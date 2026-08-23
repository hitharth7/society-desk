import { Router, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { sendEmail } from '../config/email';

const router = Router();

// 1. Fetch Notice Board (pinned first, then chronological)
router.get('/', authenticateJWT, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notices = await prisma.notice.findMany({
      orderBy: [
        { isImportant: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        reads: {
          select: { userId: true },
        },
      },
    });

    // If Resident, automatically log read receipts for all returned important notices
    if (req.user!.role === 'RESIDENT') {
      const importantNoticeIds = notices
        .filter((n) => n.isImportant)
        .map((n) => n.id);

      if (importantNoticeIds.length > 0) {
        // Find already read notices for this user
        const alreadyRead = await prisma.noticeRead.findMany({
          where: {
            userId: req.user!.id,
            noticeId: { in: importantNoticeIds },
          },
          select: { noticeId: true },
        });
        const readIds = new Set(alreadyRead.map((r) => r.noticeId));

        const unreadImportantIds = importantNoticeIds.filter((id) => !readIds.has(id));

        // Create read receipts in bulk (or one by one safely)
        if (unreadImportantIds.length > 0) {
          await prisma.noticeRead.createMany({
            data: unreadImportantIds.map((noticeId) => ({
              noticeId,
              userId: req.user!.id,
            })),
            skipDuplicates: true,
          });
        }
      }
    }

    // For admins, we want to send the read counts
    // For residents, we can attach whether the current resident has read it
    const totalResidents = await prisma.user.count({ where: { role: 'RESIDENT' } });

    const result = notices.map((notice) => {
      const readCount = notice.reads.length;
      const hasRead = notice.reads.some((r) => r.userId === req.user!.id);
      return {
        id: notice.id,
        title: notice.title,
        body: notice.body,
        isImportant: notice.isImportant,
        createdAt: notice.createdAt,
        updatedAt: notice.updatedAt,
        readCount,
        totalResidents,
        hasRead,
      };
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// 2. Mark specific notice as read manually
router.post('/:id/read', authenticateJWT, async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user!.role !== 'RESIDENT') {
    return res.status(400).json({ error: 'Only residents have read receipts.' });
  }

  try {
    const notice = await prisma.notice.findUnique({ where: { id: req.params.id as string } });
    if (!notice) {
      return res.status(404).json({ error: 'Notice not found.' });
    }

    const receipt = await prisma.noticeRead.upsert({
      where: {
        noticeId_userId: {
          noticeId: notice.id,
          userId: req.user!.id,
        },
      },
      update: {}, // do nothing if exists
      create: {
        noticeId: notice.id,
        userId: req.user!.id,
      },
    });

    res.json({ success: true, receipt });
  } catch (error) {
    next(error);
  }
});

// 3. Post Notice (Admin only, fires email if important)
router.post('/', authenticateJWT, async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { title, body, isImportant } = req.body;

  if (req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied: Admin only.' });
  }

  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required.' });
  }

  try {
    const notice = await prisma.notice.create({
      data: {
        title,
        body,
        isImportant: !!isImportant,
      },
    });

    // If important, email all residents in fire-and-forget mode
    if (notice.isImportant) {
      const residents = await prisma.user.findMany({
        where: { role: 'RESIDENT' },
        select: { email: true, name: true },
      });

      residents.forEach((res) => {
        const subject = `🚨 IMPORTANT NOTICE: ${notice.title}`;
        const emailHtml = `
          <h3>Important Notice from Society Management</h3>
          <p>Dear ${res.name},</p>
          <div style="border-left: 4px solid #EF4444; padding: 12px; margin: 16px 0; background-color: #FEF2F2;">
            <h4 style="margin: 0 0 8px 0; color: #DC2626;">${notice.title}</h4>
            <p style="margin: 0; white-space: pre-wrap;">${notice.body}</p>
          </div>
          <p>Please log in to the portal to view full details.</p>
          <hr />
          <p style="font-size: 0.85em; color: #666;">Society Maintenance Team</p>
        `;
        sendEmail({ to: res.email, subject, html: emailHtml });
      });
    }

    res.status(201).json(notice);
  } catch (error) {
    next(error);
  }
});

export default router;

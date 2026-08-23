import { Router, Response, NextFunction } from 'express';
import prisma from '../config/db';
import cloudinary from '../config/cloudinary';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { checkComplaintRateLimit } from '../middleware/rateLimiter';
import { sendEmail } from '../config/email';
import { ComplaintStatus, Priority, ComplaintCategory } from '@prisma/client';

const router = Router();

// Helper: upload buffer to Cloudinary
const uploadToCloudinary = (fileBuffer: Buffer): Promise<string | null> => {
  return new Promise((resolve) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'society_maintenance_complaints' },
      (error, result) => {
        if (error) {
          console.error('⚠️ [Cloudinary Upload Error]:', error.message || error);
          return resolve(null);
        }
        resolve(result?.secure_url || null);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

// Helper: Process single complaint for live overdue & priority escalation
export const processComplaint = (complaint: any, thresholdDays: number) => {
  const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;
  const isOverdue =
    complaint.status !== 'RESOLVED' &&
    Date.now() - new Date(complaint.createdAt).getTime() > thresholdMs;

  let priority = complaint.priority;
  let virtualHistory = [...(complaint.statusHistory || [])];

  if (isOverdue) {
    const originalPriority = complaint.priority;
    if (originalPriority === 'LOW') {
      priority = 'MEDIUM';
    } else if (originalPriority === 'MEDIUM') {
      priority = 'HIGH';
    }

    const escalationTime = new Date(new Date(complaint.createdAt).getTime() + thresholdMs);
    
    // Check if we already have this virtual escalation in history (avoid duplicates in output)
    const hasEscalation = virtualHistory.some((h: any) => h.id === `virtual-escalation-${complaint.id}`);
    if (!hasEscalation) {
      virtualHistory.push({
        id: `virtual-escalation-${complaint.id}`,
        complaintId: complaint.id,
        status: complaint.status,
        changedBy: 'System (Auto-Escalated)',
        note: `Priority automatically bumped from ${originalPriority} to ${priority} because resolution time crossed the ${thresholdDays}-day threshold.`,
        timestamp: escalationTime,
      });
      // Sort history chronologically
      virtualHistory.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }
  }

  return {
    ...complaint,
    isOverdue,
    priority,
    statusHistory: virtualHistory,
  };
};

// 1. Create Complaint (Resident only, rate limited, with photo upload)
router.post(
  '/',
  authenticateJWT,
  checkComplaintRateLimit,
  upload.single('photo'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { category, description } = req.body;

    if (!category || !description) {
      return res.status(400).json({ error: 'Category and description are required.' });
    }

    // Validate category is valid enum value
    if (!Object.values(ComplaintCategory).includes(category)) {
      return res.status(400).json({ error: `Invalid category. Must be one of: ${Object.values(ComplaintCategory).join(', ')}` });
    }

    try {
      let photoUrl: string | null = null;
      if (req.file) {
        photoUrl = await uploadToCloudinary(req.file.buffer);
      }

      // Create Complaint and record initial status history
      const complaint = await prisma.complaint.create({
        data: {
          category: category as ComplaintCategory,
          description,
          photoUrl,
          status: 'OPEN',
          priority: 'LOW',
          residentId: req.user!.id,
          statusHistory: {
            create: {
              status: 'OPEN',
              changedBy: `Resident (${req.user!.name})`,
              note: 'Complaint registered successfully.',
            },
          },
        },
        include: {
          statusHistory: true,
          resident: {
            select: { name: true, email: true, apartmentBlock: true, apartmentUnit: true },
          },
        },
      });

      res.status(201).json(complaint);
    } catch (error) {
      next(error);
    }
  }
);

// 2. Fetch Complaints (Role-guarded: Residents see own, Admins see all with filter/sort)
router.get('/', authenticateJWT, async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { category, status, startDate, endDate } = req.query;

  try {
    // Get Settings for overdue threshold
    const settings = await prisma.settings.findUnique({ where: { id: 'GLOBAL' } });
    const thresholdDays = settings?.overdueThresholdDays ?? 3;

    const whereClause: any = {};

    // Role filtration
    if (req.user!.role === 'RESIDENT') {
      whereClause.residentId = req.user!.id;
    }

    // Filters
    if (category) {
      whereClause.category = category as ComplaintCategory;
    }
    if (status) {
      whereClause.status = status as ComplaintStatus;
    }
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate as string);
      }
    }

    const complaints = await prisma.complaint.findMany({
      where: whereClause,
      include: {
        statusHistory: {
          orderBy: { timestamp: 'asc' },
        },
        resident: {
          select: { name: true, email: true, apartmentBlock: true, apartmentUnit: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Process each complaint for live overdue/escalation
    const processed = complaints.map((c) => processComplaint(c, thresholdDays));

    // Admin sorting: overdue complaints at the very top, otherwise sorted by date
    if (req.user!.role === 'ADMIN') {
      processed.sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    res.json(processed);
  } catch (error) {
    next(error);
  }
});

// 3. Fetch Single Complaint Detail
router.get('/:id', authenticateJWT, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id: req.params.id as string },
      include: {
        statusHistory: {
          orderBy: { timestamp: 'asc' },
        },
        resident: {
          select: { id: true, name: true, email: true, apartmentBlock: true, apartmentUnit: true },
        },
      },
    });

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    // Access check: resident can only view their own
    if (req.user!.role === 'RESIDENT' && complaint.residentId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const settings = await prisma.settings.findUnique({ where: { id: 'GLOBAL' } });
    const thresholdDays = settings?.overdueThresholdDays ?? 3;

    res.json(processComplaint(complaint, thresholdDays));
  } catch (error) {
    next(error);
  }
});

// 4. Update Status (Admin only, appends StatusHistory, email notification)
router.patch('/:id/status', authenticateJWT, async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { status, note } = req.body;

  if (req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied: Admin only.' });
  }

  if (!status || !Object.values(ComplaintStatus).includes(status)) {
    return res.status(400).json({ error: 'Invalid or missing status.' });
  }

  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id: req.params.id as string },
      include: { resident: true },
    });

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    // Enforce that resolved complaints are closed, EXCEPT if reopening
    const isReopening = (complaint.status === 'RESOLVED' && status !== 'RESOLVED');
    if (complaint.status === 'RESOLVED' && !isReopening) {
      return res.status(400).json({ error: 'Resolved complaints are locked and cannot be modified.' });
    }

    const updatedComplaint = await prisma.complaint.update({
      where: { id: req.params.id as string },
      data: {
        status: status as ComplaintStatus,
        statusHistory: {
          create: {
            status: status as ComplaintStatus,
            changedBy: `Admin (${req.user!.name})`,
            note: note || (isReopening ? 'Reopened by Admin' : 'Status updated'),
          },
        },
      },
      include: {
        statusHistory: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    // Notify resident via fire-and-forget email
    const subject = `Update on Complaint #${complaint.id.slice(0, 8)}`;
    const residentObj = (complaint as any).resident;
    const emailHtml = `
      <h3>Hello ${residentObj?.name || 'Resident'},</h3>
      <p>The status of your maintenance complaint has been updated.</p>
      <p><strong>Complaint Category:</strong> ${complaint.category}</p>
      <p><strong>New Status:</strong> <span style="color: #2563EB; font-weight: bold;">${status}</span></p>
      ${note ? `<p><strong>Update Note:</strong> "${note}"</p>` : ''}
      <p>Log in to your dashboard to view the full resolution history.</p>
      <hr />
      <p style="font-size: 0.85em; color: #666;">Society Maintenance Team</p>
    `;
    if (residentObj?.email) {
      sendEmail({ to: residentObj.email, subject, html: emailHtml });
    }

    res.json(updatedComplaint);
  } catch (error) {
    next(error);
  }
});

// 5. Update Priority Manually (Admin only, appends log to StatusHistory)
router.patch('/:id/priority', authenticateJWT, async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { priority, note } = req.body;

  if (req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied: Admin only.' });
  }

  if (!priority || !Object.values(Priority).includes(priority)) {
    return res.status(400).json({ error: 'Invalid or missing priority.' });
  }

  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id: req.params.id as string },
    });

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    if (complaint.status === 'RESOLVED') {
      return res.status(400).json({ error: 'Resolved complaints cannot be modified.' });
    }

    const updatedComplaint = await prisma.complaint.update({
      where: { id: req.params.id as string },
      data: {
        priority: priority as Priority,
        statusHistory: {
          create: {
            status: complaint.status, // keeps same status
            changedBy: `Admin (${req.user!.name})`,
            note: note || `Priority manually updated from ${complaint.priority} to ${priority}.`,
          },
        },
      },
      include: {
        statusHistory: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    res.json(updatedComplaint);
  } catch (error) {
    next(error);
  }
});

// 6. Rate Complaint (Resident only, must be resolved)
router.post('/:id/rate', authenticateJWT, async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { rating, ratingComment } = req.body;

  const score = Number(rating);
  if (isNaN(score) || score < 1 || score > 5) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
  }

  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id: req.params.id as string },
    });

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    if (complaint.residentId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied: You can only rate your own complaints.' });
    }

    if (complaint.status !== 'RESOLVED') {
      return res.status(400).json({ error: 'Only resolved complaints can be rated.' });
    }

    const updated = await prisma.complaint.update({
      where: { id: req.params.id as string },
      data: {
        rating: score,
        ratingComment: ratingComment || null,
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

export default router;

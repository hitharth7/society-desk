import { Router, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { authenticateJWT, requireRole } from '../middleware/auth';

const router = Router();

// Get settings
router.get('/', authenticateJWT, async (req, res, next) => {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: 'GLOBAL' },
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 'GLOBAL',
          overdueThresholdDays: 3,
          maxComplaintsPerDay: 5,
        },
      });
    }
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

// Update settings (Admin only)
router.put('/', authenticateJWT, requireRole(['ADMIN']), async (req, res, next) => {
  const { overdueThresholdDays, maxComplaintsPerDay } = req.body;

  try {
    const data: any = {};
    if (overdueThresholdDays !== undefined) data.overdueThresholdDays = Number(overdueThresholdDays);
    if (maxComplaintsPerDay !== undefined) data.maxComplaintsPerDay = Number(maxComplaintsPerDay);

    const updated = await prisma.settings.upsert({
      where: { id: 'GLOBAL' },
      update: data,
      create: {
        id: 'GLOBAL',
        overdueThresholdDays: overdueThresholdDays !== undefined ? Number(overdueThresholdDays) : 3,
        maxComplaintsPerDay: maxComplaintsPerDay !== undefined ? Number(maxComplaintsPerDay) : 5,
      },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

export default router;

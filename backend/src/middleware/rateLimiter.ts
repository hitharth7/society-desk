import { Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AuthRequest } from './auth';

export const checkComplaintRateLimit = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only residents are rate-limited. Admins are exempt.
  if (req.user.role === 'ADMIN') {
    return next();
  }

  try {
    // 1. Fetch global settings
    const settings = await prisma.settings.findUnique({
      where: { id: 'GLOBAL' },
    });

    const maxLimit = settings?.maxComplaintsPerDay ?? 5;

    // 2. Query resident complaints in the last 24 hours
    const past24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dailyCount = await prisma.complaint.count({
      where: {
        residentId: req.user.id,
        createdAt: {
          gte: past24Hours,
        },
      },
    });

    // 3. Enforce rate limit
    if (dailyCount >= maxLimit) {
      return res.status(429).json({
        error: `Daily submission limit reached. You can only submit up to ${maxLimit} complaints per day. Please try again tomorrow.`,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

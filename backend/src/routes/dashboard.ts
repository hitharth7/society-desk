import { Router, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { ComplaintCategory, ComplaintStatus } from '@prisma/client';

const router = Router();

// Admin Dashboard stats
router.get('/', authenticateJWT, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    // 1. Fetch global settings for overdue threshold
    const settings = await prisma.settings.findUnique({ where: { id: 'GLOBAL' } });
    const thresholdDays = settings?.overdueThresholdDays ?? 3;
    const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;
    const overdueCutoff = new Date(Date.now() - thresholdMs);

    // 2. Fetch all complaints with resident details for aggregation
    const allComplaints = await prisma.complaint.findMany({
      include: {
        resident: {
          select: { apartmentBlock: true, apartmentUnit: true, id: true },
        },
      },
    });

    // 3. Group by status
    const statusCounts = {
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
    };
    allComplaints.forEach((c) => {
      statusCounts[c.status as keyof typeof statusCounts] = (statusCounts[c.status as keyof typeof statusCounts] || 0) + 1;
    });

    // 4. Group by category
    const categoryCounts: Record<string, number> = {};
    Object.values(ComplaintCategory).forEach((cat) => {
      categoryCounts[cat] = 0;
    });
    allComplaints.forEach((c) => {
      categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    });

    // 5. Overdue complaints count (Open/In Progress and past threshold date)
    const overdueComplaints = allComplaints.filter(
      (c) => c.status !== 'RESOLVED' && new Date(c.createdAt) < overdueCutoff
    );
    const overdueCount = overdueComplaints.length;

    // 6. Average rating per category
    const categoryRatings: Record<string, { total: number; count: number }> = {};
    Object.values(ComplaintCategory).forEach((cat) => {
      categoryRatings[cat] = { total: 0, count: 0 };
    });

    allComplaints.forEach((c) => {
      if (c.rating !== null && c.rating !== undefined) {
        categoryRatings[c.category].total += c.rating;
        categoryRatings[c.category].count += 1;
      }
    });

    const categoryAverages: Record<string, number> = {};
    Object.entries(categoryRatings).forEach(([cat, data]) => {
      categoryAverages[cat] = data.count > 0 ? parseFloat((data.total / data.count).toFixed(1)) : 0;
    });

    // 7. Recurring Issues (rolling 30-day window)
    const rolling30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentComplaints = allComplaints.filter((c) => new Date(c.createdAt) >= rolling30Days);

    // Grouping calculations:
    // a. Complaints per category
    const categoryRecentCounts: Record<string, number> = {};
    // b. Complaints per category per unit
    const unitRecentCategoryCounts: Record<string, { count: number; units: Set<string>; complaints: any[] }> = {};

    recentComplaints.forEach((c) => {
      const category = c.category;
      categoryRecentCounts[category] = (categoryRecentCounts[category] || 0) + 1;

      const unitKey = c.resident.apartmentBlock && c.resident.apartmentUnit
        ? `${c.resident.apartmentBlock}-${c.resident.apartmentUnit}`
        : `User-${c.resident.id}`;

      const key = `${category}::${unitKey}`;
      if (!unitRecentCategoryCounts[category]) {
        unitRecentCategoryCounts[category] = { count: 0, units: new Set(), complaints: [] };
      }
      unitRecentCategoryCounts[category].count += 1;
      unitRecentCategoryCounts[category].units.add(unitKey);
      unitRecentCategoryCounts[category].complaints.push({ c, unitKey });
    });

    // Check triggers:
    // Trigger 1: Category count >= 3
    // Trigger 2: Same category from same unit >= 2
    const recurringIssues: Array<{
      category: string;
      count: number;
      affectedUnits: string[];
      reason: string;
    }> = [];

    Object.values(ComplaintCategory).forEach((cat) => {
      const totalInCat = categoryRecentCounts[cat] || 0;
      
      // Calculate unit-specific repeats in this category
      const unitGroups: Record<string, number> = {};
      const catData = unitRecentCategoryCounts[cat];
      let hasUnitRepeat = false;
      const repeatUnits: string[] = [];

      if (catData) {
        catData.complaints.forEach((comp) => {
          unitGroups[comp.unitKey] = (unitGroups[comp.unitKey] || 0) + 1;
        });

        Object.entries(unitGroups).forEach(([unit, count]) => {
          if (count >= 2) {
            hasUnitRepeat = true;
            repeatUnits.push(unit);
          }
        });
      }

      if (totalInCat >= 3 || hasUnitRepeat) {
        const affectedUnits = catData ? Array.from(catData.units) : [];
        let reason = '';
        if (totalInCat >= 3 && hasUnitRepeat) {
          reason = `High volume (${totalInCat} reports) & repeat reports from units (${repeatUnits.join(', ')})`;
        } else if (totalInCat >= 3) {
          reason = `High volume (${totalInCat} reports across society)`;
        } else {
          reason = `Repeat reports from unit (${repeatUnits.join(', ')})`;
        }

        recurringIssues.push({
          category: cat,
          count: totalInCat,
          affectedUnits,
          reason,
        });
      }
    });

    // 8. Notice read receipt stats for important notices
    const importantNotices = await prisma.notice.findMany({
      where: { isImportant: true },
      include: {
        reads: {
          select: {
            user: {
              select: { name: true, apartmentBlock: true, apartmentUnit: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const totalResidents = await prisma.user.count({ where: { role: 'RESIDENT' } });

    const noticesStats = importantNotices.map((n) => ({
      id: n.id,
      title: n.title,
      createdAt: n.createdAt,
      readCount: n.reads.length,
      totalResidents,
      reads: n.reads.map((r) => `${r.user.name} (${r.user.apartmentBlock}-${r.user.apartmentUnit})`),
    }));

    res.json({
      complaintStats: {
        status: statusCounts,
        category: categoryCounts,
        overdueCount,
        categoryAverages,
      },
      recurringIssues,
      noticesStats,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

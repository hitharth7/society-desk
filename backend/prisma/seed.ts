import { Role, ComplaintCategory, ComplaintStatus, Priority } from '@prisma/client';
import bcrypt from 'bcryptjs';
import prisma from '../src/config/db';

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean database
  await prisma.noticeRead.deleteMany({});
  await prisma.statusHistory.deleteMany({});
  await prisma.complaint.deleteMany({});
  await prisma.notice.deleteMany({});
  await prisma.settings.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const residentPassword = await bcrypt.hash('password123', 10);

  // 3. Create Admin
  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@society.com',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });
  console.log(`- Seeded admin: ${admin.email}`);

  // 4. Create Residents
  const resident1 = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@society.com',
      password: residentPassword,
      role: Role.RESIDENT,
      apartmentBlock: 'A',
      apartmentUnit: '101',
    },
  });

  const resident2 = await prisma.user.create({
    data: {
      name: 'Jane Smith',
      email: 'jane@society.com',
      password: residentPassword,
      role: Role.RESIDENT,
      apartmentBlock: 'B',
      apartmentUnit: '202',
    },
  });

  const resident3 = await prisma.user.create({
    data: {
      name: 'Alice Johnson',
      email: 'alice@society.com',
      password: residentPassword,
      role: Role.RESIDENT,
      apartmentBlock: 'C',
      apartmentUnit: '303',
    },
  });
  console.log('- Seeded 3 residents');

  // 5. Create Settings
  const settings = await prisma.settings.create({
    data: {
      id: 'GLOBAL',
      overdueThresholdDays: 3,
      maxComplaintsPerDay: 5,
    },
  });
  console.log('- Seeded global settings');

  // 6. Create Notices
  const notice1 = await prisma.notice.create({
    data: {
      title: 'Annual General Meeting 2026',
      body: 'All residents are invited to attend the Annual General Meeting on Sunday, Sept 14th at 10:00 AM in the clubhouse. Agenda: budget approvals and society committee elections.',
      isImportant: true,
    },
  });

  const notice2 = await prisma.notice.create({
    data: {
      title: 'Water Tank Maintenance',
      body: 'The main water tanks will be cleaned on Wednesday from 9:00 AM to 1:00 PM. Water supply will be unavailable during these hours. Please store water in advance.',
      isImportant: false,
    },
  });

  const notice3 = await prisma.notice.create({
    data: {
      title: 'Fire Safety Audit',
      body: 'A safety team will inspect fire extinguishers on all floors this Thursday. Please keep corridors clear.',
      isImportant: true,
    },
  });
  console.log('- Seeded 3 notices');

  // 7. Seed Read Receipts for important notices
  await prisma.noticeRead.createMany({
    data: [
      { noticeId: notice1.id, userId: resident1.id, readAt: new Date() },
      { noticeId: notice1.id, userId: resident2.id, readAt: new Date() },
      { noticeId: notice3.id, userId: resident1.id, readAt: new Date() },
    ],
  });
  console.log('- Seeded notice read receipts');

  // 8. Create Complaints
  // Standard unresolved complaint (Recent)
  const c1 = await prisma.complaint.create({
    data: {
      category: ComplaintCategory.ELECTRICAL,
      description: 'The elevator lights are flickering in Block A.',
      status: ComplaintStatus.OPEN,
      priority: Priority.LOW,
      residentId: resident1.id,
      createdAt: new Date(),
      statusHistory: {
        create: {
          status: ComplaintStatus.OPEN,
          changedBy: 'Resident (John Doe)',
          note: 'Complaint registered.',
          timestamp: new Date(),
        },
      },
    },
  });

  // Overdue complaint (created 5 days ago, threshold is 3 days)
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  const c2 = await prisma.complaint.create({
    data: {
      category: ComplaintCategory.PLUMBING,
      description: 'Major leakage in main supply line near Block B entrance.',
      status: ComplaintStatus.IN_PROGRESS,
      priority: Priority.MEDIUM, // starts medium, live processing escalates it to HIGH
      residentId: resident2.id,
      createdAt: fiveDaysAgo,
      statusHistory: {
        createMany: {
          data: [
            {
              status: ComplaintStatus.OPEN,
              changedBy: 'Resident (Jane Smith)',
              note: 'Leak reported.',
              timestamp: fiveDaysAgo,
            },
            {
              status: ComplaintStatus.IN_PROGRESS,
              changedBy: 'Admin (Super Admin)',
              note: 'Assigned plumber to inspect.',
              timestamp: new Date(fiveDaysAgo.getTime() + 1000 * 60 * 60), // + 1 hour
            },
          ],
        },
      },
    },
  });

  // Resolved complaint with a rating
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  const c3 = await prisma.complaint.create({
    data: {
      category: ComplaintCategory.CLEANING,
      description: 'Garbage pile left behind near the children park.',
      status: ComplaintStatus.RESOLVED,
      priority: Priority.LOW,
      residentId: resident3.id,
      rating: 5,
      ratingComment: 'Cleaned up very quickly. Excellent work!',
      createdAt: tenDaysAgo,
      statusHistory: {
        createMany: {
          data: [
            {
              status: ComplaintStatus.OPEN,
              changedBy: 'Resident (Alice Johnson)',
              note: 'Garbage reported.',
              timestamp: tenDaysAgo,
            },
            {
              status: ComplaintStatus.RESOLVED,
              changedBy: 'Admin (Super Admin)',
              note: 'Cleaners dispatched and area cleared.',
              timestamp: new Date(tenDaysAgo.getTime() + 2 * 24 * 60 * 60 * 1000), // + 2 days
            },
          ],
        },
      },
    },
  });

  // Recurring issue data: Category CLEANING having multiple complaints recently
  // Let's create two more cleaning complaints in the last 15 days to trigger recurring issue detection (3+ cleaning complaints)
  await prisma.complaint.create({
    data: {
      category: ComplaintCategory.CLEANING,
      description: 'Clubhouse bathroom is extremely dirty.',
      status: ComplaintStatus.OPEN,
      priority: Priority.LOW,
      residentId: resident1.id,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      statusHistory: {
        create: {
          status: ComplaintStatus.OPEN,
          changedBy: 'Resident (John Doe)',
          note: 'Reported.',
        },
      },
    },
  });

  await prisma.complaint.create({
    data: {
      category: ComplaintCategory.CLEANING,
      description: 'Corridor in Block B, Floor 2 was not swept today.',
      status: ComplaintStatus.OPEN,
      priority: Priority.LOW,
      residentId: resident2.id,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      statusHistory: {
        create: {
          status: ComplaintStatus.OPEN,
          changedBy: 'Resident (Jane Smith)',
          note: 'Reported.',
        },
      },
    },
  });

  // Create another set of complaints to trigger the resident-unit repeat (2+ reports from unit A-101 in PLUMBING)
  await prisma.complaint.create({
    data: {
      category: ComplaintCategory.PLUMBING,
      description: 'Kitchen sink drain blocked.',
      status: ComplaintStatus.OPEN,
      priority: Priority.LOW,
      residentId: resident1.id,
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      statusHistory: {
        create: {
          status: ComplaintStatus.OPEN,
          changedBy: 'Resident (John Doe)',
          note: 'Blocked sink drain.',
        },
      },
    },
  });

  await prisma.complaint.create({
    data: {
      category: ComplaintCategory.PLUMBING,
      description: 'Bathroom tap constantly dripping.',
      status: ComplaintStatus.OPEN,
      priority: Priority.LOW,
      residentId: resident1.id,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      statusHistory: {
        create: {
          status: ComplaintStatus.OPEN,
          changedBy: 'Resident (John Doe)',
          note: 'Dripping tap.',
        },
      },
    },
  });

  console.log('- Seeded 5 complaints with status histories and ratings');
  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

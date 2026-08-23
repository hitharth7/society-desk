# SocietyDesk - Society Maintenance Tracker

A production-quality full-stack maintenance ticket tracker and notice board portal built from scratch. It allows housing society residents to raise tickets, track progress, and read announcements, while admins manage resolutions, pattern analytics, and configurations.

---

## Tech Stack

- **Frontend**: React (Vite), Tailwind CSS (v4), Lucide Icons, jsPDF.
- **Backend**: Node.js, Express (REST API), TypeScript.
- **Database**: PostgreSQL with Prisma ORM.
- **Authentication**: JWT (JSON Web Tokens) with role guards (`RESIDENT`, `ADMIN`) and bcrypt password hashing.
- **Photo Storage**: Cloudinary (memory-buffer streaming).
- **Email Delivery**: Resend SDK and/or Gmail SMTP (App Passwords) support.

---

## Monorepo Layout

```
├── backend/
│   ├── src/
│   │   ├── config/       # Shared DB client, Cloudinary, Email setup
│   │   ├── middleware/   # JWT auth, Multer upload, Rate limiting, Error handler
│   │   ├── routes/       # Auth, Complaints, Notices, Settings, Dashboard
│   │   └── index.ts      # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma # Prisma database models
│   │   └── seed.ts       # Demo seeder script
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/   # NoticeBoard, ComplaintDetails, Navbar
│   │   ├── context/      # AuthContext, ToastContext
│   │   ├── pages/        # Login, Register, Dashboards, Settings, QR generator
│   │   ├── utils/        # Axios-like API wrapper
│   │   ├── App.tsx       # Root wrapper & custom client-state router
│   │   └── main.tsx      # Bootstrapper
│   ├── package.json
│   └── postcss.config.js
└── SYSTEM_DESIGN.md      # Core architecture design paper
```

---

## Environment Configuration

### Backend Environment (`backend/.env`)

Create a `backend/.env` file with the following variables:

```env
PORT=5001
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/society_maintenance?schema=public"
JWT_SECRET="super_secret_jwt_key_for_society_desk_12345"

# Cloudinary Credentials (Required for photo uploads)
CLOUDINARY_CLOUD_NAME="your_cloudinary_name"
CLOUDINARY_API_KEY="your_cloudinary_key"
CLOUDINARY_API_SECRET="your_cloudinary_secret"

# Resend API Key (Optional email delivery)
RESEND_API_KEY=""

# Gmail App Password (SMTP Fallback - Optional email delivery)
SMTP_USER=""
SMTP_PASS=""

EMAIL_FROM="Society Tracker <onboarding@resend.dev>"
```

### Frontend Environment (`frontend/.env`)

Create a `frontend/.env` file:

```env
VITE_API_URL="http://localhost:5001/api"
```

---

## Setup & Running Guide

### Prerequisites
- Node.js (v18+)
- PostgreSQL database instance (local or hosted, e.g., Neon / Supabase)

### Step 1: Install Dependencies
Install packages in both directories:
```bash
# Install backend packages
cd backend
npm install

# Install frontend packages
cd ../frontend
npm install
```

### Step 2: Database Migration & Seeding
Configure your `DATABASE_URL` in `backend/.env`. Then run:
```bash
cd ../backend

# Generate Prisma client and push schema to DB
npx prisma db push

# Seed the database with demo users, tickets, and notice read logs
npx prisma db seed
```

*Note: Since database connection configuration is now governed by `prisma.config.ts` in Prisma 7, running push or seed will automatically read the variables.*

### Step 3: Run Dev Servers
Launch both backend and frontend servers in separate terminal panes:

**Run Backend**:
```bash
cd backend
npm run dev
# Server will start on http://localhost:5001
```

**Run Frontend**:
```bash
cd frontend
npm run dev
# Vite client will start on http://localhost:5173
```

---

## Full API Documentation

### Auth Module
- `POST /api/auth/register` - Create a resident. Returns JWT + User object.
- `POST /api/auth/login` - Authenticate users. Returns JWT + User object.
- `GET /api/auth/me` - Fetch profile metadata using JWT header.

### Complaints Module
- `POST /api/complaints` - Create a complaint. Enforces resident-only guard, daily submissions rate limiter, and Cloudinary multipart uploads.
- `GET /api/complaints` - List complaints. Residents see their own; Admins see all sorted with overdue first, filtered by category, status, and dates.
- `GET /api/complaints/:id` - Fetch complaint detail, status history timeline, and resident metadata.
- `PATCH /api/complaints/:id/status` - Transition complaint status (Open → In Progress → Resolved). Appends log record, fires email notification.
- `PATCH /api/complaints/:id/priority` - Override ticket priority manually. Appends notes log.
- `POST /api/complaints/:id/rate` - Add 1-5 star satisfaction rating and comment to a Resolved complaint.

### Notice Board Module
- `GET /api/notices` - Fetch announcements list (pinned important ones first). Residents viewing important notices automatically registers read receipts.
- `POST /api/notices` - Post a notice (Admin only). If marked important, emails a broadcast to all residents.
- `POST /api/notices/:id/read` - Manually trigger read receipt verification log.

### Dashboard & Settings
- `GET /api/admin/dashboard` - Retrieve aggregated analytics (overdue counts, category ratings, notice reads, recurring issue patterns).
- `GET /api/settings` - Read overdue days threshold and rate limit counts.
- `PUT /api/settings` - Modify dynamic settings values (Admin only).

---

## How to Demo the Novelty Features

### 1. Auto-Priority Escalation & Live Overdue Check
- **Setup**: Log in as **Admin** (`admin@society.com` / `admin123`) and navigate to **Settings**. Set the overdue threshold to **1 day**.
- **Result**: Navigate to **Complaints** or the **Dashboard**. Standard complaints older than 24 hours are instantly marked as Overdue, and their priority is dynamically elevated.
- **Audit Trail**: Open an overdue ticket. In the "Audit Resolution Trail" panel, a system-generated history event is dynamically appended to the timeline: `Auto-escalated due to overdue threshold`.

### 2. Recurring Issue Detection Widget
- **Setup**: Seeding the database creates 3 complaints in the `Cleaning` category and 2 plumbing complaints from a single unit.
- **Result**: Log in as **Admin**, navigate to the **Dashboard**, and view the "Recurring Issue Patterns" widget.
- **Triggers**: It shows items flagged based on:
  - $\ge 3$ complaints in the same category within 30 days.
  - $\ge 2$ complaints in the same category from the same unit within 30 days.
  - Affected units and precise trigger reasons are listed in the card.

### 3. Notice Read Receipts
- **Setup**: Log in as **Admin**, and navigate to **Notice Board**.
- **Result**: Pinned notices show read receipts (e.g. "2 of 3 residents read").
- **Interactive Sync**: Log in as a resident on another device (e.g., `alice@society.com` / `password123`) and open the notice board. Switch back to the admin dashboard, and the read receipt count will increment instantly.

### 4. Resident Satisfaction Rating
- **Setup**: Log in as **Admin**, locate an Open complaint, and set status to **Resolved**.
- **Rating**: Log in as the resident who created the ticket, open that complaint's detail page, select a star rating (1-5), and write a comment. A confetti celebration will trigger on submission.
- **Admin Feedback**: Log in as Admin again; the category satisfaction average on the dashboard will update to include this score.

### 5. Client-Side PDF Export
- **Result**: On the **Admin Dashboard**, click **Export Dashboard PDF**. It compiles status charts, category averages, overdue counts, and recurring issues, and triggers a local file download (`.pdf`) immediately.

### 6. Complaint Rate Limiter
- **Setup**: Log in as **Resident** and set the limit in Admin Settings to **2 complaints per day**.
- **Result**: Try submitting a 3rd complaint. The backend intercepts the request with a `429 Too Many Requests` code, and the frontend displays a toast alert indicating the submission limit was hit.

# SocietyDesk — Society Maintenance Tracker

> A production-quality full-stack portal for housing societies. Residents raise maintenance tickets and read announcements; admins manage resolutions, analytics, and configurations — all in one beautifully unified interface.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Environment Configuration](#environment-configuration)
5. [Local Setup Guide](#local-setup-guide)
6. [Database Schema](#database-schema)
7. [API Reference](#api-reference)
8. [Novelty Feature Demos](#novelty-feature-demos)
9. [Deployment (Vercel)](#deployment-vercel)

---

## Features

| Feature | Description |
|---|---|
| 🎫 Ticket Lifecycle | Residents raise complaints with photos; admins update status through Open → In Progress → Resolved |
| ⚡ Live Overdue Detection | Overdue status and priority escalation computed at query time — no cron jobs needed |
| 🔥 Recurring Issue Patterns | Admin dashboard flags categories with ≥3 complaints or single-unit repeat filings within 30 days |
| 📢 Notice Board + Read Receipts | Broadcast notices to all residents via email; track individual read receipts per notice |
| ⭐ Satisfaction Ratings | Residents rate resolved tickets 1–5 stars; admin dashboard shows per-category averages |
| 📊 Analytics Dashboard | KPI cards, category distribution bars, PDF export with jsPDF + autotable |
| 🔒 Rate Limiting | Per-resident daily complaint submission cap (configurable via admin settings) |
| 📷 Cloud Photo Uploads | Memory-buffer streaming to Cloudinary — no ephemeral disk writes |
| 🔐 JWT Auth with RBAC | Role-based guards: `RESIDENT` and `ADMIN` with bcrypt password hashing |
| 📱 QR Code Generator | Admin generates location-aware deep-link QR codes; scanning auto-fills the complaint form |
| 📄 PDF Reports | One-click dashboard export — metrics, category ratings, and recurring patterns |

---

## Tech Stack

### Backend
- **Runtime**: Node.js 18+, TypeScript
- **Framework**: Express 5
- **ORM**: Prisma 7 with `@prisma/adapter-pg` driver adapter
- **Database**: PostgreSQL (Neon recommended)
- **Auth**: JWT + bcryptjs
- **Storage**: Cloudinary (memory-buffer streaming via `multer.memoryStorage()`)
- **Email**: Resend SDK (primary) / Nodemailer SMTP (fallback)
- **Deployment**: Vercel Serverless Functions

### Frontend
- **Framework**: React 18 (Vite)
- **Styling**: Tailwind CSS v4 + custom CSS design system
- **Icons**: Lucide React
- **PDF**: jsPDF + jspdf-autotable v5
- **Deployment**: Vercel Static Hosting

---

## Project Structure

```
society-desk/
├── backend/
│   ├── api/
│   │   └── index.ts          # Vercel serverless entry point
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.ts         # Prisma client (with adapter-pg)
│   │   │   ├── cloudinary.ts # Cloudinary SDK config
│   │   │   └── email.ts      # Resend / Nodemailer setup
│   │   ├── middleware/
│   │   │   ├── auth.ts       # JWT verification, role guards
│   │   │   ├── upload.ts     # Multer memory storage
│   │   │   ├── rateLimit.ts  # Per-resident daily cap
│   │   │   └── errorHandler.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── complaints.ts
│   │   │   ├── notices.ts
│   │   │   ├── settings.ts
│   │   │   └── dashboard.ts
│   │   └── index.ts          # Local dev server entry
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── vercel.json
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── ComplaintDetails.tsx
│   │   │   └── ui/
│   │   │       └── Toast.tsx
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminComplaints.tsx
│   │   │   ├── AdminNotices.tsx
│   │   │   ├── ResidentDashboard.tsx
│   │   │   ├── QRGenerator.tsx
│   │   │   └── Settings.tsx
│   │   ├── utils/
│   │   │   └── api.ts        # Fetch wrapper with JWT headers
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css         # Full custom design system
│   ├── vercel.json
│   └── package.json
│
├── SYSTEM_DESIGN.md
└── README.md
```

---

## Environment Configuration

### `backend/.env`

```env
# Server
PORT=5001
NODE_ENV=development

# Database (Neon / any PostgreSQL)
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# JWT
JWT_SECRET="replace-with-a-long-random-secret"

# Cloudinary (https://cloudinary.com/console)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Resend email (https://resend.com/api-keys)
RESEND_API_KEY="re_xxxxxxxxxxxx"
EMAIL_FROM="SocietyDesk <onboarding@resend.dev>"

# SMTP fallback (optional, only if not using Resend)
SMTP_USER=""
SMTP_PASS=""

# Vercel: set this to your deployed frontend URL
FRONTEND_URL="http://localhost:5173"
```

### `frontend/.env`

```env
# For local dev
VITE_API_URL=http://localhost:5001/api

# For production (set in Vercel dashboard)
# VITE_API_URL=https://your-backend.vercel.app/api
```

---

## Local Setup Guide

### Prerequisites
- Node.js v18+
- A PostgreSQL database (local instance, [Neon](https://neon.tech), or [Supabase](https://supabase.com))
- A [Cloudinary](https://cloudinary.com) account (free tier works)
- (Optional) A [Resend](https://resend.com) API key for emails

### 1. Clone & Install

```bash
git clone https://github.com/your-username/society-desk.git
cd society-desk

# Install backend
cd backend && npm install

# Install frontend
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
# → Edit .env with your actual values
```

### 3. Push Database Schema & Seed

```bash
cd backend

# Create tables
npx prisma db push

# Seed demo data (admin + 3 residents + complaints + notices)
npx prisma db seed
```

**Demo credentials after seeding:**

| Role | Email | Password |
|---|---|---|
| Admin | `admin@society.com` | `admin123` |
| Resident | `john@society.com` | `password123` |
| Resident | `alice@society.com` | `password123` |

### 4. Run Dev Servers

```bash
# Terminal 1 — Backend (port 5001)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Open `http://localhost:5173`

---

## Database Schema

```
┌─────────────────────────────────────────────────────┐
│ User                                                │
│  id            UUID PK                              │
│  name          String                               │
│  email         String UNIQUE                        │
│  password      String (bcrypt hash)                 │
│  role          RESIDENT | ADMIN                     │
│  apartmentBlock String?                             │
│  apartmentUnit  String?                             │
│  createdAt     DateTime                             │
└──────────────────┬──────────────────────────────────┘
                   │ 1:N               1:N
          ┌────────▼────────┐   ┌──────▼──────┐
          │   Complaint     │   │  NoticeRead  │
          │  id    UUID PK  │   │  id  UUID PK │
          │  category  ──── PLUMBING|ELECTRICAL│
          │            ──── CLEANING|SECURITY|OTHER
          │  description    │   │  noticeId FK │
          │  photoUrl?      │   │  userId   FK │
          │  status  OPEN   │   │  readAt      │
          │          IN_PROGRESS│└──────▲──────┘
          │          RESOLVED  │       │ N:1
          │  priority LOW|MEDIUM|HIGH  │
          │  rating   Int?  │   ┌──────┴──────┐
          │  ratingComment? │   │   Notice    │
          │  residentId FK  │   │  id  UUID PK│
          │  createdAt      │   │  title      │
          └──────┬──────────┘   │  body       │
                 │ 1:N          │  isImportant│
          ┌──────▼──────────┐   │  createdAt  │
          │  StatusHistory  │   └─────────────┘
          │  id   UUID PK   │
          │  complaintId FK │   ┌─────────────┐
          │  status (enum)  │   │  Settings   │
          │  changedBy      │   │  id="GLOBAL"│
          │  note?          │   │  overdueDays│
          │  timestamp      │   │  maxPerDay  │
          └─────────────────┘   └─────────────┘
```

**Key constraints:**
- `User.email` is unique
- `NoticeRead` has a compound unique index on `(noticeId, userId)` — no duplicate reads
- All foreign keys cascade on delete
- `Settings` uses a fixed singleton ID `"GLOBAL"` via `upsert`

---

## API Reference

All endpoints are prefixed with `/api`. Protected routes require:
```
Authorization: Bearer <jwt_token>
```

---

### Auth

#### `POST /api/auth/register`
Create a new resident account.

**Body**
```json
{
  "name": "John Doe",
  "email": "john@society.com",
  "password": "password123",
  "apartmentBlock": "A",
  "apartmentUnit": "102"
}
```
**Response** `201`
```json
{ "token": "<jwt>", "user": { "id": "...", "name": "John Doe", "role": "RESIDENT", ... } }
```

---

#### `POST /api/auth/login`
Authenticate and get a JWT.

**Body**
```json
{ "email": "admin@society.com", "password": "admin123" }
```
**Response** `200`
```json
{ "token": "<jwt>", "user": { "id": "...", "role": "ADMIN", ... } }
```

---

#### `GET /api/auth/me` 🔒
Returns the authenticated user's profile.

**Response** `200`
```json
{ "id": "...", "name": "...", "email": "...", "role": "RESIDENT", "apartmentBlock": "A", "apartmentUnit": "102" }
```

---

### Complaints

#### `POST /api/complaints` 🔒 RESIDENT only
Raise a maintenance ticket. Accepts `multipart/form-data` for optional photo.

**Form fields**
| Field | Type | Required |
|---|---|---|
| `category` | `PLUMBING\|ELECTRICAL\|CLEANING\|SECURITY\|OTHER` | ✅ |
| `description` | string | ✅ |
| `photo` | file (jpg/png/webp) | ❌ |

**Response** `201`
```json
{
  "id": "uuid",
  "category": "PLUMBING",
  "description": "Water leak under sink",
  "photoUrl": "https://res.cloudinary.com/...",
  "status": "OPEN",
  "priority": "LOW",
  "createdAt": "2024-08-24T..."
}
```
**Errors**: `429` if daily limit exceeded, `403` if admin

---

#### `GET /api/complaints` 🔒
List complaints. Residents see only their own; admins see all, sorted overdue-first.

**Query params** (admin only)
| Param | Values |
|---|---|
| `status` | `OPEN`, `IN_PROGRESS`, `RESOLVED` |
| `category` | `PLUMBING`, `ELECTRICAL`, etc. |
| `startDate` | ISO date string |
| `endDate` | ISO date string |

**Response** `200` — array of Complaint objects, each with:
- `isOverdue: boolean` — computed at query time
- `statusHistory` — full audit trail array

---

#### `GET /api/complaints/:id` 🔒
Fetch a single complaint with full status history and resident info.

---

#### `PATCH /api/complaints/:id/status` 🔒 ADMIN only
Transition ticket status and add an optional note.

**Body**
```json
{ "status": "IN_PROGRESS", "note": "Plumber dispatched, arriving tomorrow." }
```
**Side effects**: Sends email notification to the resident. Appends a `StatusHistory` record.

---

#### `PATCH /api/complaints/:id/priority` 🔒 ADMIN only
Manually override ticket priority.

**Body**
```json
{ "priority": "HIGH", "note": "Escalated due to repeat reports." }
```

---

#### `POST /api/complaints/:id/rate` 🔒 RESIDENT only
Submit a 1–5 star rating for a `RESOLVED` complaint.

**Body**
```json
{ "rating": 5, "ratingComment": "Very prompt service!" }
```
**Errors**: `400` if complaint is not resolved, `409` if already rated

---

### Notices

#### `GET /api/notices` 🔒
Fetch all notices (pinned important ones first). Automatically creates `NoticeRead` records for the requesting resident for any important notice they see.

---

#### `POST /api/notices` 🔒 ADMIN only
Publish a notice.

**Body**
```json
{
  "title": "Water supply shutdown",
  "body": "Water will be cut on Sunday 6am–10am for tank cleaning.",
  "isImportant": true
}
```
**Side effects**: If `isImportant: true`, emails a broadcast to all residents (fire-and-forget, non-blocking).

---

#### `POST /api/notices/:id/read` 🔒
Manually mark a notice as read for the authenticated user (idempotent upsert).

---

### Dashboard

#### `GET /api/dashboard` 🔒 ADMIN only
Returns aggregated analytics:

```json
{
  "complaintStats": {
    "status": { "OPEN": 4, "IN_PROGRESS": 2, "RESOLVED": 10 },
    "category": { "PLUMBING": 6, "ELECTRICAL": 3, ... },
    "overdueCount": 2,
    "categoryAverages": { "PLUMBING": 4.2, "ELECTRICAL": 3.8 }
  },
  "recurringIssues": [
    {
      "category": "CLEANING",
      "count": 3,
      "affectedUnits": ["A-101", "B-202"],
      "reason": "3+ complaints in the same category within 30 days"
    }
  ],
  "noticesStats": [
    {
      "id": "...", "title": "...", "readCount": 2,
      "totalResidents": 3, "reads": ["John Doe", "Alice"]
    }
  ]
}
```

---

### Settings

#### `GET /api/settings` 🔒 ADMIN only
```json
{ "overdueThresholdDays": 3, "maxComplaintsPerDay": 5 }
```

#### `PUT /api/settings` 🔒 ADMIN only
```json
{ "overdueThresholdDays": 1, "maxComplaintsPerDay": 2 }
```

---

## Novelty Feature Demos

### 1. Live Overdue Detection & Auto-Priority Escalation
1. Log in as **Admin** → **Settings** → set overdue threshold to `1` day
2. Go to **Complaints** — any ticket older than 24 hours is marked ⚠️ Overdue
3. Open the ticket — the Audit Trail shows a system-generated `Auto-Escalated` event with the exact escalation timestamp

### 2. Recurring Issue Pattern Detection
1. Seed creates 3+ Cleaning complaints and repeat Plumbing filings from a single unit
2. **Admin Dashboard → Recurring Patterns** widget shows the flagged categories, affected unit numbers, and the trigger condition

### 3. Notice Read Receipts
1. Log in as **Admin** → **Notices** → see read receipt count per pinned notice
2. Open the notice board as a resident on another browser tab — count increments on admin refresh

### 4. Satisfaction Rating with Confetti
1. Admin resolves a complaint → resident logs in → opens that ticket
2. Star rating form appears → submit → confetti burst fires 🎉

### 5. PDF Export
- Admin Dashboard → **Export PDF** → downloads a formatted report with all metrics

### 6. Rate Limiter
- Admin Settings → set to `2 complaints/day` → resident tries to submit a 3rd → receives `429 Too Many Requests`

### 7. QR Code Generator
- Admin → **QR Generator** → enter block/unit → download QR
- Scanning opens the portal with `?block=A&unit=102` pre-filled in the complaint form

---

## Deployment (Vercel)

See the step-by-step guide in the project's [walkthrough document](walkthrough.md) or follow these steps:

1. **Push to GitHub**
2. **Deploy `backend/`** as a Vercel project with all env vars set
3. **Deploy `frontend/`** as a second Vercel project, setting `VITE_API_URL` to the backend's URL
4. Update `FRONTEND_URL` on the backend to enable CORS for the deployed frontend

---

*Built with ❤️ — SocietyDesk © 2024*

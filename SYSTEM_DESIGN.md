# System Design: SocietyDesk

*A technical deep-dive into the four core subsystems of the Society Maintenance Tracker backend.*

---

## 1. Complaint History & Audit Model

The central design challenge for complaint management is preserving a **tamper-proof, ordered record** of every state transition — not just the current status. A naïve approach would be a single `status` column on the `Complaint` row, updated in place. This loses all history: who made the change, when, and why.

SocietyDesk uses an **append-only event log** pattern instead. The `Complaint` model holds current state (`status`, `priority`, `rating`), while a sibling `StatusHistory` table acts as an immutable ledger. Every admin action — status transitions and priority overrides — runs inside a single Prisma transaction that atomically updates the `Complaint` row *and* inserts a new `StatusHistory` record. This guarantees consistency: you can never have a status that doesn't have a corresponding history entry.

Each `StatusHistory` record captures four things:

| Field | Purpose |
|---|---|
| `status` | The state *after* this transition |
| `changedBy` | Human-readable actor: `"Admin (Super Admin)"`, `"Resident (John)"`, or `"System (Auto-Escalated)"` |
| `note` | Free-text admin note — e.g. *"Plumber dispatched, ETA 2hrs"* |
| `timestamp` | Exact UTC time of the event |

The frontend renders this as a colour-coded vertical timeline. Because history records are never deleted or updated, the trail is forensically reliable — useful for dispute resolution between admins and residents.

---

## 2. Live Overdue Detection & Auto-Escalation

Most systems handle overdue detection with background cron jobs that scan the database on a schedule (e.g., every hour) and write an `isOverdue` flag. This approach has two problems: it introduces lag between the real deadline and the system's awareness, and changing the threshold requires waiting for the next cron cycle.

SocietyDesk calculates overdue status **at query time** — no polling, no background workers. The logic runs inside `GET /api/complaints` for every unresolved ticket:

```
isOverdue = (now - createdAt) > overdueThresholdDays × 86400s
```

`overdueThresholdDays` is read from the `Settings` singleton on every request, so an admin changing the threshold from 3 days to 1 day takes effect on the next page load with zero redeployment.

When `isOverdue` is true, two additional things happen:

1. **Priority bump**: `LOW → MEDIUM`, `MEDIUM → HIGH` (HIGH stays HIGH). The bumped priority is returned in the response but **not written to the database** — it's a computed presentation value. The database stores the original assigned priority, preserving the distinction between admin intent and system escalation.

2. **Virtual history injection**: A synthetic `StatusHistory` entry — ID prefixed `virtual-` — is appended to the complaint's history array. Its timestamp is set to exactly `createdAt + threshold`, which means the escalation event appears at its correct chronological position in the audit timeline, not at query time. The frontend renders this entry with a distinct rose-coloured marker and a `🛡 System` actor label.

This design keeps the database clean while giving users the full picture of what happened and when.

---

## 3. Photo Handling & Storage Strategy

Serverless platforms like Vercel have no persistent local filesystem. Even on traditional servers, writing uploads to disk creates ephemeral files that don't survive restarts. SocietyDesk avoids disk writes entirely by streaming images through RAM directly to Cloudinary.

**Upload pipeline:**

```
Browser (multipart/form-data)
    ↓
Express + Multer (memoryStorage)   ← file lives only in RAM buffer
    ↓
cloudinary.uploader.upload_stream  ← streamed from buffer
    ↓
Cloudinary CDN                     ← returns secure HTTPS URL
    ↓
Prisma: Complaint.photoUrl = url   ← URL persisted, buffer discarded
```

`multer.memoryStorage()` holds the raw `Buffer` in the Node.js process heap. This is passed directly to Cloudinary's `upload_stream`, which accepts a readable stream — the buffer is piped in via a small Promise wrapper that resolves with the Cloudinary result or rejects on error.

A deliberate resilience decision: if Cloudinary upload fails (network error, quota exceeded), the Promise resolves to `null` rather than rejecting. The complaint is created without a photo URL instead of returning a `500` to the user. This prevents a third-party dependency from blocking the core ticket filing flow.

All returned Cloudinary URLs are secure `https://res.cloudinary.com/...` links with automatic CDN delivery, transformation support, and no expiry.

---

## 4. Notification Flow (Email & Read Receipts)

Notifications cover two surfaces: **transactional emails** for complaint updates, and **in-portal read receipts** for important notices.

### Email (Fire-and-Forget)

Email delivery uses Resend as the primary provider, with a Nodemailer SMTP fallback. Both share the same calling interface — the system attempts Resend first and falls back to SMTP if the Resend API key is absent.

Emails are triggered in two situations:

- **Status update**: When an admin transitions a complaint status, an HTML email is sent to the resident detailing the new status and the admin's note.
- **Important notice broadcast**: When an admin publishes a notice with `isImportant: true`, the backend queries all `RESIDENT` users and sends one email per resident.

Both triggers are **non-blocking**: the email function is called without `await`. The HTTP response returns immediately to the caller; email delivery happens asynchronously in the background. Errors are caught and logged to the console without surfacing a `500` to the API client. This prevents slow SMTP servers or Resend rate limits from degrading the user experience.

### Notice Read Receipts

The `NoticeRead` join table records which resident saw which notice, with a compound unique index on `(noticeId, userId)` to prevent duplicates.

Read registration is automatic: when a resident calls `GET /api/notices`, the backend runs a `createMany` with `skipDuplicates: true` for all important notices in the response. The resident doesn't click a "mark as read" button — viewing the notice board is itself the read event.

Admins see aggregated receipt data on the dashboard: total readers, reader names, and a read-ratio percentage per notice. This data is computed server-side by joining `NoticeRead` with `User` on every dashboard request.

---

*Total: ~780 words*

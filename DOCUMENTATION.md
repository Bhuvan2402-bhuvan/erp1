# Volunteer ERP (ERP1): System Documentation

Volunteer ERP is a centralized, role-based enterprise resource planning platform built to manage student volunteering activities, branch allocations, attendance validation, real-time messaging, and digital certificate issuing. 

---

## 1. System Architecture

The application is built on a modern, secure, and performant web architecture utilizing:
* **Frontend**: Next.js 14 (App Router) using React 18, TailwindCSS, and Framer Motion.
* **ORM**: Prisma Client for database queries and schema mapping.
* **Database**: Supabase PostgreSQL hosting core tables and indices.
* **Authentication**: Supabase Auth (coupled with HTTPOnly JWT cookies).
* **Real-time Messaging**: Supabase Realtime client for direct messaging synchronization.
* **Hosting**: Vercel Edge Serverless runtime with Next.js middleware routing.

```
       ┌──────────────────────────────────────────────────────────┐
       │                       Browser Client                     │
       └─────────────────────────────┬────────────────────────────┘
                                     │ (HTTP Requests)
                                     ▼
       ┌──────────────────────────────────────────────────────────┐
       │              Vercel Serverless Middleware                │
       │     (Token Verification, Downstream Context, RBAC)       │
       └─────────────────────────────┬────────────────────────────┘
                                     │ (Authorized API / Page Request)
                                     ▼
       ┌──────────────────────────────────────────────────────────┐
       │              Next.js 14 App Route Handlers               │
       │    (Rate Limiting, input validation, error handling)     │
       └─────────────────────────────┬────────────────────────────┘
                                     │ (Prisma Client)
                                     ▼
       ┌──────────────────────────────────────────────────────────┐
       │                      PostgreSQL (Supabase)               │
       └──────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema (Prisma)

The database matches the university structure, tracking roles, department affiliations, schedules, attendance audits, and messaging.

### Core Enums
* `Role`: `ADMIN`, `FACULTY`, `STUDENT`.
* `ApprovalStatus`: `PENDING`, `APPROVED`, `REJECTED`.
* `RegistrationStatus`: `REGISTERED`, `CANCELLED`.
* `EventType`: `ACTIVITY`, `CAMP`, `WORKSHOP`, `RALLY`, `AWARENESS`.
* `EventStatus`: `UPCOMING`, `ONGOING`, `COMPLETED`, `CANCELLED`.

### Primary Models & Fields

1. **User (`users`)**:
   - Tracks unique identifier `id` (UUID) and connects with Supabase Auth ID (`supabaseAuthId`).
   - Contains generic profile info: `email`, `name`, `phone`, `bio`, `avatarUrl`.
   - Stores role metadata: `role` (Role Enum), `approvalStatus` (ApprovalStatus Enum), `isBlocked` (Boolean).
   - Relations: Belongs to `Department`, references profiles (`Student`, `Faculty`), logs messages, and tracks events/attendances.

2. **Department (`departments`)**:
   - Represents college departments (e.g. Computer Science - `CSE`).
   - Fields: `id`, `name` (unique), `code` (unique).

3. **Student (`students`)**:
   - Extended profile for students.
   - Fields: `id`, `rollNo` (unique), `regNo`, `year`, `section`, `semester`, `isCoordinator` (Boolean).
   - Relations: Cascading relation with `User`, belongs to `Department`, references a mentor (`Faculty`), tracks registrations, attendances, issues, and digital certificates.

4. **Faculty (`faculty`)**:
   - Extended profile for faculty.
   - Fields: `id`, `employeeId` (unique), `designation`.
   - Relations: Cascading relation with `User`, belongs to `Department`, and manages student mentees.

5. **Event (`events`)**:
   - Volunteering drives.
   - Fields: `id`, `title`, `description`, `date`, `endDate`, `location`, `type` (EventType), `status` (EventStatus).
   - Relations: Created by a `User` (Admin/Faculty), maps registrations, attendances, and photos.

6. **EventRegistration (`event_registrations`)**:
   - Signup link between events and students.
   - Unique constraint: `[eventId, studentId]`.

7. **EventAttendance (`event_attendance`)**:
   - Audited logs verifying attendance.
   - Fields: `present` (Boolean), `markedById` (referencing marking Admin/Faculty).

8. **Issue (`issues`)**:
   - Grievances raised by volunteers.
   - Fields: `title`, `description`, `status` (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`), `resolvedById`, `resolvedAt`.

9. **Certificate (`certificates`)**:
   - E-Certificates issued upon volunteer hour milestones.
   - Fields: `title`, `description`, `fileUrl` (S3/Supabase storage download).

10. **Message (`messages`)**:
    - Direct peer-to-peer real-time communication logs between `senderId` and `receiverId`.

---

## 3. Role-Based Access Control (RBAC) & Portal Features

### Security Gates & Routing
Next.js middleware interceptors (`middleware.js` and `lib/supabase/middleware.js`) process cookies downstream:
- Public pages (`/`, `/login`, `/signup`) bypass auth validation queries.
- Protected routes scope to specific folders:
  - `/admin/*` requires `Role = ADMIN` and `ApprovalStatus = APPROVED`.
  - `/faculty/*` requires `Role = FACULTY` or `Role = ADMIN`.
  - `/student/*` requires `Role = STUDENT` and `ApprovalStatus = APPROVED`.

### Portal Walkthrough

#### 1. Admin Portal
- **Dashboard Metrics**: Interactive metrics tracking service hours, total active volunteers, branches, and events. Includes shimmer loaders during state hydration.
- **Volunteer Approvals**: Management console displaying registrations. Admins approve or reject accounts in real-time, instantly refreshing the client roles database.
- **Faculty Coordinator Allocations**: Register, designate, and review departmental coordinators.
- **Events Capacity Tracking**: Create events and track volunteer registration capacity bars.
- **Chat Hub**: Real-time channel communicating with coordinators and volunteers.

#### 2. Faculty Portal
- **Branch Management**: Accesses lists of students scoped exclusively to the faculty member's academic department (e.g. CSE).
- **Attendance Verification**: Reviews event sign-ups, checks attendance status, and issues certified community hours.
- **Campaign Planner**: Posts blood donation drives, clean-up activities, or awareness rallies.

#### 3. Student/Volunteer Portal
- **Campaign Catalog**: Volunteers browse open campaigns, view seat availability, and register instantly.
- **Service Portfolio Summary**: Tracks logged volunteering hours, completed events, and gamified achievement levels (Bronze, Silver, Gold).
- **PDF Certificate Downloads**: Download verified digital service certificates directly.

---

## 4. Hardening & Safety Controls

To ensure system reliability, the following enterprise controls are actively implemented:

### Sliding-Window Rate Limiting
High-risk endpoints (`POST /api/auth/signup`, `GET /api/auth/callback`, `POST /api/users/[id]/reset-password`) run through an in-memory rate limiter (`lib/rate-limit.js`):
- Signup: 5 requests / IP / 15 mins limit.
- Reset Password: 5 requests / IP / 15 mins limit.
- IP data extracted securely from Vercel `x-forwarded-for` headers.

### Downstream Error Sanitization
Global API helper wrappers (`lib/api-helpers.js`):
- Intercept exceptions in route handlers.
- Clean and sanitize error payloads to prevent stack trace or raw SQL schema leakage.
- Standardize unauthorized response structures.

### Security Headers Integration
Applied globally to all pages via `next.config.mjs`:
- `X-Frame-Options: DENY`: Prevents Clickjacking attacks.
- `X-Content-Type-Options: nosniff`: Standardizes browser content rendering.
- `Referrer-Policy: strict-origin-when-cross-origin`: Controls referral trace leaks.
- `Permissions-Policy`: Restricts camera, microphone, and geolocation access.

---

## 5. Developer Setup Guide

### 1. Installation

Ensure Node.js >= 20.9.0 is installed:

```bash
git clone https://github.com/Bhuvan2402-bhuvan/erp1.git
cd erp1
npm install
```

### 2. Environment Variables Configuration

Copy `.env.example` to `.env.local` and define keys:

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-supabase-url.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
DATABASE_URL="postgresql://postgres:password@db-connection-string"
DIRECT_URL="postgresql://postgres:password@db-direct-connection-string"
```

### 3. Database Initial Setup

Generate Prisma Client and apply migrations:

```bash
npx prisma generate
npx prisma db push
```

### 4. Seed Database

Generate test accounts (`admin@erp.com`, `faculty@erp.com`, `volunteer@erp.com` with password `Password123!`):

```bash
# Windows
generate-test-accounts.bat
# Linux/macOS
node --env-file=.env.local scripts/seed-users.mjs
```

### 5. Running local Dev Server

```bash
npm run dev
```
The application will launch locally at [http://localhost:3000](http://localhost:3000).

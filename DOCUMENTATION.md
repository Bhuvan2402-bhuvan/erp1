# VVITU NSS ERP — Complete System & Architecture Documentation

**VVITU NSS ERP** is an enterprise-grade Institutional Resource Planning, Activity Auditing, and Volunteer Management Platform built specifically for the **National Service Scheme (NSS)** at **Vasireddy Venkatadri Institute of Technology (Autonomous)**.

The system replaces manual paper logs and disparate spreadsheets with a unified, real-time platform covering **Academic Year Monitoring**, **Year-Wise Financial Auditing**, **Unit-Wise Event Operations & Photo Galleries**, **Anti-Proxy QR Attendance**, **Dynamic Form Building**, **Faculty Leadership Showcase**, and **Gamified Volunteer Portfolios**.

---

## 📑 Table of Contents
1. [System Architecture & Tech Stack](#1-system-architecture--tech-stack)
2. [Role-Based Access Control (RBAC) Matrix](#2-role-based-access-control-rbac-matrix)
3. [Core Functional Modules](#3-core-functional-modules)
   - [3.1 Academic Year-Wise Monitoring Engine](#31-academic-year-wise-monitoring-engine)
   - [3.2 Year-Wise Financial Reports & Audit Ledger](#32-year-wise-financial-reports--audit-ledger)
   - [3.3 Unit-Wise Event & Photo Management](#33-unit-wise-event--photo-management)
   - [3.4 Anti-Proxy QR Attendance Gate](#34-anti-proxy-qr-attendance-gate)
   - [3.5 Faculty Desk & Leadership Directory](#35-faculty-desk--leadership-directory)
   - [3.6 Dynamic Custom Form Builder & Submissions](#36-dynamic-custom-form-builder--submissions)
   - [3.7 Volunteer Portfolios & Gamified Recognition](#37-volunteer-portfolios--gamified-recognition)
   - [3.8 1:1 Grievance Redressal & Live Chat](#38-11-grievance-redressal--live-chat)
4. [Authentication & Security Implementation](#4-authentication--security-implementation)
5. [Database Schema & Data Models](#5-database-schema--data-models)
6. [API Route Specifications](#6-api-route-specifications)
7. [Deployment & Environment Setup Guide](#7-deployment--environment-setup-guide)
8. [Test Accounts & Access Roster](#8-test-accounts--access-roster)

---

## 1. System Architecture & Tech Stack

```
                               ┌─────────────────────────────────────────┐
                               │  Client Browsers (Desktop & Mobile PWA) │
                               └────────────────────┬────────────────────┘
                                                    │ HTTPS / WSS
                                                    ▼
                               ┌─────────────────────────────────────────┐
                               │    Next.js 14 App Router Middleware     │
                               │  (JWT Cookie Auth, Role Guard, Headers) │
                               └────────────────────┬────────────────────┘
                                                    │
                   ┌────────────────────────────────┼────────────────────────────────┐
                   ▼                                ▼                                ▼
   ┌───────────────────────────────┐ ┌───────────────────────────────┐ ┌───────────────────────────────┐
   │    App Route Handlers (API)   │ │    SSR / Dynamic UI Pages     │ │      Supabase Realtime        │
   │  - /api/monitoring/academic-… │ │  - /admin/* (Admin Portal)    │ │  - Instant Peer Chat        │
   │  - /api/finance               │ │  - /faculty/* (Faculty Desk)  │ │  - Live Notification Pushes │
   │  - /api/events & photos       │ │  - /student/* (Volunteer App) │ │                             │
   │  - /api/forms & responses     │ │  - /visitor (Public Directory)│ │                             │
   └───────────────┬───────────────┘ └──────────────┬────────────────┘ └───────────────┬───────────────┘
                   │                                │                                  │
                   └────────────────────────────────┼──────────────────────────────────┘
                                                    ▼
                               ┌─────────────────────────────────────────┐
                               │         Prisma ORM Client v5.22         │
                               └────────────────────┬────────────────────┘
                                                    │ Pooled Connections
                                                    ▼
                               ┌─────────────────────────────────────────┐
                               │   Supabase PostgreSQL Cloud Database   │
                               │  (Multi-tenant Relational Data Models)  │
                               └─────────────────────────────────────────┘
```

### Technical Stack:
* **Frontend Framework**: [Next.js 14](https://nextjs.org/) (App Router architecture with React 18).
* **Styling & Design System**: Tailwind CSS with curated color schemes, dark/light mode toggle, micro-animations, and glassmorphism.
* **Database & ORM**: PostgreSQL hosted on [Supabase](https://supabase.com/) with [Prisma ORM v5](https://www.prisma.io/).
* **Authentication**: Supabase Auth (Email/Password & Google OAuth 2.0 with PKCE verification) + HTTPOnly secure JWT sessions.
* **Real-time Engine**: `@supabase/supabase-js` realtime websockets for instant 1:1 chat and announcements.
* **Hosting & Edge Delivery**: [Vercel](https://vercel.com/) Serverless Edge Network with automated CI/CD and CDN caching.

---

## 2. Role-Based Access Control (RBAC) Matrix

| Feature / Capability | Public Visitor | Student Volunteer | Student Coordinator | Faculty Coordinator | System Admin |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Account Quota Cap** | Unlimited | Unlimited | Max 20 System-wide | Max 15 System-wide | Max 4 System-wide |
| **Public Visitor Directory & Feeds** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Faculty Leadership Profiles Showcase** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Academic Year Monitoring Dashboard** | ❌ | ❌ | ❌ | ✅ (Branch Scoped) | ✅ (Institution-wide) |
| **Year-Wise Financial Auditing & Ledger** | ❌ | ❌ | View Docs | ✅ (Branch Entries) | ✅ (Full Authority) |
| **1-Click Audit Report CSV Export** | ❌ | ❌ | ❌ | ✅ (Branch CSV) | ✅ (Master CSV) |
| **Post Events & Upload Drive Photos** | ❌ | ❌ | ✅ (Branch Drives) | ✅ (Branch Drives) | ✅ (All Drives) |
| **Anti-Proxy QR Attendance Scanner** | ❌ | ✅ (Scan Code) | ✅ (Generate/Scan) | ✅ (Generate/Scan) | ✅ (Generate/Scan) |
| **Gamified Points & Milestones** | ❌ | ✅ (Earn/View) | ✅ (Allot Points) | ✅ (Allot Points) | ✅ (Full Control) |
| **Dynamic Form Builder & Analytics** | ❌ | Fill & Submit | Branch Forms | Branch Forms | System Forms |
| **1:1 Grievance Box & Status Toggle** | ❌ | Submit Ticket | Solve Tickets | Solve Tickets | Full Oversight |
| **Approve / Reject User Accounts** | ❌ | ❌ | Branch Approvals | Branch Approvals | Master Approvals |
| **Database Backup & CSV Dumps** | ❌ | ❌ | ❌ | ✅ Branch Dump | ✅ Complete Backup |

---

## 3. Core Functional Modules

### 3.1 Academic Year-Wise Monitoring Engine
* **Routes**: `/admin/monitoring` & `/faculty/monitoring` | **API**: `/api/monitoring/academic-years`
* **Academic Cycles Supported**: Multi-year evaluation across `2026-2027`, `2025-2026`, `2024-2025`, `2023-2024`, and `2022-2023` (aligned with the Indian University June 1 – May 31 cycle).
* **Key Capabilities**:
  * **Interactive Year Pills**: One-click switching between historical and active academic sessions.
  * **Aggregated KPIs**: Active approved volunteer strength, verified community service hours, campaigns executed, and student coordinator distribution.
  * **Department Benchmarking Matrix**: Comparative leaderboard comparing all 10 academic disciplines (CSE, ECE, EEE, MECH, CIVIL, IT, CSM, CSD, AID, CIC).
  * **Year-over-Year Growth Visualizer**: 5-year longitudinal trend comparisons for student engagement and service volume.
  * **Top Volunteer Recognition**: Leaderboard identifying top point and service-hour contributors for each academic cycle.
  * **1-Click CSV Export**: Instant download of the full institutional academic year report (`NSS_Academic_Year_Report_[Year].csv`).

---

### 3.2 Year-Wise Financial Reports & Audit Ledger
* **Routes**: `/admin/finance` & `/faculty/finance` | **API**: `/api/finance`
* **Key Capabilities**:
  * **Annual Financial Ledger**: Itemized tracking of income (sponsorships, donations, university grants), expenses (camps, transport, refreshments, printing, medical), and annual budget allocations.
  * **Financial Health Summary**: Real-time compute of Total Allocated Budget, Total Spent, Net Remaining Balance, and % Budget Utilization meter.
  * **Year-Wise Financial Audit Comparison**: Visual comparative cards tracking expenditures across multiple academic cycles.
  * **Expense Category Matrix**: Spending distribution categorized by Event Logistics, Refreshments, First Aid, Transportation, Printing, and Awards.
  * **Digital Invoice & Receipt Storage**: Direct linking and previewing of proof receipts.
  * **1-Click Audit Report Export**: Spreadsheet download (`NSS_Financial_Report_AY_[Year].csv`) formatted for university auditing.

---

### 3.3 Unit-Wise Event & Photo Management
* **Routes**: `/faculty/events`, `/student/events`, `/admin/events` | **API**: `/api/events`, `/api/events/[id]/photos`
* **Key Capabilities**:
  * **Unit Scoping**: Faculty Coordinators and Student Leads can post campaigns categorized under their departmental unit (`CSE Unit`, `ECE Unit`, etc.).
  * **Client-Side Image Compression**: Automatic browser-side compression (JPEG 0.8 quality, max 1024px) for rapid uploads without cloud timeouts.
  * **Photo Gallery & Lightbox**: Volunteers and visitors can view high-resolution event photo albums with captions and coordinator attribution.
  * **Campaign Lifecycle Management**: Filter campaigns by `UPCOMING`, `ONGOING`, and `COMPLETED`.

---

### 3.4 Anti-Proxy QR Attendance Gate
* **Components**: `EventQRModal.jsx`, `VolunteerQRScannerModal.jsx` | **API**: `/api/events/[id]/attendance`
* **Key Capabilities**:
  * **Time-Sensitive Dynamic QR Code**: Faculty/Coordinators project or display dynamic QR codes during live drives.
  * **Mobile Camera Scanner**: Student volunteers use built-in HTML5 camera scanner in `/student/events` to verify physical presence.
  * **Verified Hours Tracking**: Automatically awards verified service hours (+3 hours per verified camp) to volunteer records.
  * **Manual Audit Backup**: Coordinators can inspect registration lists and manually toggle presence with attendance timestamps.

---

### 3.5 Faculty Desk & Leadership Directory
* **Routes**: `/visitor?tab=faculty`, `/admin/faculty-desk`, Home Page Spotlight | **API**: `/api/faculty-desk`, `/api/visitor`
* **Key Capabilities**:
  * **Program Coordinator (PC) Spotlight**: Prominently highlights the institutional Program Coordinator with photo, message, and achievements.
  * **Program Officers (POs) Directory**: Unit coordinators across all college branches listed with contact details, designations, and department badges.
  * **Dynamic Admin Manager (`/admin/faculty-desk`)**: Real-time CRUD manager to update faculty forewords, achievements, profile images, and visibility.

---

### 3.6 Dynamic Custom Form Builder & Submissions
* **Routes**: `/faculty/forms`, `/student/forms`, `/admin/forms` | **API**: `/api/forms`
* **Key Capabilities**:
  * **Rich Field Types**: Short text, long paragraph, single select (radio/dropdown), multi-select (checkboxes), rating scale, linear 1-10 scale, yes/no, and file attachments.
  * **Lifecycle Controls**: `DRAFT` ➔ `PUBLISHED` ➔ `CLOSED`.
  * **Workflow Approvals**: Review responses, add reviewer notes, and mark submissions as `APPROVED`, `UNDER_REVIEW`, or `REJECTED`.
  * **Analytics & Excel Export**: Visual submission distribution graphs and instant `.xlsx` / `.csv` data export.

---

### 3.7 Volunteer Portfolios & Gamified Recognition
* **Routes**: `/student/portfolio`, `/student/profile`, `/visitor` | **API**: `/api/students`, `/api/points`
* **Key Capabilities**:
  * **Milestone Badges**:
    * 🥉 **Bronze**: < 50 Points
    * 🥈 **Silver**: 50 – 149 Points
    * 🥇 **Gold**: 150 – 299 Points
    * 💎 **Platinum**: 300+ Points
  * **myBharat Government Integration**: Field tracking for Official `myBharatId` and verified government certificate URLs.
  * **Printable Service Record**: Visual printable transcript summarizing total drives, verified service hours, and achievements.

---

### 3.8 1:1 Grievance Redressal & Live Chat
* **Routes**: `/student/issues`, `/faculty/branch`, `/student/chat`, `/faculty/chat` | **API**: `/api/issues`
* **Key Capabilities**:
  * **Confidential Grievance Box**: Volunteers submit issues or requests directly to branch faculty officers.
  * **Status Lifecycle**: Toggle tickets between `NOT_SOLVED` and `SOLVED` with coordinator resolution notes.
  * **Real-time Messaging**: Instant peer-to-mentor messaging powered by Supabase Realtime channels.

---

## 4. Authentication & Security Implementation

### 1. Dual-Mode Authentication:
* **Email & Password**: Salted bcrypt hashing with email verification workflow.
* **Google OAuth 2.0 (PKCE)**: Direct one-click login linked with verified institutional Google credentials.

### 2. Session Architecture:
* Handled via **HTTPOnly, Secure, SameSite Cookies** containing signed JWT tokens.
* Protected against Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF).

### 3. Edge Route Guard (`middleware.js`):
* Inspects requests at the Vercel Edge layer before executing server components.
* Strict role redirects:
  * `/admin/*` ➔ Restricted to `ADMIN`
  * `/faculty/*` ➔ Restricted to `FACULTY` or `ADMIN`
  * `/student/*` ➔ Restricted to `STUDENT`, `COORDINATOR`, or `ADMIN`

### 4. Self-Destructing Cache Buster (`public/sw.js` & `app/Providers.jsx`):
* Automatically unregisters legacy Service Workers and clears stale client-side caches to prevent outdated CSS/JS chunk mismatches during rapid deployments.

---

## 5. Database Schema & Data Models

The system uses **18 PostgreSQL Relational Models** mapped through Prisma:

```prisma
// Core User & Authentication
model User {
  id              String         @id @default(uuid())
  email           String         @unique
  name            String
  role            Role           @default(STUDENT) // ADMIN, FACULTY, STUDENT
  approvalStatus  ApprovalStatus @default(PENDING) // PENDING, APPROVED, REJECTED
  isBlocked       Boolean        @default(false)
  avatarUrl       String?
  phone           String?
  departmentId    String?
  department      Department?    @relation(fields: [departmentId], references: [id])
  student         Student?
  faculty         Faculty?
  createdAt       DateTime       @default(now())
}

// Student Volunteer Extension
model Student {
  id              String            @id @default(uuid())
  userId          String            @unique
  rollNo          String            @unique
  regNo           String?           @unique
  year            Int               // 1, 2, 3, 4
  section         String
  semester        Int
  departmentId    String
  isCoordinator   Boolean           @default(false)
  points          Int               @default(0)
  myBharatId      String?
  myBharatCertUrl String?
  user            User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  department      Department        @relation(fields: [departmentId], references: [id])
  attendances     EventAttendance[]
  registrations   EventRegistration[]
}

// Faculty Coordinator Extension
model Faculty {
  id              String            @id @default(uuid())
  userId          String            @unique
  employeeId      String            @unique
  designation     String
  departmentId    String
  user            User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  department      Department        @relation(fields: [departmentId], references: [id])
}

// Event & Campaign Operations
model Event {
  id              String            @id @default(uuid())
  title           String
  description     String?
  date            DateTime
  endDate         DateTime?
  location        String?
  type            EventType         @default(ACTIVITY) // CAMP, ACTIVITY, WORKSHOP, RALLY, AWARENESS
  status          EventStatus       @default(UPCOMING) // UPCOMING, ONGOING, COMPLETED, CANCELLED
  createdById     String
  createdBy       User              @relation(fields: [createdById], references: [id])
  photos          EventPhoto[]
  attendances     EventAttendance[]
  registrations   EventRegistration[]
}

// Event Media & Photos
model EventPhoto {
  id              String            @id @default(uuid())
  eventId         String
  url             String
  caption         String?
  uploadedById    String
  event           Event             @relation(fields: [eventId], references: [id], onDelete: Cascade)
  uploadedBy      User              @relation(fields: [uploadedById], references: [id])
  createdAt       DateTime          @default(now())
}

// Financial Ledger & Audit
model FinanceRecord {
  id              String            @id @default(uuid())
  title           String
  description     String?
  amount          Float
  type            FinanceType       // INCOME, EXPENSE, BUDGET
  category        String            // Logistics, Refreshments, Transport, Medical, Printing, Awards
  academicYear    String            @default("2025-2026")
  receiptUrl      String?
  departmentId    String?
  createdById     String
  department      Department?       @relation(fields: [departmentId], references: [id])
  createdBy       User              @relation(fields: [createdById], references: [id])
  createdAt       DateTime          @default(now())
}
```

---

## 6. API Route Specifications

| Endpoint | Method | Allowed Roles | Description |
|:---|:---:|:---:|:---|
| `/api/auth/me` | `GET` | Authenticated | Fetch current user session, profile, and role relations |
| `/api/auth/login` | `POST` | Public | Authenticate user credentials & set JWT session cookie |
| `/api/auth/signup` | `POST` | Public | Register new student or faculty account |
| `/api/monitoring/academic-years` | `GET` | `ADMIN`, `FACULTY` | Multi-year volunteer hours, event trends & department rankings |
| `/api/finance` | `GET`, `POST`, `DELETE` | `ADMIN`, `FACULTY` | Financial transactions, YoY summaries, category breakdown & receipt audit |
| `/api/events` | `GET`, `POST` | Authenticated | Browse events with unit filters, post new campaigns |
| `/api/events/[id]` | `GET`, `PUT`, `DELETE` | `ADMIN`, `FACULTY`, `COORDINATOR` | Event detail manager, status updater, attendance viewer |
| `/api/events/[id]/photos` | `POST`, `DELETE` | `ADMIN`, `FACULTY`, `COORDINATOR` | Upload and manage event campaign photos & captions |
| `/api/events/[id]/register` | `POST`, `DELETE` | `STUDENT` | Volunteer registration & cancellation for drives |
| `/api/events/[id]/attendance` | `POST` | Authenticated | Verify and mark attendance (QR code validation) |
| `/api/forms` | `GET`, `POST` | Authenticated | Browse active forms, create dynamic custom surveys |
| `/api/forms/[formId]/responses` | `GET`, `POST` | Authenticated | Submit responses, review volunteer form submissions |
| `/api/faculty-desk` | `GET`, `POST`, `PUT`, `DELETE` | Public / `ADMIN` | Public faculty leadership directory & admin management |
| `/api/visitor` | `GET` | Public | Public stats, volunteer directory, photo feed & drives |
| `/api/issues` | `GET`, `POST`, `PUT` | Authenticated | Submit grievance, resolve ticket status (`SOLVED`/`NOT_SOLVED`) |
| `/api/backup/export` | `GET` | `ADMIN`, `FACULTY` | Export database collections as JSON or CSV |

---

## 7. Deployment & Environment Setup Guide

### 1. Prerequisites:
* **Node.js**: v18.18.0 or v20+ LTS
* **Package Manager**: `npm`
* **Database**: PostgreSQL (Supabase or standard PostgreSQL instance)

### 2. Environment Configuration (`.env.local`):
```env
# Database Connection (Supabase Transaction Pooler)
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Supabase Credentials
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR_ANON_KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR_SERVICE_ROLE_KEY]"

# Google OAuth 2.0 Credentials
NEXT_PUBLIC_GOOGLE_CLIENT_ID="[GOOGLE_CLIENT_ID].apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="[GOOGLE_CLIENT_SECRET]"

# Application URL
NEXT_PUBLIC_APP_URL="https://erp-tan-six.vercel.app"
NEXTAUTH_SECRET="[STRONG_RANDOM_SECRET_KEY]"
```

### 3. Setup Commands:
```bash
# 1. Clone repository
git clone https://github.com/Bhuvan2402-bhuvan/erp1.git
cd erp1

# 2. Install dependencies
npm install

# 3. Generate Prisma client & sync schema
npx prisma generate
npx prisma db push

# 4. Run local development server
npm run dev
```

### 4. Production Deployment on Vercel:
```bash
# Deploy to Vercel production
vercel deploy --prod
```

---

## 8. Test Accounts & Access Roster

| Role | Email Address | Default Password | Scope / Permissions |
|:---|:---|:---|:---|
| **System Admin 1** | `admin1@erp.com` | `Admin@12345` | Full Platform & User Authority |
| **System Admin 2** | `admin2@erp.com` | `Admin@12345` | Institutional Operations & Finance |
| **Faculty Coordinator (CSE)** | `faculty.cse@erp.com` | `Faculty@12345` | CSE Unit Coordinator & Drive Manager |
| **Faculty Coordinator (ECE)** | `faculty.ece@erp.com` | `Faculty@12345` | ECE Unit Coordinator & Drive Manager |
| **Faculty Coordinator (MECH)** | `faculty.mech@erp.com` | `Faculty@12345` | MECH Unit Coordinator & Drive Manager |
| **Student Coordinator** | `lead.cse1@erp.com` | `Student@12345` | Student Branch Lead (CSE) |
| **Student Volunteer** | `student.cse1@erp.com` | `Student@12345` | Standard Volunteer Account (CSE) |

---

*© 2026 VVITU NSS ERP • Developed for Vasireddy Venkatadri Institute of Technology (Autonomous).*

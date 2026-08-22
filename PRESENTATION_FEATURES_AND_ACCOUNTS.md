# 📊 VVITU NSS ERP: Complete Presentation Deck
## All Features, Pages, & Account Options Matrix

> **VVITU NSS ERP** — *Centralized Role-Governed Enterprise Resource Planning, Anti-Proxy Attendance, Financial Ledger, Documentation Archiving, & Grievance Resolution Platform.*

---

## 📽️ Presentation Table of Contents

- **Slide 1**: Title & Executive Summary
- **Slide 2**: System Roles & Quota Governance Matrix (5 Roles | Strict Account Caps)
- **Slide 3**: High-Level System Architecture & Security Layer
- **Slide 4**: Public Visitor Portal & Landing Pages (`/`, `/visitor`, `/login`, `/signup`)
- **Slide 5**: Student Volunteer Workspace (`/student/*`)
- **Slide 6**: Student Coordinator Operations (`/student/volunteers`, `/student/create-event`)
- **Slide 7**: Faculty Coordinator Governance (`/faculty/*`)
- **Slide 8**: System Administrator Master Deck (`/admin/*`)
- **Slide 9**: Deep-Dive: Anti-Proxy QR Attendance & Gamified Points Engine
- **Slide 10**: Deep-Dive: Financial Ledger & Circular Broadcast Engine
- **Slide 11**: Deep-Dive: 1:1 Complaint Box & Data Backup Engine
- **Slide 12**: Master Page-to-Account Feature Matrix (25+ Routes vs 5 Roles)
- **Slide 13**: Security Hardening, Rate-Limiting & Validation Framework
- **Slide 14**: Project Impact & Speaker Q&A

---

---

### 🟢 SLIDE 1: Title & Executive Summary

#### **Project Title**: VVITU NSS ERP Platform
#### **Focus Area**: Multi-Page Navigation & Multi-Role Governance Architecture
#### **Core Objective**: To provide an enterprise-grade ERP platform that unifies student volunteering, anti-proxy attendance tracking, financial ledger management, circular broadcasts, 1:1 complaint resolution, and data backup under strict account quotas.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           VVITU NSS ERP                                 │
├─────────────────┬───────────────────┬───────────────────┬───────────────┤
│  5 User Roles   │ 25+ Page Routes   │ Anti-Proxy QR Gate│ Fin Ledger    │
│  Strict Quotas  │ Scoped RBAC Views │ TOTP Audit Logs   │ Balance Math  │
└─────────────────┴───────────────────┴───────────────────┴───────────────┘
```

#### **Key System Highlights**:
- 🔐 **Strict Role Governance**: Hard capped limits on Admin (4), Faculty (15), and Student Coordinator (20) accounts.
- 📱 **25+ Custom Page Routes**: Role-segregated views for Volunteers, Coordinators, Faculty, Admins, and Public Guests.
- 📝 **Dynamic Custom Forms Engine**: Visual builder with 18 field types, review approval workflow, completion analytics, and Excel `.xlsx` export.
- 🛡️ **Anti-Proxy QR Gate**: TOTP time-sensitive QR code verification prevents fraudulent proxy attendance.
- 💰 **Real-Time Financial Ledger**: Transparent tracking of Budgets, Income/Sponsorships, and Expenses with receipt verification.
- 📦 **1-Click Data Sovereignty**: Complete offline JSON data export for financial records, attendance logs, forms data, and event archives.

*🗣️ **Speaker Notes**: "Good morning. Today we present the complete feature breakdown of the VVITU NSS ERP. This platform addresses institutional challenges by providing tailored views and granular permissions across 5 role accounts and over 25 dedicated page routes."*

---

### 🟢 SLIDE 2: System Roles & Quota Governance Matrix

Our system defines **5 distinct tier roles** with hard-coded account quota limits to safeguard system administration integrity:

```
        ┌─────────────────────────────────────────────────┐
        │            SYSTEM ADMINISTRATOR                 │  ◄── MAX 4 ACCOUNTS
        │    (Global Approvals, System Backup & Audits)   │
        └────────────────────────┬────────────────────────┘
                                 │
        ┌────────────────────────▼────────────────────────┐
        │           FACULTY COORDINATORS                  │  ◄── MAX 15 ACCOUNTS
        │  (Branch Operations, Finance, Docs, Circulars)  │
        └────────────────────────┬────────────────────────┘
                                 │
        ┌────────────────────────▼────────────────────────┐
        │           STUDENT COORDINATORS                  │  ◄── MAX 20 ACCOUNTS
        │ (Points Allocation, Warning Notices, Drives)    │
        └────────────────────────┬────────────────────────┘
                                 │
        ┌────────────────────────▼────────────────────────┐
        │            STUDENT VOLUNTEERS                   │  ◄── OPEN SIGNUP
        │(Events, myBharat Details, Portfolio, Complaints)│
        └────────────────────────┬────────────────────────┘
                                 │
        ┌────────────────────────▼────────────────────────┐
        │             PUBLIC VISITORS                     │  ◄── UNAUTHENTICATED
        │   (Live Impact Metrics, Anonymized Roster)      │
        └─────────────────────────────────────────────────┘
```

#### **Account Quota & Authorization Breakdown**:

| Role Account | Account Quota Limit | Registration / Upgrade Path | Primary Responsibility Scope |
|---|:---:|---|---|
| **Public Visitor** | Unlimited | None (Unauthenticated Guest Access) | Read-only public statistics & anonymized volunteer directory |
| **Student Volunteer** | Unlimited | Self Sign-Up via `/signup` (Email verified) | Event participation, QR scanning, profile & myBharat management |
| **Student Coordinator** | **Capped at 20** | Promoted from Volunteer by Faculty/Admin | Branch volunteer oversight, awarding points, misconduct warnings |
| **Faculty Coordinator** | **Capped at 15** | Register as Faculty -> Requires Admin Approval | Department operations, financial ledger, circulars, backups |
| **System Admin** | **Capped at 4** | Super Admin Provisioning | Master dashboard, global approvals, branch setup, system backups |

*🗣️ **Speaker Notes**: "Notice how quotas are strictly enforced at every level. The system blocks unauthorized registrations or promotions if any account cap is reached, ensuring administrative balance across departments."*

---

### 🟢 SLIDE 3: System Architecture & Security Layer

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                    Client Application (PWA / Responsive Web)           │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │ (HTTPS REST API Requests)
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                  Next.js 14 Middleware Security Gate                   │
 │       (JWT Cookie Validation, Role RBAC Enforcement, IP Rate Limiter) │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │ (Authorized Route Handlers)
                                     ▼
 ┌───────────────────────────────────┴────────────────────────────────────┐
 │                  Next.js Route Handlers & Zod Schemas                  │
 ├───────────────────────────────────┬────────────────────────────────────┤
 │  Prisma ORM (Data Layer)          │  Supabase Realtime Messaging       │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │ (PostgreSQL Driver)
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                     PostgreSQL Database (Supabase Cloud)               │
 └────────────────────────────────────────────────────────────────────────┘
```

#### **Core Tech Stack Specifications**:
- **Framework**: Next.js 14 App Router (React 18), TailwindCSS, Framer Motion.
- **Database & Data Access**: PostgreSQL on Supabase Cloud accessed via Prisma Client ORM.
- **Security Gates**: Sliding-window IP Rate Limiter (`lib/rate-limit.js`), HTTPOnly JWT Cookies, Zod Schema Sanitization (`lib/validations.js`).
- **Realtime Infrastructure**: Supabase Realtime client for P2P messaging and announcements.

*🗣️ **Speaker Notes**: "Our architecture employs a defense-in-depth approach. Every request passes through Middleware role enforcement, Zod payload validation, and IP rate limiting before touching the Prisma client."*

---

### 🟢 SLIDE 4: Public Visitor Portal & Public Pages

Public pages provide transparency for institutional stakeholders, external auditors, and parents without exposing private volunteer information.

```
Public User
 ├── Landing Page (/)               ──► Value Proposition, FAQs, Quick Actions
 ├── Visitor Portal (/visitor)      ──► Live Statistics & Verified Volunteer Directory
 ├── Sign In (/login)              ──► Credentials Auth Gate
 └── Account Sign Up (/signup)     ──► Role Selection (Volunteer / Faculty)
```

#### **Detailed Feature Capabilities**:
1. **Landing Page (`/`)**:
   - Dynamic Hero section highlighting platform features.
   - Interactive FAQ accordion (`LandingFaqs.jsx`).
   - Quick navigation buttons to Login, Sign-Up, and Visitor Portal.
2. **Public Visitor Portal (`/visitor`)**:
   - 📊 **Live Impact Counters**: Real-time counter of Active Volunteers, Coordinators, Faculty, and Completed Drives.
   - 📜 **Verified Volunteer Roster**: Public directory displaying Name, Department, Roll Number, Academic Year, Coordinator Status, Total Points, and Achievement Badges.
   - 🔒 **Privacy Shield Protection**: Addresses, contact phone numbers, and email credentials are completely omitted from public API payloads.
   - 🔍 **Real-Time Search & Branch Filtering**: Search by name/roll number, or filter by academic branch.

*🗣️ **Speaker Notes**: "The Visitor Portal lets external auditors verify student volunteering achievements while guaranteeing data privacy by masking personal contact information."*

---

### 🟢 SLIDE 5: Student Volunteer Workspace (`/student/*`)

Student Volunteers enjoy a rich, gamified experience to manage their volunteering journey.

#### **Page Routes & Feature Matrix**:

```
/student/
 ├── /events         ──► Browse & Register for Drives (Upcoming, Ongoing, Completed)
 ├── /attendance     ──► Personal QR Code & Camera TOTP QR Scanner
 ├── /profile        ──► Edit Bio, Avatar, Phone & myBharat ID / Certificate URL
 ├── /portfolio      ──► Summary Stats (Hours, Score) & Digital Certificate Download
 ├── /issues         ──► Submit 1:1 Grievances & Track Status (NOT_SOLVED / SOLVED)
 ├── /documentation  ──► View & Download Official Event Reports & Circulars
 ├── /announcements  ──► Campus-Wide Notification Broadcast Feed
 └── /chat           ──► Real-Time Peer & Mentor Messaging
```

#### **Gamified Points & Achievement Badges**:
- **Milestone Thresholds**:
  - 🥉 **Bronze Badge**: 0 – 49 Points
  - 🥈 **Silver Badge**: 50 – 149 Points
  - 🥇 **Gold Badge**: 150 – 299 Points
  - 💎 **Platinum Badge**: 300+ Points
- **myBharat Integration**: Dedicated fields for `myBharatId` and verified `myBharatCertUrl` link storage.

*🗣️ **Speaker Notes**: "Volunteers can register for events, scan attendance QR codes, track their tier badges, submit grievances, and download official certificates right from their student panel."*

---

### 🟢 SLIDE 6: Student Coordinator Operations (`/student/*` - Promoted)

Student Coordinators are peer leaders with department-scoped management privileges (Capped at 20 accounts).

```
Coordinator Actions
 ├── Branch Roster (/student/volunteers) ──► Department Volunteer Directory & Approval Gate
 ├── Allot Points (Modal Tool)            ──► Award Performance Points (+10, +20) + Custom Note
 ├── Misconduct Warning (Modal Tool)      ──► Issue Warning Notice with Proof URL
 ├── Create Event (/student/create-event) ──► Launch New Department Drives & Set Slots
 └── Resolve Issues (/student/issues)    ──► Toggle Complaint Status (NOT_SOLVED ↔ SOLVED)
```

#### **Key Features & Operational Capabilities**:
1. **Branch Volunteer Roster (`/student/volunteers`)**:
   - View all registered volunteers within their assigned academic department.
   - Single-click approval for newly registered branch volunteers.
2. **Points Allocation Tool**:
   - Modal popup to grant bonus points with audit descriptions.
3. **Misconduct & Proxy Warning Engine**:
   - File official warning logs (`WarningLog`) with optional evidence URL for absent or proxy-attempting students.
4. **Drive Creation Engine (`/student/create-event`)**:
   - Create new volunteering activities specifying event title, category, date, location, max capacity, banner URL, and description.
5. **Grievance Resolution**:
   - Review incoming branch complaints and toggle resolution status (**`SOLVED`** / **`NOT_SOLVED`**).

*🗣️ **Speaker Notes**: "Student Coordinators act as the frontline management, managing branch sign-ups, hosting drives, awarding performance points, and handling grievance tickets."*

---

### 🟢 SLIDE 7: Faculty Coordinator Governance (`/faculty/*`)

Faculty Coordinators supervise departmental operations, manage finances, publish documentation, and dispatch circulars (Capped at 15 accounts).

```
/faculty/
 ├── /branch         ──► Branch Control, Coordinator Promotion, Mentor Assignment
 ├── /finance        ──► Financial Ledger (Income, Expenses, Budget, Receipts)
 ├── /documentation  ──► Upload Event Reports, Circulars & Operational Guides
 ├── /announcements  ──► Dispatch Circular Broadcasts to ALL Active Volunteers
 ├── /backup         ──► 1-Click JSON Data Backup (Finance, Attendance, Reports)
 ├── /attendance     ──► Generate TOTP Anti-Proxy QR Codes & Live Audit Logs
 └── /chat           ──► Real-Time Faculty & Student Messaging
```

#### **Core Module Specifications**:
- 💰 **Financial Ledger**:
  - Track transactions across `INCOME`, `EXPENSE`, and `BUDGET`.
  - Auto-calculated Balance Equation:
    $$\text{Remaining Balance} = (\text{Total Budget} + \text{Total Income}) - \text{Total Expenses}$$
  - Attachment of digital receipt links (`receiptUrl`).
- 📢 **Circular Broadcasting Engine**:
  - Dispatch announcements that automatically generate real-time notification records for **100% of active volunteers**.
- ⭐ **Coordinator Promotion**:
  - Promote volunteers to Student Coordinators while enforcing the system quota cap of 20.

*🗣️ **Speaker Notes**: "Faculty officers maintain complete control over departmental finances, official documentation, circular notifications, and offline data backups."*

---

### 🟢 SLIDE 8: System Administrator Control Center (`/admin/*`)

System Administrators hold master control over the platform (Capped at 4 accounts).

```
/admin/
 ├── /overview       ──► Master Executive Dashboard & Live Account Quota Trackers
 ├── /approvals      ──► System-Wide Pending User Sign-Up Queue (Approve / Reject)
 ├── /faculty        ──► Faculty Roster & Account Governance
 ├── /branches       ──► Academic Department & Branch Code Setup
 ├── /volunteers     ──► Master System User Directory & Full Account Editing
 ├── /issues         ──► Global Grievance Monitoring & Resolution Controls
 ├── /backup         ──► Full System Data Snapshot Export (JSON Bundle)
 └── /finance & docs ──► Master Audit Views for Ledger & Documentation
```

#### **Executive Control Capabilities**:
- 📊 **Quota Counter Panel**: Real-time monitors tracking quota consumption (`Admin: X/4`, `Faculty: X/15`, `Student Coordinators: X/20`).
- ⚡ **Universal Approvals Center**: Review pending accounts across all branches with one-click decision tools.
- 📦 **Master System Backup**: Single-click download of full database JSON snapshot containing all system collections.

*🗣️ **Speaker Notes**: "The Admin overview panel gives super administrators full visibility over quota caps, pending approvals, global complaints, and database backups."*

---

### 🟢 SLIDE 9: Deep-Dive: Anti-Proxy QR Attendance & Gamified Points Engine

Anti-proxy verification prevents attendance fraud through dynamic time-bound validation.

```
  ┌─────────────────────────────────┐           ┌─────────────────────────────────┐
  │     Coordinator Panel           │           │        Student Mobile App       │
  │ Generates TOTP Dynamic QR Code  │           │ Scans Code via Camera Scanner   │
  └────────────────┬────────────────┘           └────────────────┬────────────────┘
                   │                                             │
                   └──────────────────┬──────────────────────────┘
                                      ▼
                  ┌──────────────────────────────────────┐
                  │ Next.js API Verification Handlers    │
                  ├──────────────────────────────────────┤
                  │ 1. Validate Time Window              │
                  │ 2. Log Student ID & Auditor Sign     │
                  │ 3. Create EventAttendance Record     │
                  └──────────────────────────────────────┘
```

#### **Engine Specifications**:
- **TOTP QR Generation**: Refreshes dynamic tokens every few seconds to prevent screenshot sharing.
- **Audit Logging**: Logs student ID, event ID, timestamp, status (`PRESENT`), and auditor signature (`markedById`).
- **Misconduct Warning Link**: Immediate shortcut to log warning tickets with proof URLs for proxy attempts.
- **Points Awarding**: Direct point allotment adding custom values (+10, +20, +50) with automated badge tier recalculation.

*🗣️ **Speaker Notes**: "With dynamic TOTP QR generation, students cannot take screenshots of attendance codes and share them. Every scan is cryptographically timestamped and logged."*

---

### 🟢 SLIDE 10: Deep-Dive: Financial Ledger & Circular Broadcast Engine

```
                       FINANCIAL LEDGER ARCHITECTURE
  ┌────────────────────────┐    ┌────────────────────────┐    ┌────────────────────────┐
  │     TOTAL BUDGET       │ +  │      TOTAL INCOME      │ -  │     TOTAL EXPENSES     │
  │ (Institutional Alloc)  │    │  (Sponsorships/Grants) │    │  (Equipment/Logistics) │
  └────────────────────────┘    └────────────────────────┘    └────────────────────────┘
                                             =
                               ┌───────────────────────────┐
                               │     REMAINING BALANCE     │
                               └───────────────────────────┘

                     CIRCULAR BROADCAST NOTIFICATION FLOW
  ┌────────────────────────┐    ┌────────────────────────┐    ┌────────────────────────┐
  │ Faculty Posts Circular │ ──►│ System Triggers Event  │ ──►│ Instant Notification   │
  │ Announcement           │    │ Payload via API        │    │ to 100% Active Students│
  └────────────────────────┘    └────────────────────────┘    └────────────────────────┘
```

#### **Key Features**:
- **Financial Receipts**: External file URL linking for digital receipt auditing.
- **Categorization**: Auto-tagging transactions by Event, Refreshments, Travel, Equipment, or Miscellaneous.
- **Broadcast Reach**: Circular announcements bypass group chat noise by writing direct notification database entries to every registered active volunteer.

*🗣️ **Speaker Notes**: "The financial ledger automatically calculates real-time remaining balances while keeping receipt proof attached. Circular broadcasts guarantee 100% reach to active volunteers."*

---

### 🟢 SLIDE 11: Deep-Dive: 1:1 Complaint Box & Data Backup Engine

#### 📩 1:1 Private Complaint System:
Allows volunteers to lodge private issues directly with department leaders without public exposure.

```
    ┌──────────────────┐               ┌──────────────────┐
    │    NOT SOLVED    │  ──────────►  │      SOLVED      │
    │ (Open Complaint) │  Coordinator  │(Resolved & Closed│
    │  [Pending Audit] │  Toggle       │  by Resolver ID) │
    └──────────────────┘               └──────────────────┘
```

#### 📦 Institutional Data Sovereignty (Data Backup Engine):

| Backup Scope | Target Endpoint | Included Data Objects | Purpose |
|---|---|---|---|
| **Financial Ledger** | `/api/backup?type=finance` | Income, Expense, Budget records, Receipts | Financial Auditing & Accounting |
| **Documentation Archives** | `/api/backup?type=documentation` | Document links, Categories, Uploaders | Institutional Archiving |
| **Event & Activity Logs** | `/api/backup?type=events` | Campaigns, Registrations, Photo links | Annual Activity Reporting |
| **Attendance Records** | `/api/backup?type=attendance` | Scanned Attendance Logs, Auditor Signatures | Attendance Verification |
| **Full System Snapshot** | `/api/backup?type=all` | Complete DB tables JSON bundle | Full Institutional Data Sovereignty |

*🗣️ **Speaker Notes**: "Grievance status transparently shifts from NOT_SOLVED to SOLVED when resolved. The 1-click JSON backup engine gives institutions full ownership over their data."*

---

### 🟢 SLIDE 12: Master Page-to-Account Feature Matrix

This matrix maps every application page route against the 5 role accounts:

| Page Route | Route Description | Public Visitor | Student Volunteer | Student Coordinator | Faculty Coordinator | System Admin |
|---|---|:---:|:---:|:---:|:---:|:---:|
| `/` | Landing Home Page | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/visitor` | Public Visitor Portal | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/login` | Account Sign In | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/signup` | Account Sign Up | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/onboarding` | Profile Onboarding | ❌ | ✅ | ✅ | ✅ | ✅ |
| `/pending` | Account Approval Wait Gate | ❌ | ✅ | ✅ | ✅ | ✅ |
| `/student/events` | Events & Campaigns Feed | ❌ | ✅ View/Register | ✅ View/Register | View | View |
| `/student/attendance` | Anti-Proxy QR Scan Gate | ❌ | ✅ Scan Code | ✅ Scan/Generate | Scan/Generate | Scan/Generate |
| `/student/profile` | Profile & myBharat ID | ❌ | ✅ Full Control | ✅ Full Control | View | View |
| `/student/portfolio` | Service Portfolio & Certs | ❌ | ✅ View/Download | ✅ View/Download | View | View |
| `/student/issues` | 1:1 Complaint Box | ❌ | ✅ Submit/View | ✅ Submit & **Resolve** | View & **Resolve** | View & **Resolve** |
| `/student/documentation` | Documentation Archive Hub | ❌ | ✅ Download | ✅ Download/Upload | Full Control | Full Control |
| `/student/announcements` | Circular Broadcast Feed | ❌ | ✅ Receive | ✅ Receive | View | View |
| `/student/chat` | Real-Time Peer Messaging | ❌ | ✅ Chat | ✅ Chat | ✅ Chat | ✅ Chat |
| `/student/volunteers` | Branch Volunteers Roster | ❌ | ❌ | ✅ **Manage Branch** | ✅ **Manage Branch** | Full Control |
| `/student/create-event` | Drive Creation Engine | ❌ | ❌ | ✅ **Create Event** | ✅ **Create Event** | Full Control |
| `/faculty/branch` | Branch Operations & Quota | ❌ | ❌ | ❌ | ✅ **Full Control** | Full Control |
| `/faculty/finance` | Financial Ledger Management | ❌ | ❌ | View Records | ✅ **Full Control** | Full Control |
| `/faculty/announcements` | Circular Broadcasting Engine | ❌ | ❌ | ❌ | ✅ **Broadcast All** | Broadcast All |
| `/faculty/backup` | Department Data Backup | ❌ | ❌ | ❌ | ✅ **Download JSON** | Download JSON |
| `/admin/overview` | Admin Executive Overview | ❌ | ❌ | ❌ | ❌ | ✅ **Full Control** |
| `/admin/approvals` | User Approvals Center | ❌ | ❌ | Branch Approvals | Branch Approvals | ✅ **Global Approvals** |
| `/admin/faculty` | Faculty Roster & Quotas | ❌ | ❌ | ❌ | ❌ | ✅ **Full Control** |
| `/admin/branches` | Branch Setup & Codes | ❌ | ❌ | ❌ | ❌ | ✅ **Full Control** |
| `/admin/volunteers` | Master Volunteer Directory | ❌ | ❌ | ❌ | ❌ | ✅ **Full Control** |
| `/admin/issues` | Global Issue Resolution | ❌ | ❌ | ❌ | ❌ | ✅ **Full Control** |
| `/admin/backup` | Master System JSON Backup | ❌ | ❌ | ❌ | ❌ | ✅ **Full Control** |

*🗣️ **Speaker Notes**: "This comprehensive page-to-account matrix illustrates how every route in the Next.js App Router enforces strict role access control."*

---

### 🟢 SLIDE 13: Security Hardening & Rate Limiting Framework

```
 Incoming API Request
       │
       ▼
 ┌────────────────────────────────────────────────────────┐
 │ 1. Next.js Middleware Gate                             │
 │    - Verify HTTPOnly Session Cookie (JWT)              │
 │    - Match Authorized Role vs Route (RBAC)             │
 └─────────────────────────┬──────────────────────────────┘
                           │
                           ▼
 ┌────────────────────────────────────────────────────────┐
 │ 2. IP Rate Limiter Gate (lib/rate-limit.js)            │
 │    - Sliding-Window Rate Limiting per IP               │
 │    - Protect Auth & Password Reset Endpoints           │
 └─────────────────────────┬──────────────────────────────┘
                           │
                           ▼
 ┌────────────────────────────────────────────────────────┐
 │ 3. Zod Payload Sanitization Gate (lib/validations.js)  │
 │    - Strict Object Schema Parsing & Type Coercion       │
 └─────────────────────────┬──────────────────────────────┘
                           │
                           ▼
 ┌────────────────────────────────────────────────────────┐
 │ 4. Prisma Client Execution & Response Sanitizer        │
 │    - Mask SQL tracebacks & stack traces in production  │
 └────────────────────────────────────────────────────────┘
```

#### **Security Features List**:
1. **Sliding-Window IP Rate Limiter**: Protects auth endpoints against brute-force attacks (`POST /api/auth/signup`, `POST /api/users/[id]/reset-password`).
2. **Strict Zod Schemas**: Validates input formats for events, user profiles, financial entries, and grievances.
3. **API Response Sanitizer**: Prevents internal database schema leakage by wrapping error tracebacks in clean HTTP error messages.
4. **Security Headers**: Standardized response headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`).

*🗣️ **Speaker Notes**: "Security is baked into every layer—from rate-limiting auth calls to stripping database stack traces before sending responses back to the browser."*

---

### 🟢 SLIDE 14: Conclusion & Key Impact

#### **Summary of Achievements**:
1. ✅ **Zero Proxy Attendance**: TOTP QR code verification with audit logs and misconduct warning integration.
2. ✅ **Account Quota Governance**: Capped accounts (4 Admins | 15 Faculty | 20 Student Coordinators).
3. ✅ **Financial Transparency**: Automated budget math with digital receipt link archiving.
4. ✅ **Guaranteed Communication**: Circular broadcast notifications reaching **100% of active volunteers**.
5. ✅ **Public Transparency & Data Privacy**: Visitor Portal showcasing verified volunteer rosters with strict contact masking.
6. ✅ **1-Click Data Sovereignty**: Instant JSON backup export for institutional compliance.

---

### 🙋‍♂️ Thank You! Questions & Answers

- 🌐 **Project Repository**: `https://github.com/Bhuvan2402-bhuvan/erp1`
- 📧 **Contact Email**: `yenugabhuvanamohanchowdary@gmail.com`
- 🏫 **Institution**: VVITU NSS Enterprise Platform

---

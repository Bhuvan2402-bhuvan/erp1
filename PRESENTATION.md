# 📊 Volunteer ERP (SAMP): Project Presentation Deck

> **Student Attendance & Operations ERP (SAMP)**  
> *A Centralized, Role-Governed Enterprise Resource Planning & Anti-Proxy Attendance Platform for Academic & Community Volunteering Drives.*

---

## 📽️ Presentation Structure

- **Slide 1**: Title & Project Executive Summary
- **Slide 2**: Problem Statement & Project Motivation
- **Slide 3**: System Architecture & Tech Stack
- **Slide 4**: Account Quotas & Role Hierarchy (4 Admins | 15 Faculty | 20 Coordinators | Volunteers)
- **Slide 5**: Core Categories System (Events, Finance, Documentation & Circular Broadcast)
- **Slide 6**: Anti-Proxy QR Attendance & Gamified Points Engine
- **Slide 7**: 1:1 Complaint Box & Grievance Resolution
- **Slide 8**: Public Visitor Portal & Transparency Controls
- **Slide 9**: Institutional Data Backup & Export Engine
- **Slide 10**: Key Takeaways & Live Impact

---

---

### 🟢 SLIDE 1: Title & Executive Summary

#### **Project Name**: Volunteer ERP (Student Attendance Management Portal - SAMP)
#### **Presenter**: Bhuvana Mohan Chowdary & Development Team
#### **Core Objective**: To digitize and streamline institutional volunteering drives, anti-proxy attendance verification, financial ledgers, document archives, circular announcements, and grievance management under strict role account governance.

#### **Key System Metrics**:
- 🏢 **Multi-Branch Operations**: Scoped data access for academic departments.
- 🔐 **Role Governance**: Hard capped account quotas for Admin, Faculty, and Coordinators.
- ⚡ **Real-Time Communication**: P2P chat, grievance tracking, and circular broadcasts.
- 📊 **1-Click System Backup**: Enterprise export for financial records, attendance logs, and event documentation.

*🗣️ **Speaker Notes**: "Good morning everyone. Today we are presenting Volunteer ERP, an all-in-one institutional portal that solves the key challenges of proxy attendance, unorganized event budgets, missing event documentation, and unmonitored volunteer grievances."*

---

### 🟢 SLIDE 2: Problem Statement & Motivation

#### **The Challenges in Academic Volunteering Drives**:
1. ⚠️ **Proxy Attendance Fraud**: Students scanning shared QR screenshots or signing manual attendance sheets without physical presence.
2. 📉 **Lack of Account Governance**: Uncontrolled account creation leading to unverified admin or coordinator privileges.
3. 💸 **Unmonitored Event Finances**: Lack of real-time budget, sponsorship, and expense tracking with attached digital receipts.
4. 📄 **Fragmented Document Storage**: Event reports, circular notices, and certificates stored across personal drives without centralized archiving.
5. 📢 **Communication Gaps**: Circular notices failing to reach all volunteers instantly.
6. ❓ **Unresolved Grievances**: Complaints getting lost in group chats without clear `SOLVED` / `NOT_SOLVED` status tracking.

*🗣️ **Speaker Notes**: "Traditional manual attendance sheets and unorganized messaging groups cause significant proxy fraud and financial ambiguity. Our platform introduces strict governance and automated tracking to solve these core issues."*

---

### 🟢 SLIDE 3: System Architecture & Technology Stack

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                    Client Application (PWA / Mobile / Desktop)         │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │ (HTTPS API Requests)
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                  Next.js 14 Middleware Security Gate                   │
 │       (JWT Session Verification, IP Rate Limiting, RBAC Checks)       │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │ (Authorized Route Processing)
                                     ▼
 ┌───────────────────────────────────┴────────────────────────────────────┐
 │                  Next.js Route Handlers & Zod Validation               │
 ├───────────────────────────────────┬────────────────────────────────────┤
 │  Prisma Client ORM                │  Supabase Realtime Messaging Engine│
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │ (PostgreSQL Driver)
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                     PostgreSQL Database (Supabase Cloud)               │
 └────────────────────────────────────────────────────────────────────────┘
```

#### **Technology Stack**:
- **Frontend & App Framework**: Next.js 14 (App Router), React 18, TailwindCSS, Framer Motion.
- **Backend & Database**: Prisma ORM, PostgreSQL (Supabase), Supabase Auth.
- **Security & Integrity**: Zod Schema Validation, HTTPOnly JWT Cookies, Sliding-Window IP Rate Limiter.

---

### 🟢 SLIDE 4: Role Hierarchy & Account Quota Governance

Our platform enforces **strict role account caps** to maintain administrative integrity:

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
        └─────────────────────────────────────────────────┘
```

#### **Quota Breakdown**:
- **Admin**: Capped at **4 Accounts** (Supervision & Global Approvals).
- **Faculty Coordinator**: Capped at **15 Accounts** (Departmental Officers).
- **Student Coordinator**: Capped at **20 Accounts** (Peer Leaders).
- **Volunteers**: Open Registration with Email Authentication.

---

### 🟢 SLIDE 5: Core System Categories

The system categorizes institutional operations into **4 major pillars**:

1. 📅 **Events Schedule & Updates**:
   - Event creation, location, category (Camp, Workshop, Rally, Plantation, Survey).
   - Registrations mapping, photo gallery uploads, and status lifecycle (`UPCOMING`, `ONGOING`, `COMPLETED`).

2. 💰 **Financial Ledger**:
   - Budget allocation, income/sponsorship logging, and expense tracking.
   - Real-time balance calculations: `Remaining Balance = (Budget + Income) - Expenses`.
   - Attachment of receipt file URLs.

3. 📂 **Documentation & Archive Hub**:
   - Upload & download event summary reports, circular notices, guidelines, and historical archives.

4. 📢 **Circular Broadcasting Engine**:
   - Posting a circular notice instantly dispatches broadcast notifications to **each and every active volunteer**.

---

### 🟢 SLIDE 6: Anti-Proxy Attendance & Gamified Volunteer Engine

#### 🛡️ Anti-Proxy QR Attendance Gate:
- Dynamic, time-sensitive TOTP QR code generator for faculty and coordinators.
- Timestamped audit logs recording student ID, event ID, attendance presence, and auditor signature.

#### ⚠️ Misconduct & Warning Engine:
- Coordinators can issue warning notices with proof URLs for absent or proxy-attempting volunteers.

#### 🏆 Gamified Points & myBharat Integration:
- **Points Allotment**: Coordinators award performance points (+10, +20, etc.) with custom reasons.
- **myBharat Integration**: Volunteers store and update official `myBharatId` and `myBharatCertUrl`.
- **Achievement Badges**:
  - 🥉 **Bronze**: < 50 pts | 🥈 **Silver**: 50–149 pts | 🥇 **Gold**: 150–299 pts | 💎 **Platinum**: 300+ pts

---

### 🟢 SLIDE 7: 1:1 Complaint Box & Grievance Resolution

#### **Structured 1:1 Complaint System**:
- Volunteers open direct private complaint tickets targeted at branch coordinators and faculty.
- Track real-time resolution status:

```
    ┌──────────────────┐               ┌──────────────────┐
    │    NOT SOLVED    │  ──────────►  │      SOLVED      │
    │ (Open Complaint) │  Coordinator  │(Resolved & Closed│
    │  [Pending Audit] │  Action       │  by Coordinator) │
    └──────────────────┘               └──────────────────┘
```

#### **Key Features**:
- Single-click toggle between `SOLVED` and `NOT_SOLVED`.
- Resolver identity tracking (`resolvedById`, `resolvedAt`).

---

### 🟢 SLIDE 8: Public Visitor Portal & Transparency

#### **Public Visitor Page (`/visitor`)**:
- Publicly accessible view without authentication requirements.
- Designed for parents, external auditors, and institutional guests.

#### **Features**:
- 📊 **Live Impact Metrics**: Total active volunteers, coordinators, faculty, and completed drives.
- 📜 **Verified Volunteer Roster**: Displays volunteer name, department code, roll number, academic year, coordinator badge, total points, and tier badges.
- 🔒 **Privacy Shield**: Street addresses, phone numbers, and email addresses are strictly hidden.

---

### 🟢 SLIDE 9: Enterprise Data Backup & Export Engine

#### **1-Click Institutional Backup Hub (`/admin/backup` & `/faculty/backup`)**:
Provides complete data sovereignty and institutional compliance with instant JSON export options:

- 📑 **Financial Ledger Backup**: Complete income, expense, and budget audit trail.
- 📄 **Documentation & Reports Archive**: Complete document metadata and file URL listings.
- 📊 **Event Activity Reports**: Campaign summaries, registration counts, and photo references.
- 🛡️ **Audited Attendance Logs**: Complete student attendance records with coordinator signatures.
- 📦 **Full System Snapshot**: Complete JSON bundle containing all database tables.

---

### 🟢 SLIDE 10: Conclusion & Key Impact

#### **Summary of Achievements**:
1. ✅ **Eliminated Attendance Fraud**: Time-sensitive TOTP QR verification with warning audit logs.
2. ✅ **Enforced Account Governance**: Hard capped account quotas (4 Admins | 15 Faculty | 20 Coordinators).
3. ✅ **Financial Transparency**: Real-time ledger with automated balance calculation and receipt links.
4. ✅ **Guaranteed Communication**: Circular broadcast notifications reaching **100% of active volunteers**.
5. ✅ **Public Transparency**: Public Visitor Portal showcasing verified volunteers without compromising personal privacy.

#### **Thank You! Questions & Answers**
- 🌐 **Project Repository**: `https://github.com/Bhuvan2402-bhuvan/erp1`
- 📧 **Coordinator Contact**: `yenugabhuvanamohanchowdary@gmail.com`

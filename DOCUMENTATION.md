# VVITU NSS ERP: Complete System & User Role Documentation

VVITU NSS ERP is a centralized, enterprise-grade Resource Planning and Attendance Management Portal designed to streamline student volunteering, branch operations, financial management, documentation archiving, anti-proxy attendance verification, and real-time community engagement.

---

## 1. System Architecture & Technical Specifications

The application uses a modern, secure, and highly scalable serverless web architecture:

* **Frontend Framework**: Next.js 14 (App Router) using React 18, TailwindCSS, and Framer Motion.
* **ORM & Data Access**: Prisma Client v5 with PostgreSQL.
* **Database Infrastructure**: Supabase PostgreSQL hosting relational models and query indexing.
* **Authentication**: Supabase Auth coupled with HTTPOnly JWT cookies and rate-limited API handlers.
* **Real-time Engine**: Supabase Realtime client for instant peer-to-peer and coordinator messaging.
* **Deployment & Edge Runtime**: Vercel Edge Serverless runtime with Next.js Middleware RBAC security.

```
       ┌──────────────────────────────────────────────────────────┐
       │                 Browser Client (PWA ready)               │
       └─────────────────────────────┬────────────────────────────┘
                                     │ (HTTPS API Requests)
                                     ▼
       ┌──────────────────────────────────────────────────────────┐
       │             Next.js Serverless Middleware Gate           │
       │   (JWT Verification, Role Access Control, Rate Limiting) │
       └─────────────────────────────┬────────────────────────────┘
                                     │ (Authorized Route Handlers)
                                     ▼
       ┌──────────────────────────────────────────────────────────┐
   | Feature / Capability | Public Visitor | Student Volunteer | Student Coordinator | Faculty Coordinator | System Admin |
|---|:---:|:---:|:---:|:---:|:---:|
| **Account Quota Cap** | N/A | Unlimited | **Max 20** | **Max 15** | **Max 4** |
| **Browse Public Visitor Portal** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **View Verified Volunteer Names & Count** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Self Sign-Up & Registration** | N/A | ✅ | Self (Requires Promotion) | ✅ (Quota Check) | Restricted |
| **Manage myBharat ID & Certificate URL** | ❌ | ✅ | ✅ | View & Audit | View & Audit |
| **Register & Participate in Events** | ❌ | ✅ | ✅ | Manage Drives | Manage Drives |
| **Anti-Proxy QR Attendance Scan** | ❌ | ✅ (Scan Code) | ✅ (Generate/Scan) | ✅ (Generate/Scan) | ✅ (Generate/Scan) |
| **Earn & View Service Points / Badges** | ❌ | ✅ | ✅ | Award Points | Award Points |
| **1:1 Complaint Box Submission** | ❌ | ✅ | ✅ | Resolve Complaints | Resolve Complaints |
| **Toggle Complaint (SOLVED / NOT_SOLVED)** | ❌ | View Status | ✅ Toggle | ✅ Toggle | ✅ Toggle |
| **Dynamic Custom Forms (Fill & Submit)** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Form Builder (Create & Design)** | ❌ | ❌ | ✅ (Branch Forms) | ✅ (Branch Forms) | ✅ (System Forms) |
| **Form Response Review & Approvals** | ❌ | View Own Submissions | ✅ Review Branch | ✅ Review Branch | ✅ Full Review |
| **Form Analytics & Excel/CSV Export** | ❌ | ❌ | ✅ Branch Analytics | ✅ Branch Analytics | ✅ System Analytics |
| **Finance Ledger Management** | ❌ | View Docs | Add/View Records | Full Control | Full Control |
| **Documentation Hub (Upload/Download)** | ❌ | Download | Upload & Download | Full Control | Full Control |
| **Broadcast Circular Notifications** | ❌ | Receive All | Receive All | Broadcast to All | Broadcast to All |
| **Issue Misconduct / Absence Warnings** | ❌ | Receive Notice | Issue Notice | Issue Notice | Full Audit |
| **One-Click Data Backup & Export** | ❌ | ❌ | ❌ | ✅ Download | ✅ Download |
| **Approve / Reject Pending Accounts** | ❌ | ❌ | Branch Approvals | Branch Approvals | System Approvals |

---

## 3. User Role Working Capabilities (In-Depth)

### 🌐 1. Public Visitor (Unauthenticated Guest)
* **Target Audience**: Parents, external auditors, institution visitors, and public stakeholders.
* **Working Capabilities**:
  * **Visitor Dashboard (`/visitor`)**: Access live high-level impact statistics including Total Active Volunteers, Student Coordinators, Faculty Officers, and Executed Campaigns.
  * **Public Volunteer Roster**: View public directory of registered volunteers displaying name, department code, roll number, academic year, coordinator status, total accumulated service points, and achievement tier badges (Bronze, Silver, Gold, Platinum).
  * **Privacy Control**: Private contact numbers, email addresses, and personal street addresses are strictly hidden.
  * **Search & Department Filtering**: Instant search by volunteer name or roll number, with branch dropdown filters.

---

### 🎓 2. Student Volunteer (Default Registered Student)
* **Account Requirement**: Self registration via `/signup` with email verification.
* **Working Capabilities**:
  * **Campaign Feed (`/student/events`)**: Browse upcoming, ongoing, and completed volunteering campaigns (Blood Donation, Plantation, Surveys, Workshops). One-click registration.
  * **Anti-Proxy QR Gate**: Present personal QR code or scan time-sensitive TOTP QR codes generated by coordinators to log audited live attendance.
  * **myBharat Portal Profile (`/student/profile`)**: Manage personal details, phone number, bio, avatar, and official `myBharatId` & `myBharatCertUrl`.
  * **Points & Gamified Achievements**: Earn performance points (+10, +20, etc.) awarded by coordinators for active campaign work. Track achievement milestones:
    * 🥉 **Bronze**: < 50 points
    * 🥈 **Silver**: 50 - 149 points
    * 🥇 **Gold**: 150 - 299 points
    * 💎 **Platinum**: 300+ points
  * **Service Portfolio (`/student/portfolio`)**: Visual service summary logging total volunteer hours, completed drives, attendance percentage, and downloadable digital service certificates.
  * **1:1 Complaint Box (`/student/issues`)**: Submit direct 1:1 grievances or requests to branch coordinators and faculty. Monitor real-time status: **`NOT_SOLVED`** vs **`SOLVED`**.
  * **Available Custom Forms (`/student/forms/available`)**: Discover active department and campus-wide surveys, registration forms, and feedback questionnaires.
  * **Dynamic Form Submission (`/student/forms/[formId]/fill`)**: Complete forms with rich input types (short/long text, dropdowns, ratings, checkboxes, linear scales, file uploads, yes/no). Supports saving drafts and draft recovery.
  * **My Form Submissions (`/student/forms/my-submissions`)**: Track status of submitted forms (**`DRAFT`**, **`SUBMITTED`**, **`UNDER_REVIEW`**, **`APPROVED`**, **`REJECTED`**) with reviewer notes.
  * **Documentation Hub (`/student/documentation`)**: Download official event reports, standard operating guidelines, circular notices, and archives.
  * **Real-time Peer Chat (`/student/chat`)**: Direct real-time messaging with assigned mentors, coordinators, and peers.

---

### ⭐ 3. Student Coordinator (Promoted Volunteer)
* **Quota Capacity**: **Maximum 20 accounts across the system**.
* **Account Requirement**: Promoted from Volunteer by a Faculty member or Admin.
* **Working Capabilities**:
  * **All Capabilities of a Student Volunteer**, plus:
  * **Branch Volunteers Management (`/student/volunteers`)**: View and manage volunteers within the coordinator's academic branch.
  * **Approve Pending Branch Sign-Ups**: Review and approve newly registered student accounts belonging to their department.
  * **Custom Forms Builder & Management (`/student/forms`)**: Create, publish, close, edit, and track branch custom forms (`/student/forms/create`).
  * **Form Response Review**: Inspect volunteer submissions, add coordinator review notes, and set response approval status (**`APPROVED`** / **`REJECTED`** / **`UNDER_REVIEW`**).
  * **Form Analytics & Data Export**: View visual submission analytics and export full response matrices to `.xlsx` Excel spreadsheets.
  * **Allot Performance Points**: Modal tool to award points (+10, +20, etc.) with custom reasons to branch volunteers.
  * **Issue Misconduct Warnings**: Issue official warning notices (with optional proof URLs) to absent or proxy-attempting volunteers.
  * **Post New Event Drives (`/student/create-event`)**: Create and launch new volunteering activities for branch volunteers.
  * **Manage 1:1 Complaints**: Review student complaints and toggle status between **`NOT_SOLVED`** and **`SOLVED`**.

---

### 👨‍🏫 4. Faculty Coordinator (Branch Faculty Officer)
* **Quota Capacity**: **Maximum 15 accounts across the system**.
* **Account Requirement**: Registered via `/signup` under Faculty role, subject to quota check and Admin approval.
* **Working Capabilities**:
  * **My Branch Operations Hub (`/faculty/branch`)**: Comprehensive dashboard tracking department stats, total volunteers, coordinators count, and student list.
  * **Promote Student Coordinators**: Toggle `isCoordinator` status on student profiles (enforces maximum 20 student coordinators limit).
  * **Assign Faculty Mentors**: Assign specific faculty mentors to student volunteers.
  * **Dynamic Forms Control Suite (`/faculty/forms`)**: Complete lifecycle management for department forms (Drafts, Published, Closed). Visual drag-and-drop field builder, conditional display rules, and customizable access visibility (`DEPARTMENT_ONLY`, `ALL_VOLUNTEERS`, `SELECTED_DEPARTMENTS`).
  * **Form Submissions Review & Decisioning (`/faculty/forms/[formId]/responses`)**: Review submitted responses, inspect attached uploaded files, add faculty notes, and transition statuses (**`UNDER_REVIEW`** -> **`APPROVED`** / **`REJECTED`**).
  * **Form Analytics Engine (`/faculty/forms/[formId]/analytics`)**: Interactive chart breakdowns, response rates, field distributions, and one-click `.xlsx` Excel / CSV data export (`/api/forms/[formId]/export`).
  * **Financial Ledger Management (`/faculty/finance`)**: Log and monitor event budgets, income/sponsorships, and operational expenses with receipt file URLs. View automated balance calculations.
  * **Documentation Management (`/faculty/documentation`)**: Upload and publish event reports, circular notices, guidelines, and archives.
  * **Broadcast Circular Announcements (`/faculty/announcements`)**: Post campus-wide circulars with instant push notification delivery to **each and every active volunteer**.
  * **System Data Backup Hub (`/faculty/backup`)**: One-click JSON export for financial records, documentations, event reports, form responses, and audited student attendance logs.

---

### 🛡️ 5. System Administrator (Super Admin)
* **Quota Capacity**: **Maximum 4 accounts across the system**.
* **Working Capabilities**:
  * **System Overview Dashboard (`/admin/overview`)**: Master control dashboard visualizing system-wide metrics, department distributions, active campaigns, open grievances, and role account quota counters (`Admin (X/4)`, `Faculty (X/15)`, `Student Coordinators (X/20)`).
  * **User Approvals Center (`/admin/approvals`)**: Review all pending sign-ups across all branches with single-click Approval or Rejection controls.
  * **Global Forms Governance Hub (`/admin/forms`)**: Audit all campus forms across all departments, inspect active vs closed status, view response volumes, and monitor form audit logs.
  * **Faculty Management (`/admin/faculty`)**: Manage faculty members, employee IDs, and department assignments.
  * **Branch Management (`/admin/branches`)**: Create, edit, and audit academic departments and codes.
  * **Global Complaint & Grievance Control (`/admin/issues`)**: Monitor system-wide complaints and switch resolution status (**`SOLVED`** / **`NOT_SOLVED`**).
  * **System Backup & Data Export Hub (`/admin/backup`)**: Full system snapshot export (JSON bundle) including all system data models.

---

## 4. Primary Functional Modules & Specifications

### 📊 1. Role Account Quota Limits
- **Strict Limits**: Admin (4), Faculty Coordinator (15), Student Coordinator (20), Volunteers (Open).
- **Validation Gates**:
  - Enforced during registration (`/api/auth/signup`).
  - Enforced during account approval (`/api/admin/approvals`).
  - Enforced during coordinator promotion (`/api/users/[id]`).

---

### 💰 2. Financial Ledger & Budget Management
- **Prisma Model**: `FinanceRecord` (`id`, `title`, `amount`, `type` [`INCOME`, `EXPENSE`, `BUDGET`], `category`, `description`, `receiptUrl`, `createdById`, `createdAt`).
- **Functionality**:
  - Automated mathematical sum calculations: `Remaining Balance = (Total Budget + Total Income) - Total Expenses`.
  - Category tag filtering (Event, Equipment, Refreshments, Travel, Misc).
  - External receipt URL attachment.

---

### 📂 3. Documentation & Archive Hub
- **Prisma Model**: `Documentation` (`id`, `title`, `category` [`REPORT`, `CIRCULAR`, `GUIDELINE`, `ARCHIVE`], `description`, `fileUrl`, `uploadedById`, `createdAt`).
- **Functionality**:
  - Centralized file library with category filtering tabs.
  - One-click file download / view links.
  - Uploader identity and role tracing.

---

### 📢 4. Circular Broadcasting Engine
- **Mechanism**: Integrated into Public Messages / Announcements posting (`/api/public-messages`).
- **Broadcast Execution**: Upon posting a circular notice, the system automatically creates instant `Notification` records for **each and every active student volunteer** in the system.

---

### 🛡️ 5. Anti-Proxy Attendance Verification
- **Mechanism**: Dynamic TOTP QR code generator for faculty and coordinators.
- **Audit Log**: Prisma `EventAttendance` table logs timestamp, event ID, student ID, attendance presence (`Boolean`), and auditor `markedById`.
- **Misconduct Warnings**: Direct modal integration to log official warning records (`WarningLog`) with proof URLs for absent or proxy-scanning volunteers.

---

### 📝 6. Dynamic Custom Forms & Survey Engine
- **Prisma Models**: `Form`, `FormField`, `FormResponse`, `FormAnswer`, `FormAccess`, `FormResponseNote`, `FormAuditLog`.
- **Field Types**: 18 supported input field types including Short Text, Long Text, Dropdown, Radio, Checkbox, Multi-Select, Number, Email, Phone, Date, Rating, Linear Scale, Yes/No, File Upload, Image Upload, Signature, Section/Heading, and Divider.
- **Form Lifecycle**: Status state transitions (`DRAFT` -> `PUBLISHED` -> `CLOSED` -> `ARCHIVED`).
- **Visibility Governance**: `DEPARTMENT_ONLY`, `SELECTED_DEPARTMENTS`, `ALL_VOLUNTEERS`, `SELECTED_USERS`.
- **Response Review Workflow**: Multi-tier response decisioning (`DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`) with reviewer audit notes.
- **Export & Analytics Engine**: Automated bar chart field distributions, response completion rates, and 1-click `.xlsx` Excel and `.csv` matrix export via `xlsx` integration.

---

### 📦 7. System Data Backup Engine
- **Endpoint**: `/api/backup?type=[all|finance|documentation|events|attendance|forms]`.
- **Capability**: One-click download of JSON structured data exports for offline backup storage and institutional compliance.

---

## 5. Security, Validation & Performance Hardening

1. **Rate Limiting**: IP-based sliding window rate limiter (`lib/rate-limit.js`) protecting sensitive endpoints (`POST /api/auth/signup`, `POST /api/users/[id]/reset-password`).
2. **Schema Sanitization & Validation**: All incoming API requests validated strictly using Zod schemas (`lib/validations.js`).
3. **Data Sanitization**: Global helper wrappers (`lib/api-helpers.js`) sanitize API error tracebacks to prevent SQL schema or internal stack leaks.
4. **Security Headers**: Configured in `next.config.mjs` (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`).

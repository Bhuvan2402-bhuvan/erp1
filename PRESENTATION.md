# 🎤 VVITU NSS ERP — Official Presentation Deck & Live Demo Guide

> **Project Title**: VVITU NSS ERP (Institutional Resource Planning & Monitoring Platform)  
> **Institution**: Vasireddy Venkatadri Institute of Technology (Autonomous)  
> **Production Deployment URL**: [https://erp-tan-six.vercel.app](https://erp-tan-six.vercel.app)  
> **Target Audience**: College Management, External NAAC/NIRF Auditors, Faculty Program Officers, Student Coordinators

---

## 📑 Presentation Structure
* **Part 1**: Executive Pitch Deck (Slides 1 – 10)
* **Part 2**: Core Feature Showcase & Technical Innovations
* **Part 3**: Step-by-Step Live Demonstration Script
* **Part 4**: Demo Accounts & Access Credentials

---

# 📽️ PART 1: Executive Pitch Deck (Slides 1 – 10)

---

### 🟢 SLIDE 1: Title & Executive Summary
* **Project Name**: VVITU NSS ERP
* **Tagline**: *Centralized, Role-Governed ERP & Anti-Proxy Attendance Platform for Institutional Volunteering Drives.*
* **Objective**: Replace manual paper logs, unorganized spreadsheets, and proxy attendance with a unified, real-time digital management ecosystem.
* **Core Pillars**:
  1. 📊 **Academic Year Monitoring**: Multi-year evaluation (`2022-2023` to `2026-2027`) and department benchmarking.
  2. 💰 **Financial Audit & Ledger**: Real-time budget allocations, operational expenses, digital receipts, and YoY comparisons.
  3. 📸 **Unit-Wise Event Operations & Photo Galleries**: Branch-scoped campaigns, client-side photo compression, and public lightbox showcase.
  4. 📱 **Anti-Proxy QR Attendance Gate**: Dynamic time-sensitive QR codes with instant mobile camera verification.
  5. 📝 **Dynamic Custom Form Builder**: 18+ question types with multi-stage approval workflows and `.xlsx` export.
  6. 🎖️ **Gamified Volunteer Recognition**: Tiered milestone badges (Bronze ➔ Platinum) and official `myBharat` ID sync.

> 🗣️ **Speaker Note**:  
> *"Good morning, esteemed panel and guests. Today we present VVITU NSS ERP — an enterprise-grade institutional portal that digitizes student community service, enforces anti-proxy attendance, automates financial audits, and provides real-time academic year monitoring for college administration and NAAC auditing."*

---

### 🟢 SLIDE 2: Problem Statement & Motivation

| Traditional NSS Operations | VVITU NSS ERP Solution |
|:---|:---|
| ❌ **Proxy Attendance & Ghost Volunteers**: Paper signatures or forwarded QR screenshots. | ✅ **Time-Sensitive Dynamic QR Scanner**: Requires physical presence; logs verified service hours (+3 hrs/camp). |
| ❌ **Scattered Financial Records**: Receipts and expenses stored in personal chats or paper bills. | ✅ **Centralized Financial Ledger**: Categorized budgets, expense meters, proof receipts, and 1-click audit CSVs. |
| ❌ **No Academic Year Comparisons**: Difficult to measure year-over-year volunteer engagement. | ✅ **Academic Year Monitoring Engine**: 5-Year historical trends, department rankings, and institutional reports. |
| ❌ **Fragmented Photo Archives**: Camp photos lost in messaging groups without captions or credits. | ✅ **Unit-Wise Photo Management**: Compressed uploads, unit badges (`CSE Unit`), and visitor lightbox galleries. |
| ❌ **Rigid Paper Registration Forms**: Hard to collect custom feedback or volunteer survey data. | ✅ **Dynamic Form Builder**: Custom drag-and-drop forms with multi-status approval workflows. |

---

### 🟢 SLIDE 3: System Architecture & Technology Stack

```
   ┌──────────────────────────────────────────────────────────┐
   │             Responsive Web & Mobile Client (PWA)         │
   │           Next.js 14 + React 18 + Tailwind CSS           │
   └────────────────────────────┬─────────────────────────────┘
                                │ HTTPS / Secure WSS
                                ▼
   ┌──────────────────────────────────────────────────────────┐
   │            Edge Middleware & Security Guard              │
   │  - HTTPOnly JWT Sessions  - Role-Based Access Control    │
   │  - IP Rate Limiting       - Google OAuth 2.0 (PKCE)      │
   └────────────────────────────┬─────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
   ┌───────────────┐   ┌─────────────────┐   ┌────────────────────┐
   │ App API Gates │   │ Dynamic Pages   │   │ Supabase Realtime  │
   │ /api/monitor  │   │ /admin/*        │   │ - Live 1:1 Chat    │
   │ /api/finance  │   │ /faculty/*      │   │ - Circular Pushes  │
   │ /api/events   │   │ /student/*      │   │                    │
   │ /api/forms    │   │ /visitor        │   │                    │
   └───────┬───────┘   └────────┬────────┘   └─────────┬──────────┘
           │                    │                      │
           └────────────────────┼──────────────────────┘
                                ▼
   ┌──────────────────────────────────────────────────────────┐
   │                     Prisma ORM v5.22                     │
   └────────────────────────────┬─────────────────────────────┘
                                │ Connection Pooler
                                ▼
   ┌──────────────────────────────────────────────────────────┐
   │            Supabase PostgreSQL Relational DB             │
   │            (18 Scalable Relational Models)               │
   └──────────────────────────────────────────────────────────┘
```

---

### 🟢 SLIDE 4: Role-Based Access Control (RBAC) & Quotas

```
                            ┌────────────────────────┐
                            │   System Admin (Max 4) │
                            │ Full System Governance │
                            └───────────┬────────────┘
                                        │
                                        ▼
                   ┌─────────────────────────────────────────┐
                   │   Faculty Coordinators / POs (Max 15)   │
                   │ Department Scoped & Drive Operations    │
                   └────────────────────┬────────────────────┘
                                        │
                                        ▼
                   ┌─────────────────────────────────────────┐
                   │    Student Coordinators (Max 20)        │
                   │ Branch Leads & Attendance Operators     │
                   └────────────────────┬────────────────────┘
                                        │
                                        ▼
                   ┌─────────────────────────────────────────┐
                   │     Student Volunteers (Unlimited)      │
                   │ Camp Registration & Service Portfolio   │
                   └─────────────────────────────────────────┘
```

* **System Admins (`ADMIN`)**: Master control over users, institutional academic year monitoring, system approvals, and master financial reports.
* **Faculty Coordinators (`FACULTY`)**: Program Officers governing their specific academic unit (CSE, ECE, MECH, etc.), publishing department drives, uploading photos, approving branch sign-ups, and managing unit budgets.
* **Student Coordinators (`STUDENT` + Coordinator)**: Department student leads assisting with form creation, point allotment, QR generation, and volunteer attendance.
* **Student Volunteers (`STUDENT`)**: Enrolled volunteers scanning attendance, earning points, submitting custom forms, and generating certified portfolios.
* **Public Visitors & Auditors**: Open transparency access to live impact statistics, faculty leadership directory, and volunteer achievements.

---

### 🟢 SLIDE 5: Flagship 1 — Academic Year Monitoring Engine

* **Live URL**: `/admin/monitoring` & `/faculty/monitoring`
* **Key Innovations**:
  * **Interactive Multi-Year Selector**: View statistics for `2026-2027`, `2025-2026`, `2024-2025`, `2023-2024`, and `2022-2023`.
  * **Executive KPI Cards**: Active Enrolled Volunteers, Verified Service Hours, Campaigns & Drives Executed, and Student Coordinator Distribution.
  * **Department Benchmarking Leaderboard**: Real-time performance matrix ranking all 10 engineering departments (CSE, ECE, EEE, MECH, CIVIL, IT, CSM, CSD, AID, CIC).
  * **5-Year Growth Progression**: Comparative charts tracking volunteer enrollment volume and service hour growth across academic years.
  * **Top Volunteer Recognition**: Leaderboard displaying top point and service-hour contributors for each academic cycle.
  * **1-Click CSV Export**: Download the official Institutional Academic Year Report formatted for NAAC accreditation.

---

### 🟢 SLIDE 6: Flagship 2 — Year-Wise Financial Reports & Audit Ledger

* **Live URL**: `/admin/finance` & `/faculty/finance`
* **Key Innovations**:
  * **Comprehensive Financial Health**: Real-time metrics on Total Allocated Budget (₹), Incurred Operational Expenses (₹), Sponsorships & Inflows (₹), and Remaining Net Balance (₹).
  * **Budget Utilization Meter**: Live percentage progress bars preventing budget overruns.
  * **Year-Wise Financial Comparison**: Visual annual comparison cards tracking budget allocations vs actual spending across multiple academic cycles.
  * **Expense Category Matrix**: Itemized breakdown across Event Logistics, Refreshments, First Aid / Medical, Transportation, Printing & Banners, and Awards.
  * **Digital Receipt Attachment**: Direct linking and previewing of proof invoices and receipts.
  * **1-Click Audit Report Export**: Spreadsheet download (`NSS_Financial_Report_AY_[Year].csv`) formatted for institutional auditors.

---

### 🟢 SLIDE 7: Flagship 3 — Unit-Wise Event Operations & Photo Galleries

* **Live URL**: `/faculty/events`, `/student/events`, `/visitor`
* **Key Innovations**:
  * **Unit Scoping & Tagging**: Campaigns are tagged under the organizing department unit (`CSE Unit`, `ECE Unit`, `MECH Unit`, etc.).
  * **Client-Side Image Compressor**: Compresses high-resolution images in the browser before upload (JPEG 0.8 quality, 1024px max) to eliminate network lag.
  * **Interactive Photo Gallery & Lightbox**: Full-screen photo viewer with captions, upload timestamps, and coordinator attribution.
  * **Visitor Directory Integration**: Real-time feed showcasing unit activity photos and drives to the general public.

---

### 🟢 SLIDE 8: Flagship 4 — Anti-Proxy QR Attendance Gate

* **Components**: `EventQRModal.jsx`, `VolunteerQRScannerModal.jsx`
* **Key Innovations**:
  * **Dynamic QR Code Display**: Faculty/Coordinators project dynamic QR codes on screens during live drives.
  * **Integrated Mobile Camera Scanner**: Volunteers open `/student/events` and scan the live code using their smartphone camera.
  * **Automated Hour Calculation**: Instantly credits verified service hours (+3 hours per verified event) to the volunteer's record.
  * **Anti-Fraud Protections**: Prevents double-scanning, validates active enrollment, and maintains an audited attendance ledger.

---

### 🟢 SLIDE 9: Flagship 5 — Dynamic Custom Form Builder & Submissions

* **Live URL**: `/faculty/forms` & `/student/forms`
* **Key Innovations**:
  * **18 Input Field Types**: Short text, paragraphs, single select (radio/dropdown), multi-select (checkboxes), rating scale, linear 1-10 scale, yes/no, and file uploads.
  * **Publishing Lifecycle**: `DRAFT` ➔ `PUBLISHED` ➔ `CLOSED`.
  * **Multi-Stage Review Workflow**: Coordinators inspect responses, add review notes, and assign status (`APPROVED`, `UNDER_REVIEW`, `REJECTED`).
  * **Analytics & Excel Export**: Visual submission distribution graphs and instant 1-click `.xlsx` Excel data exports.

---

### 🟢 SLIDE 10: Flagship 6 — Faculty Leadership Showcase & Portfolios

* **Live URL**: `/visitor?tab=faculty`, `/admin/faculty-desk`, `/student/portfolio`
* **Key Innovations**:
  * **Program Coordinator (PC) Spotlight**: Highlights institutional leadership with photo, designation, vision, and key achievements.
  * **Program Officers (POs) Directory**: Interactive directory listing department branch coordinators with contact info and branch badges.
  * **Gamified Milestone Badges**: Volunteers unlock 🥉 Bronze (<50 pts), 🥈 Silver (50-149 pts), 🥇 Gold (150-299 pts), and 💎 Platinum (300+ pts).
  * **Official `myBharat` Government Integration**: Verified government ID and certificate URL linking.
  * **Printable Service Record**: Visual transcript summarizing total drives, service hours, and certificates.

---

# 🎬 PART 2: Step-by-Step Live Demonstration Script

Follow this structured script during your live presentation for a seamless showcase:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        LIVE DEMO WALKTHROUGH FLOW                      │
│                                                                        │
│  1. Public Landing & Visitor Directory  (Faculty Spotlight & Drives)   │
│  2. Admin Master Dashboard              (Academic Year & YoY Trends)   │
│  3. Financial Auditing & Ledger         (Budget vs Spend & CSV Export) │
│  4. Faculty Coordinator Portal          (Unit Events & Photo Uploads)  │
│  5. Student Volunteer Mobile View       (QR Attendance & Portfolio)    │
└────────────────────────────────────────────────────────────────────────┘
```

### Step 1: Public Visitor Experience & Faculty Showcase (2 Mins)
1. Open **[https://erp-tan-six.vercel.app](https://erp-tan-six.vercel.app)**.
2. Highlight the **Faculty Leadership Showcase** on the home page (Program Coordinator spotlight & Program Officers grid).
3. Click **"Explore Public Directory"** (`/visitor`).
4. Show the **Activity Feed** with unit-tagged photos (`CSE Unit`), **Events & Drives**, and the **Faculty & Officers Directory** tab.

### Step 2: Admin Academic Year Monitoring (2 Mins)
1. Log in as **Admin 1** (`admin1@erp.com` / `Admin@12345`).
2. Navigate to **AY Monitoring** (`/admin/monitoring`).
3. Click through the **Academic Year Pills** (`2025-2026`, `2024-2025`, `2023-2024`) to show instant re-calculation of volunteer counts, service hours, and event volumes.
4. Highlight the **Department Performance Matrix** comparing all 10 branches.
5. Click **"Export AY Report (CSV)"** to demonstrate instant compliance report generation.

### Step 3: Financial Auditing Ledger (2 Mins)
1. Navigate to **Finance & Audit** (`/admin/finance`).
2. Demonstrate the **Financial Health Summary** (Budget, Expenses, Income, Balance, Utilization %).
3. Show the **Year-Wise Financial Audit Comparison** progress bars and **Expense Category Matrix**.
4. Click **"Export Financial Audit (CSV)"** to download the itemized audit report.
5. Open the **"Add Financial Entry"** modal to show how new income or expense transactions are recorded with receipts.

### Step 4: Faculty Coordinator Event Operations & Photo Management (2 Mins)
1. Switch to a **Faculty Coordinator** account (`faculty.cse@erp.com` / `Faculty@12345`).
2. Navigate to **Events** (`/faculty/events`).
3. Toggle between **"My Unit Events"** and **"All NSS Units"**.
4. Click **"Photos (X)"** on an event to show the photo management canvas, image compression, captions, and lightbox gallery.
5. Click **"Manage & Attendance"** to demonstrate volunteer registration audits and status management.

### Step 5: Student Volunteer Experience & QR Scanner (2 Mins)
1. Log in as a **Student Volunteer** (`student.cse1@erp.com` / `Student@12345`).
2. Navigate to **NSS Events** (`/student/events`).
3. Click **"Scan Event Attendance QR"** to showcase the HTML5 mobile camera scanner.
4. Navigate to **Portfolio** (`/student/portfolio`) to display the student's gamified achievement tier (Gold/Silver), total verified hours, and printable transcript.

---

# 🔑 PART 3: Demo Accounts & Access Credentials

Use these pre-configured credentials during your presentation:

| Role | Email Address | Password | Department / Scope |
|:---|:---|:---|:---|
| **System Admin 1** | `admin1@erp.com` | `Admin@12345` | Master Platform Oversight |
| **System Admin 2** | `admin2@erp.com` | `Admin@12345` | Operations & Financial Auditing |
| **Faculty Coordinator (CSE)** | `faculty.cse@erp.com` | `Faculty@12345` | Computer Science Unit Coordinator |
| **Faculty Coordinator (ECE)** | `faculty.ece@erp.com` | `Faculty@12345` | Electronics & Comm Unit Coordinator |
| **Faculty Coordinator (MECH)** | `faculty.mech@erp.com` | `Faculty@12345` | Mechanical Eng Unit Coordinator |
| **Student Coordinator** | `lead.cse1@erp.com` | `Student@12345` | CSE Student Branch Lead |
| **Student Volunteer** | `student.cse1@erp.com` | `Student@12345` | Enrolled Volunteer (CSE) |

---

## 🏆 Key Takeaways for Evaluators & Management
1. **Institutional Compliance**: Built directly for NAAC, NIRF, and university accreditation audits with automated 1-click CSV exports.
2. **Zero Proxy Tolerance**: Camera-verified dynamic QR scanning guarantees genuine volunteer participation.
3. **Fiscal Transparency**: Real-time ledger balances budgets, sponsorships, and expenses with digital receipts.
4. **Autonomous Scalability**: Scoped departmental access empowers faculty coordinators while maintaining centralized administrative oversight.

---

*© 2026 VVITU NSS ERP • Developed for Vasireddy Venkatadri Institute of Technology (Autonomous).*

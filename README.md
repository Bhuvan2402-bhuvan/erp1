# VVITU NSS ERP — Institutional Resource Planning & Monitoring Portal

[![Production Deployment](https://img.shields.io/badge/Production-Live-emerald?style=for-the-badge&logo=vercel)](https://erp-tan-six.vercel.app)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma)](https://prisma.io)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)

**VVITU NSS ERP** is an enterprise-grade Institutional Resource Planning, Activity Auditing, and Volunteer Management Platform designed and engineered for the **National Service Scheme (NSS)** at **Vasireddy Venkatadri Institute of Technology (Autonomous)**.

🌐 **Live Production Portal**: [https://erp-tan-six.vercel.app](https://erp-tan-six.vercel.app)  
📖 **Comprehensive Technical Documentation**: See [DOCUMENTATION.md](DOCUMENTATION.md)

---

## 🌟 Key Functional Highlights

### 1. 📊 Academic Year-Wise Monitoring Engine (`/admin/monitoring` & `/faculty/monitoring`)
* Multi-year tracking across academic cycles (`2026-2027`, `2025-2026`, `2024-2025`, `2023-2024`, `2022-2023`).
* Real-time metrics on volunteer enrollment, verified community service hours, and event execution volume.
* Comparative department benchmarking matrix across all 10 engineering disciplines.
* 1-Click institutional report export as CSV (`NSS_Academic_Year_Report_[Year].csv`).

### 2. 💰 Year-Wise Financial Reports & Audit Ledger (`/admin/finance` & `/faculty/finance`)
* Itemized tracking of income (sponsorships, donations, grants), operational expenses, and annual budget allocations.
* Spending breakdown across Event Logistics, Refreshments, First Aid, Transport, Printing, and Awards.
* Real-time Budget Utilization % meters and annual comparative progress bars.
* 1-Click financial audit export formatted for university governance.

### 3. 📸 Unit-Wise Event Operations & Photo Galleries (`/faculty/events` & `/student/events`)
* Branch-scoped event management allowing Faculty Coordinators to post drives tagged under their departmental unit (`CSE Unit`, `ECE Unit`, `MECH Unit`, etc.).
* Automated client-side image compression and multi-photo upload engine.
* Interactive photo gallery with full-screen lightboxes, captions, and coordinator attribution.

### 4. 📱 Anti-Proxy QR Attendance Gate
* Dynamic time-sensitive QR code generation projected during live community drives.
* Built-in mobile camera scanner for instant physical presence verification.
* Automated service hour calculation (+3 verified hours per camp) and anti-proxy tamper resistance.

### 5. 🏛️ Faculty Desk & Leadership Directory (`/visitor?tab=faculty` & `/admin/faculty-desk`)
* Program Coordinator (PC) spotlight with vision, profile image, and forewords.
* Program Officers (POs) directory across all academic branches.
* Public visitor directory showcasing verified volunteer counts, drive memories, and live statistics.

### 6. 📝 Dynamic Custom Form Builder & Workflow Approvals (`/faculty/forms` & `/student/forms`)
* 18+ rich input field types (text, paragraph, dropdowns, ratings, linear scales, file attachments).
* Multi-tier review and approval lifecycle (`DRAFT` ➔ `SUBMITTED` ➔ `UNDER_REVIEW` ➔ `APPROVED` / `REJECTED`).
* Visual submission analytics and 1-click export to `.xlsx` Excel spreadsheets.

---

## 🛠️ Technology Stack & Architecture

* **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, Lucide Icons
* **Database & ORM**: PostgreSQL on Supabase, Prisma ORM v5
* **Authentication**: Supabase Auth (Email/Password & Google OAuth 2.0 PKCE) + Secure HTTPOnly JWT Cookies
* **Real-time Engine**: Supabase Realtime WebSockets for peer chat and circular notifications
* **Hosting**: Vercel Edge Serverless Network

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Bhuvan2402-bhuvan/erp1.git
cd erp1
npm install
```

### 2. Configure Environment Variables
Create `.env.local` in the project root:
```env
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

NEXT_PUBLIC_SUPABASE_URL="https://[REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[ANON_KEY]"
SUPABASE_SERVICE_ROLE_KEY="[SERVICE_ROLE_KEY]"

NEXT_PUBLIC_GOOGLE_CLIENT_ID="[GOOGLE_CLIENT_ID].apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="[GOOGLE_CLIENT_SECRET]"

NEXT_PUBLIC_APP_URL="https://erp-tan-six.vercel.app"
```

### 3. Initialize Prisma & Run Locally
```bash
npx prisma generate
npx prisma db push
npm run dev
```

Visit `http://localhost:3000` to access the portal.

---

## 👥 Demo Accounts Roster

| Role | Email | Password | Scope |
|:---|:---|:---|:---|
| **System Admin 1** | `admin1@erp.com` | `Admin@12345` | Institutional Master Admin |
| **System Admin 2** | `admin2@erp.com` | `Admin@12345` | Operations & Financial Auditing |
| **Faculty Coordinator (CSE)** | `faculty.cse@erp.com` | `Faculty@12345` | CSE Unit Lead & Drive Approver |
| **Faculty Coordinator (ECE)** | `faculty.ece@erp.com` | `Faculty@12345` | ECE Unit Lead & Drive Approver |
| **Student Coordinator (CSE)** | `lead.cse1@erp.com` | `Student@12345` | Student Branch Lead |
| **Student Volunteer (CSE)** | `student.cse1@erp.com` | `Student@12345` | Verified Volunteer Account |

---

## 📄 License & Attribution

Developed for **Vasireddy Venkatadri Institute of Technology (Autonomous)**.  
Licensed under the [MIT License](LICENSE).

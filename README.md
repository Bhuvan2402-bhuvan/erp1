# Volunteer ERP

Volunteer ERP is an enterprise resource planning and management platform built with Next.js 14, React, TailwindCSS, Prisma, and Supabase. The platform provides a centralized, secure, and performant workspace for administrators, faculty coordinators, and student volunteers.

## Key Features

- **Robust RBAC (Role-Based Access Control)**: Secure role management ensuring proper access controls across three distinct user portals:
  - **Admin Portal**: User registrations overview, event calendar metrics, status management (approved, pending, rejected), and account status details.
  - **Faculty Portal**: Branch controls, event assignment, attendance management, and user profiles.
  - **Student Portal**: Interactive event discovery, signups, calendar integration, and personal profile management.
- **Real-Time Live Chat**: Direct, real-time messaging with coordinators and admins powered by Supabase Realtime client.
- **Enterprise-Grade Security Hardening**:
  - Full middleware-based routing validation bypassing unnecessary backend calls for public endpoints.
  - Strict security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, etc.).
  - Sliding-window in-memory rate limiting applied to high-risk authentication routes.
  - Contextual error sanitization avoiding internal stack trace exposure downstream.
- **UI & Performance Optimizations**:
  - Custom SVG/Lucide card interfaces.
  - Shimmer-effect skeleton loading states replacing raw text loaders.
  - Next.js dynamic imports (`next/dynamic`) for lazy loading heavy components (e.g., chat boxes, details modals).

## Tech Stack

- **Framework**: [Next.js 14 (App Router)](https://nextjs.org/)
- **Frontend library**: [React 18](https://react.dev/)
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Backend/Auth Database**: [Supabase](https://supabase.com/)
- **Styles & Animations**: [TailwindCSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## Installation & Setup

### Prerequisites

Ensure you have **Node.js >= 20.9.0** installed on your system.

### 1. Clone the Repository

```bash
git clone https://github.com/Bhuvan2402-bhuvan/erp1.git
cd erp1
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variable Configuration

Create a `.env.local` file in the root directory and configure the following credentials (refer to `.env.example` for reference):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database Connection (Direct and Transaction Connection String)
DATABASE_URL=your_prisma_supabase_db_connection_url
DIRECT_URL=your_prisma_supabase_direct_db_connection_url
```

### 4. Database Setup (Prisma)

Generate the Prisma Client and apply the schema changes to your database:

```bash
npm run postinstall
# Or execute manually:
# npx prisma generate
# npx prisma db push
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## Available Scripts

In the project directory, you can run:

- `npm run dev`: Runs the app in development mode.
- `npm run build`: Builds the application for production deployment.
- `npm run start`: Starts the Next.js production server.
- `npm run lint`: Analyzes code for ESLint errors.
- `npm run lint:fix`: Automatically fixes fixable ESLint errors.

---

## Project Structure

```
├── app/                  # Next.js App Router (Layouts, Pages, API handlers)
│   ├── (auth)/           # Authentication views (login, signup)
│   ├── admin/            # Admin dashboard and portal pages
│   ├── faculty/          # Faculty dashboard and portal pages
│   ├── student/          # Student dashboard and portal pages
│   └── api/              # API routes with JWT/session and RBAC protection
├── components/           # Reusable UI components
├── lib/                  # Shared utility libraries (Supabase config, auth helpers, rate limiting)
├── prisma/               # Prisma schema and seed scripts
└── public/               # Static assets (images, icons)
```

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

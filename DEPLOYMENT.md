# Deploying VVITU NSS ERP to Vercel, Render & Cloudflare R2

This guide details the step-by-step instructions for deploying the **Frontend to Vercel**, the **Express API Backend & PostgreSQL to Render**, and **Media Storage to Cloudflare R2**.

---

## 1. Cloudflare R2 Bucket Setup (Storage)

1. Log into your [Cloudflare Dashboard](https://dash.cloudflare.com/) and navigate to **R2 Storage**.
2. Click **Create bucket** and name it `vvitu-erp-storage`.
3. Under **Bucket Details** -> **Settings**:
   - Enable **Public Access** or connect a **Custom Domain** (e.g. `https://pub-xyz.r2.dev`).
4. Go to **R2** -> **Manage R2 API Tokens** and click **Create API Token**:
   - Permission: **Admin Read & Write**
   - Copy down your **Account ID**, **Access Key ID**, and **Secret Access Key**.

---

## 2. Render Deployment (Express Backend & PostgreSQL)

### Option A: Automatic Blueprint Deployment (Recommended)
1. Log into your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Blueprint**.
3. Connect your GitHub repository (`Bhuvan2402-bhuvan/erp1`).
4. Render will automatically read `render.yaml` and prompt you to enter the environment secrets:
   - `CLOUDFLARE_R2_ACCOUNT_ID`
   - `CLOUDFLARE_R2_ACCESS_KEY_ID`
   - `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
   - `CLOUDFLARE_R2_PUBLIC_URL`
   - `CORS_ORIGIN` (`https://your-app.vercel.app`)
5. Click **Apply**. Render will provision the PostgreSQL database and build the Express API service.

### Option B: Manual Web Service Setup
- **Root Directory**: `server`
- **Build Command**: `npm install && npx prisma generate`
- **Start Command**: `npm start`
- **Health Check Path**: `/health`

---

## 3. Vercel Deployment (Next.js Frontend)

1. Log into your [Vercel Dashboard](https://vercel.com/) and click **Add New** -> **Project**.
2. Import your GitHub repository (`Bhuvan2402-bhuvan/erp1`).
3. Set the **Framework Preset** to **Next.js**.
4. Configure **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: `https://vvitu-erp-backend.onrender.com` (Your Render Web Service URL)
   - `DATABASE_URL`: `postgresql://...` (Your Render PostgreSQL connection string)
   - `DIRECT_URL`: `postgresql://...`
5. Click **Deploy**.

`vercel.json` will automatically proxy all `/api/*` requests from your Vercel URL directly to your Render Express backend.

---

## 4. Local Testing

To test the Express backend locally:
```bash
# Start Express Backend Server on http://localhost:10000
npm run server:start

# Start Next.js Frontend on http://localhost:3000
npm run dev
```

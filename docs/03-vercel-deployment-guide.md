# CureSync — Deployment Guide (Render + Vercel)

## Deployment Architecture

CureSync is a **two-tier application** deployed on two free platforms:

```
┌─────────────────────────────────────────────┐
│         FRONTEND — Vercel (Free)            │
│         Next.js 15 App Router               │
│         https://curesync.vercel.app         │
│                                             │
│         /api/* ─── rewrite proxy ──────┐    │
└────────────────────────────────────────┼────┘
                                         │ HTTPS
                                         ▼
┌─────────────────────────────────────────────┐
│         BACKEND — Render (Free)             │
│         FastAPI + Uvicorn                   │
│         https://curesync-api.onrender.com   │
│                                             │
│         ┌─────────┐  ┌───────────────────┐  │
│         │Supabase │  │ DashScope (Qwen)  │  │
│         │(Auth+DB)│  │ (AI + OCR)        │  │
│         └─────────┘  └───────────────────┘  │
└─────────────────────────────────────────────┘
```

### Why These Platforms?

| Platform | Tier | Role | Why |
|---|---|---|---|
| **Vercel** | Free (Hobby) | Frontend hosting | Native Next.js support, global CDN, automatic HTTPS, zero config |
| **Render** | Free | Backend hosting | Runs persistent Python processes, Git auto-deploy, free SSL, simple env var management |


## What Needs to Change

### 1. Render Backend Setup

Render runs a real Python process (not serverless), so **no code changes** are needed. APScheduler, long-running AI calls, and all FastAPI features work as-is.

**Render Free Tier Notes:**
- Service spins down after 15 minutes of inactivity (first request after idle takes ~30-50 seconds cold start)
- 512 MB RAM — sufficient for CureSync
- 750 free hours/month

### 2. Update `next.config.mjs` Rewrite Destination

**Current** (development):
```js
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:8000/api/:path*',
    },
  ];
}
```

**Required change** (production):
```js
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'https://curesync-api.onrender.com/api/:path*',
    },
  ];
}
```

Or use an environment variable for flexibility:
```js
destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/:path*`,
```

Then set `NEXT_PUBLIC_API_URL` in Vercel's environment variables dashboard.

### 3. Update Backend CORS Origins

Set the `CORS_ORIGINS` environment variable on Render to include your Vercel domain:
```
CORS_ORIGINS=https://curesync.vercel.app,https://your-custom-domain.com
```

### 4. Backend Environment Variables on Render

Set these in the Render dashboard (Environment section):

| Variable | Value |
|---|---|
| `DASHSCOPE_API_KEY` | Your Alibaba Cloud DashScope API key |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `CORS_ORIGINS` | `https://your-vercel-domain.vercel.app` |
| `BACKEND_HOST` | `0.0.0.0` |
| `BACKEND_PORT` | `8000` (Render may override with `$PORT`) |

### 5. Frontend on Vercel

The Next.js frontend is **fully Vercel-compatible** with no code changes needed beyond the rewrite URL:

- All pages are client-side rendered (`'use client'`)
- No server-side secrets needed on the frontend
- `images.unoptimized: true` is already set
- Tailwind CSS v4 builds normally
- Static assets in `public/` are served automatically
- `icon.png` in `src/app/` works as favicon

**Vercel Environment Variables**: None required (unless using the env-var-based rewrite URL).


## Deployment Steps

### Step 1: Deploy Backend to Render

1. Push your code to GitHub (or connect existing repo)
2. Go to [render.com](https://render.com) and click **New → Web Service**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `curesync-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3.11`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free
5. Add all environment variables from the table above
6. Click **Deploy**
7. Wait for deployment (~2-3 minutes)
8. Note the deployed URL (e.g., `https://curesync-api.onrender.com`)
9. Test: visit `https://curesync-api.onrender.com/health` — should return `{"status": "healthy"}`

> **Important**: Render uses the `$PORT` environment variable (not 8000). The start command must use `--port $PORT`.

### Step 2: Update Frontend Config

1. In `frontend/next.config.mjs`, change the rewrite destination:
   ```js
   destination: 'https://curesync-api.onrender.com/api/:path*',
   ```
2. Commit and push

### Step 3: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and click **Add New → Project**
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend`
   - **Build Command**: `next build`
   - **Output Directory**: `.next`
4. Click **Deploy**
5. Wait for build (~1-2 minutes)
6. Your app is live at `https://your-project.vercel.app`

### Step 4: Update CORS on Render

1. Go back to Render dashboard → your service → Environment
2. Update `CORS_ORIGINS` to include your Vercel URL:
   ```
   CORS_ORIGINS=https://your-project.vercel.app
   ```
3. Render auto-redeploys with the new value


## Handling Render's Cold Start

The Render free tier spins down after 15 minutes of inactivity. The first request after idle takes ~30-50 seconds. To mitigate this:

1. **Use a free cron service** (e.g., cron-job.org or UptimeRobot) to ping `https://curesync-api.onrender.com/health` every 10 minutes, keeping the service warm.

2. **Add a loading state** on the frontend — the app already shows spinners during API calls, so users see feedback while the backend wakes up.

3. **Inform users** — the first interaction after idle may be slow; subsequent requests are instant.


## Potential Issues & Solutions

| Issue | Cause | Solution |
|---|---|---|
| First request takes 30-50 seconds | Render cold start (free tier) | Use a cron service to keep the backend warm |
| API calls fail with CORS error | CORS doesn't include Vercel domain | Add Vercel URL to `CORS_ORIGINS` on Render |
| API calls return 404 | Rewrite URL not updated | Update `next.config.mjs` destination to Render URL |
| AI features return offline responses | `DASHSCOPE_API_KEY` not set on Render | Add the env var in Render dashboard |
| Auth fails | Supabase keys not set on Render | Add all `SUPABASE_*` env vars in Render dashboard |
| Port binding error | Using hardcoded port 8000 | Use `$PORT` in the Render start command |
| Prescription scan slow | Render free tier has limited CPU | Acceptable for demo; upgrade if needed for production |


## Cost Summary

| Component | Platform | Cost |
|---|---|---|
| Frontend (Next.js) | Vercel Hobby | **Free** |
| Backend (FastAPI) | Render Free | **Free** |
| Database + Auth | Supabase Free | **Free** |
| AI (Qwen models) | DashScope | Pay per token (small costs) |
| Domain (optional) | Any registrar | ~$10/year |
| **Total** | | **$0 (excluding AI tokens)** |


## Summary: Deployment Readiness

| Aspect | Status | Action Required |
|---|---|---|
| Next.js frontend | **Ready** | No changes needed |
| API rewrite URL | **Needs update** | Change `localhost:8000` to Render URL in `next.config.mjs` |
| Backend on Render | **Ready to deploy** | Create service, set env vars, deploy from Git |
| CORS configuration | **Needs update** | Add Vercel domain to `CORS_ORIGINS` on Render |
| Start command | **Needs adjustment** | Use `--port $PORT` instead of hardcoded 8000 |
| Environment variables | **Needs setup** | Set all keys in Render dashboard |
| Build process | **Ready** | `next build` succeeds cleanly |
| Static assets | **Ready** | `public/` directory and `icon.png` work out of the box |
| Tailwind/CSS | **Ready** | No changes needed |
| Authentication | **Ready** | JWT-based auth works with any backend URL |

**Bottom line**: Deploy the backend to Render (free, takes ~5 minutes), deploy the frontend to Vercel (free, takes ~2 minutes), update one line in `next.config.mjs`, and set CORS origins on Render. No structural code changes required.

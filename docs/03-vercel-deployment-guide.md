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

### 2. Rewrite Destination (already env-var based)

`next.config.mjs` resolves the backend URL from the environment, so no code change is needed between local development and production:
```js
destination: `${process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/:path*`,
```

- **Local development**: no env var set → falls back to `http://localhost:8000`
- **Production**: set `API_URL` in Vercel's environment variables dashboard (a private, non-public variable — the value is only read server-side at build time, so it never reaches the browser bundle)

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

**Vercel Environment Variables**: One optional variable — `API_URL` set to the Render backend URL (e.g. `https://curesync-api.onrender.com`). Use the plain `API_URL` name (no `NEXT_PUBLIC_` prefix): the rewrite is evaluated server-side at build time, so the value never reaches the browser bundle. The config also accepts `NEXT_PUBLIC_API_URL` as a fallback. No variables are needed for local development — the rewrite falls back to `http://localhost:8000`.


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

### Step 2: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and click **Add New → Project**
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Next.js (auto-detected once root is set)
   - **Root Directory**: `frontend` ← **critical** (see troubleshooting below)
   - **Build Command**: `next build`
   - **Output Directory**: `.next`
4. Add the environment variable `API_URL` = your Render URL (e.g. `https://curesync-api.onrender.com`) — no `NEXT_PUBLIC_` prefix needed
5. Click **Deploy**
6. Wait for build (~1-2 minutes); the build log should show the Next.js route table (`/`, `/chat`, `/login`, ...)
7. Your app is live at `https://your-project.vercel.app`

> **Note**: The rewrite URL no longer requires a code change — `next.config.mjs` reads `API_URL` at build time and falls back to `http://localhost:8000` when absent. If you add or change the env var after the first deploy, redeploy so the rewrite picks it up.

### Step 3: Update CORS on Render

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
| Frontend shows `404: NOT_FOUND` (plain Vercel page) | Root Directory left at repo root — Vercel found no `package.json` and deployed an empty site | Settings → General → Root Directory → set to `frontend`, then redeploy |
| Render start command shows `gunicorn your_application.wsgi` | Render's default placeholder for Django apps | Replace entirely with `uvicorn app.main:app --host 0.0.0.0 --port $PORT` (FastAPI needs ASGI, and gunicorn isn't in requirements.txt) |
| Vercel warns about `NEXT_PUBLIC_` prefix exposing values | Public prefixes are inlined into the browser bundle | Use plain `API_URL` instead — the rewrite runs server-side at build time (already implemented) |
| First request takes 30-50 seconds | Render cold start (free tier) | Use a cron service to keep the backend warm |
| API calls fail with CORS error | CORS doesn't include Vercel domain | Add Vercel URL to `CORS_ORIGINS` on Render (exact match, no trailing slash) |
| API calls return 404 | Rewrite URL not resolved | Set `API_URL` on Vercel to the Render URL; redeploy after changing it |
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

| Aspect | Status | Notes |
|---|---|---|
| Next.js frontend | **Ready** | Builds cleanly; all pages static-prerendered |
| API rewrite URL | **Done (env-var based)** | `next.config.mjs` reads `API_URL`; set it in the Vercel dashboard — no code change needed |
| Backend on Render | **Ready to deploy** | Create service with Root Directory `backend`, set env vars, deploy from Git |
| CORS configuration | **Set during deploy** | `CORS_ORIGINS` on Render = exact Vercel URL (no trailing slash) |
| Start command | **Documented** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` (replace Render's gunicorn default) |
| Environment variables | **Set during deploy** | All keys in the Render dashboard; only `API_URL` on Vercel |
| Build process | **Ready** | `next build` succeeds on Vercel (~40s) |
| Static assets | **Ready** | `public/` directory and `icon.png` work out of the box |
| Tailwind/CSS | **Ready** | No changes needed |
| Authentication | **Ready** | JWT-based auth works with any backend URL |
| Multilingual AI | **Ready** | Urdu, Balochi, Sindhi, Pashto, Punjabi replies verified in native scripts |

**Bottom line**: Both halves of the stack deploy from the same GitHub repository — Render builds `backend/` with the uvicorn start command, Vercel builds `frontend/` with the `API_URL` environment variable. The only cross-platform wiring is setting `CORS_ORIGINS` on Render to match your Vercel domain. Total infrastructure cost: $0 (excluding AI tokens).

<div align="center">

<img src="frontend/public/CureSync_Icon.png" alt="CureSync Logo" width="110"/>

# CureSync

### Your AI-Powered Medication Safety Companion

**Check drug interactions · Scan prescriptions · Chat in your own language**


[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![Qwen AI](https://img.shields.io/badge/AI-Qwen_Via_DashScope-615CED)](https://www.alibabacloud.com/product/dashscope)

</div>

---

## 💊 The Problem

Adverse drug interactions are a leading cause of preventable harm — especially for **elderly patients and anyone managing multiple prescriptions**. A patient seeing different doctors often has no easy way to know if their medications conflict.

On top of that, almost every digital health tool is **English-only**, leaving millions of people in Pakistan and surrounding regions without medication guidance in the languages they actually speak.

## ✨ What CureSync Does

| Feature | What it does |
|---|---|
| 🔍 **Drug Interaction Checker** | Add 2+ medications and get severity-graded results (high/medium/low) from a database of **1,900+ medicines and 25,000+ known interactions**, plus an AI-written, patient-friendly risk analysis with emergency alerts for high-severity pairs |
| 💬 **AI Health Assistant** | A Qwen-powered chatbot that answers **only** medication questions — side effects, dosage, storage, precautions — with voice input and persistent chat history |
| 📷 **Prescription Scanner** | Photograph a handwritten or printed prescription; AI vision OCR extracts each medicine with dosage, frequency, and a confidence score, then adds it to your schedule in one click |
| 🗓️ **Medication Schedule** | A personal tracker with active/inactive states, dosage details, and reminder times |
| 🌍 **Six-Language AI** | Verified replies written **entirely in native scripts** — اردو (Urdu), سنڌي (Sindhi), پښتو (Pashto), پنجابی (Punjabi), بلوچی (Balochi) and English — with medicine names kept in English for accuracy |
| 🌙 **Dark / Light Mode** | Full theme support with system-preference detection |

## 🎯 Who It's For

- **Elderly patients** managing multiple daily medications
- **Chronic medication users** (diabetes, hypertension, etc.)
- **Caregivers** coordinating medications for family members
- **Community health workers, pharmacy students, and professionals** needing a fast, local-language reference

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                FRONTEND — Next.js 15 (Vercel)            │
│   App Router · Tailwind CSS v4 · Framer Motion ·         │
│   next-themes · Axios (JWT auth interceptors)            │
└──────────────────────┬───────────────────────────────────┘
                       │ /api/* rewrite proxy
                       ▼
┌──────────────────────────────────────────────────────────┐
│                BACKEND — FastAPI (Render)                │
│   Auth · Chat · Interactions · OCR · Drugs · Medications │
└───────┬───────────────────────┬──────────────────────────┘
        │                       │
        ▼                       ▼
┌───────────────┐     ┌──────────────────────────┐
│   Supabase    │     │   Alibaba Cloud DashScope │
│ PostgreSQL DB │     │  qwen-plus (text + chat)  │
│  + JWT Auth   │     │  qwen-vl-plus (OCR)       │
└───────────────┘     └──────────────────────────┘
```

**Request flow:** Browser → Vercel (frontend) → Render (backend) → Supabase / DashScope. All credentials live only on the backend — the frontend never touches them.

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 15 (App Router), React 18, Tailwind CSS v4, Framer Motion, next-themes, Axios, react-markdown, Web Speech API |
| **Backend** | FastAPI, Python, Uvicorn, Pydantic, APScheduler, httpx, python-multipart |
| **AI** | Alibaba Cloud DashScope — qwen-plus (chat, interaction analysis, prescription parsing), qwen-vl-plus (vision OCR) |
| **Data & Auth** | Supabase (PostgreSQL + JWT auth), local brand-name alias map (~140 entries, e.g. "Panadol" → acetaminophen) |
| **Deployment** | Vercel (frontend) + Render (backend) + Supabase — **entirely free-tier infrastructure** |

## 🚀 Quick Start (Local)

**1. Backend** — Python 3.11+

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows (use source .venv/bin/activate on Linux/Mac)
pip install -r requirements.txt
cp .env.example .env            # fill in your keys
python run.py                   # serves http://localhost:8000
```

**2. Frontend** — Node 18+

```bash
cd frontend
npm install
npm run dev                    # serves http://localhost:3000
```

The frontend proxies `/api/*` to `http://localhost:8000` automatically.

## 🔑 Environment Variables

Create `backend/.env` (see [.env.example](backend/.env.example)):

| Variable | Purpose |
|---|---|
| `DASHSCOPE_API_KEY` | Alibaba Cloud DashScope key (Qwen models) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins |
| `BACKEND_HOST` | Bind address (default `0.0.0.0`) |

On Vercel, set one variable: `API_URL` = your Render backend URL (used by the Next.js rewrite proxy at build time).

## 📡 API Overview

| Area | Endpoints |
|---|---|
| **Auth** | `POST /api/auth/signup` · `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me` |
| **Drugs** | `GET /api/drugs/search?q=` · `GET /api/drugs` · `GET /api/drugs/:id` |
| **Interactions** | `POST /api/interactions/check` |
| **Chat** | `POST /api/chat` · `GET /api/chat/sessions` · `GET /api/chat/sessions/:id` · `DELETE /api/chat/sessions/:id` |
| **OCR** | `POST /api/ocr/scan` |
| **Medications** | `GET/POST /api/medications` · `PUT/DELETE /api/medications/:id` · `POST /api/medications/:id/deactivate` |

Interactive docs auto-generated at `/docs` (Swagger UI).

## 🧪 Verified End-to-End

- ✅ Authentication (signup → email confirm → login → JWT sessions)
- ✅ Interaction checks against live Supabase data (1,939 medicines, 25,110 interaction records)
- ✅ Prescription OCR from image upload to schedulable medication entries
- ✅ Multilingual replies verified in native scripts — Urdu (اردو) and Sindhi (سنڌي) tested against the live API
- ✅ Deployed and running on free-tier infrastructure

## ⚠️ Disclaimer

CureSync is an **informational tool** — it complements, never replaces, professional medical advice. Always consult a doctor or pharmacist for medical decisions. In emergencies, contact local emergency services.

---

<div align="center">

**Built with ❤️ for safer medication management in every language**

</div>

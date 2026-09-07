# CureSync — Architecture, Tech Stack & End-to-End Flow

## High-Level Architecture

CureSync follows a **two-tier client-server architecture** with a clear separation between the frontend and backend:

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 15)                │
│  Deployed on: Vercel (Free)                             │
│                                                         │
│  ┌─────────┐ ┌──────────┐ ┌───────┐ ┌──────────────┐  │
│  │  Pages  │ │Components│ │Contexts│ │   Services   │  │
│  │ (App    │ │ (UI +    │ │(Auth,  │ │ (Axios API   │  │
│  │ Router) │ │ Framer)  │ │ Lang)  │ │  Client)     │  │
│  └────┬────┘ └──────────┘ └────────┘ └──────┬───────┘  │
│       │                                      │          │
│       └──────────── /api/* ──────────────────┘          │
│                    (rewrite proxy)                       │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP (REST + JSON)
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  BACKEND (FastAPI + Python)              │
│  Deployed on: Render (Free)                             │
│                                                         │
│  ┌──────────┐  ┌─────────────┐  ┌───────────────────┐  │
│  │ Routers  │──│  Services   │──│  External APIs    │  │
│  │ (REST    │  │ (Business   │  │  ┌─────────────┐  │  │
│  │ endpoints│  │  Logic)     │──│  │  Supabase   │  │  │
│  │ )        │  │             │  │  │  (PostgreSQL│  │  │
│  └──────────┘  └─────────────┘  │  │   + Auth)   │  │  │
│                                 │  └─────────────┘  │  │
│                                 │  ┌─────────────┐  │  │
│                                 │  │  DashScope  │  │  │
│                                 │  │  (Qwen LLM) │  │  │
│                                 │  └─────────────┘  │  │
│                                 │  ┌─────────────┐  │  │
│                                 │  │ Local JSON  │  │  │
│                                 │  │ (Drug DB +  │  │  │
│                                 │  │  Aliases)   │  │  │
│                                 │  └─────────────┘  │  │
│                                 └───────────────────┘  │
└─────────────────────────────────────────────────────────┘
```


## Tech Stack

### Frontend

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Framework** | Next.js (App Router) | 15.x | React framework with SSR, file-based routing, API rewrites |
| **UI Library** | React | 18.x | Component-based UI rendering |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS with custom `@theme` palette |
| **Animations** | Framer Motion | 11.x | Page transitions, staggered lists, hover effects, AnimatePresence |
| **Theming** | next-themes | 0.4.x | Class-based dark/light mode with system preference detection |
| **HTTP Client** | Axios | 1.7.x | API calls with interceptors (auth headers, 401 redirect) |
| **Markdown** | react-markdown + remark-gfm | 10.x / 4.x | Renders AI-generated markdown in chat responses |
| **Voice Input** | Web Speech API (native) | - | Browser-native speech-to-text in the AI Chat input (Chat page only) |
| **Build** | PostCSS + Tailwind plugin | - | Compiles Tailwind v4 utility classes |

### Backend

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Framework** | FastAPI | 0.115+ | Async Python REST API with auto-generated OpenAPI docs |
| **Server** | Uvicorn | 0.30+ | ASGI server with hot-reload for development |
| **AI / LLM** | Alibaba Cloud DashScope SDK | 1.20+ | Qwen text model (qwen-plus) and vision model (qwen-vl-plus) |
| **Database** | Supabase (PostgreSQL) | 2.30+ | User authentication, drug database, medication storage, chat sessions |
| **HTTP Client** | httpx | 0.27+ | Async HTTP calls to Supabase REST API |
| **Scheduler** | APScheduler | 3.10+ | Medication reminder scheduling |
| **Validation** | Pydantic | 2.9+ | Request/response data validation and serialization |
| **Config** | python-dotenv | 1.0+ | Environment variable loading from `.env` file |
| **File Upload** | python-multipart | 0.0.9+ | Handles prescription image uploads |

### External Services

| Service | Provider | Purpose |
|---|---|---|
| **Database + Auth** | Supabase | PostgreSQL database for generics, drugs, interactions, medications, chat sessions. Also handles user signup/login with JWT tokens. Live data: 1,939 generic medications and 25,110 interaction records. |
| **AI Text Generation** | Alibaba Cloud DashScope (International, Singapore) | Qwen-plus model for health chat, interaction analysis, prescription parsing |
| **AI Vision / OCR** | Alibaba Cloud DashScope (International, Singapore) | Qwen-vl-plus model for extracting text from prescription images |
| **Drug Database** | Local JSON files + Supabase | `drugs_database.json` as local fallback; `drug_aliases.json` (~140 entries) maps common/brand names to generic names |


## Project Structure

```
CureSync/
├── frontend/                          # Next.js 15 App Router
│   ├── public/
│   │   └── CureSync_Icon.png          # App icon
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css            # Tailwind v4 theme + dark mode variant
│   │   │   ├── icon.png               # Browser favicon
│   │   │   ├── layout.jsx             # Root layout (providers chain)
│   │   │   ├── not-found.jsx          # Custom 404 page
│   │   │   ├── page.jsx               # Home page
│   │   │   ├── login/page.jsx         # Login page (with Suspense)
│   │   │   ├── signup/page.jsx        # Signup page
│   │   │   ├── interactions/page.jsx  # Drug interaction checker
│   │   │   ├── chat/page.jsx          # AI health assistant
│   │   │   ├── scan/page.jsx          # Prescription OCR scanner
│   │   │   └── schedule/page.jsx      # Medication schedule
│   │   ├── components/
│   │   │   ├── Layout.jsx             # Page wrapper
│   │   │   ├── Navbar.jsx             # Navigation bar (theme toggle, language, auth)
│   │   │   ├── ThemeProvider.jsx       # next-themes wrapper
│   │   │   ├── ProtectedRoute.jsx     # Auth gate component
│   │   │   ├── PageTransition.jsx     # Framer Motion page entrance
│   │   │   ├── DrugSearchInput.jsx    # Autocomplete drug search
│   │   │   ├── ChatMessage.jsx        # Chat bubble component
│   │   │   ├── InteractionCard.jsx    # Interaction severity card
│   │   │   ├── MedicationRow.jsx      # Medication table row
│   │   │   └── VoiceInputButton.jsx   # Speech-to-text button (Chat page only)
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx        # Authentication state (login/signup/logout)
│   │   │   └── LanguageContext.jsx    # UI language state (en/ur/bal/sd/ps/pa)
│   │   ├── hooks/
│   │   │   └── useVoiceInput.js       # Web Speech API hook (Chat page only)
│   │   └── services/
│   │       └── api.js                 # Axios client + all API functions
│   ├── next.config.mjs               # API rewrite proxy config
│   ├── postcss.config.mjs            # Tailwind PostCSS plugin
│   └── package.json
│
├── backend/                           # FastAPI Python server
│   ├── app/
│   │   ├── main.py                    # FastAPI app, CORS, router mounting
│   │   ├── config.py                  # Settings from environment variables
│   │   ├── models/
│   │   │   └── schemas.py             # Pydantic request/response models
│   │   ├── routers/
│   │   │   ├── auth.py                # /api/auth/* (signup, login, logout, me)
│   │   │   ├── chat.py                # /api/chat (AI health chat)
│   │   │   ├── chat_sessions.py       # /api/chat/sessions/* (CRUD)
│   │   │   ├── interactions.py        # /api/interactions/check
│   │   │   ├── drugs.py               # /api/drugs/* (search, list, get)
│   │   │   ├── medications.py         # /api/medications/* (CRUD)
│   │   │   └── ocr.py                 # /api/ocr/scan (prescription image)
│   │   ├── services/
│   │   │   ├── ai_service.py          # DashScope/Qwen LLM integration + language name resolution
│   │   │   ├── db_service.py          # Supabase client (auth, queries)
│   │   │   ├── drug_service.py        # Drug search + alias resolution
│   │   │   ├── medication_service.py  # Medication CRUD + scheduler
│   │   │   └── ocr_service.py         # Vision model OCR processing
│   │   └── data/
│   │       ├── drug_aliases.json      # ~140 brand/common -> generic mappings
│   │       └── drugs_database.json    # Local drug interaction database (fallback)
│   ├── run.py                         # Uvicorn launcher
│   ├── requirements.txt
│   ├── .env                           # API keys (not committed)
│   └── .env.example                   # Template for env vars
│
└── docs/                              # Documentation
```


## End-to-End Data Flow

### 1. User Authentication Flow
```
User fills signup form
  → Frontend: AuthContext.signup()
    → api.js: POST /api/auth/signup {email, password, full_name}
      → next.config.mjs rewrite → http://backend:8000/api/auth/signup
        → Backend: auth.py → db_service.signup()
          → Supabase Auth: create user account
            ← Returns {message, email_confirmation_required}
  → Frontend redirects to /login with success notice

User fills login form
  → Frontend: AuthContext.login()
    → api.js: POST /api/auth/login {email, password}
      → Backend: auth.py → db_service.login()
        → Supabase Auth: verify credentials, issue JWT
          ← Returns {access_token, user: {id, email, full_name}}
  → Frontend stores token + user in localStorage
  → AuthContext updates user state → ProtectedRoute grants access
```

### 2. Drug Interaction Check Flow
```
User types "Aspirin" in search box
  → DrugSearchInput: debounced (300ms) onChange
    → api.js: GET /api/drugs/search?q=Aspirin
      → Backend: drugs.py → drug_service.search()
        → Check drug_aliases.json: "Aspirin" → "acetylsalicylic acid"
        → Supabase: ilike search on generics table
          ← Returns [{name: "acetylsalicylic acid", brand_names: ["Aspirin"], ...}]
  → Frontend: autocomplete dropdown shows "Aspirin (acetylsalicylic acid)"

User selects 2+ drugs, clicks "Check Interactions"
  → api.js: POST /api/interactions/check {medicines: ["aspirin", "warfarin"], language: "en"}
    → Backend: interactions.py
      → Step 1: Query local drugs_database.json for known interactions
      → Step 2: Send results + medicine list to ai_service.analyze_interactions()
        → DashScope API: Qwen-plus generates patient-friendly analysis
          ← Returns {summary, interactions[], ai_analysis, emergency_alert?}
  → Frontend: renders emergency alert (if any), summary card, interaction cards, AI analysis
```

### 3. Prescription Scanner Flow
```
User uploads prescription image
  → Frontend: FormData with file blob
    → api.js: POST /api/ocr/scan (multipart/form-data, 60s timeout)
      → Backend: ocr.py → ocr_service.scan()
        → DashScope API: Qwen-vl-plus (vision model) extracts text from image
          ← Returns raw OCR text
        → ai_service.parse_prescription_text(ocr_text)
          → DashScope API: Qwen-plus parses text into structured JSON
            ← Returns [{name, dosage, frequency, confidence}]
              ← Returns {raw_text, medicines[]}
  → Frontend: displays extracted text + medication cards with "Add to Schedule" buttons
  → User clicks "Add to Schedule"
    → api.js: POST /api/medications {name, dosage, frequency, times}
      → Backend: medications.py → Supabase: insert medication record
```

### 4. AI Chat Flow
```
User types question in chat input (or uses the microphone button for
voice input via the Web Speech API)
  → api.js: POST /api/chat {message, history[], session_id, language}
    → Backend: chat.py → ai_service.health_chat()
      → Build messages array: [system_prompt, ...history, user_message]
      → If language != "en":
          → resolve_language_name("sd") → "Sindhi (سنڌي, Arabic script)"
          → append language instruction: reply ONLY in that language,
            native script (no Roman transliteration), medicine names
            kept in English parentheses
      → DashScope API: Generation.call(model="qwen-plus", messages=[...])
        ← Returns AI response text in the requested language/script
      → If session_id provided: save message + response to Supabase chat_sessions
        ← Returns {content, session_id}
  → Frontend: ChatMessage component renders AI response (markdown-aware)
```

### 5. Medication Schedule Flow
```
User adds medication
  → DrugSearchInput: search/select drug
  → Form: fill dosage, frequency, reminder times, notes
    → api.js: POST /api/medications {name, dosage, frequency, times[], notes}
      → Backend: medications.py → medication_service
        → Supabase: insert into medications table (linked to user_id from JWT)
        → APScheduler: register reminder if times provided
          ← Returns {id, name, dosage, frequency, times, active: true}

User views schedule
  → api.js: GET /api/medications?active_only=false
    → Backend: Supabase: SELECT * WHERE user_id = current_user ORDER BY created_at
      ← Returns medications[] with active/inactive status
  → Frontend: renders MedicationRow for each, grouped by active/inactive
```


## Provider Chain (Frontend)

The root layout wraps all pages in three context providers:

```
<html>
  <body>
    <ThemeProvider>          ← next-themes (dark/light class toggle)
      <AuthProvider>         ← user state, login/signup/logout functions
        <LanguageProvider>   ← current language (en/ur/bal/sd/ps/pa)
          {children}         ← page content
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  </body>
</html>
```

All pages that require authentication are wrapped in `<ProtectedRoute>`, which checks `useAuth().user` and redirects to `/login` if not authenticated.


## API Endpoint Summary

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/signup` | Create user account |
| POST | `/api/auth/login` | Authenticate, get JWT token |
| POST | `/api/auth/logout` | Invalidate session |
| GET | `/api/auth/me` | Get current user profile |
| GET | `/api/drugs/search?q=...` | Search drugs (alias + ilike) |
| GET | `/api/drugs` | List all drug names |
| GET | `/api/drugs/:id` | Get single drug details |
| POST | `/api/interactions/check` | Check drug interactions |
| POST | `/api/chat` | Send chat message to AI |
| GET | `/api/chat/sessions` | List chat history sessions |
| GET | `/api/chat/sessions/:id` | Get session messages |
| DELETE | `/api/chat/sessions/:id` | Delete chat session |
| POST | `/api/ocr/scan` | Scan prescription image |
| GET | `/api/medications` | List user's medications |
| POST | `/api/medications` | Add medication to schedule |
| PUT | `/api/medications/:id` | Update medication |
| DELETE | `/api/medications/:id` | Delete medication |
| POST | `/api/medications/:id/deactivate` | Deactivate medication |


## Environment Variables

### Backend (.env)

| Variable | Purpose |
|---|---|
| `DASHSCOPE_API_KEY` | Alibaba Cloud DashScope API key for Qwen models |
| `ALIBABA_CLOUD_ACCESS_KEY_ID` | (Optional) Separate OCR service credentials |
| `ALIBABA_CLOUD_ACCESS_KEY_SECRET` | (Optional) Separate OCR service credentials |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins |
| `BACKEND_HOST` | Server bind address (default: 0.0.0.0) |
| `BACKEND_PORT` | Server port (default: 8000) |

The frontend requires only one optional environment variable in production: `API_URL` on Vercel (the deployed Render backend URL, e.g. `https://curesync-api.onrender.com`), which the Next.js rewrite proxy reads at build time. In local development no variables are needed — the rewrite falls back to `http://localhost:8000`.

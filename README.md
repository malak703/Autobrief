<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Groq-LLM%20%2B%20Vision-F55036?style=for-the-badge&logo=meta&logoColor=white" alt="Groq" />
</p>

<h1 align="center">📋 AutoBrief</h1>

<p align="center">
  <strong>AI-powered project brief generation from raw client conversations</strong>
</p>

<p align="center">
  Turn messy WhatsApp chats, voice notes, and screenshots into structured, professional project briefs — in seconds.
</p>

---

## ✨ What is AutoBrief?

AutoBrief is an **AI-powered workspace** that helps freelancers, agencies, and project managers transform unstructured client communication into clear, actionable project briefs and proposals.

Instead of manually sifting through hundreds of WhatsApp messages, voice notes, and screenshot references, AutoBrief:

1. **Ingests** raw client materials (chat exports, audio files, images)
2. **Extracts** text via transcription (Whisper) and vision OCR (Groq)
3. **Filters** work-related content from casual conversation
4. **Generates** a structured 4-section project brief using LLMs
5. **Sends** a client-facing review link for confirmation and feedback
6. **Produces** a final professional proposal with deadline tracking

---

## 🚀 Key Features

### 📂 Multi-Format Intake
- **WhatsApp/Telegram exports** — Upload `.zip`, `.txt`, or `.json` chat exports
- **Voice notes** — Automatic transcription via Groq Whisper (Arabic + English)
- **Screenshots & images** — Vision-based OCR extracts text from mockups, references, and design boards
- **Pasted text** — Direct paste for quick briefs
- **Selective processing** — Choose which messages and images to include

### 🤖 AI Pipeline
- **Work filter** — LLM-powered filter strips greetings, jokes, and off-topic messages, keeping only project requirements
- **Brief generation** — Structures filtered content into 4 sections: *What the client wants*, *Goals & success criteria*, *Gaps & unclear points*, and *Follow-up questions*
- **Deadline extraction** — Automatically detects dated milestones and adds them to your calendar
- **Proposal generation** — Creates polished, client-ready proposals from reviewed briefs

### 👥 Client Collaboration
- **Shareable review links** — Send clients a branded link to review and confirm each brief section
- **Section-by-section feedback** — Clients can approve, comment, or request changes per section
- **Word-level diff tracking** — See exactly what changed between original and edited content
- **Voice feedback** — Clients can record audio responses for each section
- **Final proposal with PDF export** — Generate and download professional proposals

### 📅 Calendar & Deadlines
- **Auto-populated deadlines** — AI extracts due dates from briefs and proposals
- **Per-account isolation** — Each user sees only their own deadlines
- **Status tracking** — Mark deadlines as submitted or active
- **Manual entries** — Add custom deadlines alongside AI-extracted ones

### 🔒 Multi-Tenant Security
- **Row Level Security (RLS)** — Supabase enforces data isolation at the database level
- **Owner-scoped queries** — All data is filtered through the `business_owners → clients` ownership chain
- **Secure server actions** — Every mutation verifies ownership before executing

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 16 (Frontend + API)          │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐             │
│  │ Dashboard │  │  Briefs  │  │ Calendar  │  + more...  │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘             │
│       │              │              │                   │
│  ┌────┴──────────────┴──────────────┴─────┐             │
│  │         Server Actions + API Routes     │             │
│  └────────────────┬───────────────────────┘             │
└───────────────────┼─────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌───────────────┐     ┌─────────────────┐
│   Supabase    │     │  FastAPI Service │
│  Auth + DB +  │     │  (Python)       │
│  Storage      │     │                 │
│               │     │  • Whisper STT  │
│  • Users      │     │  • Vision OCR   │
│  • Clients    │     │  • LLM Filter   │
│  • Briefs     │     │  • Brief Gen    │
│  • Deadlines  │     │  • Deadlines    │
└───────────────┘     └────────┬────────┘
                               │
                               ▼
                      ┌─────────────────┐
                      │    Groq API     │
                      │  (LLama 3.1 +  │
                      │   Whisper +     │
                      │   Vision)       │
                      └─────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16, React 19, TypeScript | App shell, SSR, server components |
| **Styling** | Tailwind CSS 4, custom design system | Warm, professional UI aesthetic |
| **Auth & DB** | Supabase (Auth, Postgres, Storage, RLS) | User management, data persistence |
| **AI Backend** | FastAPI (Python) | Voice/image processing pipeline |
| **LLM** | Groq (LLama 3.1 8B Instant) | Text filtering, brief generation, deadline extraction |
| **Speech-to-Text** | Groq Whisper Large v3 | Arabic + English voice transcription |
| **Vision OCR** | Groq Vision (LLama 4 Scout) | Screenshot text extraction |
| **PDF Export** | html2pdf.js | Client-facing proposal downloads |
| **File Handling** | JSZip | WhatsApp `.zip` export parsing |

---

## ⚡ Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+ (for the FastAPI service)
- A **Supabase** project (free tier works)
- A **Groq** API key ([console.groq.com](https://console.groq.com))

### 1. Clone & Install

```bash
git clone https://github.com/your-username/autobrief.git
cd autobrief
npm install
```

### 2. Environment Variables

Create a `.env` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Groq AI
GROQ_API_KEY=gsk_your_groq_api_key

# FastAPI Extract Service
EXTRACT_SERVICE_URL=http://localhost:8000

# Optional: Site URL for client links
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Database Setup

Run these SQL migrations in the Supabase SQL Editor to create the required tables:

- `business_owners` — one row per authenticated user
- `clients` — scoped to an owner
- `briefs` — project briefs with sections, scores, and proposals
- `deadlines` — calendar deadlines linked to clients

Then apply RLS policies from `setup-rls.sql`.

### 4. Start the FastAPI Service

```bash
cd fastapi-service
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env  # Add your GROQ_API_KEY
uvicorn main:app --reload --port 8000
```

### 5. Start Next.js

```bash
# From the project root
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you're ready to go! 🎉

---

## 📁 Project Structure

```
autobrief/
├── app/
│   ├── (dashboard)/          # Authenticated routes
│   │   ├── page.tsx          # Dashboard home
│   │   ├── briefs/           # Brief listing + detail views
│   │   ├── calendar/         # Deadline calendar
│   │   ├── clients/          # Client management + uploads
│   │   └── settings/         # Account & notification settings
│   ├── brief/[token]/        # Public client review page
│   ├── api/                  # API routes
│   │   ├── generate-proposal/  # Groq proposal generation
│   │   ├── brief-feedback/     # Client feedback endpoint
│   │   └── cron/               # Deadline reminder cron
│   ├── actions/              # Server actions
│   │   ├── briefs.ts         # Brief CRUD + AI pipeline
│   │   ├── clients.ts        # Client management
│   │   └── account.ts        # User settings
│   └── layout.tsx            # Root layout with theme + nav
├── components/               # Reusable UI components
│   ├── internal_calendar.tsx  # Full calendar widget
│   ├── enhanced-upload-area.tsx # Multi-format file upload
│   ├── section-card.tsx      # Editable brief sections
│   ├── proposal-view.tsx     # Proposal display + diff
│   └── ...
├── lib/
│   ├── extract-service.ts    # FastAPI client helpers
│   ├── brief-helpers.ts      # Brief parsing + formatting
│   ├── intake-parser.ts      # Chat export normalization
│   ├── word-diff.ts          # Word-level change tracking
│   └── supabase/             # Supabase client setup
├── fastapi-service/
│   ├── main.py               # All AI endpoints
│   └── requirements.txt
└── setup-rls.sql             # Supabase RLS policies
```

---

## 🔌 API Endpoints

### FastAPI Service (`/fastapi-service`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/extract-voice` | POST | Transcribe audio → text (Whisper) |
| `/extract-image` | POST | OCR screenshots → text (Vision) |
| `/extract-text` | POST | Label raw text input |
| `/filter-work-content` | POST | Filter work-related content from conversation |
| `/filter-and-generate-brief` | POST | Combined filter + brief generation (single LLM call) |
| `/generate-project-brief` | POST | Generate structured brief from filtered bullets |
| `/extract-deadlines` | POST | Extract dated milestones from text |
| `/generate-meeting-summary` | POST | Structured meeting summary from transcript |

### Next.js API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/generate-proposal` | POST | Generate final proposal via Groq + extract deadlines |
| `/api/brief-feedback` | POST | Save client section feedback |
| `/api/extract-health` | GET | Proxy health check to FastAPI |
| `/api/cron/deadline-reminders` | GET | Send deadline reminder notifications |

---

## 🎨 Design Philosophy

AutoBrief uses a **warm, earthy design language** inspired by premium stationery and professional workspace tools:

- **Color palette**: Deep browns (`#2a2118`), warm golds (`#9a7b52`), soft creams (`#f6efe4`)
- **Typography**: Clean, modern type with generous spacing
- **Cards**: Rounded corners with subtle shadows and warm borders
- **Interactions**: Smooth transitions, hover effects, and skeleton loading states
- **Mobile-first**: Fully responsive layout across all breakpoints

---

## 🚢 Deployment

### Next.js (Vercel)

```bash
npm run build
# Deploy to Vercel, Netlify, or any Node.js host
```

### FastAPI (Railway / Render)

The `fastapi-service/` includes a `Procfile` and `runtime.txt` for Railway deployment:

```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

Set `EXTRACT_SERVICE_URL` in your Next.js environment to point at the deployed FastAPI URL.

---

## 👩‍💻 Built By

<table>
  <tr>
    <td align="center">
      <a href="https://www.linkedin.com/in/salmamedhatismail/">
        <strong>Salma Medhat</strong>
      </a>
      <br />
      Backend + Bits of Frontend + AI Engineer
    </td>
    <td align="center">
      <a href="https://www.linkedin.com/in/malak-e-3b765925b/">
        <strong>Malak Mohamed</strong>
      </a>
      <br />
      Frontend + Bits of Backend + AI Engineer
    </td>
  </tr>
</table>

<p align="center">
  <a href="https://www.linkedin.com/in/salmamedhatismail/">
    <img src="https://img.shields.io/badge/Salma_Medhat-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="Salma LinkedIn" />
  </a>
  &nbsp;
  <a href="https://www.linkedin.com/in/malak-e-3b765925b/">
    <img src="https://img.shields.io/badge/Malak_Mohamed-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="Malak LinkedIn" />
  </a>
</p>

---

<p align="center">
  Made with ☕ and a lot of AI magic
</p>

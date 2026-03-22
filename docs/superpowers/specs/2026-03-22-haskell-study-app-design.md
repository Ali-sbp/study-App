# HaskellStudy App — Design Spec
**Date:** 2026-03-22
**Status:** Approved

---

## Overview

A web application that helps students study Haskell (in Russian) using AI-powered prompt buttons, a code editor, and a contextual chat assistant. The core value proposition is carefully engineered prompts that extract maximum educational value from a free LLM (DeepSeek), making the app feel like a smart tutor rather than a generic chatbot.

Built to scale into a multi-language, multi-subject study platform over time.

---

## Architecture

### Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | FastAPI (Python) |
| Database | PostgreSQL + SQLAlchemy + Alembic |
| Auth | Clerk (frontend SDK + backend JWT verification) |
| AI | Vercel AI SDK (frontend streaming) + DeepSeek API |
| Code Execution | Judge0 API (external, zero server RAM cost) |
| Editor | Monaco Editor (VS Code engine) |
| Payments | Stripe (installed, disabled via feature flag) |
| Deployment | Docker Compose on Ubuntu server (Nginx + Next.js + FastAPI + PostgreSQL) |

### Service Boundaries

```
Browser
  └── Next.js (frontend only — UI, routing, no business logic)
        └── FastAPI (all backend — API, DB, AI proxy, auth, Judge0)
              └── PostgreSQL
```

Next.js never touches the database directly. All data flows through the FastAPI backend. This separation allows future mobile apps or other clients to use the same API.

### Deployment (Docker Compose)

```
Nginx          — reverse proxy, SSL termination
  ├── nextjs   — Next.js app (port 3000 internal)
  ├── fastapi  — FastAPI app (port 8000 internal)
  └── postgres — PostgreSQL (port 5432 internal, not exposed)
```

---

## UI Design

### Layout

Two-panel layout with a collapsible toolbar:

```
┌─────────────────────────────────────────────────────────────┐
│  λ HaskellStudy   [📁 Лекция 3 — Функторы ▾]    Иван [И]  │  ← Top nav
├─────────────────────────────────────────────────────────────┤
│  AI: [✦ Объяснить] [⚡ Задачи] [🔍 Концепция] [💡 Подсказка] [🔎 Проверить] [📋 Резюме]  │  ← Toolbar
├────────────────────────────┬──┬────────────────────────────┤
│                            │  │                            │
│   Monaco Editor (58%)      │⋮ │   AI Chat (42%)            │  ← Resizable
│   [📄 Лекция] [✏️ Практика] │  │   [● AI Ассистент — DS]   │
│   [line numbers] [code]    │  │   [messages...]            │
│                            │  │                            │
├────────────────────────────┤  │                            │
│ ▼ Вывод  [▶ Запустить снова]│  │   [chat input → ]          │
│ $ runghc...                │  │                            │
│ [2,3,4]                    │  └────────────────────────────┘
└────────────────────────────┘
```

### Editor Panel (left, 58% default)

- **Two tabs:** Лекция (lecture file) and Практика (practice scratchpad)
- **Both tabs editable** — students can annotate lectures with comments
- **Monaco Editor** with Haskell syntax highlighting, line numbers, VS Code status bar
- **Save button** — saves per-user (annotations don't overwrite other students' copies)
- **+ Файл button** — upload additional .hs files
- **Collapsible output panel** at bottom — shows Judge0 execution results, collapses to a single header bar when not needed
- **Run button** (small, bottom-right of status bar) — sends Практика tab code to Judge0

### Chat Panel (right, 42% default)

- Shared conversation thread — preset buttons and free-form chat use the same context
- AI always has the full lecture content in its system prompt
- Streaming responses
- Clear button resets the conversation for the current lecture

### Divider

Draggable resize handle between editor and chat, clamped 30%–75%.

---

## Pages & Routes

### Frontend (Next.js)

| Route | Description |
|---|---|
| `/` | Landing page |
| `/sign-in`, `/sign-up` | Clerk auth pages |
| `/dashboard` | Browse and select lectures |
| `/lecture/[id]` | Main study interface |
| `/admin` | Upload/manage default lectures (admin only) |

### Backend (FastAPI)

| Endpoint | Description |
|---|---|
| `GET /lectures` | List all lectures (defaults + user-uploaded) |
| `POST /lectures` | Upload a new .hs file |
| `GET /lectures/{id}/content` | Get user's saved version of a lecture |
| `PUT /lectures/{id}/content` | Save user's annotated version |
| `POST /chat/{lecture_id}` | Send a message, returns streaming AI response |
| `GET /chat/{lecture_id}/history` | Get chat history for a lecture |
| `DELETE /chat/{lecture_id}/history` | Clear chat history |
| `POST /execute` | Run code via Judge0, return output |
| `POST /webhooks/stripe` | Stripe payment webhook |

---

## Data Model

```sql
-- Lectures (uploaded .hs files)
lectures
  id            UUID PRIMARY KEY
  title         TEXT
  filename      TEXT
  original_content  TEXT        -- never modified
  is_default    BOOLEAN DEFAULT false
  created_by    TEXT            -- Clerk user ID (admin)
  created_at    TIMESTAMP

-- Per-user annotated versions
user_lectures
  id            UUID PRIMARY KEY
  user_id       TEXT            -- Clerk user ID
  lecture_id    UUID REFERENCES lectures
  content       TEXT            -- starts as original_content, user edits their copy
  updated_at    TIMESTAMP
  UNIQUE (user_id, lecture_id)

-- Chat history per user per lecture
chat_messages
  id            UUID PRIMARY KEY
  user_id       TEXT
  lecture_id    UUID REFERENCES lectures
  role          TEXT            -- 'system' | 'user' | 'assistant'
  content       TEXT
  created_at    TIMESTAMP

-- Users (minimal, Clerk is source of truth)
users
  clerk_id      TEXT PRIMARY KEY
  plan          TEXT DEFAULT 'free'   -- 'free' | 'pro'
  created_at    TIMESTAMP
```

---

## AI Architecture

### System Prompt (per session)

When a student opens a lecture, the system prompt injected into the conversation is:

```
Ты — терпеливый и дружелюбный преподаватель Haskell.
Студент изучает следующую лекцию. Отвечай на русском языке.
Используй простые аналогии и объяснения. Не давай готовых решений —
направляй студента к самостоятельному мышлению.

--- СОДЕРЖАНИЕ ЛЕКЦИИ ---
{lecture_content}
-------------------------
```

### Preset Prompt Buttons

These are placeholder prompts to be refined during the prompt engineering phase:

| Button | Injected message (placeholder) |
|---|---|
| ✦ Объяснить лекцию | "Объясни мне эту лекцию с нуля, простым языком. Используй аналогии." |
| ⚡ Создать задачи | "Создай 5 практических задач по этой лекции, от простого к сложному." |
| 🔍 Объяснить концепцию | "Объясни подробно следующую концепцию: {selected_text}" |
| 💡 Подсказка к задаче | "Дай подсказку к задаче, не раскрывая полного решения." |
| 🔎 Проверить мой код | "Проверь этот код и дай обратную связь:\n\n{editor_content}" |
| 📋 Резюме лекции | "Сделай краткое резюме этой лекции в виде буллетов." |

> ⚠️ **Prompt Engineering Phase:** The prompts above are scaffolding only. A dedicated phase after initial build will replace these with carefully engineered prompts designed to extract maximum educational value from DeepSeek. This is the core product differentiator.

### LLM Provider

- **Current:** DeepSeek (free tier, OpenAI-compatible API)
- **Switching:** Changing provider requires updating one env variable (`AI_PROVIDER`) — Vercel AI SDK abstracts the rest

---

## Auth & Payments

### Auth (Clerk)
- Clerk handles sign-up, sign-in, session management
- Backend verifies Clerk JWT on every protected request
- Admin role: specific Clerk user IDs listed in env var `ADMIN_USER_IDS`

### Payments (Stripe — disabled for now)
- Feature flag: `PAYMENTS_ENABLED=false` in env
- When enabled: `free` plan gets limited AI requests/day; `pro` plan is unlimited
- Stripe webhook updates `users.plan` on subscription events
- Zero rework to enable — just flip the flag

---

## Scalability Notes

This architecture is designed to grow into a multi-language, multi-subject study platform:

- **New languages** (C, C++): Judge0 supports 60+ languages — just add a language selector to the UI and pass the language ID to the execute endpoint
- **Notes/general study mode**: The lecture model is generic — any text file can be a "lecture", not just .hs files. A future "Notepad mode" reuses the same editor + chat structure with different file types
- **Mobile app**: FastAPI backend is a clean REST API — any future mobile client hits the same endpoints
- **Horizontal scaling**: Next.js and FastAPI containers are stateless — add more instances behind Nginx as needed

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Clerk
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...

# AI
DEEPSEEK_API_KEY=...
AI_PROVIDER=deepseek

# Code execution
JUDGE0_API_KEY=...
JUDGE0_API_URL=...

# Payments (disabled)
PAYMENTS_ENABLED=false
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# Admin
ADMIN_USER_IDS=clerk_id1,clerk_id2
```

# Slack-Lite MVP

A **self-host-able, TypeScript-only Slack alternative** you can demo in weeks  
(targeting YC W24 deadline — **August 4, 2025**).

---

## ✨ Core Features (MVP)

| ✅ Ready in v0.1 | ❌ Not in MVP |
|-----------------|--------------|
| Email **magic-link auth** (NextAuth.js) | Rich media uploads |
| **Public & private channels** | Mobile apps |
| **Direct messages (DMs)** | Push / desktop notifications |
| **OpenAI chatbot per channel** (user supplies their own API key) | Landing-page marketing site |
| Real-time updates via WebSockets | Threading, reactions, etc. |

---

## 🏗️ Tech Decisions

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Frontend & Backend** | **Next.js 15** (App Router, TypeScript) | Single repo, SSR + API + WS in one process |
| **Auth** | **NextAuth.js** (email provider) | 2-file setup, no external SaaS |
| **Database** | **PostgreSQL 16 (Docker)** | Battle-tested, self-host-friendly |
| **ORM** | **Prisma** | Type-safe models, simple migrations |
| **Real-time transport** | **tRPC + WebSocket handler** | End-to-end types, zero GraphQL boilerplate |
| **Chatbot** | API route that proxies to `openai.chat.completions` | User adds `OPENAI_API_KEY` → keeps infra simple |
| **Styling / UI** | **Tailwind CSS + shadcn/ui** | Copy-paste components for speed |
| **Containerization** | Single **Dockerfile** + (optional) **docker-compose.yml** | Drops onto any Ubuntu VPS |
| **CI** | GitHub Actions (`docker buildx`) | Free tier, reproducible images |

---

## 🗄️ Project Layout
```
slack-lite/
├─ app/ # Next.js App Router
│ ├─ page.tsx # entry
│ ├─ channels/[id]/ # channel UI
│ ├─ dm/[uid]/ # direct-message UI
│ └─ api/
│ ├─ auth/[...nextauth]/ # NextAuth handler
│ ├─ socket/route.ts # WS upgrade handler
│ └─ chatbot/route.ts # POST → OpenAI
├─ prisma/
│ └─ schema.prisma
├─ .env.example
├─ Dockerfile
└─ docker-compose.yml # Next.js + Postgres (optional Traefik)
```

---

## 🚀 Quick Start

### 1. Prerequisites

* Node 20+ (use `fnm` or `nvm`)
* **pnpm** (`corepack enable`)
* Docker & Docker Compose (for Postgres / production image)

### 2. Clone & install

```bash
git clone https://github.com/yourname/slack-lite.git
cd slack-lite
pnpm install
```

### 3. Configure environment

Copy variables and fill in secrets:

```
cp .env.example .env

# edit DATABASE_URL, NEXTAUTH_SECRET, SMTP creds (for email links),
# OPENAI_API_KEY (optional for local testing)
```

### 4. Run Postgres (dev)

`docker compose up -d db`

### 5. Generate DB & client

```
pnpm prisma db push     # create tables
pnpm prisma generate    # create Prisma client
```

### 6. Start the dev server

`pnpm dev`

Open http://localhost:3000 — you should see the login screen.
Magic-link emails will be sent via the SMTP settings you supplied.

---
## 🐋 Production with Docker

Build and run everything in one container (behind your own reverse proxy).

```
docker build -t slack-lite:latest .
docker run -d --restart=always \
  --env-file .env \
  -p 3000:3000 \
  slack-lite:latest
```

(Add Traefik/Caddy/Nginx for HTTPS + domain.)

---

## 🔧 Common Tasks
| Action | Command |
|--------|---------|
| Add a new Prisma model | Edit schema.prisma → pnpm prisma migrate dev |
| Open interactive DB console | pnpm prisma studio |
| Lint / type-check | pnpm lint / pnpm typecheck |
| Run Jest tests | pnpm test (coming soon) |


## 🛣️ Roadmap

**v0.1 – Demo**
• Auth, channels, DMs, OpenAI bot, basic UI polish

**v0.2 – Quality of life**
• Edit / delete messages, FTS search, channel invites

**v0.3 – Mobile & media**
• Expo + React Native, image uploads (MinIO), push notifications

**v1.0 – Self-reliant federation**
• Matrix-compatible bridge, LiveKit calls, Helm charts for on-prem deploys

---

## 🤝 Contributing

PRs & issues welcome! Please run pnpm lint && pnpm typecheck before pushing.
📄 License

MIT — see LICENSE.

**Self-Reliance First**

Every dependency here is FOSS and can be run on your own hardware or a commodity VPS. No vendor lock-in, no hidden SaaS fees.
# Stonefruit

A **self-hostable, TypeScript-only Slack alternative** you can demo in weeks  
(targeting YC W24 deadline — **August 4, 2025**).

---

## ✨ Core Features (MVP)

| ✅ Ready in v0.1                                                 | ❌ Not in MVP                |
| ---------------------------------------------------------------- | ---------------------------- |
| Email **magic-link auth** (NextAuth.js) via Resend              | Rich media uploads           |
| **Public & private channels**                                    | Mobile apps                  |
| **Direct messages (DMs)**                                        | Push / desktop notifications |
| **OpenAI chatbot per channel** (user supplies their own API key) | Landing-page marketing site  |
| Real-time updates via WebSockets                                 | Threading, reactions, etc.   |

---

## 🏗️ Tech Decisions

| Layer                   | Choice                                                    | Rationale                                       |
| ----------------------- | --------------------------------------------------------- | ----------------------------------------------- |
| **Frontend & Backend**  | **Next.js 15** (App Router, TypeScript)                   | Single repo, SSR + API + WS in one process      |
| **Auth**                | **NextAuth.js** (email provider)                          | 2-file setup, no external SaaS                  |
| **Database**            | **PostgreSQL 16 (Docker)**                                | Battle-tested, self-host-friendly               |
| **ORM**                 | **Prisma**                                                | Type-safe models, simple migrations             |
| **Real-time transport** | **tRPC + WebSocket handler**                              | End-to-end types, zero GraphQL boilerplate      |
| **Chatbot**             | API route that proxies to `openai.chat.completions`       | User adds `OPENAI_API_KEY` → keeps infra simple |
| **Styling / UI**        | **Tailwind CSS + shadcn/ui**                              | Copy-paste components for speed                 |
| **Containerization**    | Single **Dockerfile** + (optional) **docker-compose.yml** | Drops onto any Ubuntu VPS                       |
| **CI**                  | GitHub Actions (`docker buildx`)                          | Free tier, reproducible images                  |

---

## 🗄️ Project Layout

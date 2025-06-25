## Tech Decisions
| Area               | Decision                                                                 | Why it stays simple                                                   |
|--------------------|--------------------------------------------------------------------------|------------------------------------------------------------------------|
| Codebase           | One Next.js 15 project (/app router, TypeScript)                         | Pages + API routes + WebSocket server all live together. No Turborepo. |
| Auth               | NextAuth.js – Email magic-link provider                                  | 2-file setup; sessions stored in Postgres.                             |
| Database           | PostgreSQL 16 (Docker)                                                   | Battle-tested, self-host-able.                                         |
| ORM / migrations   | Prisma                                                                   | Type-safe models, prisma migrate dev in Docker.                        |
| Real-time          | next-auth-ws + tRPC (or plain ws handler under /app/api/socket)         | Runs inside the same Next.js server process.                           |
| OpenAI bot         | Simple API route /api/chatbot that calls chat.completions with user-supplied key | No extra service.                                             |
| Styling / UI       | Tailwind + shadcn/ui                                                     | Copy-paste components, zero config.                                    |
| Container / deploy | Single Dockerfile → push to your Ubuntu VPS (Traefik optional)           | `docker run -e DATABASE_URL=... yourimage:tag`—done.                   |
| CI                 | GitHub Actions (build & push image)                                      | Free tier is enough; keeps everything reproducible.                    |



## Project Layout
```
/my-slack-mvp
├─ app/                 # Next.js App Router
│  ├─ page.tsx          # app root
│  ├─ channels/[id]/    # channel UI
│  └─ api/
│     ├─ auth/[...nextauth]/route.ts  # NextAuth handler
│     ├─ socket/route.ts              # WS upgrade handler
│     └─ chatbot/route.ts             # POST → OpenAI
├─ prisma/
│  └─ schema.prisma
├─ Dockerfile
└─ docker-compose.yml   # Next.js + Postgres
```
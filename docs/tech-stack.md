# Stonefruit 2.0 — Tech Decisions

Svelte w/ Vite on the frontend. Node + Fastify on the backend with an OpenAPI spec via @fastify/swagger. All JavaScript because TS is annoying. Lucia for auth. PostgreSQL db w/ Prisma. Emails via Resend.
Docker Compose, self-hosted behind Caddy. We have server at home.
Websockets for real-time comms.
Radix primitives for a11y.
Maybe Zustand??
Storybook/Ladlde for design system.

**Testing**

- Unit: Vitest.
- API: supertest against Fastify with an ephemeral DB.
- WS: simulated clients for acks and resend.
- E2E: Playwright against Compose stack.

**Security baseline**

- Input validation at boundaries (zod).
- Rate limits on auth and message sends.
- CSP, Helmet, sanitized HTML rendering.
- Least-priv DB user. Secrets via env.

## MVP scope

- Workspaces, channels, messages.
- Auth via magic link.
- Basic presence and typing indicators.
- Message history and pagination.
- One small delight element.

## Initial commands (proposed)

- `just dev` — run Compose and Vite
- `just db:migrate` — Prisma migrate
- `just openapi` — emit spec and client
- `just test` — unit + API suite

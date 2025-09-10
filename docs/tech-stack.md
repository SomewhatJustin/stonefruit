# Stonefruit 2.0 — Tech Decisions

## Stack summary

* **Frontend:** React + Vite + TypeScript + Radix Primitives + Tailwind
* **Backend:** Node LTS + Fastify + TypeScript
* **Validation/types:** zod (+ zod-to-openapi)
* **Auth:** Lucia (session cookies). Passwordless via magic links using Resend
* **DB:** PostgreSQL + Prisma
* **Cache/realtime/broker:** Redis (later for presence, rate limits, BullMQ)
* **Email:** Resend
* **Docs:** OpenAPI 3 via @fastify/swagger
* **Runtime:** Docker Compose, self-hosted behind Caddy

## Rationale

* **React:** known, rich ecosystem, stable SSR/CSR options.
* **Fastify:** fast, type-safe, schema-first, good plugin model.
* **zod:** single source of truth for validation and types.
* **Lucia:** simple session model. Works with custom passwordless flows.
* **Prisma + Postgres:** reliable, ergonomic schema migration.
* **Resend:** straightforward transactional email for magic links and notifications.
* **OpenAPI:** future-proof for mobile or external clients.

## Auth plan (Lucia + magic links)

* Generate a short-lived, one-time login token mapped to user and intent.
* Email a signed link via **Resend** to the user’s address.
* On link open, verify token → create Lucia session → rotate token.
* Cookies: `HttpOnly`, `Secure`, `SameSite=Lax`.
* Optional device binding and IP heuristics later.

## API design

* Define request/response with **zod**.
* Derive OpenAPI using **zod-to-openapi**.
* Serve docs with **@fastify/swagger** and **@fastify/swagger-ui**.
* Generate a typed client for the React app from the OpenAPI spec.

## Realtime

* Start with **@fastify/websocket** (or `ws`) for channels.
* Heartbeats (ping/pong 20–30s), per-socket backpressure, message UUIDs, acks.
* Presence in Redis with TTL. Postgres remains source of truth for history.
* Redis pub/sub for fan-out when you scale beyond one node.

## Frontend

* **Vite** for dev/build. **React Query** for data fetching + cache.
* **Radix Primitives** for a11y. Style with Tailwind tokens for a distinct look.
* Minimal global state (Zustand) for UI only.
* Storybook or Ladle for the design system.

## Services (Docker Compose)

* `web`: Fastify API + WS
* `postgres`: database
* `redis`: cache/pubsub (later BullMQ)
* `caddy`: reverse proxy, TLS, WS upgrades
* Optional: `mailhog` for local preview, `otel-collector` later

## Environments

* Dev: devcontainer + Compose. No host dependencies.
* Prod: single Docker host with nightly DB backups and healthchecks.

## Testing

* Unit: Vitest.
* API: supertest against Fastify with an ephemeral DB.
* WS: simulated clients for acks and resend.
* E2E: Playwright against Compose stack.

## Security baseline

* Input validation at boundaries (zod).
* Rate limits on auth and message sends.
* CSP, Helmet, sanitized HTML rendering.
* Least-priv DB user. Secrets via env.

## MVP scope

* Workspaces, channels, messages.
* Auth via magic link.
* Basic presence and typing indicators.
* Message history and pagination.
* One small delight element.

## Initial commands (proposed)

* `just dev` — run Compose and Vite
* `just db:migrate` — Prisma migrate
* `just openapi` — emit spec and client
* `just test` — unit + API suite

## Next steps

* Scaffold repo with Vite + Fastify + Prisma + Lucia.
* Wire zod schemas and OpenAPI emission.
* Add Resend provider and magic link flow.
* Bring up Compose and a first channel message loop.

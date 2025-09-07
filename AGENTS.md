# Repository Guidelines

## Project Structure & Module Organization
- `app/` – Next.js App Router (pages, layouts, routes). API routes live under `app/api/*` (NextAuth, tRPC, upload, socket).
- `components/` – Reusable UI (PascalCase files). `hooks/` – React hooks (`use*.ts`).
- `lib/` – Client/server utilities. `server/websocketServer.ts` – WS helpers. `trpc.ts` – tRPC router.
- `prisma/` – `schema.prisma`, generated client, and `migrations/`.
- `public/` – static assets. `scripts/` – small CLIs (e.g., avatar tools). `documents/` – design notes.

## Build, Test, and Development Commands
- `pnpm dev` – runs Postgres (`docker compose up -d db`), watches Prisma (`prisma dev`), and starts Next.js dev server.
- `pnpm build` – Next.js production build. `pnpm start` – start prod server.
- `pnpm lint` – ESLint (Next core-web-vitals + TS). Fix issues before PRs.
- Prisma: `pnpm prisma migrate dev -n "init-feature"` (create/apply migration), `pnpm prisma studio` (inspect DB).
- Docker: `docker compose up --build` to run `app` + `db` with volumes for persistence.
- Env: `.env` must define `DATABASE_URL`, `NEXTAUTH_SECRET`, optional `RESEND_API_KEY`.

## Coding Style & Naming Conventions
- TypeScript, strict mode. Prettier config: no semicolons, `trailingComma: es5`, `arrowParens: avoid`, 2-space indent.
- Files: components `PascalCase.tsx`; hooks `use-*.ts` or `use*.ts`; pages `page.tsx`; API handlers `route.ts`.
- Use Tailwind v4 and shadcn/ui; prefer utility classes and `class-variance-authority` for variants.
- Keep server-only code out of client components; colocate small helpers in `lib/`.

## Testing Guidelines
- No formal test runner is configured yet. At minimum: run `pnpm lint` and verify flows locally.
- If you add non-trivial logic, include lightweight unit tests (Vitest or similar) in the same PR and keep functions pure where possible.
- For DB changes, include a Prisma migration and test fresh setup (`docker compose down -v && pnpm dev`).

## Commit & Pull Request Guidelines
- Commits: short, imperative, focused (examples: `fix typing indicators for DMs`, `add browse channels`). Avoid noisy “WIP”.
- PRs: include a clear description, linked issues, screenshots of UI, and notes on env or migration steps. Ensure `pnpm lint` and `pnpm build` pass.
- Schema changes: include `prisma/migrations/*` and briefly describe impact and rollback.

## Security & Configuration Tips
- Never commit secrets. Use `.env` and Docker secrets. File uploads persist in the `uploads` volume.
- Validate user input with Zod (tRPC procedures) and enforce auth via NextAuth session in server paths.

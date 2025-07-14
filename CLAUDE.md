# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `pnpm dev` - Start development environment (spins up Docker DB, runs Prisma migrations, starts Next.js dev server)
- `pnpm build` - Build production bundle
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Database Operations  
- `pnpm prisma dev` - Run database migrations in development
- `pnpm prisma migrate dev` - Create and apply new migration
- `pnpm prisma studio` - Open Prisma Studio database browser
- `pnpm prisma generate` - Regenerate Prisma client after schema changes

### Docker
- `docker compose up -d db` - Start PostgreSQL database in background
- `docker compose down` - Stop all services

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router and TypeScript
- **Database**: PostgreSQL 16 with Prisma ORM  
- **Auth**: NextAuth.js with email magic-link provider
- **Real-time**: WebSocket server + tRPC for type-safe API
- **UI**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack React Query with tRPC

### Key Architectural Patterns

**Monolithic Structure**: Single Next.js app contains frontend, API routes, and WebSocket server in one process. No microservices or separate backends.

**Real-time Communication**: 
- WebSocket server (`server/websocketServer.ts`) runs on port 3001
- EventEmitter-based pub/sub system broadcasts messages across connections
- tRPC procedures emit events to WebSocket clients for real-time updates

**Database Design**:
- Multi-tenant with Users, Channels, Messages, and ChannelMembers
- Direct messages use special Channel records with `isDirect: true`
- Channel membership controls message access
- Reactions and read status tracking included

**Authentication Flow**:
- NextAuth.js handles email magic-link authentication
- Session management via Prisma adapter  
- All API routes protected via tRPC middleware

### Important File Locations

**Core API Logic**: `trpc.ts` - Contains all tRPC procedures and business logic
**Database Schema**: `prisma/schema.prisma` - Complete data model
**WebSocket Server**: `server/websocketServer.ts` - Real-time message broadcasting
**Auth Configuration**: `auth.ts` and `auth.config.ts` - NextAuth.js setup
**Main UI Components**: `components/` - Chat interface, message handling, etc.

### Development Notes

**Database**: Always ensure Docker PostgreSQL is running before development. The dev command handles this automatically.

**Real-time Features**: Message posting, typing indicators, and reactions all use the WebSocket + EventEmitter system for immediate UI updates.

**Direct Messages**: Implemented as special channels with `isDirect: true` and a `directHash` for efficient lookups between users.

**General Channel**: Auto-created default channel where all users are automatically added as members.
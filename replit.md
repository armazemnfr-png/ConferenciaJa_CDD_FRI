# ConfereJá - Cargo Conference System

## Overview

ConfereJá is a web-based cargo conference (load verification) system for a logistics/delivery company. It has three user modules:

1. **Administrator** - Dashboard with analytics (conference times, divergence rates), WMS data upload via CSV, and matinal meeting history
2. **Equipe de Entrega (Delivery Team / Drivers)** - Mobile-first interface for drivers to verify cargo items by bay, marking quantities, damages, and partial counts
3. **Supervisor de Rota (Route Supervisor)** - MatinalPlay module for tracking daily morning meetings (matinals) with stopwatch-style timing

The app uses a mustard yellow and corporate blue color scheme as brand colors. The name "ConfereJá" means "Check Now" in Portuguese — the entire UI is in Brazilian Portuguese.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router)
- **State/Data Fetching**: TanStack React Query for server state management
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (mustard yellow `--primary`, corporate blue `--accent`)
- **Charts**: Recharts for admin dashboard visualizations
- **CSV Parsing**: PapaParse for WMS data upload
- **Icons**: Lucide React
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend
- **Framework**: Express.js running on Node with TypeScript (via tsx)
- **Server entry**: `server/index.ts` creates an HTTP server, registers routes, and serves static files in production or uses Vite dev middleware in development
- **API structure**: RESTful JSON API under `/api/` prefix. Route definitions with Zod validation schemas are shared between client and server in `shared/routes.ts`
- **Storage layer**: `server/storage.ts` implements `IStorage` interface with `DatabaseStorage` class using Drizzle ORM queries

### Database
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema location**: `shared/schema.ts` (app tables) and `shared/models/auth.ts` (auth tables)
- **Connection**: `server/db.ts` creates a `pg.Pool` from `DATABASE_URL` environment variable
- **Migration**: Use `npm run db:push` (drizzle-kit push) to sync schema to database
- **Key tables**:
  - `conferences` - Tracks cargo conference sessions (map number, driver, status, timing)
  - `wms_items` - Individual items from WMS system to be verified (SKU, bay, quantities, damage tracking)
  - `matinals` - Morning meeting records (room, timing, duration)
  - `sessions` - Express session storage (required for Replit Auth)
  - `users` - User accounts (required for Replit Auth)

**Note**: There is also a legacy `server.js` file at root and a `prisma/` directory referencing Prisma — these are leftover artifacts. The active system uses Drizzle ORM exclusively. The legacy `server.js` should not be used.

### TML (Tempo de Manhã de Loja)
`AdminTml` page at `/admin/tml` computes 4 components per mapa from cross-referenced data:
- **Matinal** — `matinals.durationMinutes` (matched by equipe substring vs roomName, same day as portaria exit)
- **Matinal→Pátio** — `ginfo.hrInicio` minus matinal `actualEndTime`
- **Checklist** — `ginfo.hrFinal` minus `ginfo.hrInicio` (fallback: `ginfo.tempo`)
- **Pátio→Portaria** — `promax.hrOper` (SAIDA CDD/FAB) minus `ginfo.hrFinal`

The `ginfo_checklist` table has `hr_inicio` and `hr_final` text columns. The GINFO upload tab extracts HR INICIO and HR FINAL columns. Room matching uses case-insensitive substring normalization.

### Portaria (Gate Exit Tracking)
The `promax_data` table stores two types of records from the Promax PW report:
- `fase = "CARREGADO"` — used for driver login (maps driver registration to their map)
- `fase = "SAIDA CDD/FAB"` — used for portaria exit tracking (stores `hrOper`, `dtOper`, `motorista`)

The upload (PW tab) now sends all rows to the server with `mapa`, `fase`, `hrOper`, `dtOper`, `motorista`, `veiculo`, `placa`. The server filters by phase and stores accordingly.

### Authentication
- **Replit Auth** integration via OpenID Connect (located in `server/replit_integrations/auth/`)
- Session-based authentication using `express-session` with `connect-pg-simple` for PostgreSQL session storage
- Passport.js with OpenID Client strategy
- Protected routes use `isAuthenticated` middleware
- Client-side auth hook at `client/src/hooks/use-auth.ts`

### Shared Code
- `shared/schema.ts` - Drizzle table definitions and Zod insert schemas, shared between client and server
- `shared/routes.ts` - API route definitions with paths, methods, input validation (Zod), and response schemas. Acts as a typed API contract
- `shared/models/auth.ts` - Auth-related table definitions

### Build System
- **Development**: `npm run dev` runs tsx to execute `server/index.ts` which sets up Vite dev server with HMR
- **Production build**: `npm run build` runs `script/build.ts` which builds the client with Vite and bundles the server with esbuild
- **Production start**: `npm start` runs the built `dist/index.cjs`

## External Dependencies

- **PostgreSQL** - Primary database, connected via `DATABASE_URL` environment variable
- **Replit Auth (OpenID Connect)** - Authentication provider, requires `ISSUER_URL`, `REPL_ID`, and `SESSION_SECRET` environment variables
- **No other external APIs** - The system is self-contained; data comes from CSV uploads processed with PapaParse
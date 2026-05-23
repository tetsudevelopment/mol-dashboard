<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# MOLTECH Dashboard — project rules

This dashboard is an **internal development tool** for testing the MOLTECH backend (`../moltech_api/`) and the mobile app (`../moltech-app/`). It is **not** a production admin panel.

## Sibling repos

- `moltech_api/` — NestJS 11 + Prisma 6 + Postgres 16 + Redis 7. REST API at `/api/v1/...` with envelope `{ data, meta, error }`.
- `moltech-app/` — Expo 54 + Expo Router 6 + React 19. Uses the same API contract.

Both are read-only from this repo. If a contract change is needed, edit the backend first and propagate.

## Stack contract

- Next.js 16 (App Router), TypeScript strict, React 19, Tailwind CSS 4.
- TanStack Query for server state. Zustand for client state.
- Axios single instance (`src/api/client.ts`). Zod 4 for every schema.
- Path alias: `@/*` → `src/*`.

## Non-negotiables

- **Envelope unwrapping is mandatory.** Endpoints in `src/api/endpoints/` must call `unwrap()` and validate the result with a Zod schema. Components consume already-unwrapped, already-validated data via `src/queries/*.queries.ts`.
- **No raw `fetch` to the backend from components.** Always go through `apiClient`.
- **Decimals are strings on the wire.** Use `decimal.js` for math. Never `number` for money.
- **Idempotency-Key (UUID v4) is required on every payment-creating request.** Use `newIdempotencyKey()` from `src/api/client.ts`.
- **No PII or tokens in logs.** Use a scrubbed logger (TODO) once added.
- **Zod is the single source of truth for shape.** Derive types with `z.infer`, never duplicate by hand.
- **No `console.log` in committed code.** Wrap behind a logger.

## Layered structure

```
src/
├── app/                — routes (App Router)
├── api/                — Axios client + endpoint functions (data layer)
├── queries/            — TanStack Query hooks (server state)
├── stores/             — Zustand stores (client state)
├── validators/         — Zod schemas (shape source of truth)
├── providers/          — React context providers
├── components/         — UI building blocks
├── lib/                — env, cn, pure utilities
└── types/              — derived/domain types
```

Dependencies flow strictly inward: `app/` → `queries/` / `stores/` → `api/` / `validators/` / `lib/`. Do not import `axios` from `app/` or `components/`.

## Conventions

- Components are functional. Named exports everywhere except in `app/` (route files need default exports).
- React 19 + React Compiler: do NOT add `useMemo` / `useCallback` by default. Add only with profiler evidence.
- File suffixes: `*.queries.ts`, `*.store.ts`, `*.schema.ts`. Components in `PascalCase.tsx` files.
- Tailwind 4: tokens come from `globals.css` `@theme inline`. Do not hardcode `#xxxxxx` in components; reach for a token first.
- Event naming: prop `onXxx`, internal handler `handleXxx`.
- Conventional Commits. Subject in imperative, lowercase, ≤72 chars.

## Operational rules

- Match the user's language in chat (default Spanish). Code, identifiers, and comments stay in English.
- Documentation lives in Spanish (Colombia) to match the rest of the MOLTECH project.
- Before touching multiple files for a feature, propose a 3-5 step plan and wait for OK.
- Do not run lint or tests after each file; run once at the end.

## How to run

```bash
cp .env.example .env.local
# edit .env.local — point NEXT_PUBLIC_API_URL to your backend
npm install
npm run dev   # http://localhost:3000 (or 3001 if backend already on 3000)
```

# Phase 1 Status — Backend

**Status: COMPLETE.** All endpoints implemented, typechecked, built (dev and production), and proven with a real HTTP smoke test — 47/47 checks passing, including cross-user data isolation and malformed-input handling.

> Note: this repo is further along than "Phase 1" — the full web app, Chrome extension, and Android project are also already built (see `README.md`). This file documents the backend specifically, per the Phase 1 spec.

## How to run

```bash
cd server
cp .env.example .env   # optional — sensible defaults exist
npm run dev            # http://localhost:4000, auto-reload on change
```

Production build:

```bash
npm run build          # -> dist/index.js (esbuild bundle + copied migrations)
npm start               # node dist/index.js
```

Both paths resolve the SQLite data directory and migration files relative to `process.cwd()` / the compiled `dist/` folder respectively — no brittle absolute or `__dirname`-only paths. See `src/db/connection.ts` (data dir = `<cwd>/data`) and `src/db/migrate.ts` (checks `../migrations` for dev, `./migrations` for the bundled build).

## How to seed

```bash
npm run seed
```

Idempotent — skips if the demo account (`demo@manifestcrm.app` / `Demo@1234`) already exists. Seeds a realistic founder account: goals across categories, a CRM pipeline (won/lost/in-progress leads), a college outreach list, several months of money entries, habits with partial logs, evidence entries, and one completed morning/night cycle. Nothing is falsely marked "achieved."

## How to smoke-test

```bash
# terminal 1
npm run dev
# terminal 2
npm run test:smoke
```

`scripts/smokeTest.ts` makes real HTTP requests against the running server (no mocking) and prints `PASS`/`FAIL` per check, then `BACKEND SMOKE TEST PASSED` only if everything passed. Last run: **47 passed, 0 failed.**

It covers: health, signup/login (including wrong password and validation failures), `/auth/me` (including missing/invalid JWT), onboarding, goals CRUD, the full morning-routine payload (gratitude, future self, Big 3, money move, courage action, all four scores), the 1-3-5 task limit, leads (create/move-stage/follow-up/stats), college outreach (create/status transitions/today's-contact-count), money entries + summary totals, habits (create/toggle/progress), evidence (create/timeline), night review (create/fetch), weekly/monthly review endpoints, and a security section (see below).

## Security checklist

| Item | Status |
|---|---|
| Passwords hashed (bcrypt) | ✅ `bcryptjs`, 10 salt rounds |
| JWT secret from env | ✅ `process.env.JWT_SECRET`, never hardcoded |
| `.env` gitignored | ✅ |
| `.env.example` exists | ✅ `server/.env.example` |
| SQLite data dir gitignored | ✅ `server/data/*.sqlite*` (base file, journal, WAL, SHM) |
| Inputs validated | ✅ every mutating route uses a `zod` schema; failures return 400 with a readable message |
| User A cannot access/modify User B's data | ✅ verified by smoke test — every resource query/mutation is scoped by `user_id` derived from the JWT, never from the URL/body |
| Malformed IDs don't crash the server | ✅ verified — a non-numeric or non-existent `:id` simply misses the `WHERE id = ? AND user_id = ?` match and returns 404 |
| Invalid/missing JWT returns 401 | ✅ `requireAuth` middleware |
| Missing required fields return 400 | ✅ `zod` `safeParse` on every write route |

Not done, and intentionally out of scope for a personal-use v1: rate limiting, refresh-token rotation, email verification, password reset flow. None of these block the product from being safe to use.

## Endpoints

All routes are mounted under `/api` and (except `/api/health` and `/api/auth/signup|login`) require `Authorization: Bearer <jwt>`.

- `GET /api/health`
- `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me`, `PATCH /api/auth/me`
- `GET /api/onboarding`, `POST /api/onboarding`
- `GET /api/goals`, `POST /api/goals`, `PATCH /api/goals/:id`, `DELETE /api/goals/:id`
- `GET /api/morning/:date`, `POST /api/morning`
- `GET /api/night/:date`, `POST /api/night`
- `GET /api/checkins`, `POST /api/checkins` (quick check-in, 11:11, 22:22, 3-3-3)
- `GET /api/leads`, `GET /api/leads/stats`, `POST /api/leads`, `PATCH /api/leads/:id`, `DELETE /api/leads/:id`
- `GET /api/colleges`, `GET /api/colleges/stats`, `POST /api/colleges`, `PATCH /api/colleges/:id`, `DELETE /api/colleges/:id`
- `GET /api/money/entries`, `POST /api/money/entries`, `DELETE /api/money/entries/:id`, `GET /api/money/goals`, `POST /api/money/goals`, `GET /api/money/summary`
- `GET /api/habits`, `POST /api/habits`, `DELETE /api/habits/:id`, `POST /api/habits/:id/toggle`
- `GET /api/evidence`, `POST /api/evidence`, `DELETE /api/evidence/:id`
- `GET /api/tasks`, `POST /api/tasks`, `PATCH /api/tasks/:id`, `DELETE /api/tasks/:id`
- `GET /api/reviews/weekly[/:weekStart]`, `POST /api/reviews/weekly`, `GET /api/reviews/monthly[/:month]`, `POST /api/reviews/monthly`, `GET /api/reviews/monthly-trend`
- `GET /api/dashboard` — aggregates today's focus, goals, money, pipeline, scores, streaks, and rule-based coaching messages in one call

## Database structure

SQLite via `better-sqlite3`, versioned SQL migrations in `src/migrations/*.sql`, tracked in a `schema_migrations` table. Tables: `users`, `onboarding`, `goals`, `daily_checkins`, `morning_routines`, `night_reviews`, `leads`, `college_outreach`, `money_entries`, `money_goals`, `habits`, `habit_logs`, `evidence_logs`, `weekly_reviews`, `monthly_reviews`, `tasks`. Full schema: `server/src/migrations/001_init.sql`.

## Demo credentials

```
Email:    demo@manifestcrm.app
Password: Demo@1234
```

## Genuine limitations

- No automated *unit* test suite — the smoke test is an integration-level proof against a real running server, which is what was asked for and is appropriate for a v1 of this size.
- No rate limiting or brute-force login protection yet.
- No password-reset / email-verification flow (not needed for a single personal account + a demo login in v1).
- Smoke test creates two throwaway accounts (`smoke-a-*@test.local`, `smoke-b-*@test.local`) each run; harmless, but delete `server/data/mecrm.sqlite*` and re-seed if you want a pristine database afterward.

# Manifestation & Execution CRM

A simple, bold, fast, positive, mobile-friendly personal operating system that turns **vision into daily execution** and **daily execution into measurable evidence**.

It combines manifestation practices (gratitude, visualization, affirmations) with real business execution (CRM, college outreach, money tracking, goals, habits) — without becoming a complicated ERP.

> **THOUGHT → BELIEF → DECISION → ACTION → CONSISTENCY → EVIDENCE → RESULT**

---

## What's included

| Area | Status |
|---|---|
| Monorepo (npm workspaces) | ✅ Done |
| Backend (Node + Express + TypeScript + SQLite) | ✅ Done |
| Auth (JWT + bcrypt) | ✅ Done |
| Web app (React + Vite + TypeScript + Tailwind) | ✅ Done |
| Dashboard (Today's Focus, Goals, Money, Pipeline, Score, Streaks) | ✅ Done |
| Morning Routine (gratitude, future self, 3-6-9, visualization, Big 3, money move, courage action, score) | ✅ Done |
| Focus Mode (1-3-5 tasks + 25/45/60 min timer) | ✅ Done |
| Quick Check-in, 11:11 Reset, 22:22 Builder Check, 3-3-3 Reset | ✅ Done |
| Night Review | ✅ Done |
| Vision & Goals (12mo → 90d → 30d → weekly → today) | ✅ Done |
| Money Dashboard + reverse-engineering revenue calculator | ✅ Done |
| CRM Pipeline (leads, stages, stats) | ✅ Done |
| College Outreach Tracker | ✅ Done |
| Habit Tracker | ✅ Done |
| Evidence Log + Timeline | ✅ Done |
| Weekly & Monthly Review + trend charts (Recharts) | ✅ Done |
| Rule-based positive coaching engine (no AI API needed) | ✅ Done |
| Student Mode vs Founder Mode | ✅ Done |
| Onboarding → auto-builds goal chain | ✅ Done |
| Seed data + demo account | ✅ Done |
| Chrome Extension (Manifest V3: popup + new-tab override) | ✅ Done, tested in Chromium |
| Android project (Capacitor, wraps the same web app) | ✅ Scaffolded & verified configuring correctly |
| Signed/installable APK file | ⚠️ **Not built in this environment** — see note below |

### About the Android APK

The Capacitor Android project is fully generated and verified to **configure and resolve correctly** with Gradle (AGP + dependencies resolve, `./gradlew tasks` succeeds). Actually compiling `assembleDebug` requires the **Android SDK** (platform + build tools), which is not installable in this sandboxed environment. This is a one-time local step — see [Android build instructions](#android-app-capacitor) below. Nothing about the app itself is unfinished; this is purely a "needs Android Studio installed on a real machine" limitation.

---

## Monorepo structure

```
/apps
  /web         React + Vite + TypeScript + Tailwind (the main product)
  /extension   Chrome Extension, Manifest V3 (popup + new-tab)
  /mobile      Capacitor wrapper that packages /apps/web into Android
/packages
  /types       Shared TypeScript types (User, Goal, Lead, MoneyEntry, ...)
  /shared      Shared logic: rule-based coaching engine, money/progress calculations
  /ui          Shared React UI primitives (Card, ProgressBar, ScoreCircle, Pill...) + design tokens CSS
/server
  /src
    /routes    One file per resource (auth, goals, morning, night, leads, colleges, money, habits, evidence, tasks, reviews, dashboard)
    /db        SQLite connection, migration runner, seed script
    /migrations  Versioned .sql migration files
```

The web app, the Chrome extension, and (by wrapping the web app directly) the Android app all share the same `@mecrm/types`, `@mecrm/shared`, and `@mecrm/ui` packages — one design system, one set of business rules, three delivery surfaces.

---

## Tech stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, Recharts, Lucide React
- **Backend:** Node.js, Express, TypeScript
- **Database:** SQLite (via `better-sqlite3`), hand-rolled versioned SQL migrations
- **Auth:** Email + password, bcrypt password hashing, JWT sessions
- **Android:** Capacitor (wraps the web build)
- **Chrome:** Manifest V3 extension (Vite build)

---

## 1. Local setup (web app + API)

Requires Node.js 18+.

```bash
# from the repo root
npm install

# configure the server (optional — sensible defaults exist)
cp server/.env.example server/.env
# edit server/.env if you want to change the JWT secret, port, or CORS origin

# create the SQLite database + demo account with realistic sample data
npm run seed

# run the API (http://localhost:4000) and the web app (http://localhost:5173) together
npm run dev
```

Then open **http://localhost:5173** and either:

- Sign up as a new Founder or Student account (you'll go through onboarding), or
- Click **"Use Demo Account"** on the login screen (`demo@manifestcrm.app` / `Demo@1234`) to explore with realistic seeded data — leads, a college pipeline, goals, money entries, habits, evidence, and a completed morning/night cycle from "yesterday".

Run each app individually if you prefer two terminals:

```bash
npm run dev:server   # API on :4000
npm run dev:web      # Web app on :5173 (proxies /api to :4000)
```

### Production build

```bash
npm run build:server   # -> server/dist/index.js (run with `node dist/index.js` from server/)
npm run build:web      # -> apps/web/dist (any static host / reverse-proxied behind the API)
```

Set real environment variables in production — **never** ship the default `JWT_SECRET`.

---

## 2. Chrome Extension build & install instructions

The extension talks to the same API as the web app (`http://localhost:4000` by default — see `apps/extension/manifest.json`'s `host_permissions` if you deploy the API elsewhere and need to add that origin).

```bash
npm run build:extension    # apps/extension/dist is ready to load
```

To load it in Chrome:

1. Make sure the API server is running (`npm run dev:server`, or your deployed API).
2. Open `chrome://extensions`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select `apps/extension/dist`.
5. Click the extension icon, sign in with the same account you use on the web app (or the demo account).
6. Open a new browser tab — it now opens straight into "What are we creating today?" with your Big 3, top goal, a focus timer, and a link back to the full dashboard.

If your API is not on `http://localhost:4000`, add its origin to `host_permissions` in `apps/extension/manifest.json` before building, and rebuild.

---

## 3. Android app (Capacitor)

The Android app is the same web app, wrapped natively so it can be distributed as an installable APK. Bottom navigation (Home / Focus / Goals / CRM / Me) and touch-friendly controls are already built into the web app's mobile layout, so no separate mobile UI was needed.

### Prerequisites (on your machine, not in this sandbox)

- [Android Studio](https://developer.android.com/studio) (installs the Android SDK + an emulator for you), **or** the Android command-line tools + `ANDROID_HOME` set up manually.
- JDK 17 (Android Studio bundles one).

### Build steps

```bash
# 1. Build the web app
npm run build --workspace=apps/web

# 2. Copy the web build into the Capacitor project and sync native dependencies
npm run sync --workspace=apps/mobile

# 3a. Open in Android Studio (recommended — lets you run on an emulator/device and click "Build > Build APK")
npm run open:android --workspace=apps/mobile

# 3b. OR build a debug APK directly from the command line (needs ANDROID_HOME set)
npm run build:apk --workspace=apps/mobile
# -> apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

The debug APK from step 3b is directly installable on a device (`adb install app-debug.apk`) or emulator. For a Play Store-ready **AAB**, use Android Studio's **Build > Generate Signed Bundle / APK** with your own signing key — this repo intentionally does not include a production keystore.

Re-run steps 1–2 any time you change the web app, before rebuilding the APK.

---

## Demo account

```
Email:    demo@manifestcrm.app
Password: Demo@1234
```

Seeded with realistic (not-yet-achieved) numbers: a monthly revenue target of ₹8,00,000 against ₹20,000 earned so far, a college outreach pipeline, a CRM with won/lost/in-progress leads, habits with a partial streak, evidence log entries, and one completed morning/night cycle — enough to see every screen with real data without anything being falsely marked "achieved."

Re-seed at any time (idempotent — skips if the demo account already exists):

```bash
npm run seed
```

To start over completely, delete `server/data/mecrm.sqlite*` and re-run `npm run seed`.

---

## Design system

Maximum white space, one accent color, large bold numbers, generous rounded corners, and constructive microcopy — see `packages/ui/src/styles.css` for the shared primitives (`.card`, `.btn-primary`, `.input-field`, `.progress-track`) and `apps/web/tailwind.config.js` for the color tokens (`primary #16A34A`, `soft background #F7FAF8`, `ink #111827`, etc). The Chrome extension reuses the exact same tokens and components.

The app never says "you failed." Missed days, low scores, and broken streaks are always reframed as the next available action (see `packages/shared/src/coaching.ts` for the full rule-based coaching engine).

---

## What's next (not built yet)

- An actual compiled `.apk`/`.aab` file (needs Android Studio/SDK on a real machine — see above).
- Push notifications / native reminders on Android.
- A hosted production deployment (this repo is local-first; deploying the API + web app to your own server/host is a normal Node.js + static-site deploy — nothing in the code is tied to localhost besides default config values).
- An AI-assisted coaching layer — the current coaching engine is intentionally rule-based per the v1 spec so it works with zero external API keys or cost.

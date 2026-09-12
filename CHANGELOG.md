# Changelog

## v1.0.0 — Initial Release

**Manifestation & Execution CRM** — a simple, bold, fast, positive, mobile-friendly personal operating system that turns vision into daily execution and daily execution into measurable evidence.

### Core Manifestation Routines
- Morning Routine: gratitude ×3, future-self reflection, manifestation statement, 3-6-9 practice, 60–90s visualization, Today's Big 3, Money-Making Move, Courage Action, and a 4-part morning score (Clarity/Energy/Confidence/Focus).
- Night Review: business win, money win checklist, personal win, evidence, lesson, release, and tomorrow's #1 priority.
- Quick Check-in, 11:11 Reset, 22:22 Builder Check, and 3-3-3 Reset rituals.

### Goal Dashboard
- Vision → 12-Month → 90-Day → 30-Day → Weekly → Today hierarchy for every goal.
- Explicit Target / Current / Gap / Next Milestone on every goal card.
- Onboarding auto-generates the first goal chain from the user's 12-month vision.

### Money
- Revenue, expense, profit, savings, and investment tracking with monthly totals.
- Target / Current / Gap per money goal, in the user's chosen currency.
- Reverse-engineering revenue calculator ("I want to make ₹X — model how").

### CRM
- Simple lead pipeline (New Lead → Contacted → Conversation → Follow-up → Proposal → Won/Lost).
- Pipeline value, potential revenue, won revenue, follow-ups today, and overdue follow-ups at a glance.

### College Outreach
- Dedicated outreach tracker with its own stage pipeline and a configurable daily contact target.

### Habits, Evidence, Reviews
- Simple checkmark habit tracking (last 7 days).
- Evidence log with categories and a timeline.
- Weekly review (numbers + wins/misses/lessons/bottleneck/next goal/stop-start-continue) and monthly review with Recharts trend charts.

### Founder Mode & Student Mode
- One account, two experiences: Founder Mode shows Money/CRM/College Outreach; Student Mode hides them and uses career-oriented onboarding language.

### Settings
- Editable name, account type, currency (INR/USD), configurable daily outreach target, morning/night reminder preferences, and one-click data export (full JSON dump, or CSV for leads/money/evidence).

### Platforms
- **Web**: React + Vite + TypeScript + Tailwind, responsive from 390px to desktop.
- **Chrome Extension** (Manifest V3): popup with today's focus/Big 3/quick capture/gratitude, and a new-tab override.
- **Android**: Capacitor project wrapping the same web app, with the standard bottom navigation (Home/Focus/Goals/CRM/Me).

### Backend
- Node.js + Express + TypeScript + SQLite, JWT + bcrypt auth, versioned migrations, seed data with a realistic demo account, and a 53-check HTTP smoke test covering every endpoint plus cross-user isolation and malformed-input handling.

### Fixed during release QA
- Auth session no longer gets silently cleared when the server is briefly unreachable (was treating any network error the same as an invalid token).
- Horizontal overflow on Focus/CRM/Goals at phone widths (a flex `min-width: auto` issue affecting any page with a horizontally-scrollable pill row).
- Empty states across CRM, College Outreach, Goals, Money, Evidence, and Habits rewritten to be forward-looking rather than flatly stating "no data."

### Known limitations (by design for v1)
- No push/email delivery for morning/night reminders yet (the preference is stored and ready to wire up).
- No AI-assisted coaching — the coaching engine is intentionally rule-based so it needs no external API or cost.
- No production deployment included — this is a local-first app; hosting is a standard Node.js + static-site deploy.
- No compiled Android APK in this repository — the Capacitor project is complete and verified to configure correctly with Gradle; producing the actual `.apk`/`.aab` requires Android Studio/SDK on a real machine (see README).

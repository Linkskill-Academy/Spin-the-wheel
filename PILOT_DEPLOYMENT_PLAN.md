# Pilot Deployment Plan

This document distinguishes two very different setups. Do not confuse them —
the current app works great for the first, and is **not** ready for the second
without additional infrastructure.

## LOCAL PILOT (ready today)

**What it is:** you run the backend on your own Windows laptop; the Android
app (or web browser) connects to it over the same Wi-Fi network.

**Who it works for:** you personally, and anyone testing in person while
physically on your home/office network, for a short session.

**Architecture:**
- Node + Express + better-sqlite3, single process, single file DB (`server/data/mecrm.sqlite`)
- Backend listens on all interfaces (`app.listen(PORT, ...)` binds `0.0.0.0` by default) on port 4000
- Web app built with `VITE_API_URL` pointed at your laptop's LAN IPv4 address (see `apps/web/.env.mobile`)
- Android app packaged via Capacitor, cleartext HTTP permitted only to that specific LAN IP (`apps/mobile/android/app/src/main/res/xml/network_security_config.xml`)

**Requirements to actually use it:**
1. Laptop and phone on the same Wi-Fi network.
2. Backend running (`npm run dev --workspace=server` or the built `server/dist/index.js`).
3. Windows Firewall allows inbound connections to the Node process on the LAN profile (see below).
4. Laptop's LAN IP hasn't changed since the APK was built (DHCP can reassign it — rebuild if so).

**Limitations (real, not hidden):**
- **Single point of failure**: if the laptop sleeps, closes, or leaves the network, the app stops working for everyone.
- **Not multi-network**: a student on cellular data or a different Wi-Fi network cannot reach the backend at all.
- **Not multi-user at scale**: SQLite is fine for a handful of concurrent users but isn't a hosted, always-on service.
- **Plain HTTP**: traffic between phone and laptop is unencrypted (acceptable for a same-room pilot, not for real user data over time).
- **IP drift**: the API URL is baked into the APK at build time; a new laptop IP means a new build.

## REMOTE STUDENT PILOT (not ready — here's the gap)

**What it is:** students install the APK on their own phones, on their own
networks, with no dependency on your laptop being on and reachable.

**What's missing today:**
1. **A hosted backend.** The Node/Express server needs to run somewhere with a stable public address — a small VM or PaaS (Render, Railway, Fly.io, a $5-6/mo VPS) is enough for pilot-scale traffic. This is the main gap; nothing in the current code prevents deploying it this way, it simply hasn't been deployed.
2. **A durable database.** `better-sqlite3` on a single VM's disk is workable for a small pilot as long as the host has persistent storage (most PaaS free/hobby tiers wipe local disk on redeploy) — plan for either a persistent volume or a swap to a small hosted Postgres if that's a concern.
3. **HTTPS.** A public backend needs a real TLS certificate (Let's Encrypt via the host, or the PaaS's built-in HTTPS) so Android's default cleartext-blocking behavior doesn't need any exceptions at all — this also removes the `network_security_config.xml` cleartext allowance entirely.
4. **Environment variables for production:**
   - `server/.env`: `JWT_SECRET` set to a real random secret (never the example placeholder), `CORS_ORIGIN` set to the real origins (web domain + `https://localhost` for the Android app, or left as `*` only if you're comfortable with that), `PORT` per host requirements, `DATABASE_PATH` pointed at persistent storage.
   - `apps/web/.env.mobile`: `VITE_API_URL` set to the hosted backend's `https://` URL, then rebuild the APK (`npm run build:apk --workspace=apps/mobile`).
   - Chrome extension: its API base URL (`apps/extension/src/lib/storage.ts` → `getServerUrl()`) is user-configurable at runtime already, so it just needs students to be told the hosted URL — no rebuild required there.
5. **Distribution.** Sideloading a debug APK to multiple students is manageable for a handful of people (share the file directly) but doesn't scale much past that — a signed release build and/or Play Store internal testing track is the natural next step if the pilot grows.

**Summary of the swap when moving from local → remote:**

| Piece | Local pilot | Remote pilot |
|---|---|---|
| Backend host | Your laptop | Hosted VM/PaaS |
| Protocol | HTTP (LAN only) | HTTPS |
| `VITE_API_URL` | `http://<laptop LAN IP>:4000` | `https://<your-domain>` |
| Android cleartext config | Required (dev only) | Removed |
| Database | Local SQLite file | Persistent-volume SQLite, or hosted Postgres |
| `JWT_SECRET` / `CORS_ORIGIN` | Defaults are fine | Must be set explicitly |

## Windows Firewall note (local pilot only)

Rather than disabling the firewall, add one narrow inbound rule for the Node
process's port:

```powershell
New-NetFirewallRule -DisplayName "MECRM Backend (dev)" -Direction Inbound -Protocol TCP -LocalPort 4000 -Action Allow -Profile Private
```

This allows only TCP port 4000 on the **Private** network profile (home/office Wi-Fi), not Public networks, and can be removed after the pilot with `Remove-NetFirewallRule -DisplayName "MECRM Backend (dev)"`.

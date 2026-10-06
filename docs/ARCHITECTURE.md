# Architecture

## Overview

USAS Class Timetable is a single-page application built with **React 18**, **TypeScript**, **Vite** and **Tailwind CSS**, shipped as an installable **PWA**. Student data is fetched from the official USAS UMC API through a stateless **Cloudflare Pages Function** proxy.

## High-level flow

```text
Browser (React SPA)
  │  fetch /api/usas/*        (same origin; CSP connect-src 'self')
  ▼
Cloudflare Pages Function      functions/api/usas/_middleware.ts
  │  • verifies Cloudflare Turnstile on login (when configured)
  │  • strips the one-time x-turnstile-token header
  │  • enforces the endpoint allowlist
  ▼
https://mobile.usas.edu.my/umc_v2   (official USAS UMC API)
```

## Why a proxy

- The USAS API is not CORS-enabled for browsers.
- The Turnstile **secret key** must stay server-side.
- All outbound endpoints are allowlisted in `src/shared/lib/usasProxy.ts`.
- The proxy never persists credentials or session tokens.

## Authentication

1. `LoginForm` renders a Cloudflare Turnstile widget; the token is passed to `AuthProvider.login(userId, password, false, captchaToken)`.
2. `loginStudentAPI` POSTs to `/api/usas/student/login_student.php` with the `x-turnstile-token` header.
3. The Pages Function verifies the token via `siteverify` (when `TURNSTILE_SECRET_KEY` is set) and then proxies the request upstream.
4. On success, `sid_1`/`sid_2`/`sid_3` are stored in `sessionStorage` and the timetable is cached in `localStorage`.
5. Login throttling state lives in `sessionStorage`.

## Data layer

- `src/services/usas/Api.ts` is the single integration point: payload builders, response parsing, field mapping, sanitization and error handling.
- `postUSASOutcome` distinguishes a **network failure** from an **invalid response**, so the UI can show friendly messages and fall back to cached data.

## State management

- Providers: `ThemeProvider`, `AuthProvider`, `NotificationProvider`, `LanguageProvider`.
- `AuthProvider` owns the session, the cached timetable, the login throttle and connectivity (`isOffline`).

## Third parties

- **Prayer times**: `https://api.waktusolat.app/v2/solat/<zone>` (JAKIM), called directly from the client.
- **Cloudflare Turnstile**: bot protection on login.
- **Sentry** (optional): client error tracking, enabled by `VITE_SENTRY_DSN`.

## Monitoring

- The Pages Function logs `console.warn` for captcha rejections, rate-limit hits and upstream errors (visible in Cloudflare Functions logs / `wrangler pages deployment tail`).
- `.github/workflows/api-schema-check.yml` runs `scripts/check-usas-schema.mjs` daily to detect upstream schema drift.
- Cloudflare Web Analytics (traffic) and optional Sentry (errors).

## Project layout

```text
functions/api/usas/   Cloudflare Pages Function proxy
src/app/              Providers, shell (Navbar, ToolsDrawer), routing & SEO
src/features/         auth, export, landing, planning, sharing, timetable, pwa
src/services/         USAS API client and JAKIM prayer-time client
src/shared/           i18n, types, and reusable libraries (security, cache, time)
src/styles/           Tailwind entry & global styles
scripts/              Tooling (e.g. schema monitor)
tests/                Vitest unit suites & Playwright e2e specs
```

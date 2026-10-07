# USAS Class Timetable

![CI](https://github.com/zis3c/USAS-Class-Timetable/actions/workflows/ci.yml/badge.svg)
![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?logo=tailwindcss&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Ready-orange?logo=pwa&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg)

<p align="center">
  <img src="./public/usas-logo-dark.png" alt="USAS Logo" width="100px">
</p>

USAS Class Timetable is a modern, client-side academic schedule portal designed for Universiti Sultan Azlan Shah (USAS) students. Built on React 18, TypeScript, and Vite with custom glassmorphism styling, it enables students to fetch, view, and export their class timetables directly into standard calendar feeds (.ICS), official A4 printable PDF documents, and high-resolution device lockscreen wallpapers.

> [!NOTE]
> Student login requests pass through a stateless Cloudflare Pages Function before reaching the official USAS UMC API. The app does not keep a project database, but the browser stores the session for the current tab and a timetable cache on the device. See the [Privacy Notice](docs/PRIVACY.md) for data flow and storage details.

## Core Features & Capabilities

* **University API Integration**: Connects to official USAS UMC portal endpoints through the Cloudflare Pages Function proxy.
* **Document & Wallpaper Exports**:
  * **Print-Ready A4 PDF & PNG**: High-resolution landscape documents formatted with student matric identity, course codes, locations, and timestamps.
  * **Device Lockscreen Wallpapers**: Tailored presets for Phone (9:16), Tablet (4:3), Desktop (16:9), and Square (1:1) with vertical clock offset adjustment and 5 color themes.
* **Live Schedule Tracking**:
  * **Live Next Class Card**: Real-time widget highlighting the current ongoing lecture or countdown timer to the next session.
  * **Clash Detection**: Automated detection and warning flags for overlapping course hours.
  * **Attendance Meter**: Visual percentage tracker monitoring course attendance thresholds against the 80% bar risk limit.
  * **GPA Target Calculator**: Interactive tool for simulating semester GPA and cumulative CGPA goals.
  * **Lecturer Directory Lookup**: Tap a lecturer to load their official e-mail, position and extension from the USAS staff directory.
* **Calendar Sync & Social Sharing**:
  * **Universal .ICS Export**: One-click calendar sync compatible with Google Calendar, Apple iCal, and Microsoft Outlook.
  * **WhatsApp & QR Share**: Instant timetable dispatch via formatted messaging or scannable QR codes.
* **Multi-Language & Theme Support**:
  * **4 Supported Languages**: English (Default), Bahasa Melayu, Simplified Chinese (简体中文), and Tamil (தமிழ்).
  * **5 Color Themes**: Dark Theme (Default), Light Theme, OLED Pure Black, Islamic Emerald Green, and Warm Amber.

## Secure by Design

Because the portal processes student academic schedules, security and privacy are implemented at every layer:

* **Stateless API Proxy**: Requests pass through a Cloudflare Pages Function to `https://mobile.usas.edu.my`. The app code does not write credentials or sessions to a project database or function logs.
* **Server-Side Bot Protection**: When `TURNSTILE_SECRET_KEY` is configured, the Pages Function verifies the login challenge before proxying the request.
* **Content Security Policy (CSP)**: Restricts script, frame, and connection sources to reduce injection and framing risks.
* **Browser Storage**: The session is kept in `sessionStorage`; the timetable cache and preferences use `localStorage`. These remain on the device until logout or browser storage is cleared. See the [Privacy Notice](docs/PRIVACY.md).

## Tech Stack

**Frontend**
- [React 18](https://react.dev/)
- [TypeScript 5](https://www.typescriptlang.org/)
- [Vite 5](https://vitejs.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Lucide React](https://lucide.dev/)
- [Lenis](https://lenis.darkroom.engineering/)

**Document & Media Engines**
- [jsPDF](https://github.com/parallax/jsPDF)
- [html2canvas](https://html2canvas.hertzen.com/)
- [QRCode](https://github.com/soldair/node-qrcode)

**Backend & Hosting**
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/) (API proxy & Turnstile verification)
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/)

**Testing & Quality Assurance**
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)
- [ESLint](https://eslint.org/)

**Monitoring**
- [Sentry](https://sentry.io/) (optional client error tracking)

## Getting Started

> **Detailed Setup Guide**: For comprehensive environment configuration, proxy setups, and production deployments, see our [Installation Guide](docs/INSTALLATION.md).

Follow these quick steps to get a local development copy running.

### Prerequisites

* Node.js >= 18.x (v20+ recommended)
* NPM >= 9.x (or pnpm / yarn)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/zis3c/USAS-Class-Timetable.git
   cd "USAS Class Timetable"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   > **Real API login:** `npm run dev` serves the UI (and demo mode) only. The `/api/usas` proxy is a Cloudflare Pages Function, so run `npm run dev:cf` to exercise real USAS API calls locally.

4. **Run unit tests and type checks**
   ```bash
   npm run typecheck
   npm run test:unit
   ```

## Project Structure

```text
USAS Class Timetable/
├── .github/
│   └── workflows/
│       ├── ci.yml             # GitHub Actions CI workflow (lint, typecheck, unit, e2e)
│       ├── deploy.yml         # Cloudflare Pages deployment workflow
│       └── api-schema-check.yml # Scheduled USAS API schema monitor
├── docs/                      # Installation, architecture, API reference & policies
├── public/
│   ├── 404.html               # Branded standalone 404 error page
│   ├── 500.html               # Branded standalone 500 error page
│   ├── 502.html               # Branded standalone 502 error page
│   ├── 503.html               # Branded standalone 503 error page
│   ├── 504.html               # Branded standalone 504 error page
│   ├── _headers               # Cloudflare Pages security & cache headers
│   ├── error.css              # Glassmorphic error pages stylesheet
│   ├── error-page.js          # Error page hydration script
│   ├── sw.js                  # PWA offline service worker
│   ├── usas-logo-dark.png     # Dark theme logo
│   ├── usas-logo-light.png    # Light theme logo
│   └── usas-logo.png          # Dark theme compatibility asset
├── functions/
│   └── api/usas/
│       └── _middleware.ts     # Cloudflare Pages Function proxy to the USAS API (Turnstile gate)
├── src/
│   ├── app/
│   │   ├── main.tsx           # Application entrypoint
│   │   ├── App.tsx            # Main shell, routing & SEO metadata
│   │   ├── providers/         # Auth, Language & Theme state providers
│   │   └── shell/             # Navbar, ToolsDrawer, ErrorBoundary
│   ├── features/
│   │   ├── auth/              # Login form, LoginPage, TurnstileCaptcha
│   │   ├── export/            # PdfExportModal, PDF & wallpaper engines
│   │   ├── landing/           # LandingPage (hero, 3D tilt, bento features)
│   │   ├── planning/          # ExamScheduleModal, GpaCalculatorModal
│   │   ├── sharing/           # Schedule comparison & sharing (CompareScheduleModal)
│   │   └── timetable/         # TimetableGrid, LiveNextClass, AttendanceMeter
│   ├── shared/
│   │   ├── i18n/              # Multi-language dictionaries (en, ms, zh, ta)
│   │   ├── lib/               # Storage, caching, time parsing, audio chimes
│   │   └── types/             # TypeScript data contracts & interfaces
│   └── styles/
│       └── index.css          # Tailwind base & custom scrollbar styles
├── tests/                     # Vitest unit test suites & Playwright e2e specs
├── index.html                 # Root HTML shell with CSP & SEO metadata
├── vite.config.ts             # Vite build & plugin configurations
└── package.json               # Dependencies and build scripts
```

## Documentation

| Document | Description |
| :--- | :--- |
| [Installation Guide](docs/INSTALLATION.md) | Local setup, environment variables, deployment & monitoring. |
| [Architecture](docs/ARCHITECTURE.md) | How the SPA, proxy, auth and data layers fit together. |
| [API Reference](docs/API.md) | Reverse-engineered USAS UMC endpoints & schemas. |
| [Changelog](docs/CHANGELOG.md) | Release history. |
| [Contributing](docs/CONTRIBUTING.md) | How to contribute. |
| [Code of Conduct](docs/CODE_OF_CONDUCT.md) | Community expectations. |
| [Security Policy](docs/SECURITY.md) | How to report vulnerabilities. |
| [Privacy Notice](docs/PRIVACY.md) | Data flow, browser storage, and third-party services. |

## Contributing

We welcome contributions from the community! Please read our [Contributing Guidelines](docs/CONTRIBUTING.md) to get started. By participating in this project, you agree to abide by our [Code of Conduct](docs/CODE_OF_CONDUCT.md).

## Security

If you discover any security-related issues, please refer to our [Security Policy](docs/SECURITY.md) for information on how to responsibly disclose vulnerabilities.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

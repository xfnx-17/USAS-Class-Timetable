# USAS Class Timetable Installation Guide

Welcome to the detailed installation guide for the **USAS Class Timetable** portal, developed by the USAS STEM Club. This document will walk you through setting up the project for both **local development** and **production deployment**.

---

## Prerequisites

Before you begin, ensure your system meets the following requirements:

### Frontend Environment
* **Node.js**: `v18.x` or higher (v20+ recommended)
* **NPM**: `v9.x` or higher (or `pnpm` / `yarn`)
* **Modern Web Browser**: Google Chrome, Mozilla Firefox, Apple Safari, or Microsoft Edge.

---

## Local Development Setup

Follow these steps to get a full development environment running on your local machine.

### 1. Clone the Repository
Clone the project and navigate into the application directory:
```bash
git clone https://github.com/zis3c/USAS-Class-Timetable.git
cd "USAS Class Timetable"
```

### 2. Install Dependencies
Install the required Node.js packages:
```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the project root with the Cloudflare Turnstile **Site Key** (public):

```env
VITE_TURNSTILE_SITE_KEY=0x4AAAAAA...
```

The login captcha is verified server-side by the Pages Function, which needs the Turnstile **Secret Key**. For local testing create a `.dev.vars` file in the project root (already gitignored):

```env
TURNSTILE_SECRET_KEY=0x4AAAAAA...
```

> Without `TURNSTILE_SECRET_KEY`, the server-side captcha check is skipped (convenient for UI-only work). Cloudflare's testing site key `1x00000000000000000000AA` always passes on the client widget.

Optionally enable client error tracking by adding a Sentry DSN:

```env
VITE_SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>
```

### 4. Start Development Server

Launch the Vite development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

Open your browser at `http://localhost:5173`.

> `npm run dev` serves the Vite UI only (plus demo mode). Because the `/api/usas/*` requests are handled by a Cloudflare Pages Function, run **`npm run dev:cf`** to exercise real USAS API calls locally.

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server (UI/demo only). |
| `npm run dev:cf` | Builds and serves the app with Cloudflare Pages Functions (real API + captcha). |
| `npm run build` | Compiles and optimizes assets into `dist/` for production. |
| `npm run preview` | Previews the production bundle locally. |
| `npm run preview:cf` | Builds and previews with Cloudflare Pages Functions. |
| `npm run deploy:cf` | Builds and deploys to Cloudflare Pages via Wrangler. |
| `npm run lint` | Runs ESLint across the repository. |
| `npm run typecheck` | Executes TypeScript type checking without emitting files. |
| `npm run test:unit` | Executes all unit test suites using Vitest. |
| `npm run test:e2e` | Executes Playwright end-to-end browser integration tests. |
| `npm run test:strict` | Runs linter, typecheck, unit tests, and production build in sequence. |

---

## Production Deployment

The build output consists of static HTML, CSS, and JavaScript files generated in `dist/`.

### Building for Production
```bash
npm run build
```

### Deploying to Cloudflare Pages

The `/api/usas/*` proxy and captcha verification run as Cloudflare Pages Functions, so Cloudflare Pages is the recommended host.

1. Connect your repository in the Cloudflare Pages dashboard (or deploy with `npm run deploy:cf`).
2. Build command: `npm run build`.
3. Output directory: `dist`.
4. Add environment variables under **Settings → Environment variables** (Production and Preview):
   - `VITE_TURNSTILE_SITE_KEY` — Turnstile Site Key (public, baked into the build).
5. Add the Turnstile Secret Key as an encrypted secret:
   ```bash
   npx wrangler pages secret put TURNSTILE_SECRET_KEY --project-name=<your-project>
   ```
6. The included `public/_headers` file automatically configures Content Security Policy (CSP) and cache headers.

#### Automated deployment (GitHub Actions)

The bundled `.github/workflows/deploy.yml` deploys on every push to `main`. Add these repository secrets (**Settings → Secrets and variables → Actions**):

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `VITE_TURNSTILE_SITE_KEY`

### Deploying to Vercel / Netlify

Both hosts can serve the static `dist/` output. However, real API login depends on the Cloudflare Pages Function proxy (`/api/usas/*`) and its server-side Turnstile check, which are Cloudflare-specific. On Vercel or Netlify you must supply an equivalent serverless function that proxies `/api/usas/*` to the USAS API and verifies the Turnstile token.

- **Vercel**: Framework Preset **Vite**, Output Directory `dist`.
- **Netlify**: Build command `npm run build`, Publish directory `dist`.

---

## Rate Limiting & Monitoring

### API rate limiting

Login abuse is mitigated by server-side Cloudflare Turnstile verification. Cloudflare Pages Functions do not support Worker rate-limiting bindings, and the app's custom domain does not need to be hosted on Cloudflare DNS.

If your domain is proxied through Cloudflare, you can add an additional edge limit via **Security → WAF → Rate limiting rules** matching `/api/usas/*`.

### Monitoring

- **Traffic & Web Vitals**: Cloudflare dashboard → **Web Analytics** → enable for the Pages project (privacy-first, cookieless).
- **Function logs & errors**: the proxy emits `console.warn` entries for captcha rejections, rate-limit hits and upstream failures. View them live with:
  ```bash
  npx wrangler pages deployment tail --project-name=<your-project>
  ```
  or via the Pages project → **Functions → Logs** in the dashboard.
- **Client error tracking (optional)**: the app initialises Sentry automatically when `VITE_SENTRY_DSN` is set.
  1. Create a Sentry project (platform **React**) and copy its DSN.
  2. Set `VITE_SENTRY_DSN` in `.env` (local), Cloudflare Pages environment variables, and the GitHub Actions secret `VITE_SENTRY_DSN`.
  3. The Sentry ingest hosts are already allowed in the Content Security Policy.

import * as Sentry from '@sentry/react';

// Initialises Sentry only when a DSN is provided via VITE_SENTRY_DSN, so the
// app runs unchanged without error tracking configured.
export function initMonitoring(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
  });
}

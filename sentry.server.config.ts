// Sentry for server-side code (API routes, server components). DSN is public by design.
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://d4f2b770242e88a2a92de3ad039f318c@o4512196028727296.ingest.us.sentry.io/4512196032724992',
  enabled: process.env.NODE_ENV === 'production',
  // Sample 10% of requests for performance data — stays within the free plan
  tracesSampleRate: 0.1,
});

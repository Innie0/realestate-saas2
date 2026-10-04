// Sentry for edge runtime code (middleware). DSN is public by design.
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://d4f2b770242e88a2a92de3ad039f318c@o4512196028727296.ingest.us.sentry.io/4512196032724992',
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: 0.1,
});

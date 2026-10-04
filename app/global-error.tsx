'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

/** Last-resort error page; reports crashes that escape every other boundary. */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Something went wrong</h1>
        <p style={{ color: '#555', marginTop: '0.5rem' }}>
          We&apos;ve been notified. Please refresh the page or try again in a moment.
        </p>
      </body>
    </html>
  );
}

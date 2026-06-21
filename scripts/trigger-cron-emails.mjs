#!/usr/bin/env node
/**
 * Manually run the lead follow-up email cron (same logic as Vercel Cron).
 * Usage: node --env-file=.env.local scripts/trigger-cron-emails.mjs
 */

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const cronSecret = process.env.CRON_SECRET;

async function main() {
  const headers = cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {};

  const res = await fetch(`${appUrl}/api/cron/emails`, {
    method: 'POST',
    headers,
  });

  const data = await res.json().catch(() => ({}));
  console.log('Status:', res.status);
  console.log(JSON.stringify(data, null, 2));

  if (!res.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { rejectUnauthorizedCron } from '@/lib/cron-auth';
import { processEmailSequences } from '@/lib/process-email-sequences';
import { processLeadSequenceSteps } from '@/lib/lead-sequences/process';
import { processSignupNudges } from '@/lib/signup-nudge-email';

async function handleCron(request: NextRequest) {
  const denied = rejectUnauthorizedCron(request);
  if (denied) return denied;

  try {
    const legacy = await processEmailSequences();
    const sequences = await processLeadSequenceSteps();
    // Separate try so a problem here never blocks agents' lead emails
    let nudges = { sent: 0, failed: 0 };
    try {
      nudges = await processSignupNudges();
    } catch (err) {
      console.error('[Cron/Emails] Signup nudge error:', err);
    }
    console.log(
      `[Cron/Emails] Legacy sent ${legacy.processed}, sequences emails ${sequences.emailsSent}, tasks ${sequences.tasksCreated}, failed ${legacy.failed + sequences.failed}, signup nudges ${nudges.sent}`,
    );
    return NextResponse.json({ success: true, legacy, sequences, nudges });
  } catch (err) {
    console.error('[Cron/Emails] Error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/** Vercel Cron (GET) */
export async function GET(request: NextRequest) {
  return handleCron(request);
}

/** Manual trigger for testing (POST + CRON_SECRET) */
export async function POST(request: NextRequest) {
  return handleCron(request);
}

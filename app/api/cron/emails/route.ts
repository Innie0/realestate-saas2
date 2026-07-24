// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { rejectUnauthorizedCron } from '@/lib/cron-auth';
import { processEmailSequences } from '@/lib/process-email-sequences';
import { processLeadSequenceSteps } from '@/lib/lead-sequences/process';

async function handleCron(request: NextRequest) {
  const denied = rejectUnauthorizedCron(request);
  if (denied) return denied;

  try {
    const legacy = await processEmailSequences();
    const sequences = await processLeadSequenceSteps();
    console.log(
      `[Cron/Emails] Legacy sent ${legacy.processed}, sequences emails ${sequences.emailsSent}, tasks ${sequences.tasksCreated}, failed ${legacy.failed + sequences.failed}`,
    );
    return NextResponse.json({ success: true, legacy, sequences });
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

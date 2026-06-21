// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { rejectUnauthorizedCron } from '@/lib/cron-auth';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function handleCron(request: NextRequest) {
  const denied = rejectUnauthorizedCron(request);
  if (denied) return denied;

  try {
    const now = new Date();

    const { data: pendingReminders, error: fetchError } = await supabaseAdmin
      .from('transaction_reminders')
      .select(`
        id,
        title,
        description,
        reminder_date,
        reminder_type,
        user_id,
        transaction:transactions(
          id,
          property_address,
          buyer_name,
          seller_name,
          status
        )
      `)
      .eq('is_sent', false)
      .eq('is_dismissed', false)
      .lte('reminder_date', now.toISOString());

    if (fetchError) {
      console.error('Error fetching reminders:', fetchError);
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    if (!pendingReminders || pendingReminders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending reminders to process',
        processed: 0,
      });
    }

    const processedReminders = [];
    const errors = [];

    for (const reminder of pendingReminders) {
      try {
        const { error: updateError } = await supabaseAdmin
          .from('transaction_reminders')
          .update({
            is_sent: true,
            sent_at: now.toISOString(),
          })
          .eq('id', reminder.id);

        if (updateError) {
          errors.push({ id: reminder.id, error: updateError.message });
        } else {
          const transaction = Array.isArray(reminder.transaction)
            ? reminder.transaction[0]
            : reminder.transaction;
          processedReminders.push({
            id: reminder.id,
            title: reminder.title,
            user_id: reminder.user_id,
            transaction_address: transaction?.property_address,
          });
        }
      } catch (err: unknown) {
        errors.push({
          id: reminder.id,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    console.log(`[Cron] Processed ${processedReminders.length} reminders, ${errors.length} errors`);

    return NextResponse.json({
      success: true,
      message: `Processed ${processedReminders.length} reminders`,
      processed: processedReminders.length,
      reminders: processedReminders,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: unknown) {
    console.error('Cron reminders error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

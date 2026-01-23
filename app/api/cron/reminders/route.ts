// Cron-like Reminder Scheduler API
// This endpoint processes pending reminders and can be called:
// 1. By a cron job (Vercel cron, external service, etc.)
// 2. Manually for testing
// 3. Client-side polling for basic functionality

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for cron jobs (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/cron/reminders
 * Processes all pending reminders that should be sent
 * Can be called by:
 * - Vercel Cron
 * - External cron service
 * - Client-side polling
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // If CRON_SECRET is set, verify the request
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Allow the request if no secret is set (development mode)
      if (authHeader) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const now = new Date();

    // Fetch all pending reminders that should be sent
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
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    if (!pendingReminders || pendingReminders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending reminders to process',
        processed: 0,
      });
    }

    // Process each reminder
    const processedReminders = [];
    const errors = [];

    for (const reminder of pendingReminders) {
      try {
        // In a production app, you would:
        // 1. Send email notification
        // 2. Send push notification
        // 3. Send SMS
        // For now, we'll just mark them as sent

        // Example: Send email (uncomment and implement with your email service)
        // await sendEmail({
        //   to: userEmail,
        //   subject: reminder.title,
        //   body: `Reminder for ${reminder.transaction?.property_address}: ${reminder.description}`,
        // });

        // Mark reminder as sent
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
          // Handle transaction as array (Supabase returns nested relations as arrays)
          const transaction = Array.isArray(reminder.transaction) ? reminder.transaction[0] : reminder.transaction;
          processedReminders.push({
            id: reminder.id,
            title: reminder.title,
            user_id: reminder.user_id,
            transaction_address: transaction?.property_address,
          });
        }
      } catch (err: any) {
        errors.push({ id: reminder.id, error: err.message });
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
  } catch (error: any) {
    console.error('Cron reminders error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/reminders
 * Manual trigger to process reminders (for testing)
 */
export async function POST(request: NextRequest) {
  // Reuse GET logic
  return GET(request);
}

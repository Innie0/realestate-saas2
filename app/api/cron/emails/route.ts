// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import {
  buildWelcomeEmail,
  buildFollowUp1Email,
  buildFollowUp2Email,
  sendEmail,
} from '@/lib/resend';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      if (authHeader) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
    }

    const supabase = createAdminClient();
    const now = new Date().toISOString();

    const { data: pending, error } = await supabase
      .from('email_sequences')
      .select(`
        id, template, agent_user_id, client_id,
        clients!inner(name, email, lead_type, message)
      `)
      .eq('status', 'pending')
      .lte('send_at', now)
      .limit(50);

    if (error) {
      console.error('[Cron/Emails] Fetch error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!pending || pending.length === 0) {
      return NextResponse.json({ success: true, processed: 0, message: 'No pending emails' });
    }

    let sent = 0;
    let failed = 0;

    for (const row of pending) {
      try {
        const client = Array.isArray(row.clients) ? row.clients[0] : row.clients;
        if (!client?.email) {
          await supabase.from('email_sequences').update({ status: 'cancelled' }).eq('id', row.id);
          continue;
        }

        // Get agent name
        const { data: agentUser } = await supabase.auth.admin.getUserById(row.agent_user_id);
        const agentName = agentUser?.user?.user_metadata?.full_name || 'Your Agent';

        // Parse area from message notes
        const msg = client.message || '';
        const areaMatch = msg.match(/Area:\s*(.+)/i);
        const area = areaMatch ? areaMatch[1].trim() : '';

        const emailData = {
          leadName: client.name,
          leadEmail: client.email,
          agentName,
          leadType: client.lead_type,
          area,
        };

        let email;
        if (row.template === 'welcome') email = buildWelcomeEmail(emailData);
        else if (row.template === 'follow_up_1') email = buildFollowUp1Email(emailData);
        else email = buildFollowUp2Email(emailData);

        await sendEmail(email);
        await supabase.from('email_sequences')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', row.id);
        sent++;
      } catch (err) {
        console.error(`[Cron/Emails] Failed to send ${row.id}:`, err);
        await supabase.from('email_sequences')
          .update({ status: 'failed' })
          .eq('id', row.id);
        failed++;
      }
    }

    console.log(`[Cron/Emails] Sent ${sent}, failed ${failed}`);
    return NextResponse.json({ success: true, processed: sent, failed });
  } catch (err) {
    console.error('[Cron/Emails] Error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

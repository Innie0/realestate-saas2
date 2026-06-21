import { createAdminClient } from '@/lib/supabase-admin';
import {
  buildWelcomeEmail,
  buildFollowUp1Email,
  buildFollowUp2Email,
  sendEmail,
} from '@/lib/resend';

export type ProcessEmailSequencesResult = {
  processed: number;
  failed: number;
  message?: string;
};

export async function processEmailSequences(): Promise<ProcessEmailSequencesResult> {
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
    throw new Error(error.message);
  }

  if (!pending || pending.length === 0) {
    return { processed: 0, failed: 0, message: 'No pending emails' };
  }

  let processed = 0;
  let failed = 0;

  for (const row of pending) {
    try {
      const client = Array.isArray(row.clients) ? row.clients[0] : row.clients;
      if (!client?.email) {
        await supabase.from('email_sequences').update({ status: 'cancelled' }).eq('id', row.id);
        continue;
      }

      const { data: agentUser } = await supabase.auth.admin.getUserById(row.agent_user_id);
      const agentName = agentUser?.user?.user_metadata?.full_name || 'Your Agent';

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
      await supabase
        .from('email_sequences')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', row.id);
      processed++;
    } catch (err) {
      console.error(`[Cron/Emails] Failed to send ${row.id}:`, err);
      await supabase.from('email_sequences').update({ status: 'failed' }).eq('id', row.id);
      failed++;
    }
  }

  return { processed, failed };
}

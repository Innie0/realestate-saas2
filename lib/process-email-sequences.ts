import { createAdminClient } from '@/lib/supabase-admin';
import { resolveAgentReplyEmail } from '@/lib/agent-reply-email';
import { buildFollowupEmail, type FollowupSettings } from '@/lib/followup-emails';
import { sendEmail } from '@/lib/resend';

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

      const { data: agentSettings } = await supabase
        .from('agent_settings')
        .select(`
          profile_email,
          followup_email_1_day, followup_email_2_day, followup_email_3_day,
          followup_email_1_subject, followup_email_1_body,
          followup_email_2_subject, followup_email_2_body,
          followup_email_3_subject, followup_email_3_body
        `)
        .eq('user_id', row.agent_user_id)
        .maybeSingle();

      const agentReplyEmail = resolveAgentReplyEmail({
        profileEmail: agentSettings?.profile_email,
        authEmail: agentUser?.user?.email,
      });

      const msg = client.message || '';
      const areaMatch = msg.match(/Area:\s*(.+)/i);
      const area = areaMatch ? areaMatch[1].trim() : '';

      const context = {
        leadName: client.name,
        leadEmail: client.email,
        agentName,
        agentReplyEmail,
        leadType: client.lead_type,
        area,
      };

      const settings = (agentSettings || null) as FollowupSettings | null;
      const template = row.template as 'welcome' | 'follow_up_1' | 'follow_up_2';
      const email = buildFollowupEmail(template, context, settings);

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

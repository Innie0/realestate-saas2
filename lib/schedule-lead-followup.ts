import { resolveAgentReplyEmail } from '@/lib/agent-reply-email';
import {
  buildFollowupEmail,
  computeFollowupSendAt,
  getFollowupDaySchedule,
  type FollowupSettings,
} from '@/lib/followup-emails';
import { sendEmail } from '@/lib/resend';

type ScheduleLeadFollowupOptions = {
  supabase: {
    from: (table: string) => any;
    auth: { admin: { getUserById: (id: string) => Promise<{ data: { user?: { email?: string; user_metadata?: { full_name?: string } } } }> } };
  };
  clientId: string;
  agentId: string;
  leadName: string;
  leadEmail: string;
  leadType?: string | null;
  area?: string;
  settings: FollowupSettings | null;
  capturedAt?: Date;
};

export async function scheduleLeadFollowupEmails(options: ScheduleLeadFollowupOptions): Promise<void> {
  const {
    supabase,
    clientId,
    agentId,
    leadName,
    leadEmail,
    leadType,
    area,
    settings,
    capturedAt = new Date(),
  } = options;

  const schedule = getFollowupDaySchedule(settings);
  const { data: agentUser } = await supabase.auth.admin.getUserById(agentId);
  const agentName = agentUser?.user?.user_metadata?.full_name || 'Your Agent';
  const agentReplyEmail = resolveAgentReplyEmail({
    profileEmail: (settings as { profile_email?: string | null } | null)?.profile_email,
    authEmail: agentUser?.user?.email,
  });

  const context = {
    leadName,
    leadEmail,
    agentName,
    agentReplyEmail,
    leadType,
    area,
  };

  await supabase.from('email_sequences').insert([
    {
      client_id: clientId,
      agent_user_id: agentId,
      template: 'welcome',
      send_at: computeFollowupSendAt(capturedAt, schedule.welcome),
      status: 'pending',
    },
    {
      client_id: clientId,
      agent_user_id: agentId,
      template: 'follow_up_1',
      send_at: computeFollowupSendAt(capturedAt, schedule.follow_up_1),
      status: 'pending',
    },
    {
      client_id: clientId,
      agent_user_id: agentId,
      template: 'follow_up_2',
      send_at: computeFollowupSendAt(capturedAt, schedule.follow_up_2),
      status: 'pending',
    },
  ]);

  if (schedule.welcome === 0) {
    try {
      const email = buildFollowupEmail('welcome', context, settings);
      await sendEmail(email);
      await supabase
        .from('email_sequences')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('client_id', clientId)
        .eq('template', 'welcome');
    } catch (emailErr) {
      console.error('Welcome email failed:', emailErr);
    }
  }
}

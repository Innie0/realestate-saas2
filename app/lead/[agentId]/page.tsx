// Public lead capture page.
//
// Reachable at /lead/<agentId> OR /lead/<name-slug>--<agentId>.
// No authentication required — this is the link an agent shares publicly.
// A prospect fills out the form and the submission lands in the agent's CRM.

import { createAdminClient } from '@/lib/supabase-admin';
import { hasLeadCaptureAccess } from '@/lib/subscription';
import LeadCaptureForm from '@/components/LeadCaptureForm';
import { SITE_URL } from '@/lib/site-config';

interface LeadPageProps {
  params: Promise<{ agentId: string }>;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Extract the UUID from the agentId param.
 * Supports both plain UUIDs and "name-slug--uuid" format.
 */
function extractUuid(agentId: string): string | null {
  // "john-smith--6cf31aa1-99c3-4f77-a371-56ecb8bcdd63"
  const parts = agentId.split('--');
  const candidate = parts[parts.length - 1];
  return UUID_REGEX.test(candidate) ? candidate : null;
}

/**
 * Look up the agent via the Supabase Auth admin API.
 * Returns null if the link is invalid or the user doesn't exist.
 * Also returns the agent's plan so free users can be blocked.
 */
async function getAgent(agentId: string) {
  const uuid = extractUuid(agentId);
  if (!uuid) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.getUserById(uuid);
  if (error || !data?.user) return null;

  const { data: userData } = await supabase
    .from('users')
    .select('subscription_plan, subscription_status')
    .eq('id', uuid)
    .single();

  const user = data.user;
  const isPaid = hasLeadCaptureAccess(
    userData?.subscription_status,
    userData?.subscription_plan,
    user.email
  );

  return {
    id: user.id,
    full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
    email: user.email ?? '',
    isPaid,
  };
}

export default async function LeadCapturePage({ params }: LeadPageProps) {
  const { agentId } = await params;
  const agent = await getAgent(agentId);

  if (!agent) {
    return (
      <div className="marketing-root min-h-screen flex items-center justify-center bg-white px-4 text-mkt-foreground">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-mkt-surface-muted border border-mkt-border flex items-center justify-center mx-auto mb-6">
            <svg className="w-7 h-7 text-mkt-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          </div>
          <h1 className="font-display text-xl font-medium text-mkt-foreground mb-2">Form not available</h1>
          <p className="text-mkt-secondary text-sm">This contact link is invalid or has been removed.</p>
        </div>
      </div>
    );
  }

  if (!agent.isPaid) {
    return (
      <div className="marketing-root min-h-screen flex items-center justify-center bg-white px-4 text-mkt-foreground">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-mkt-surface-muted border border-mkt-border flex items-center justify-center mx-auto mb-6">
            <svg className="w-7 h-7 text-mkt-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="font-display text-xl font-medium text-mkt-foreground mb-2">Form not available</h1>
          <p className="text-mkt-secondary text-sm">This contact link is not currently active.</p>
        </div>
      </div>
    );
  }

  const agentName = agent.full_name?.trim() || 'your agent';
  const initials = agentName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="marketing-root min-h-screen bg-white py-10 px-4 flex flex-col items-center justify-center text-mkt-foreground">
      <div className="w-full max-w-lg">

        {/* Agent header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-mkt-surface-muted border border-mkt-border flex items-center justify-center mx-auto mb-4 text-mkt-foreground text-xl font-medium">
            {initials}
          </div>
          <h1 className="font-display text-2xl font-medium text-mkt-foreground mb-1">
            Get in touch with {agentName}
          </h1>
          <p className="text-mkt-secondary text-sm max-w-sm mx-auto">
            Fill out the form below and {agentName.split(' ')[0]} will reach
            out to help you with your real estate needs.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-mkt-surface rounded-mkt-card border border-mkt-border shadow-[var(--mkt-shadow-soft)] p-6 sm:p-8">
          <LeadCaptureForm agentId={agent.id} agentName={agentName} />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-mkt-secondary mt-6">
          Powered by{' '}
          <a href={SITE_URL} className="font-mkt-mono text-mkt-secondary hover:text-[#0668E1] transition-colors">
            Oikaro
          </a>
        </p>
      </div>
    </div>
  );
}

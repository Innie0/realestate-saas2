// Public showing/meeting booking page.
//
// Reachable at /book/<agentId> OR /book/<name-slug>--<agentId>.
// No authentication required — this is the link an agent shares publicly
// so a lead can pick an open time and book a showing without back-and-forth.

import { createAdminClient } from '@/lib/supabase-admin';
import { hasLeadCaptureAccess } from '@/lib/subscription';
import BookingScheduler from '@/components/BookingScheduler';
import { SITE_URL } from '@/lib/site-config';

interface BookingPageProps {
  params: Promise<{ agentId: string }>;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function extractUuid(agentId: string): string | null {
  const parts = agentId.split('--');
  const candidate = parts[parts.length - 1];
  return UUID_REGEX.test(candidate) ? candidate : null;
}

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

  const { data: settings } = await supabase
    .from('agent_settings')
    .select('booking_enabled')
    .eq('user_id', uuid)
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
    isPaid,
    bookingEnabled: settings?.booking_enabled === true,
  };
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { agentId } = await params;
  const agent = await getAgent(agentId);

  const unavailable = !agent || !agent.isPaid || !agent.bookingEnabled;

  if (unavailable) {
    return (
      <div className="marketing-root min-h-screen flex items-center justify-center bg-white px-4 text-mkt-foreground">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-mkt-surface-muted border border-mkt-border flex items-center justify-center mx-auto mb-6">
            <svg className="w-7 h-7 text-mkt-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="font-display text-xl font-medium text-mkt-foreground mb-2">Booking not available</h1>
          <p className="text-mkt-secondary text-sm">This booking link is invalid or is no longer accepting appointments.</p>
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
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-mkt-surface-muted border border-mkt-border flex items-center justify-center mx-auto mb-4 text-mkt-foreground text-xl font-medium">
            {initials}
          </div>
          <h1 className="font-display text-2xl font-medium text-mkt-foreground mb-1">
            Book a showing with {agentName}
          </h1>
          <p className="text-mkt-secondary text-sm max-w-sm mx-auto">
            Pick a time that works for you — you&apos;ll get an instant confirmation.
          </p>
        </div>

        <div className="bg-mkt-surface rounded-mkt-card border border-mkt-border shadow-[var(--mkt-shadow-soft)] p-6 sm:p-8">
          <BookingScheduler agentId={agent.id} agentName={agentName} />
        </div>

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

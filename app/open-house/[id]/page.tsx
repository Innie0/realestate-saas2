import { createAdminClient } from '@/lib/supabase-admin';
import OpenHouseSignInForm from './OpenHouseSignInForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getOpenHouse(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('open_houses')
    .select('id, property_address, date, start_time, end_time, user_id, status')
    .eq('id', id)
    .single();

  if (error || !data) return null;

  // Get agent name
  const { data: agentUser } = await supabase.auth.admin.getUserById(data.user_id);
  const agentName = agentUser?.user?.user_metadata?.full_name || 'Agent';

  return { ...data, agent_name: agentName };
}

export default async function OpenHouseSignInPage({ params }: PageProps) {
  const { id } = await params;
  const openHouse = await getOpenHouse(id);

  if (!openHouse) {
    return (
      <div className="marketing-root min-h-screen bg-white flex items-center justify-center p-6 text-mkt-foreground">
        <div className="text-center">
          <p className="text-mkt-foreground text-lg font-medium">This open house isn&apos;t available.</p>
          <p className="text-mkt-secondary text-sm mt-2">The link may have expired or is invalid.</p>
        </div>
      </div>
    );
  }

  if (openHouse.status === 'ended') {
    return (
      <div className="marketing-root min-h-screen bg-white flex items-center justify-center p-6 text-mkt-foreground">
        <div className="text-center">
          <p className="text-mkt-foreground text-lg font-medium">This open house has ended.</p>
          <p className="text-mkt-secondary text-sm mt-2">Thanks for your interest!</p>
        </div>
      </div>
    );
  }

  const displayDate = new Date(openHouse.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <div className="marketing-root min-h-screen bg-white flex items-center justify-center p-4 text-mkt-foreground">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-mkt-surface-muted flex items-center justify-center mx-auto mb-3">
            <span className="text-lg">🏠</span>
          </div>
          <h1 className="font-display text-xl font-medium text-mkt-foreground mb-1">Open House Sign-In</h1>
          <p className="text-sm text-mkt-secondary">{openHouse.property_address}</p>
          <p className="text-xs text-mkt-secondary mt-1">
            {displayDate} · {openHouse.start_time.slice(0, 5)} – {openHouse.end_time.slice(0, 5)}
          </p>
          <p className="text-xs text-mkt-secondary mt-1">Hosted by {openHouse.agent_name}</p>
        </div>

        <OpenHouseSignInForm openHouseId={openHouse.id} />
      </div>
    </div>
  );
}

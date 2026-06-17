import { createAdminClient } from '@/lib/supabase-admin';
import { hasLeadCaptureAccess } from '@/lib/subscription';
import PublicAgentProfileView from '@/components/PublicAgentProfileView';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function extractUuid(slug: string): string | null {
  const parts = slug.split('--');
  const candidate = parts[parts.length - 1];
  return UUID_REGEX.test(candidate) ? candidate : null;
}

async function getAgentProfile(slug: string) {
  const uuid = extractUuid(slug);
  if (!uuid) return null;

  const supabase = createAdminClient();
  const { data: authData, error: authError } = await supabase.auth.admin.getUserById(uuid);
  if (authError || !authData?.user) return null;

  const user = authData.user;

  const { data: userData } = await supabase
    .from('users')
    .select('subscription_plan, subscription_status')
    .eq('id', uuid)
    .single();

  if (!hasLeadCaptureAccess(
    userData?.subscription_status,
    userData?.subscription_plan,
    user.email
  )) {
    return null;
  }

  const { data: settings } = await supabase
    .from('agent_settings')
    .select('*')
    .eq('user_id', uuid)
    .single();

  if (!settings?.profile_enabled) return null;

  return {
    id: uuid,
    name: user.user_metadata?.full_name || 'Agent',
    headline: settings.profile_headline || '',
    bio: settings.profile_bio || '',
    photoUrl: settings.profile_photo_url || '',
    specialties: settings.profile_specialties || [],
    areas: settings.profile_areas || [],
    phone: settings.profile_phone || '',
    profileEmail: settings.profile_email || '',
    brokerage: settings.profile_brokerage || '',
    license: settings.profile_license || '',
    website: settings.profile_website || '',
    yearsExperience: settings.profile_years_experience ?? null,
  };
}

async function getPublishedListings(userId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('projects')
    .select('id, title, property_info, images, published_at')
    .eq('user_id', userId)
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(12);

  return data ?? [];
}

export default async function AgentProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const agent = await getAgentProfile(slug);

  if (!agent) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-6">
        <div className="text-center max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-gray-900 text-lg font-semibold">Profile not available</p>
          <p className="text-gray-500 text-sm mt-2">
            This agent hasn&apos;t set up their public profile yet.
          </p>
        </div>
      </div>
    );
  }

  const listings = await getPublishedListings(agent.id);

  return <PublicAgentProfileView agent={agent} listings={listings} />;
}

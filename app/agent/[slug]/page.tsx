import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase-admin';
import { hasProLeadToolsAccess } from '@/lib/subscription';
import { buildAgentProfilePath, buildBookingPath } from '@/lib/agent-profile-shared';
import { AgentProfileStructuredData } from '@/components/seo/StructuredData';
import { SITE_NAME_ALT, SITE_URL } from '@/lib/site-config';
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

  if (!hasProLeadToolsAccess(
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
    bookingEnabled: settings.booking_enabled === true,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const agent = await getAgentProfile(slug);

  if (!agent) {
    return {
      title: 'Agent profile not available',
      robots: { index: false, follow: false },
    };
  }

  const canonicalPath = buildAgentProfilePath(agent.name, agent.id);
  const pageUrl = `${SITE_URL}${canonicalPath}`;
  const areasLabel = agent.areas.length > 0 ? agent.areas.slice(0, 3).join(', ') : '';
  const title = areasLabel
    ? `${agent.name} — Real Estate Agent in ${areasLabel}`
    : `${agent.name} — Real Estate Agent`;
  const description =
    (agent.headline || agent.bio || '').slice(0, 160) ||
    `Connect with ${agent.name}${areasLabel ? `, a real estate agent serving ${areasLabel}` : ''} on ${SITE_NAME_ALT}.`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: 'website',
      url: pageUrl,
      title,
      description,
      siteName: SITE_NAME_ALT,
      ...(agent.photoUrl ? { images: [{ url: agent.photoUrl, alt: agent.name }] } : {}),
    },
    twitter: {
      card: agent.photoUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(agent.photoUrl ? { images: [agent.photoUrl] } : {}),
    },
  };
}

export default async function AgentProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const agent = await getAgentProfile(slug);

  if (!agent) {
    return (
      <div className="marketing-root min-h-screen bg-white flex items-center justify-center p-6 text-mkt-foreground">
        <div className="text-center max-w-md rounded-mkt-card border border-mkt-border bg-mkt-surface p-8 shadow-[var(--mkt-shadow-soft)]">
          <p className="text-mkt-foreground text-lg font-medium">Profile not available</p>
          <p className="text-mkt-secondary text-sm mt-2">
            This agent hasn&apos;t set up their public profile yet.
          </p>
        </div>
      </div>
    );
  }

  const canonicalPath = buildAgentProfilePath(agent.name, agent.id);
  const bookingUrl = agent.bookingEnabled ? buildBookingPath(agent.name, agent.id) : null;

  return (
    <>
      <AgentProfileStructuredData agent={agent} url={`${SITE_URL}${canonicalPath}`} />
      <PublicAgentProfileView agent={agent} bookingUrl={bookingUrl} />
    </>
  );
}

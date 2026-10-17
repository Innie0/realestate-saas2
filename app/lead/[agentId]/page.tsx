// Public lead capture page.
//
// Reachable at /lead/<agentId> OR /lead/<name-slug>--<agentId>.
// No authentication required — this is the link an agent shares publicly.
// A prospect fills out the form and the submission lands in the agent's CRM.

import { createAdminClient } from '@/lib/supabase-admin';
import { hasLeadCaptureAccess } from '@/lib/subscription';
import LeadCaptureForm from '@/components/LeadCaptureForm';
import { SITE_URL } from '@/lib/site-config';
import { parseAdAttribution } from '@/lib/ads/utm';
import { normalizeProjectImages } from '@/lib/listing-utils';

interface LeadPageProps {
  params: Promise<{ agentId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Ad types that promote one specific home, and the label shown above it. */
const LISTING_AD_LABELS: Record<string, string> = {
  new_listing: 'Just listed',
  open_house: 'Open house',
  price_reduced: 'Price reduced',
  coming_soon: 'Coming soon',
  just_sold: 'Just sold',
};

interface AdListing {
  projectId: string;
  label: string;
  address: string;
  cityLine: string;
  price: string | null;
  specs: string;
  imageUrl: string | null;
}

/**
 * The home an ad click is about, so the page matches the ad the visitor clicked.
 * Only returned for a real ad this agent published — a bare project id in the
 * URL never reveals a listing the agent hasn't advertised.
 */
async function getAdListing(
  agentId: string,
  search: Record<string, string | string[] | undefined>,
): Promise<AdListing | null> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (typeof value === 'string') query.set(key, value);
  }
  const { projectId, promotionId } = parseAdAttribution(query.toString());
  if (!projectId || !promotionId) return null;

  const supabase = createAdminClient();
  return getAdListingFor(supabase, agentId, projectId, promotionId);
}

/** Whether the visitor came from one of this agent's "What's your home worth?" ads. */
async function isHomeValueAdClick(
  agentId: string,
  search: Record<string, string | string[] | undefined>,
): Promise<boolean> {
  const content = typeof search.utm_content === 'string' ? search.utm_content : '';
  if (!/^[0-9a-f-]{36}$/i.test(content)) return false;
  const { data } = await createAdminClient()
    .from('ad_promotions')
    .select('ad_type')
    .eq('id', content)
    .eq('user_id', agentId)
    .maybeSingle();
  return data?.ad_type === 'home_value';
}

async function getAdListingFor(
  supabase: ReturnType<typeof createAdminClient>,
  agentId: string,
  projectId: string,
  promotionId: string,
): Promise<AdListing | null> {
  const { data: promotion } = await supabase
    .from('ad_promotions')
    .select('ad_type')
    .eq('id', promotionId)
    .eq('user_id', agentId)
    .eq('project_id', projectId)
    .maybeSingle();
  const adType: string | undefined = promotion?.ad_type ?? undefined;
  const label = adType ? LISTING_AD_LABELS[adType] : undefined;
  if (!label) return null;

  const { data: project } = await supabase
    .from('projects')
    .select('id, property_info, images')
    .eq('id', projectId)
    .eq('user_id', agentId)
    .maybeSingle();
  const info = project?.property_info || {};
  if (!project || !info.address?.trim()) return null;

  const specs = [
    info.bedrooms ? `${info.bedrooms} bed` : null,
    info.bathrooms ? `${info.bathrooms} bath` : null,
    info.square_feet ? `${Number(info.square_feet).toLocaleString('en-US')} sq ft` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return {
    projectId: project.id,
    label,
    address: info.address.trim(),
    cityLine: [info.city, [info.state, info.zip_code].filter(Boolean).join(' ')].filter(Boolean).join(', '),
    // A sold home's list price is no longer the point of the ad
    // US-style price for buyers: $1,359,999
    price:
      adType !== 'just_sold' && Number(info.price) > 0
        ? `$${Math.round(Number(info.price)).toLocaleString('en-US')}`
        : null,
    specs,
    imageUrl: normalizeProjectImages(project.images)[0] ?? null,
  };
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

export default async function LeadCapturePage({ params, searchParams }: LeadPageProps) {
  const { agentId } = await params;
  const agent = await getAgent(agentId);
  const search = agent?.isPaid ? await searchParams : {};
  const adListing = agent?.isPaid ? await getAdListing(agent.id, search) : null;
  const homeValue = !adListing && agent?.isPaid ? await isHomeValueAdClick(agent.id, search) : false;

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
            {adListing
              ? 'Interested in this home?'
              : homeValue
                ? 'What’s your home worth?'
                : `Get in touch with ${agentName}`}
          </h1>
          <p className="text-mkt-secondary text-sm max-w-sm mx-auto">
            {adListing
              ? `Ask ${agentName.split(' ')[0]} a question or request a showing.`
              : homeValue
                ? `Get a free home value report from ${agentName}, based on recent sales near you. No obligation.`
                : `Fill out the form below and ${agentName.split(' ')[0]} will reach out to help you with your real estate needs.`}
          </p>
        </div>

        {/* The home from the ad, so the page matches what the visitor clicked */}
        {adListing && (
          <div className="mb-6 overflow-hidden rounded-mkt-card border border-mkt-border bg-mkt-surface shadow-[var(--mkt-shadow-soft)]">
            {adListing.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- listing photos may be data URLs
              <img
                src={adListing.imageUrl}
                alt={adListing.address}
                className="aspect-[4/3] w-full object-cover"
              />
            )}
            <div className="p-5">
              <p className="font-mkt-mono text-[11px] uppercase tracking-[0.08em] text-[#0668E1]">
                {adListing.label}
              </p>
              <p className="mt-1 font-display text-lg font-medium text-mkt-foreground">
                {adListing.address}
              </p>
              {adListing.cityLine && (
                <p className="text-sm text-mkt-secondary">{adListing.cityLine}</p>
              )}
              <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                {adListing.price && (
                  <span className="text-lg font-medium text-mkt-foreground">{adListing.price}</span>
                )}
                {adListing.specs && (
                  <span className="text-sm text-mkt-secondary">{adListing.specs}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form card */}
        <div className="bg-mkt-surface rounded-mkt-card border border-mkt-border shadow-[var(--mkt-shadow-soft)] p-6 sm:p-8">
          {adListing ? (
            <LeadCaptureForm
              agentId={agent.id}
              agentName={agentName}
              variant="listing"
              listingAddress={adListing.address}
              projectId={adListing.projectId}
            />
          ) : homeValue ? (
            <LeadCaptureForm agentId={agent.id} agentName={agentName} variant="home_value" />
          ) : (
            <LeadCaptureForm agentId={agent.id} agentName={agentName} />
          )}
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

import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase-admin';
import { hasLeadCaptureAccess } from '@/lib/subscription';
import LeadCaptureForm from '@/components/LeadCaptureForm';
import { formatListingPrice, normalizeProjectImages } from '@/lib/listing-utils';

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

  // Get profile settings
  const { data: settings } = await supabase
    .from('agent_settings')
    .select('profile_enabled, profile_headline, profile_bio, profile_photo_url, profile_specialties, profile_areas, profile_phone, profile_email, profile_brokerage, profile_license, profile_website, profile_years_experience')
    .eq('user_id', uuid)
    .single();

  if (!settings?.profile_enabled) return null;

  return {
    id: uuid,
    name: user.user_metadata?.full_name || 'Agent',
    email: user.email || '',
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
        <div className="text-center">
          <p className="text-gray-500 text-lg font-medium">Profile not available</p>
          <p className="text-gray-600 text-sm mt-2">This agent hasn&apos;t set up their profile yet.</p>
        </div>
      </div>
    );
  }

  const listings = await getPublishedListings(agent.id);

  const initials = agent.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Hero */}
      <div className="border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          {agent.photoUrl ? (
            <img
              src={agent.photoUrl}
              alt={agent.name}
              className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-2 border-gray-200"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-gray-900">{initials}</span>
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{agent.name}</h1>
          {agent.headline && (
            <p className="text-gray-500 text-sm">{agent.headline}</p>
          )}
          {(agent.brokerage || agent.yearsExperience != null) && (
            <p className="text-gray-500 text-xs mt-2">
              {[agent.brokerage, agent.yearsExperience != null ? `${agent.yearsExperience}+ years experience` : null]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
          {agent.license && (
            <p className="text-gray-400 text-xs mt-1">{agent.license}</p>
          )}

          {/* Contact row */}
          <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
            {agent.phone && (
              <a href={`tel:${agent.phone}`} className="text-xs text-gray-500 hover:text-brand-600 transition-colors">
                {agent.phone}
              </a>
            )}
            {agent.profileEmail && (
              <a href={`mailto:${agent.profileEmail}`} className="text-xs text-gray-500 hover:text-brand-600 transition-colors">
                {agent.profileEmail}
              </a>
            )}
            {agent.website && (
              <a
                href={agent.website.startsWith('http') ? agent.website : `https://${agent.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-brand-600 transition-colors"
              >
                Website
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Bio */}
        {agent.bio && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">About</h2>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{agent.bio}</p>
          </div>
        )}

        {/* Specialties */}
        {agent.specialties.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Specialties</h2>
            <div className="flex flex-wrap gap-2">
              {agent.specialties.map((s: string) => (
                <span key={s} className="px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-sm text-gray-600">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Areas served */}
        {agent.areas.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Areas Served</h2>
            <div className="flex flex-wrap gap-2">
              {agent.areas.map((a: string) => (
                <span key={a} className="px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-sm text-gray-600">
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Published listings */}
        {listings.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Listings
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {listings.map((listing) => {
                const info = (listing.property_info as Record<string, unknown>) || {};
                const thumb = normalizeProjectImages(listing.images)[0];
                const address =
                  (typeof info.address === 'string' && info.address) || listing.title;
                const price =
                  typeof info.price === 'number' ? info.price : null;

                return (
                  <Link
                    key={listing.id}
                    href={`/listing/${listing.id}`}
                    className="group rounded-xl border border-gray-200 bg-white overflow-hidden hover:border-brand-300 hover:shadow-sm transition-all"
                  >
                    <div className="aspect-[16/10] bg-gray-100">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={address}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                          No photo
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-gray-900 text-sm">
                        {formatListingPrice(price)}
                      </p>
                      <p className="text-gray-600 text-xs mt-1 line-clamp-2">{address}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Lead capture form */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Get In Touch</h2>
          <LeadCaptureForm agentId={agent.id} agentName={agent.name} />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 py-6 text-center">
        <p className="text-xs text-gray-600">Powered by Realestic</p>
      </div>
    </div>
  );
}

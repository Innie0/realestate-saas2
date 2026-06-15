import { createAdminClient } from '@/lib/supabase-admin';
import { hasLeadCaptureAccess } from '@/lib/subscription';
import LeadCaptureForm from '@/components/LeadCaptureForm';

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
    .select('profile_enabled, profile_headline, profile_bio, profile_photo_url, profile_specialties, profile_areas, profile_phone, profile_email')
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
  };
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

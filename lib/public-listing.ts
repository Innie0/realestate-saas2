import { createAdminClient } from '@/lib/supabase-admin';
import type { PublicListingData } from '@/lib/public-listing-shared';

export type { PublicListingAgent, PublicListingData } from '@/lib/public-listing-shared';

export async function getPublicListing(id: string): Promise<PublicListingData | null> {
  const supabase = createAdminClient();

  const { data: project, error } = await supabase
    .from('projects')
    .select(
      'id, user_id, title, description, property_type, property_info, images, ai_content, published, published_at'
    )
    .eq('id', id)
    .eq('published', true)
    .maybeSingle();

  if (error || !project) return null;

  const [{ data: authData }, { data: settings }] = await Promise.all([
    supabase.auth.admin.getUserById(project.user_id),
    supabase
      .from('agent_settings')
      .select('profile_phone, profile_email, profile_photo_url, profile_headline')
      .eq('user_id', project.user_id)
      .maybeSingle(),
  ]);

  const user = authData?.user;
  if (!user) return null;

  const agentName =
    (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name) ||
    (typeof user.user_metadata?.name === 'string' && user.user_metadata.name) ||
    'Agent';

  const nameSlug = agentName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const profilePath = nameSlug
    ? `/agent/${nameSlug}--${project.user_id}`
    : `/agent/${project.user_id}`;

  return {
    project: project as PublicListingData['project'],
    agent: {
      id: project.user_id,
      name: agentName,
      phone: settings?.profile_phone || null,
      email: settings?.profile_email || user.email || null,
      photoUrl: settings?.profile_photo_url || null,
      headline: settings?.profile_headline || null,
      profilePath,
    },
  };
}

import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase-admin';
import PublicListingView from '@/components/PublicListingView';
import LeadCaptureForm from '@/components/LeadCaptureForm';
import { formatListingAddress } from '@/lib/listing-utils';
import type { Project } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getPublishedListing(id: string) {
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

  const { data: authData } = await supabase.auth.admin.getUserById(project.user_id);
  const user = authData?.user;
  if (!user) return null;

  const { data: settings } = await supabase
    .from('agent_settings')
    .select('profile_phone, profile_email, profile_photo_url, profile_headline')
    .eq('user_id', project.user_id)
    .maybeSingle();

  const agentName =
    (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name) ||
    (typeof user.user_metadata?.name === 'string' && user.user_metadata.name) ||
    'Agent';

  const nameSlug = agentName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const profilePath = nameSlug ? `/agent/${nameSlug}--${project.user_id}` : `/agent/${project.user_id}`;

  return {
    project: project as Pick<
      Project,
      'id' | 'title' | 'description' | 'property_info' | 'images' | 'ai_content'
    >,
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

export default async function PublicListingPage({ params }: PageProps) {
  const { id } = await params;
  const listing = await getPublishedListing(id);

  if (!listing) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <p className="text-gray-600 text-lg font-medium">This listing isn&apos;t available.</p>
          <p className="text-gray-500 text-sm mt-2">
            It may have been unpublished or the link is incorrect.
          </p>
        </div>
      </div>
    );
  }

  const { project, agent } = listing;
  const listingAddress = formatListingAddress(project.property_info, project.title);
  const initials = agent.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {agent.photoUrl ? (
              <img
                src={agent.photoUrl}
                alt={agent.name}
                className="w-10 h-10 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-gray-700">{initials}</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">Listed by {agent.name}</p>
              {agent.headline && (
                <p className="text-xs text-gray-500 truncate">{agent.headline}</p>
              )}
            </div>
          </div>
          <Link
            href={agent.profilePath}
            className="text-xs text-brand-600 hover:text-brand-700 font-medium shrink-0"
          >
            View profile
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <PublicListingView project={project} />

        <div className="rounded-xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Interested in this home?</h2>
          <p className="text-sm text-gray-500 mb-6">
            Send a message to {agent.name.split(' ')[0]} and they&apos;ll get back to you soon.
          </p>
          <LeadCaptureForm
            agentId={agent.id}
            agentName={agent.name}
            variant="listing"
            source="listing_page"
            listingAddress={listingAddress}
          />
        </div>
      </div>

      <div className="border-t border-gray-200 py-6 text-center space-y-2">
        <Link href="/" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
          Browse more properties
        </Link>
        <p className="text-xs text-gray-500">Powered by Realestic</p>
      </div>
    </div>
  );
}

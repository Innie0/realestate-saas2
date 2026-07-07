import { MetadataRoute } from 'next';
import { createAdminClient } from '@/lib/supabase-admin';
import { getPublicAgentDirectory, getAllAreaSlugs } from '@/lib/agent-directory';

const baseUrl = 'https://realestic.ai';

// Google's hard limit is 50,000 URLs per sitemap file. We stay comfortably
// under that with a single file for now — if agent/listing counts ever get
// close to this, split into multiple sitemaps via generateSitemaps()
// instead of raising this further.
const MAX_DYNAMIC_URLS = 40000;

// Pulls live agent/listing data, so this must run per-request rather than
// being frozen at build time (a build environment may not have DB access).
export const dynamic = 'force-dynamic';

async function getPublishedListings() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('projects')
    .select('id, published_at')
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(MAX_DYNAMIC_URLS);
  return data || [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/for-agents`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/agents`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  let dynamicEntries: MetadataRoute.Sitemap = [];

  try {
    const [agents, areas, listings] = await Promise.all([
      getPublicAgentDirectory(),
      getAllAreaSlugs(),
      getPublishedListings(),
    ]);

    const agentEntries: MetadataRoute.Sitemap = agents.slice(0, MAX_DYNAMIC_URLS).map((agent) => ({
      url: `${baseUrl}${agent.path}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    const areaEntries: MetadataRoute.Sitemap = areas.map((area) => ({
      url: `${baseUrl}/agents/${area.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    const listingEntries: MetadataRoute.Sitemap = listings.map((listing) => ({
      url: `${baseUrl}/listing/${listing.id}`,
      lastModified: listing.published_at ? new Date(listing.published_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    dynamicEntries = [...agentEntries, ...areaEntries, ...listingEntries];
  } catch (error) {
    console.error('Failed to build dynamic sitemap entries:', error);
  }

  return [...staticEntries, ...dynamicEntries];
}

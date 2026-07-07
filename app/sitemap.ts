import { MetadataRoute } from 'next';
import { createAdminClient } from '@/lib/supabase-admin';
import { getPublicAgentDirectory } from '@/lib/agent-directory';

// Cap how many dynamic (agent/listing) URLs we emit in one sitemap file.
// A single sitemap should stay well under Google's 50k URL limit — if the
// directory grows past this, split into a sitemap index instead.
const MAX_DYNAMIC_URLS = 1000;

// Pulls live agent/listing data, so this must run per-request rather than
// being frozen at build time (a build environment may not have DB access).
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://realestic.ai';

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
    const agents = await getPublicAgentDirectory();
    const agentEntries: MetadataRoute.Sitemap = agents.slice(0, MAX_DYNAMIC_URLS).map((agent) => ({
      url: `${baseUrl}${agent.path}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    const supabase = createAdminClient();
    const { data: listings } = await supabase
      .from('projects')
      .select('id, published_at')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(MAX_DYNAMIC_URLS);

    const listingEntries: MetadataRoute.Sitemap = (listings || []).map((listing) => ({
      url: `${baseUrl}/listing/${listing.id}`,
      lastModified: listing.published_at ? new Date(listing.published_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    dynamicEntries = [...agentEntries, ...listingEntries];
  } catch (error) {
    console.error('Failed to build dynamic sitemap entries:', error);
  }

  return [...staticEntries, ...dynamicEntries];
}

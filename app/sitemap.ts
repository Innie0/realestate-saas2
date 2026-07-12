import { MetadataRoute } from 'next';
import { getPublicAgentDirectory, getAllAreaSlugs } from '@/lib/agent-directory';

const baseUrl = 'https://realestic.ai';

const MAX_DYNAMIC_URLS = 40000;

export const dynamic = 'force-dynamic';

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
    const [agents, areas] = await Promise.all([
      getPublicAgentDirectory(),
      getAllAreaSlugs(),
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

    dynamicEntries = [...agentEntries, ...areaEntries];
  } catch (error) {
    console.error('Failed to build dynamic sitemap entries:', error);
  }

  return [...staticEntries, ...dynamicEntries];
}

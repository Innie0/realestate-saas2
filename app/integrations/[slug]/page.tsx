import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import IntegrationDetailClient from '@/components/integrations/IntegrationDetailClient';
import { getAllIntegrationSlugs, getIntegrationBySlug } from '@/lib/integrations';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllIntegrationSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const integration = getIntegrationBySlug(slug);
  if (!integration) return { title: 'Integration — Oikaro' };

  return {
    title: `${integration.name} — Oikaro Integrations`,
    description: integration.description,
  };
}

export default async function IntegrationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const integration = getIntegrationBySlug(slug);
  if (!integration) notFound();

  return <IntegrationDetailClient integration={integration} />;
}

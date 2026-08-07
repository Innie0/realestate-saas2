import { MARKETING_FAQ_ITEMS } from '@/lib/marketing-faq';
import { SITE_DESCRIPTION, SITE_NAME, SITE_NAME_ALT, SITE_TAGLINE, SITE_URL } from '@/lib/site-config';
import { SUPPORT_EMAIL } from '@/lib/support-email';

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function GlobalStructuredData() {
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    alternateName: SITE_NAME_ALT,
    url: SITE_URL,
    logo: `${SITE_URL}/apple-icon.png`,
    email: SUPPORT_EMAIL,
    description: SITE_DESCRIPTION,
    founder: {
      '@type': 'Person',
      name: 'Ali Ali',
    },
  };

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME_ALT,
    alternateName: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
  };

  const softwareApplication = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME_ALT,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    offers: {
      '@type': 'Offer',
      price: '49',
      priceCurrency: 'USD',
      description: `${SITE_TAGLINE} — Starter plan from $49/month with 7-day free trial`,
    },
  };

  return (
    <>
      <JsonLd data={organization} />
      <JsonLd data={website} />
      <JsonLd data={softwareApplication} />
    </>
  );
}

interface AgentProfileForStructuredData {
  name: string;
  headline?: string;
  bio?: string;
  photoUrl?: string;
  phone?: string;
  profileEmail?: string;
  brokerage?: string;
  areas?: string[];
}

/**
 * RealEstateAgent structured data for an agent's public profile page — lets
 * Google understand the page is a local business/agent listing (rather than
 * a generic page) and surface richer results for "agents near me" searches.
 */
export function AgentProfileStructuredData({
  agent,
  url,
}: {
  agent: AgentProfileForStructuredData;
  url: string;
}) {
  const raw: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: agent.name,
    url,
    description: agent.headline || agent.bio || undefined,
    image: agent.photoUrl || undefined,
    telephone: agent.phone || undefined,
    email: agent.profileEmail || undefined,
    areaServed: agent.areas && agent.areas.length > 0 ? agent.areas : undefined,
    worksFor: agent.brokerage ? { '@type': 'Organization', name: agent.brokerage } : undefined,
  };

  const data = Object.fromEntries(Object.entries(raw).filter(([, value]) => value !== undefined));

  return <JsonLd data={data} />;
}

export function HomeFaqStructuredData() {
  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: MARKETING_FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return <JsonLd data={faqPage} />;
}

import type { Metadata } from 'next';
import HomePageClient from '@/components/home/HomePageClient';
import { HomeFaqStructuredData } from '@/components/seo/StructuredData';
import { SITE_DESCRIPTION, SITE_NAME, SITE_NAME_ALT, SITE_TAGLINE, SITE_URL } from '@/lib/site-config';

export const metadata: Metadata = {
  title: `${SITE_NAME_ALT} – ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
  keywords: [
    'Oikaro',
    'Oikaro',
    'oikaro.ai',
    'real estate agent tools',
    'AI listing description generator',
    'property listing software',
    'real estate CRM',
    'real estate lead capture',
    'open house QR sign in',
    'real estate transaction management',
    'MLS listing description',
    'real estate marketing tools',
    'real estate agent software',
  ],
  alternates: {
    canonical: '/for-agents',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${SITE_URL}/for-agents`,
    siteName: SITE_NAME_ALT,
    title: `${SITE_NAME_ALT} – ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/logo-wordmark.png',
        width: 800,
        height: 240,
        alt: `${SITE_NAME_ALT} – ${SITE_TAGLINE}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME_ALT} – ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: ['/logo-wordmark.png'],
  },
};

export default function ForAgentsPage() {
  return (
    <>
      <HomeFaqStructuredData />
      <HomePageClient />
    </>
  );
}

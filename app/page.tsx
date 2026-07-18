import type { Metadata } from 'next';
import HomePageClient from '@/components/home/HomePageClient';
import { HomeFaqStructuredData } from '@/components/seo/StructuredData';
import { SITE_DESCRIPTION, SITE_NAME_ALT, SITE_TAGLINE, SITE_URL } from '@/lib/site-config';

export const metadata: Metadata = {
  title: `${SITE_NAME_ALT} – ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
  keywords: [
    'Oikaro',
    'Oikaro',
    'oikaro.ai',
    'real estate agent tools',
    'AI listing description generator',
    'real estate CRM',
    'real estate lead capture',
    'real estate ads',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
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

export default function HomePage() {
  return (
    <>
      <HomeFaqStructuredData />
      <HomePageClient />
    </>
  );
}

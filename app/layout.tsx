// Root layout - wraps all pages in the application
// This is the main layout file for the Next.js app

import MetaPixel from '@/components/analytics/MetaPixel';
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GlobalStructuredData } from '@/components/seo/StructuredData';
import { SITE_NAME, SITE_NAME_ALT, SITE_DESCRIPTION, SITE_DOMAIN, SITE_URL } from '@/lib/site-config';
import './globals.css';

// All fonts are self-hosted (@fontsource, imported in globals.css, variables set in :root).
// Google's font files now use a URL format Turbopack's next/font can't download, which failed builds.

const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION;

/**
 * Metadata for the application
 * This appears in browser tabs and search results
 */
export const metadata: Metadata = {
  title: {
    default: `Properties for Sale | ${SITE_NAME_ALT}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME_ALT,
  keywords: [
    SITE_NAME,
    SITE_DOMAIN,
    'real estate agent tools',
    'AI listing description generator',
    'property listing software',
    'real estate CRM',
    'real estate lead capture',
    'real estate transaction management',
    'MLS listing description',
    'real estate marketing tools',
    'property showing scheduler',
    'real estate agent software',
  ],
  authors: [{ name: 'Ali Ali', url: `${SITE_URL}/about` }],
  creator: SITE_NAME,
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME_ALT,
    title: `Properties for Sale | ${SITE_NAME_ALT}`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/logo-wordmark.png',
        width: 800,
        height: 240,
        alt: `${SITE_NAME_ALT} – Properties for Sale`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Properties for Sale | ${SITE_NAME_ALT}`,
    description: SITE_DESCRIPTION,
    images: ['/logo-wordmark.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  ...(googleSiteVerification
    ? {
        verification: {
          google: googleSiteVerification,
        },
      }
    : {}),
};

/**
 * RootLayout component
 * This wraps all pages in the application
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={GeistSans.variable} suppressHydrationWarning>
      <body
        className={`${GeistSans.className} font-sans antialiased`}
      >
        <GlobalStructuredData />
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}

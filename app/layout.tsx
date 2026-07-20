// Root layout - wraps all pages in the application
// This is the main layout file for the Next.js app

import type { Metadata } from 'next';
import { EB_Garamond, IBM_Plex_Mono, Inter } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import { GlobalStructuredData } from '@/components/seo/StructuredData';
import { SITE_NAME, SITE_NAME_ALT, SITE_DESCRIPTION, SITE_DOMAIN, SITE_URL } from '@/lib/site-config';
import './globals.css';

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-inter',
  display: 'swap',
});

// Serif display — dashboard/app only; not used on Framer-style marketing pages.
const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

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
    icon: '/favicon.png',
    apple: '/favicon.png',
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
    <html lang="en" className={GeistSans.variable}>
      <body className={`${GeistSans.className} ${plexMono.variable} ${ebGaramond.variable} ${inter.variable} font-sans antialiased`}>
        <GlobalStructuredData />
        {children}
      </body>
    </html>
  );
}

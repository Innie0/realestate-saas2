// Root layout - wraps all pages in the application
// This is the main layout file for the Next.js app

import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Fraunces } from 'next/font/google';
import { GlobalStructuredData } from '@/components/seo/StructuredData';
import { SITE_NAME, SITE_NAME_ALT, SITE_URL } from '@/lib/site-config';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

// Editorial serif for display moments — page titles and hero numbers.
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  axes: ['opsz'],
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
  description:
    'Browse homes and properties for sale on Realestic. Search by location, property type, and price — no account required.',
  applicationName: SITE_NAME_ALT,
  keywords: [
    'Realestic',
    'Realestic AI',
    'realestic.ai',
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
    description:
      'Browse homes and properties for sale on Realestic. Search by location, property type, and price.',
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
    description:
      'Browse homes and properties for sale on Realestic. Search by location, property type, and price.',
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
    <html lang="en">
      <body className={`${jakarta.variable} ${fraunces.variable} font-sans antialiased`}>
        <GlobalStructuredData />
        {children}
      </body>
    </html>
  );
}

// Root layout - wraps all pages in the application
// This is the main layout file for the Next.js app

import type { Metadata } from 'next';
import { IBM_Plex_Mono, Inter, JetBrains_Mono, Newsreader, Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
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

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const tiempos = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-tiempos',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-space-grotesk',
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
      <body
        className={`${GeistSans.className} ${plexMono.variable} ${plusJakartaSans.variable} ${inter.variable} ${newsreader.variable} ${tiempos.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} font-sans antialiased`}
      >
        <GlobalStructuredData />
        {children}
      </body>
    </html>
  );
}

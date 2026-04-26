// Root layout - wraps all pages in the application
// This is the main layout file for the Next.js app

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Load Inter font from Google Fonts
const inter = Inter({ subsets: ['latin'] });

/**
 * Metadata for the application
 * This appears in browser tabs and search results
 */
export const metadata: Metadata = {
  title: {
    default: 'Realestic – AI-Powered Tools for Real Estate Agents',
    template: '%s | Realestic',
  },
  description: 'Realestic helps real estate agents write listing descriptions with AI, manage clients, track transactions, and schedule showings — all in one place. Save hours every week.',
  keywords: [
    'real estate agent tools',
    'AI listing description generator',
    'property listing software',
    'real estate CRM',
    'real estate transaction management',
    'MLS listing description',
    'real estate marketing tools',
    'property showing scheduler',
    'real estate agent software',
  ],
  authors: [{ name: 'Realestic' }],
  creator: 'Realestic',
  metadataBase: new URL('https://realestic.ai'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://realestic.ai',
    siteName: 'Realestic',
    title: 'Realestic – AI-Powered Tools for Real Estate Agents',
    description: 'Write listing descriptions in seconds, manage clients, track transactions, and schedule showings. The all-in-one platform built for real estate agents.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Realestic – AI-Powered Real Estate Tools',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Realestic – AI-Powered Tools for Real Estate Agents',
    description: 'Write listing descriptions in seconds, manage clients, track transactions, and schedule showings.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.png',
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
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}


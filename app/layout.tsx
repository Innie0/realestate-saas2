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
  title: 'Realestic - Time-Saving Tools for Real Estate Agents',
  description: 'Streamline your workflow with smart tools for property listings, client management, and scheduling.',
  icons: {
    icon: '/favicon.png',
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


import type { Metadata } from 'next';
import AboutPageClient from '@/components/about/AboutPageClient';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Meet Ali Ali and learn why Oikaro was built — simple tools for real estate agents who want to save time and win more business.',
  alternates: {
    canonical: '/about',
  },
  robots: { index: true, follow: true },
};

export default function AboutPage() {
  return <AboutPageClient />;
}

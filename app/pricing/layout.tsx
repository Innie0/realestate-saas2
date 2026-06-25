import type { Metadata } from 'next';
import { SITE_NAME_ALT } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Pricing',
  description: `${SITE_NAME_ALT} pricing — Starter and Pro plans for real estate agents. 7-day free trial, AI listings, CRM, lead capture, and transaction tools.`,
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    title: `Pricing | ${SITE_NAME_ALT}`,
    description:
      'Compare Starter and Pro plans. AI listing tools, lead capture, CRM, and more — with a 7-day free trial.',
    url: '/pricing',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from 'next';
import IntegrationsPageClient from '@/components/integrations/IntegrationsPageClient';

export const metadata: Metadata = {
  title: 'Integrations — Oikaro',
  description:
    'Oikaro connects to Google Calendar, Google Ads, Meta Ads, Resend, and your lead capture forms — the tools you already run your business on.',
};

export default function IntegrationsPage() {
  return <IntegrationsPageClient />;
}

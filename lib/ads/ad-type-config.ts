import {
  Calendar,
  Home,
  Megaphone,
  Quote,
  Sparkles,
  Tag,
  TrendingUp,
  User,
  type LucideIcon,
} from 'lucide-react';
import type { AdType } from '@/lib/ads/ad-draft-types';

export interface AdTypeOption {
  id: AdType;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const AD_TYPE_OPTIONS: AdTypeOption[] = [
  { id: 'new_listing', label: 'New listing', description: 'Just listed — drive buyers to your page', icon: Home },
  { id: 'open_house', label: 'Open house', description: 'Promote date, time & directions', icon: Calendar },
  { id: 'just_sold', label: 'Just sold', description: 'Celebrate the sale & attract sellers', icon: Sparkles },
  { id: 'price_reduced', label: 'Price reduced', description: 'Highlight a fresh price drop', icon: Tag },
  { id: 'coming_soon', label: 'Coming soon', description: 'Build buzz before go-live', icon: Megaphone },
  { id: 'agent_branding', label: 'Meet the agent', description: 'Personal brand & expertise', icon: User },
  { id: 'market_update', label: 'Market update', description: 'Neighborhood stats & trends', icon: TrendingUp },
  { id: 'testimonial', label: 'Testimonial', description: 'Share client success stories', icon: Quote },
];

export interface DetailField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'datetime-local' | 'textarea';
  placeholder?: string;
}

export function getDetailFieldsForAdType(adType: AdType | null): DetailField[] {
  switch (adType) {
    case 'open_house':
      return [
        { key: 'openHouseDate', label: 'Open house date & time', type: 'datetime-local' },
        { key: 'address', label: 'Address', type: 'text', placeholder: '123 Main St' },
        { key: 'city', label: 'City', type: 'text' },
        { key: 'price', label: 'List price', type: 'number' },
      ];
    case 'agent_branding':
      return [
        { key: 'agentTagline', label: 'Headline / tagline', type: 'text', placeholder: 'Your local expert in…' },
        { key: 'bioBlurb', label: 'Short bio', type: 'textarea', placeholder: '2–3 sentences about you' },
      ];
    case 'market_update':
      return [
        { key: 'areaName', label: 'Area / neighborhood', type: 'text', placeholder: 'Visalia, CA' },
        { key: 'statHighlight', label: 'Key stat or insight', type: 'text', placeholder: 'Median price up 4% YoY' },
      ];
    case 'testimonial':
      return [
        { key: 'clientName', label: 'Client name', type: 'text', placeholder: 'Jane S.' },
        { key: 'quote', label: 'Testimonial quote', type: 'textarea', placeholder: 'What they said about you…' },
      ];
    case 'just_sold':
    case 'price_reduced':
    case 'coming_soon':
    case 'new_listing':
    default:
      return [
        { key: 'address', label: 'Address', type: 'text' },
        { key: 'city', label: 'City', type: 'text' },
        { key: 'price', label: 'Price', type: 'number' },
        { key: 'bedrooms', label: 'Beds', type: 'number' },
        { key: 'bathrooms', label: 'Baths', type: 'number' },
      ];
  }
}

export function getDefaultCtaForAdType(adType: AdType | null): 'LEARN_MORE' | 'CONTACT_US' | 'GET_QUOTE' {
  switch (adType) {
    case 'open_house':
      return 'GET_QUOTE';
    case 'agent_branding':
    case 'testimonial':
      return 'CONTACT_US';
    default:
      return 'LEARN_MORE';
  }
}

export function getAdTypeLabel(adType: AdType): string {
  return AD_TYPE_OPTIONS.find((o) => o.id === adType)?.label ?? adType;
}

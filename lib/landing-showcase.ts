import type { LucideIcon } from 'lucide-react';
import {
  Sparkles,
  FolderKanban,
  Search,
  Inbox,
  Link2,
  Users,
  FileText,
  Calendar,
  DoorOpen,
  Megaphone,
  LayoutDashboard,
  Home,
  KeyRound,
  Building2,
} from 'lucide-react';

export type ShowcaseSlide = {
  id: string;
  eyebrow: string;
  headline: string;
  description: string;
  screenshot: string;
  screenshotAlt: string;
  productsHref: string;
  tools: string[];
};

export type PlatformTool = {
  id: string;
  icon: LucideIcon;
  name: string;
  summary: string;
};

export type PersonaCard = {
  id: string;
  label: string;
  title: string;
  description: string;
};

export type Testimonial = {
  id: string;
  quote: string;
  name: string;
  initials: string;
  role: string;
  metric: string;
  metricLabel: string;
  metric2: string;
  metricLabel2: string;
};

export const SHOWCASE_NARRATIVE = {
  eyebrow: 'How it works',
  headlineLead: 'Close the loop from lead',
  headlineFade: ' to closing',
  subheadline:
    'Oikaro unifies listings, leads, clients, and deals in one workspace — so every conversation, task, and deadline moves your pipeline forward.',
};

export const SHOWCASE_SLIDES: ShowcaseSlide[] = [
  {
    id: 'ask-once',
    eyebrow: 'AI Assistant',
    headline: 'Ask once. Listings, follow-ups, and research — done.',
    description:
      'Draft copy, look up comps, schedule reminders, and analyze photos or PDFs in natural language. Your whole workflow, one chat away.',
    screenshot: '/landing/ai-assistant.png',
    screenshotAlt: 'Oikaro AI Assistant chat workspace',
    productsHref: '/products/ai-assistant',
    tools: ['AI Assistant'],
  },
  {
    id: 'win-listing',
    eyebrow: 'Listings & Research',
    headline: 'Go from photos to MLS-ready copy in seconds.',
    description:
      'Generate listing descriptions in multiple tones, then look up any address for owner contact, property details, and full sale history — without switching tabs or tools.',
    screenshot: '/landing/projects.png',
    screenshotAlt: 'Oikaro listing projects and property research',
    productsHref: '/products/projects',
    tools: ['Listing Projects', 'Property Research'],
  },
  {
    id: 'never-lose-lead',
    eyebrow: 'Leads & CRM',
    headline: 'Know exactly who to call first.',
    description:
      'Every form submission and open house sign-in lands in your inbox — scored Hot, Warm, or Cold — and syncs straight into your CRM.',
    screenshot: '/landing/leads-inbox.png',
    screenshotAlt: 'Oikaro leads inbox with Hot, Warm, and Cold scoring',
    productsHref: '/products/leads-inbox',
    tools: ['Leads Inbox', 'Lead Capture', 'Open Houses', 'CRM'],
  },
  {
    id: 'close-confidence',
    eyebrow: 'Deals & Growth',
    headline: 'Track every deal from offer to close.',
    description:
      'Checklists, calendar sync, ad campaigns, and a dashboard that shows your pipeline at a glance — so nothing slips before closing day.',
    screenshot: '/landing/transactions.png',
    screenshotAlt: 'Oikaro transaction pipeline and deal tracking',
    productsHref: '/products/transactions',
    tools: ['Transactions', 'Calendar', 'Ads', 'Dashboard'],
  },
];

export const PLATFORM_HEADLINE = {
  eyebrow: 'One platform',
  title: 'One product for your entire business',
  description:
    'Listings, leads, clients, transactions, research, ads, and AI — from one workspace. No copying between spreadsheets, forms, and five different apps.',
};

export const PLATFORM_TOOLS: PlatformTool[] = [
  { id: 'ai-assistant', icon: Sparkles, name: 'AI Assistant', summary: 'Natural-language commands across your CRM' },
  { id: 'projects', icon: FolderKanban, name: 'Listing Projects', summary: 'MLS-ready descriptions in under 10 seconds' },
  { id: 'property-research', icon: Search, name: 'Property Research', summary: 'Comps, AVM, and owner data in one search' },
  { id: 'leads-inbox', icon: Inbox, name: 'Leads Inbox', summary: 'Hot, Warm, and Cold scoring built in' },
  { id: 'lead-capture', icon: Link2, name: 'Lead Capture', summary: 'Branded form link for bio and cards' },
  { id: 'clients', icon: Users, name: 'CRM', summary: 'Clients, notes, and pipeline in one place' },
  { id: 'transactions', icon: FileText, name: 'Transactions', summary: 'Checklists and docs through closing' },
  { id: 'calendar', icon: Calendar, name: 'Calendar', summary: 'Google Calendar sync and reminders' },
  { id: 'open-houses', icon: DoorOpen, name: 'Open Houses', summary: 'QR sign-in — no clipboards' },
  { id: 'ads', icon: Megaphone, name: 'Ads', summary: 'Meta and Google campaigns from listings' },
  { id: 'dashboard', icon: LayoutDashboard, name: 'Dashboard', summary: 'Pipeline and tasks at a glance' },
];

export const PERSONA_CARDS: PersonaCard[] = [
  {
    id: 'listing-agents',
    label: 'For listing agents',
    title: 'Win more listings, faster',
    description:
      'Descriptions, property research, and ad campaigns from one place — so you spend less time on admin and more time with sellers.',
  },
  {
    id: 'buyer-agents',
    label: 'For buyer\'s agents',
    title: 'Never miss a follow-up',
    description:
      'CRM, calendar, and AI reminders keep every buyer on track — from first showing to accepted offer.',
  },
  {
    id: 'team-leads',
    label: 'For team leads',
    title: 'See the whole pipeline',
    description:
      'Dashboard, scored leads, and transaction checklists give you visibility across every deal and agent on your team.',
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    quote:
      'I finally stopped juggling five different tools. Listings, leads, and follow-ups all live in one place — and the AI actually saves me hours every week.',
    name: 'Sarah Mitchell',
    initials: 'SM',
    role: 'Listing Agent · Compass, Austin TX',
    metric: '5+',
    metricLabel: 'Hours saved per week',
    metric2: '5',
    metricLabel2: 'Apps replaced',
  },
  {
    id: '2',
    quote:
      'Open house sign-in alone changed how I work. Every visitor becomes a scored lead in my inbox before I leave the property.',
    name: 'James Rodriguez',
    initials: 'JR',
    role: 'Buyer\'s Agent · RE/MAX, Denver CO',
    metric: '10+',
    metricLabel: 'More leads captured',
    metric2: '0',
    metricLabel2: 'Missed open house visitors',
  },
  {
    id: '3',
    quote:
      'Property research and CMA used to take an hour. Now I pull comps and a price range in one search while I\'m still on the call.',
    name: 'Maria Lopez',
    initials: 'ML',
    role: 'Team Lead · Douglas Elliman, Miami FL',
    metric: '10x',
    metricLabel: 'Faster listing prep',
    metric2: '60',
    metricLabel2: 'Minutes saved per CMA',
  },
];

export const INTEGRATIONS = [
  { id: 'google-calendar', name: 'Google Calendar', description: 'Sync showings and deadlines to your calendar' },
  { id: 'google-ads', name: 'Google Ads', description: 'Launch search campaigns from your listings' },
  { id: 'meta-ads', name: 'Meta Ads', description: 'Run Facebook and Instagram ads in minutes' },
  { id: 'lead-forms', name: 'Lead forms', description: 'Branded capture links for bio and cards' },
] as const;

export const PERSONA_ICONS: Record<string, LucideIcon> = {
  'listing-agents': Home,
  'buyer-agents': KeyRound,
  'team-leads': Building2,
};

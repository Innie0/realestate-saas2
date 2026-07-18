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
} from 'lucide-react';

export type LandingFeature = {
  id: string;
  icon: LucideIcon;
  tag: string;
  title: string;
  description: string;
  highlights: string[];
  /** PNG in public/landing/ — replace with real app screenshots when ready */
  imageSrc: string;
  imageAlt: string;
  flip?: boolean;
};

export const LANDING_FEATURES: LandingFeature[] = [
  {
    id: 'ai-assistant',
    icon: Sparkles,
    tag: 'AI Assistant',
    title: 'Ask anything — listings, follow-ups, research, reminders',
    description:
      'A chat-first workspace that drafts copy, creates projects, adds clients, and schedules follow-ups. Upload photos or PDFs for instant analysis.',
    highlights: ['Natural-language commands', 'Photo & PDF analysis', 'Actions across your CRM'],
    imageSrc: '/landing/ai-assistant.png',
    imageAlt: 'Oikaro AI Assistant chat interface',
    flip: false,
  },
  {
    id: 'projects',
    icon: FolderKanban,
    tag: 'Listing Projects',
    title: 'Write stunning listing descriptions in seconds',
    description:
      'Upload property photos, enter the basics, and get MLS-ready descriptions in multiple tones. Edit length and style until it is perfect.',
    highlights: ['Generates in under 10 seconds', 'Pro, casual & luxury tones', 'Works from photos + details'],
    imageSrc: '/landing/projects.png',
    imageAlt: 'Oikaro listing description generator',
    flip: true,
  },
  {
    id: 'property-research',
    icon: Search,
    tag: 'Property Research',
    title: 'Property data and CMA in one search',
    description:
      'Look up any address for beds, baths, owner info, and estimated value — then run comps and a suggested price range without leaving Oikaro.',
    highlights: ['Instant property details', 'Comparable sales & AVM', 'Adjustable radius & history'],
    imageSrc: '/landing/property-research.png',
    imageAlt: 'Oikaro property research and CMA',
    flip: false,
  },
  {
    id: 'leads-inbox',
    icon: Inbox,
    tag: 'Leads Inbox',
    title: 'Every lead in one place, scored and ready',
    description:
      'Form submissions and open house sign-ins land in your inbox — tagged Hot, Warm, or Cold so you know who to call first.',
    highlights: ['Hot / Warm / Cold scoring', 'One-click add to CRM', 'Source & property attached'],
    imageSrc: '/landing/leads-inbox.png',
    imageAlt: 'Oikaro leads inbox with scoring',
    flip: true,
  },
  {
    id: 'lead-capture',
    icon: Link2,
    tag: 'Lead Capture',
    title: 'Your personal lead form, ready to share',
    description:
      'Get a custom link for your bio, email signature, or business cards. Every submission captures timeline, budget, and area automatically.',
    highlights: ['Branded agent link', 'Auto-sync to inbox', 'Mobile-friendly form'],
    imageSrc: '/landing/lead-capture.png',
    imageAlt: 'Oikaro public lead capture form',
    flip: false,
  },
  {
    id: 'clients',
    icon: Users,
    tag: 'CRM',
    title: 'Keep every client perfectly organized',
    description:
      'Clients, preferences, notes, and follow-up history in one clean CRM. See your pipeline and never lose track of the next touchpoint.',
    highlights: ['Notes & activity history', 'Stage tracking', 'Fast search'],
    imageSrc: '/landing/clients.png',
    imageAlt: 'Oikaro client CRM detail view',
    flip: true,
  },
  {
    id: 'transactions',
    icon: FileText,
    tag: 'Transactions',
    title: 'Track every deal from offer to close',
    description:
      'Checklists, documents, and timelines for each transaction. Know exactly what is done and what is due before closing day.',
    highlights: ['Task checklists', 'Document uploads', 'Closing date reminders'],
    imageSrc: '/landing/transactions.png',
    imageAlt: 'Oikaro transaction checklist',
    flip: false,
  },
  {
    id: 'calendar',
    icon: Calendar,
    tag: 'Scheduling',
    title: 'Never miss a showing or deadline',
    description:
      'Syncs with Google Calendar. Schedule showings, set automated reminders, and keep transaction milestones visible at a glance.',
    highlights: ['Google Calendar sync', 'Automated reminders', 'Week & month views'],
    imageSrc: '/landing/calendar.png',
    imageAlt: 'Oikaro calendar with showings',
    flip: true,
  },
  {
    id: 'open-houses',
    icon: DoorOpen,
    tag: 'Open Houses',
    title: 'Paperless sign-in at every open house',
    description:
      'Create an event, display a QR code, and let visitors sign in from their phone. Every attendee becomes a scored lead in your inbox.',
    highlights: ['QR code sign-in', 'No clipboards', 'Property & event tagged'],
    imageSrc: '/landing/open-houses.png',
    imageAlt: 'Oikaro open house QR sign-in',
    flip: false,
  },
  {
    id: 'ads',
    icon: Megaphone,
    tag: 'Ads',
    title: 'Launch Meta and Google ads from your listings',
    description:
      'Connect ad accounts, generate copy with AI, preview creatives, and publish campaigns — then track performance in one dashboard.',
    highlights: ['Google & Meta support', 'AI ad copy assist', 'Performance metrics'],
    imageSrc: '/landing/ads.png',
    imageAlt: 'Oikaro ads campaign dashboard',
    flip: true,
  },
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    tag: 'Dashboard',
    title: 'Your command center for the whole business',
    description:
      'Open deals, recent clients, upcoming tasks, and plan usage on one screen — so you start every day knowing what matters most.',
    highlights: ['Pipeline at a glance', 'Upcoming follow-ups', 'Usage & plan limits'],
    imageSrc: '/landing/dashboard.png',
    imageAlt: 'Oikaro agent dashboard overview',
    flip: false,
  },
];

export const LANDING_HERO_SCREENSHOT = {
  src: '/landing/hero-assistant.png',
  alt: 'Oikaro AI Assistant product preview',
};

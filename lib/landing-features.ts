/**
 * Product catalog — one entry per /products/[id] page.
 * See public/landing/README.md for screenshot & video paths.
 */
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

export type HowItWorksStep = {
  title: string;
  description: string;
};

export type LandingFeature = {
  id: string;
  icon: LucideIcon;
  tag: string;
  title: string;
  description: string;
  /** One-line teaser on /products grid — defaults to description */
  cardSummary?: string;
  /** SEO description for /products/[id] — defaults to description */
  metaDescription?: string;
  /** Set false to hide from /products index while you finish the page */
  published?: boolean;
  highlights: string[];
  howItWorks: HowItWorksStep[];
  /** PNG in public/landing/ — replace with real app screenshots when ready */
  imageSrc: string;
  imageAlt: string;
  /** Optional WebM/MP4 in public/landing/videos/ — shown when file exists */
  videoSrc?: string;
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
    howItWorks: [
      { title: 'Ask in plain English', description: 'Type what you need — a listing, comps, or a follow-up reminder.' },
      { title: 'Review the draft', description: 'Oikaro pulls context from your CRM and generates a ready-to-use result.' },
      { title: 'Apply with one click', description: 'Save to a project, add a client, or schedule the next touchpoint.' },
    ],
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
    howItWorks: [
      { title: 'Upload photos & details', description: 'Add beds, baths, address, and listing photos to a new project.' },
      { title: 'Pick a tone', description: 'Choose professional, casual, or luxury — and adjust length.' },
      { title: 'Copy to MLS', description: 'Edit inline, then paste the finished description wherever you list.' },
    ],
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
    howItWorks: [
      { title: 'Search any address', description: 'Enter a property address to pull beds, baths, owner, and AVM.' },
      { title: 'Run comps', description: 'Adjust radius and filters to build a comparable sales set.' },
      { title: 'Share a price range', description: 'Use the suggested range in listing presentations or buyer consults.' },
    ],
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
    howItWorks: [
      { title: 'Leads arrive automatically', description: 'Form fills and open house sign-ins sync to your inbox.' },
      { title: 'See who\'s hottest', description: 'Every lead is scored Hot, Warm, or Cold based on intent signals.' },
      { title: 'Convert to client', description: 'Add to CRM and schedule follow-ups without re-entering data.' },
    ],
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
    howItWorks: [
      { title: 'Copy your link', description: 'Get a branded URL to drop in your bio, email sig, or QR code.' },
      { title: 'Lead fills the form', description: 'They share timeline, budget, and area preferences on any device.' },
      { title: 'Inbox notifies you', description: 'The submission appears in Leads Inbox, scored and ready to action.' },
    ],
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
    howItWorks: [
      { title: 'Add or import clients', description: 'Create profiles from inbox leads or add manually in seconds.' },
      { title: 'Log every touchpoint', description: 'Notes, calls, and showings stay attached to the client record.' },
      { title: 'Track stage & next steps', description: 'See pipeline stage and upcoming follow-ups at a glance.' },
    ],
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
    howItWorks: [
      { title: 'Open a transaction', description: 'Start from a accepted offer with property and closing date.' },
      { title: 'Work the checklist', description: 'Tick off inspection, appraisal, and doc tasks as you go.' },
      { title: 'Never miss a deadline', description: 'Reminders surface what\'s due before closing day.' },
    ],
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
    howItWorks: [
      { title: 'Connect Google Calendar', description: 'Two-way sync keeps Oikaro and your calendar aligned.' },
      { title: 'Schedule showings', description: 'Book appointments and attach the property and client.' },
      { title: 'Get reminded', description: 'Automated nudges for showings and transaction milestones.' },
    ],
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
    howItWorks: [
      { title: 'Create the event', description: 'Set the property, date, and time — Oikaro generates a QR code.' },
      { title: 'Visitors sign in on their phone', description: 'No clipboards — guests scan and submit in seconds.' },
      { title: 'Leads hit your inbox', description: 'Each attendee is scored and tagged to the open house.' },
    ],
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
    howItWorks: [
      { title: 'Connect ad accounts', description: 'Link Google and Meta once — campaigns pull from your listings.' },
      { title: 'Generate copy & creative', description: 'AI drafts ad text; preview before you publish.' },
      { title: 'Track performance', description: 'See spend, clicks, and leads in one dashboard.' },
    ],
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
    howItWorks: [
      { title: 'Start your day here', description: 'See open deals, recent leads, and tasks in one view.' },
      { title: 'Prioritize follow-ups', description: 'Upcoming reminders surface who to call first.' },
      { title: 'Monitor pipeline health', description: 'Track active transactions and plan usage at a glance.' },
    ],
    imageSrc: '/landing/dashboard.png',
    imageAlt: 'Oikaro agent dashboard overview',
    flip: false,
  },
];

export const LANDING_HERO_SCREENSHOT = {
  src: '/landing/hero-assistant.png',
  alt: 'Oikaro AI Assistant product preview',
};

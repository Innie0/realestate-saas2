import { getStarterProComparisonAnswer } from '@/lib/pricing';

export type MarketingFaqItem = {
  question: string;
  answer: string;
};

export const MARKETING_FAQ_ITEMS: MarketingFaqItem[] = [
  {
    question: 'Is there a free trial?',
    answer:
      "Yes — every plan includes a 7-day free trial. You'll add a payment method at checkout, but you won't be charged until the trial ends. Cancel anytime before then from Account → Manage billing and you won't pay.",
  },
  {
    question: "What's the difference between Starter and Pro?",
    answer: getStarterProComparisonAnswer(),
  },
  {
    question: 'How does Property Research work?',
    answer:
      'Enter a property address to pull owner information, contact details, listing status, and property records — then run a CMA with comparable sales and an estimated value. Results for the same address are cached for 7 days to save time. Starter includes 20 lookups and 5 CMA analyses per month; Pro is unlimited.',
  },
  {
    question: 'How does the AI listing tool work?',
    answer:
      'Create a listing project, add property details and photos, and Oikaro generates a professional description plus social captions in seconds. Choose from three tones and refine the length or focus until it\'s ready to publish. Starter includes 20 projects per month; Pro is unlimited.',
  },
  {
    question: 'How do leads and follow-up work?',
    answer:
      'You get a personal lead capture link and QR code to share anywhere — bio, email signature, open house flyers. New leads land in your inbox with hot, warm, and cold scoring. You can add them to your CRM and turn on automated follow-up emails. Open house QR sign-in and a public agent profile are included on Pro.',
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      "Yes — cancel anytime with no cancellation fee from Account → Manage billing. You'll keep access until the end of your current billing period (or trial). If you cancel during the free trial, you won't be charged.",
  },
  {
    question: 'Is my data secure?',
    answer:
      'Yes. Your data is encrypted in transit and at rest, hosted on Supabase with row-level security. Payments are handled by Stripe — we never store card numbers. We don\'t sell your data. See our Privacy Policy for full details on third-party services like property data providers.',
  },
  {
    question: 'Does it work for commercial real estate?',
    answer:
      'AI listing projects work for residential, commercial, rentals, and land — the AI adapts to the property type you enter. Property Research and CMA are built primarily for residential markets; commercial coverage varies by location and available public records.',
  },
];

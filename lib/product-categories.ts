export type ProductCategory = {
  id: string;
  label: string;
  description: string;
  featureIds: string[];
};

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    id: 'ai',
    label: 'AI Assistant',
    description: 'Natural-language commands across your entire workflow.',
    featureIds: ['ai-assistant'],
  },
  {
    id: 'listings',
    label: 'Listings & Research',
    description: 'From photos to MLS-ready copy and property data in one place.',
    featureIds: ['projects', 'property-research'],
  },
  {
    id: 'leads',
    label: 'Leads & CRM',
    description: 'Capture, score, and manage every lead without switching tools.',
    featureIds: ['leads-inbox', 'lead-capture', 'open-houses', 'clients'],
  },
  {
    id: 'deals',
    label: 'Deals & Growth',
    description: 'Track transactions, schedule showings, run ads, and see your pipeline.',
    featureIds: ['transactions', 'calendar', 'ads', 'dashboard'],
  },
];

/** Flat list of all product ids for landing pill strip */
export const ALL_PRODUCT_IDS = PRODUCT_CATEGORIES.flatMap((c) => c.featureIds);

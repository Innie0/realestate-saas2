import { getProductHref, PRODUCT_PAGES_LIVE } from '@/lib/products';

export const FOOTER_COLUMN_HEADER =
  'text-[11px] font-semibold uppercase tracking-[0.14em] text-mkt-secondary';

export const FOOTER_LINK_CLASS =
  'text-sm text-mkt-secondary transition-colors hover:text-mkt-foreground';

/** Curated product links for footer — not a full sitemap (hidden until product pages are live) */
const ALL_FOOTER_PRODUCT_LINKS = [
  { id: 'ai-assistant', label: 'AI Assistant' },
  { id: 'clients', label: 'CRM' },
  { id: 'leads-inbox', label: 'Leads Inbox' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'dashboard', label: 'Dashboard' },
] as const;

export const FOOTER_PRODUCT_LINKS = PRODUCT_PAGES_LIVE ? ALL_FOOTER_PRODUCT_LINKS : [];

export function footerProductHref(id: string): string {
  return getProductHref(id);
}

export const FOOTER_COMPANY_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const;

export const FOOTER_RESOURCES_LINKS = [
  { href: '/for-agents', label: 'For agents' },
  ...(PRODUCT_PAGES_LIVE ? [{ href: '/products', label: 'All products' }] : []),
  { href: '/integrations', label: 'Integrations' },
  { href: '/pricing', label: 'Pricing' },
];

export const FOOTER_LEGAL_LINKS = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
] as const;

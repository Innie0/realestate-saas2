export type SearchResultKind =
  | 'project'
  | 'client'
  | 'lead'
  | 'transaction'
  | 'ad'
  | 'event'
  | 'conversation'
  | 'nav'
  | 'action'
  | 'research';

export interface SearchResult {
  id: string;
  kind: SearchResultKind;
  title: string;
  subtitle?: string;
  href: string;
}

export interface SearchResponse {
  projects: SearchResult[];
  clients: SearchResult[];
  leads: SearchResult[];
  transactions: SearchResult[];
  ads: SearchResult[];
  events: SearchResult[];
  conversations: SearchResult[];
}

export const SEARCH_GROUP_LABELS: Record<SearchResultKind, string> = {
  research: 'Property research',
  action: 'Quick actions',
  nav: 'Pages',
  project: 'Projects',
  client: 'Clients',
  lead: 'Leads',
  transaction: 'Transactions',
  ad: 'Ads',
  event: 'Calendar',
  conversation: 'AI chats',
};

export const SEARCH_GROUP_ORDER: SearchResultKind[] = [
  'research',
  'action',
  'nav',
  'project',
  'client',
  'lead',
  'transaction',
  'ad',
  'event',
  'conversation',
];

/** Row/column counts tuned to typical loaded data to minimize layout shift. */
export const SKELETON_COUNTS = {
  clientsTableRows: 8,
  leadsInboxRows: 6,
  transactionsDeals: 4,
  projectsGrid: 6,
  openDealsRows: 6,
  todayRows: 5,
  continueRows: 3,
  attentionRows: 3,
  openHouses: 3,
  formFields: 3,
} as const;

export const CLIENT_TABLE_HEADERS = [
  'Client',
  'Interest',
  'Stage',
  'Last contact',
  'Next follow-up',
] as const;

export const OPEN_DEALS_HEADERS = [
  'Property',
  'Client',
  'Stage',
  'Price',
  'Closing',
] as const;

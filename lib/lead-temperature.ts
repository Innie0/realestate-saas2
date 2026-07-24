export type LeadTemperature = 'hot' | 'warm' | 'cold';

/** Score lead temperature from recency and timeline signals in the message. */
export function getLeadTemperature(createdAt: string, message = ''): LeadTemperature {
  const hoursAgo = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  const msg = message.toLowerCase();
  if (hoursAgo < 48 || msg.includes('timeline: asap')) return 'hot';
  if (hoursAgo < 168 || msg.includes('timeline: 1-3')) return 'warm';
  return 'cold';
}

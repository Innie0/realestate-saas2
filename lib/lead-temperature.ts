export type LeadTemperature = 'hot' | 'warm' | 'cold';

export function coerceLeadMessage(message: unknown): string {
  return typeof message === 'string' ? message : '';
}

export function coerceLeadTemperature(value: unknown): LeadTemperature {
  if (value === 'hot' || value === 'warm' || value === 'cold') return value;
  return 'warm';
}

/** Score lead temperature from recency and timeline signals in the message. */
export function getLeadTemperature(createdAt: string, message: unknown = ''): LeadTemperature {
  const hoursAgo = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  const msg = coerceLeadMessage(message).toLowerCase();
  if (hoursAgo < 48 || msg.includes('timeline: asap')) return 'hot';
  if (hoursAgo < 168 || msg.includes('timeline: 1-3')) return 'warm';
  return 'cold';
}

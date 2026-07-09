/**
 * Compact currency for dashboard pipeline / deal tables.
 * $1,359,000 → $1.359M · $1,359,450 → $1.35945M · $1,400,000 → $1.4M
 */
export function formatCompactPrice(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return '—';

  if (amount >= 1_000_000) {
    const millions = Math.floor(amount / 1_000_000);
    const remainder = Math.round(amount % 1_000_000);

    if (remainder === 0) {
      return `$${millions}M`;
    }

    const frac = String(remainder).padStart(6, '0').replace(/0+$/, '');
    return frac ? `$${millions}.${frac}M` : `$${millions}M`;
  }

  if (amount >= 1_000) {
    const wholeThousands = Math.floor(amount / 1_000);
    const remainder = Math.round(amount % 1_000);

    if (remainder === 0) {
      return `$${wholeThousands}K`;
    }

    const frac = String(remainder).padStart(3, '0').replace(/0+$/, '');
    return frac ? `$${wholeThousands}.${frac}K` : `$${wholeThousands}K`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

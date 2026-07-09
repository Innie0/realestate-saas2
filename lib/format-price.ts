/**
 * Dashboard currency — full amount with dot thousand separators (no M/K).
 * $1,359,000 → $1.359.000 · $1,359,450 → $1.359.450
 */
export function formatCompactPrice(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return '—';

  const rounded = Math.round(amount);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$${formatted}`;
}

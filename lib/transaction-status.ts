import type { BadgeVariant } from '@/components/ui/Badge';

export type TransactionStatus =
  | 'active'
  | 'pending'
  | 'under_contract'
  | 'closed'
  | 'cancelled'
  | 'expired';

export const TRANSACTION_STATUSES: { value: TransactionStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'under_contract', label: 'Under Contract' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'expired', label: 'Expired' },
];

export const OPEN_TRANSACTION_STATUSES: TransactionStatus[] = [
  'active',
  'pending',
  'under_contract',
];

export function getTransactionStatusLabel(status: string): string {
  return TRANSACTION_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function getTransactionStatusBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case 'active':
    case 'under_contract':
      return 'pro';
    case 'pending':
      return 'warm';
    case 'closed':
      return 'success';
    case 'cancelled':
      return 'hot';
    case 'expired':
      return 'neutral';
    default:
      return 'default';
  }
}

export function isOpenTransactionStatus(status: string): boolean {
  return OPEN_TRANSACTION_STATUSES.includes(status as TransactionStatus);
}

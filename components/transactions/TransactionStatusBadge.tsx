import StatusPill from '@/components/ui/StatusPill';
import Badge from '@/components/ui/Badge';
import {
  getTransactionStatusBadgeVariant,
  getTransactionStatusLabel,
} from '@/lib/transaction-status';

const filledStatuses = new Set(['active', 'under_contract']);

const statusTone: Record<string, 'active' | 'success' | 'warning' | 'neutral' | 'danger'> = {
  active: 'active',
  under_contract: 'active',
  pending: 'warning',
  closed: 'success',
  cancelled: 'danger',
  expired: 'neutral',
};

export default function TransactionStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const label = getTransactionStatusLabel(status);

  if (filledStatuses.has(status)) {
    return (
      <StatusPill tone={statusTone[status] ?? 'neutral'} className={className}>
        {label}
      </StatusPill>
    );
  }

  return (
    <Badge variant={getTransactionStatusBadgeVariant(status)} className={className}>
      {label}
    </Badge>
  );
}

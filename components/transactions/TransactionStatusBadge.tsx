import Badge from '@/components/ui/Badge';
import {
  getTransactionStatusBadgeVariant,
  getTransactionStatusLabel,
} from '@/lib/transaction-status';

export default function TransactionStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <Badge variant={getTransactionStatusBadgeVariant(status)} className={className}>
      {getTransactionStatusLabel(status)}
    </Badge>
  );
}

import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={clsx('text-center py-12 px-4', className)}>
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-100 border border-gray-200 mb-4">
        <Icon className="w-7 h-7 text-gray-400" strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-sm mx-auto mb-5">{description}</p>
      )}
      {action}
    </div>
  );
}

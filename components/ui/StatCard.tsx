import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  className?: string;
}

export default function StatCard({ label, value, icon: Icon, className }: StatCardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-gray-200 bg-[var(--surface)] p-4',
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-gray-400" strokeWidth={1.75} />
        <p className="text-xs font-medium uppercase tracking-wide text-gray-700">{label}</p>
      </div>
      <p className="text-2xl font-bold tabular-nums text-gray-900">{value}</p>
    </div>
  );
}

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
        'rounded-[10px] border border-gray-200 bg-[var(--surface)] px-5 py-4',
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-gray-500" strokeWidth={1.75} />
        <p className="text-label text-gray-600">{label}</p>
      </div>
      <p className="text-[26px] font-semibold tabular-nums tracking-[-0.02em] text-gray-900">
        {value}
      </p>
    </div>
  );
}

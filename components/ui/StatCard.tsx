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
    <div className={clsx('bg-white border border-gray-200 rounded-xl p-4', className)}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-gray-400" strokeWidth={1.75} />
        <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
    </div>
  );
}

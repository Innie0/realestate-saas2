import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';

export type BadgeVariant = 'default' | 'hot' | 'warm' | 'cold' | 'pro' | 'success' | 'neutral';

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700 border-gray-200',
  hot: 'bg-red-50 text-red-700 border-red-200',
  warm: 'bg-amber-50 text-amber-700 border-amber-200',
  cold: 'bg-sky-50 text-sky-700 border-sky-200',
  pro: 'bg-brand-50 text-brand-700 border-brand-200',
  success: 'bg-green-50 text-green-700 border-green-200',
  neutral: 'bg-gray-50 text-gray-600 border-gray-200',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  icon?: LucideIcon;
  className?: string;
}

export default function Badge({ children, variant = 'default', icon: Icon, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border',
        variantStyles[variant],
        className
      )}
    >
      {Icon && <Icon className="w-3 h-3 flex-shrink-0" />}
      {children}
    </span>
  );
}

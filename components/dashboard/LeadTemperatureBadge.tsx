import clsx from 'clsx';
import { getLeadTemperature, type LeadTemperature } from '@/lib/lead-temperature';

export type { LeadTemperature };

const CONFIG: Record<
  LeadTemperature,
  { label: string; dot: string; badge: string }
> = {
  hot: {
    label: 'Hot',
    dot: 'bg-rose-500',
    badge: 'bg-rose-100 text-rose-800 ring-1 ring-inset ring-rose-200/80',
  },
  warm: {
    label: 'Warm',
    dot: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-200/80',
  },
  cold: {
    label: 'Cold',
    dot: 'bg-gray-400',
    badge: 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200/80',
  },
};

type LeadTemperatureBadgeProps = {
  temperature: LeadTemperature;
  size?: 'sm' | 'md';
  showDot?: boolean;
  className?: string;
};

/** Hot / Warm / Cold lead scoring — obvious at a glance in lists and filters. */
export default function LeadTemperatureBadge({
  temperature,
  size = 'sm',
  showDot = true,
  className,
}: LeadTemperatureBadgeProps) {
  const { label, dot, badge } = CONFIG[temperature];

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-medium uppercase tracking-[0.06em]',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        badge,
        className,
      )}
    >
      {showDot ? (
        <span className={clsx('size-1.5 shrink-0 rounded-full', dot)} aria-hidden />
      ) : null}
      {label}
    </span>
  );
}

export { getLeadTemperature };

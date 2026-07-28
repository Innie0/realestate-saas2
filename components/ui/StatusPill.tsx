import clsx from 'clsx';

export type StatusPillTone =
  | 'active'
  | 'success'
  | 'warning'
  | 'neutral'
  | 'danger'
  | 'info';

const toneStyles: Record<StatusPillTone, string> = {
  active: 'bg-brand-500 text-white',
  success: 'bg-emerald-500 text-white',
  warning: 'bg-amber-500 text-white',
  neutral: 'bg-gray-200 text-gray-700',
  danger: 'bg-rose-500 text-white',
  info: 'bg-sky-500 text-white',
};

interface StatusPillProps {
  children: React.ReactNode;
  tone?: StatusPillTone;
  className?: string;
}

/** Filled status badge — Instantly-style "Active" pill. */
export default function StatusPill({ children, tone = 'active', className }: StatusPillProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-tight',
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

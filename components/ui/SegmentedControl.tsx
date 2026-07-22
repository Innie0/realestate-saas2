'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';
import { useMotionReduced } from '@/lib/motion';

export interface Segment<T extends string = string> {
  id: T;
  label?: string;
  icon?: LucideIcon;
  /** When set, renders a link instead of a button (no onChange required). */
  href?: string;
  /** For icon-only segments */
  ariaLabel?: string;
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange?: (id: T) => void;
  /** Unique id for the active pill motion (required when multiple controls share a page). */
  layoutId: string;
  className?: string;
  /** Stretch segments evenly on small screens */
  stretch?: boolean;
  size?: 'sm' | 'md';
  /** Sky = blue active chip (Clients status). Neutral = raised surface (default). */
  activeStyle?: 'sky' | 'neutral';
}

/** Light-theme sky chip — same look in dark and light dashboard modes. */
const SKY_ACTIVE_PILL =
  'absolute inset-0 rounded-md border border-[#bae6fd] bg-[#e0f2fe]';
const SKY_ACTIVE_TEXT = 'text-[#0284c7]';

const NEUTRAL_ACTIVE_PILL =
  'absolute inset-0 rounded-md border border-border bg-card shadow-sm dark:bg-gray-200 dark:shadow-none';

const sizeStyles = {
  sm: {
    track: 'p-1 rounded-lg',
    button: 'px-3 py-1.5 rounded-md text-[12.5px]',
    icon: 'w-3.5 h-3.5',
    iconOnly: 'p-1.5 rounded-md',
  },
  md: {
    track: 'p-1 rounded-lg',
    button: 'px-3.5 py-1.5 rounded-md text-[13px]',
    icon: 'w-4 h-4',
    iconOnly: 'p-2 rounded-md',
  },
} as const;

export default function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  layoutId,
  className,
  stretch = false,
  size = 'sm',
  activeStyle = 'neutral',
}: SegmentedControlProps<T>) {
  const reduced = useMotionReduced();
  const styles = sizeStyles[size];

  const pillClass = activeStyle === 'sky' ? SKY_ACTIVE_PILL : NEUTRAL_ACTIVE_PILL;
  const activeTextClass = activeStyle === 'sky' ? SKY_ACTIVE_TEXT : 'text-foreground';

  return (
    <div
      className={clsx(
        'inline-flex gap-0.5 bg-muted',
        styles.track,
        stretch && 'w-full sm:w-auto',
        className,
      )}
      role="tablist"
    >
      {segments.map(({ id, label, icon: Icon, href, ariaLabel }) => {
        const active = value === id;
        const iconOnly = !label && Icon;

        const inner = (
          <>
            {active && !reduced && (
              <motion.span
                layoutId={layoutId}
                className={pillClass}
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            {active && reduced && <span className={pillClass} />}
            {Icon && (
              <Icon
                className={clsx('relative z-10 shrink-0', styles.icon)}
                strokeWidth={1.75}
                aria-hidden={!!label}
              />
            )}
            {label && <span className="relative z-10">{label}</span>}
          </>
        );

        const segmentClass = clsx(
          'relative z-10 inline-flex items-center justify-center gap-1.5 font-medium transition-colors',
          iconOnly ? styles.iconOnly : styles.button,
          stretch && 'flex-1 sm:flex-none',
          active ? activeTextClass : 'text-muted-foreground hover:text-foreground',
        );

        if (href && !onChange) {
          return (
            <Link
              key={id}
              href={href}
              role="tab"
              aria-selected={active}
              aria-label={ariaLabel}
              className={segmentClass}
            >
              {inner}
            </Link>
          );
        }

        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={ariaLabel ?? label}
            onClick={() => onChange?.(id)}
            className={segmentClass}
          >
            {inner}
          </button>
        );
      })}
    </div>
  );
}

'use client';

import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';

export type DemoToolbarAccent = 'blue' | 'indigo' | 'cyan';

/** Literal class strings (not dynamically concatenated) so Tailwind's JIT
 *  scanner picks up every arbitrary-value color used here. */
const LIGHT_ACCENT_CLASSES: Record<DemoToolbarAccent, { icon: string; border: string; label: string }> = {
  blue: {
    icon: 'text-[#0668E1]/60 hover:bg-[#0668E1]/10 hover:text-[#0668E1]',
    border: 'border-[#0668E1]/12',
    label: 'text-[#0668E1]/45',
  },
  indigo: {
    icon: 'text-[#6366F1]/60 hover:bg-[#6366F1]/10 hover:text-[#6366F1]',
    border: 'border-[#6366F1]/12',
    label: 'text-[#6366F1]/45',
  },
  cyan: {
    icon: 'text-[#0891B2]/60 hover:bg-[#0891B2]/10 hover:text-[#0891B2]',
    border: 'border-[#0891B2]/12',
    label: 'text-[#0891B2]/45',
  },
};

/** Shared "editor toolbar" chrome for the illustrated landing feature cards —
 *  makes each gradient card read as an app surface, not a flat text block.
 *  `light` swaps the (white-on-dark) styling for a dark-on-light variant, used
 *  by cards that sit on a white/tinted surface instead of a saturated gradient.
 *  `accent` picks which light-mode tint to use, so cards on the same section
 *  can each carry a distinct blue tone. */
export function DemoToolbarButton({
  icon: Icon,
  light,
  accent = 'blue',
}: {
  icon: LucideIcon;
  light?: boolean;
  accent?: DemoToolbarAccent;
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden
      className={clsx(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors',
        light ? LIGHT_ACCENT_CLASSES[accent].icon : 'text-white/70 hover:bg-white/15 hover:text-white',
      )}
    >
      <Icon size={14} strokeWidth={2} />
    </button>
  );
}

export function DemoToolbar({
  label,
  icons,
  light,
  accent = 'blue',
}: {
  label: string;
  icons: LucideIcon[];
  light?: boolean;
  accent?: DemoToolbarAccent;
}) {
  return (
    <div
      className={clsx(
        'mb-4 flex items-center gap-0.5 border-b pb-3',
        light ? LIGHT_ACCENT_CLASSES[accent].border : 'border-white/15',
      )}
    >
      {icons.map((Icon, i) => (
        <DemoToolbarButton key={i} icon={Icon} light={light} accent={accent} />
      ))}
      <span
        className={clsx(
          'ml-auto text-[10px] font-semibold uppercase tracking-wide',
          light ? LIGHT_ACCENT_CLASSES[accent].label : 'text-white/50',
        )}
      >
        {label}
      </span>
    </div>
  );
}

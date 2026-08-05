'use client';

import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';

/** Shared "editor toolbar" chrome for the illustrated landing feature cards —
 *  makes each gradient card read as an app surface, not a flat text block.
 *  `light` swaps the (white-on-dark) styling for a dark-on-light variant, used
 *  by cards that sit on a white/tinted surface instead of a saturated gradient. */
export function DemoToolbarButton({ icon: Icon, light }: { icon: LucideIcon; light?: boolean }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden
      className={clsx(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors',
        light
          ? 'text-[#0668E1]/60 hover:bg-[#0668E1]/10 hover:text-[#0668E1]'
          : 'text-white/70 hover:bg-white/15 hover:text-white',
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
}: {
  label: string;
  icons: LucideIcon[];
  light?: boolean;
}) {
  return (
    <div
      className={clsx(
        'mb-4 flex items-center gap-0.5 border-b pb-3',
        light ? 'border-[#0668E1]/12' : 'border-white/15',
      )}
    >
      {icons.map((Icon, i) => (
        <DemoToolbarButton key={i} icon={Icon} light={light} />
      ))}
      <span
        className={clsx(
          'ml-auto text-[10px] font-semibold uppercase tracking-wide',
          light ? 'text-[#0668E1]/45' : 'text-white/50',
        )}
      >
        {label}
      </span>
    </div>
  );
}

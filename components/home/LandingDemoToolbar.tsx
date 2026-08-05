'use client';

import type { LucideIcon } from 'lucide-react';

/** Shared "editor toolbar" chrome for the illustrated landing feature cards —
 *  makes each gradient card read as an app surface, not a flat text block. */
export function DemoToolbarButton({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/15 hover:text-white"
    >
      <Icon size={14} strokeWidth={2} />
    </button>
  );
}

export function DemoToolbar({ label, icons }: { label: string; icons: LucideIcon[] }) {
  return (
    <div className="mb-4 flex items-center gap-0.5 border-b border-white/15 pb-3">
      {icons.map((Icon, i) => (
        <DemoToolbarButton key={i} icon={Icon} />
      ))}
      <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-white/50">
        {label}
      </span>
    </div>
  );
}

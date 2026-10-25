'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface FilterGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

interface FilterSidebarProps {
  title?: string;
  groups: FilterGroup[];
  className?: string;
}

/** Collapsible left filter panel — Instantly SuperSearch filter rail. */
export default function FilterSidebar({ title = 'Filters', groups, className }: FilterSidebarProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(groups.filter((g) => g.defaultOpen !== false).map((g) => g.id)),
  );

  // On phones the filters start folded so the list itself is on the first screen
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <aside
      className={clsx(
        'w-full min-w-0 shrink-0 overflow-hidden rounded-xl border border-border bg-card xl:w-[240px]',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        aria-expanded={mobileOpen}
        className={clsx(
          'flex w-full items-center justify-between px-4 py-3 text-left xl:pointer-events-none',
          mobileOpen && 'border-b border-border',
          'xl:border-b xl:border-border',
        )}
      >
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <ChevronDown
          className={clsx('size-4 text-muted-foreground transition-transform xl:hidden', mobileOpen && 'rotate-180')}
          strokeWidth={2}
        />
      </button>
      <div className={clsx('divide-y divide-border xl:block', mobileOpen ? 'block' : 'hidden')}>
        {groups.map(({ id, label, icon: Icon, children }) => {
          const isOpen = openIds.has(id);
          return (
            <div key={id}>
              <button
                type="button"
                onClick={() => toggle(id)}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[13px] font-medium text-foreground transition-colors hover:bg-muted/40"
              >
                <Icon className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                <span className="flex-1">{label}</span>
                <ChevronDown
                  className={clsx(
                    'size-3.5 shrink-0 text-muted-foreground transition-transform',
                    isOpen && 'rotate-180',
                  )}
                  strokeWidth={2}
                />
              </button>
              {isOpen ? <div className="space-y-1 px-4 pb-3">{children}</div> : null}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

'use client';

import type { ElementType } from 'react';
import { cn } from '@/lib/utils';

export type DetailPageTab<T extends string = string> = {
  id: T;
  label: string;
  icon?: ElementType;
  badge?: string | number;
};

type DetailPageTabNavProps<T extends string> = {
  tabs: DetailPageTab<T>[];
  activeTab: T;
  onChange: (tab: T) => void;
  className?: string;
};

/** Underline tab navigation shared by detail pages (transactions, clients, etc.). */
export default function DetailPageTabNav<T extends string>({
  tabs,
  activeTab,
  onChange,
  className,
}: DetailPageTabNavProps<T>) {
  return (
    <div className={cn('border-b border-border', className)}>
      <nav className="flex gap-[26px] overflow-x-auto" role="tablist">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={cn(
                'relative flex items-center gap-1.5 py-3 text-[13px] font-medium whitespace-nowrap transition-colors',
                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {Icon ? <Icon className="size-3.5" /> : null}
              {tab.label}
              {tab.badge !== undefined && tab.badge !== '' ? (
                <span className="ml-0.5 text-[11px] text-muted-foreground">({tab.badge})</span>
              ) : null}
              {isActive ? (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-brand-500" aria-hidden />
              ) : null}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

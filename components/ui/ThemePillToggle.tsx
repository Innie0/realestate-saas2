'use client';

import clsx from 'clsx';
import { Monitor, Moon, Sun } from 'lucide-react';
import type { DashboardThemePreference } from '@/lib/dashboard-theme';

const OPTIONS: { value: DashboardThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

interface ThemePillToggleProps {
  value: DashboardThemePreference;
  onChange: (value: DashboardThemePreference) => void;
  className?: string;
}

/** Instantly-style Light / Dark / System segmented theme control. */
export default function ThemePillToggle({ value, onChange, className }: ThemePillToggleProps) {
  return (
    <div className={clsx('space-y-2', className)}>
      <p className="px-1 text-[11px] font-medium text-muted-foreground">Theme</p>
      <div
        className="flex rounded-lg border border-border bg-muted/60 p-0.5"
        role="radiogroup"
        aria-label="Theme"
      >
        {OPTIONS.map(({ value: optionValue, label, icon: Icon }) => {
          const active = value === optionValue;
          return (
            <button
              key={optionValue}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(optionValue)}
              className={clsx(
                'flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11.5px] font-medium transition-all',
                active
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-3 shrink-0" strokeWidth={1.75} />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

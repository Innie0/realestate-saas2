'use client';

import Link from 'next/link';
import { Inbox, Megaphone, Zap } from 'lucide-react';
import clsx from 'clsx';

export type LeadsTab = 'inbox' | 'capture' | 'automations';

const SWITCHER_TABS: { id: LeadsTab; label: string; icon: React.ElementType }[] = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'capture', label: 'Capture', icon: Megaphone },
  { id: 'automations', label: 'Automations', icon: Zap },
];

interface LeadsSectionSwitcherProps {
  active: LeadsTab;
  /** If provided, renders as in-page tab buttons. Otherwise renders as links back to the main Leads hub. */
  onChange?: (tab: LeadsTab) => void;
  className?: string;
}

/**
 * The Inbox / Capture / Automations section switcher shared by the main Leads
 * hub and its Capture sub-pages (Open Houses, Booking Link, Agent Profile),
 * so the switcher stays visible and consistent while navigating the section.
 */
export default function LeadsSectionSwitcher({ active, onChange, className }: LeadsSectionSwitcherProps) {
  return (
    <div className={clsx('inline-flex gap-1 rounded-lg bg-gray-100 p-1', className)} role="tablist">
      {SWITCHER_TABS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        const sharedClass = clsx(
          'flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-colors',
          isActive ? 'bg-brand-500 text-white' : 'text-gray-600 hover:text-gray-900'
        );

        if (onChange) {
          return (
            <button key={id} type="button" role="tab" aria-selected={isActive} onClick={() => onChange(id)} className={sharedClass}>
              <Icon className="w-3.5 h-3.5" strokeWidth={1.9} />
              <span>{label}</span>
            </button>
          );
        }

        return (
          <Link key={id} href={`/dashboard/leads?tab=${id}`} role="tab" aria-selected={isActive} className={sharedClass}>
            <Icon className="w-3.5 h-3.5" strokeWidth={1.9} />
            <span>{label}</span>
          </Link>
        );
      })}
    </div>
  );
}

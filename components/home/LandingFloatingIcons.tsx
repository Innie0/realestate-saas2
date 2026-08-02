'use client';

import { Sparkles, FileText, Search, Inbox, Users, ClipboardCheck, Megaphone, CalendarDays } from 'lucide-react';

const FLOATING_ICONS = [
  { icon: Sparkles, label: 'AI Assistant', bg: '#3548C7', rotate: -8, position: 'top-[8%] left-[6%]' },
  { icon: FileText, label: 'Listing copy', bg: '#6E7CF2', rotate: 10, position: 'top-[4%] left-[24%]' },
  { icon: Search, label: 'Property Research', bg: '#1C1D22', rotate: -6, position: 'top-[10%] right-[26%]' },
  { icon: Inbox, label: 'Leads Inbox', bg: '#28348A', rotate: 12, position: 'top-[6%] right-[6%]' },
  { icon: Users, label: 'CRM', bg: '#A5B4FC', rotate: -10, position: 'bottom-[8%] left-[10%]' },
  { icon: ClipboardCheck, label: 'Transactions', bg: '#3548C7', rotate: 8, position: 'bottom-[4%] left-[28%]' },
  { icon: Megaphone, label: 'Ads', bg: '#1C1D22', rotate: -12, position: 'bottom-[10%] right-[24%]' },
  { icon: CalendarDays, label: 'Calendar', bg: '#6E7CF2', rotate: 9, position: 'bottom-[6%] right-[8%]' },
];

export function LandingFloatingIcons() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden>
      {FLOATING_ICONS.map(({ icon: Icon, bg, rotate, position }, i) => (
        <div
          key={i}
          className={`absolute ${position} flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm`}
          style={{ backgroundColor: bg, transform: `rotate(${rotate}deg)` }}
        >
          <Icon className="h-5 w-5 text-white" strokeWidth={2} />
        </div>
      ))}
    </div>
  );
}

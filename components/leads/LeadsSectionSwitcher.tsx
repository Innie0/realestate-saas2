'use client';

import { Inbox, Megaphone, Zap } from 'lucide-react';
import SegmentedControl from '@/components/ui/SegmentedControl';
import type { Segment } from '@/components/ui/SegmentedControl';

export type LeadsTab = 'inbox' | 'capture' | 'automations';

const SWITCHER_SEGMENTS: Segment<LeadsTab>[] = [
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
 * hub and its Capture sub-pages (Open Houses, Booking Link, Agent Profile).
 */
export default function LeadsSectionSwitcher({ active, onChange, className }: LeadsSectionSwitcherProps) {
  const segments = onChange
    ? SWITCHER_SEGMENTS
    : SWITCHER_SEGMENTS.map((s) => ({ ...s, href: `/dashboard/leads?tab=${s.id}` }));

  return (
    <SegmentedControl
      layoutId="leads-section-switcher"
      segments={segments}
      value={active}
      onChange={onChange}
      size="md"
      className={className}
    />
  );
}

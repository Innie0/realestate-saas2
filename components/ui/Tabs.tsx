'use client';

import SegmentedControl, {
  type Segment,
  type Segment as TabItem,
} from '@/components/ui/SegmentedControl';

export type { TabItem };

interface TabsProps<T extends string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  className?: string;
  hideLabelsOnMobile?: boolean;
  layoutId?: string;
}

/** @deprecated Prefer SegmentedControl directly. Thin wrapper for legacy tab API. */
export default function Tabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  className,
  hideLabelsOnMobile,
  layoutId = 'tabs-active-pill',
}: TabsProps<T>) {
  const segments: Segment<T>[] = hideLabelsOnMobile
    ? tabs.map(({ id, label, icon }) => ({
        id,
        label: undefined,
        icon,
        ariaLabel: label,
      }))
    : tabs;

  return (
    <SegmentedControl
      layoutId={layoutId}
      segments={segments}
      value={activeTab}
      onChange={onChange}
      className={className}
      size="md"
    />
  );
}

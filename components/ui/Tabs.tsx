'use client';

import clsx from 'clsx';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ElementType<{ className?: string; strokeWidth?: number }>;
}

interface TabsProps<T extends string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  className?: string;
  hideLabelsOnMobile?: boolean;
}

export default function Tabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  className,
  hideLabelsOnMobile = false,
}: TabsProps<T>) {
  return (
    <div
      className={clsx(
        'flex gap-1 p-1 bg-gray-100 border border-gray-200 rounded-xl',
        className
      )}
      role="tablist"
    >
      {tabs.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              active
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            )}
          >
            {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
            <span className={hideLabelsOnMobile ? 'hidden sm:inline' : undefined}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

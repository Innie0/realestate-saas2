// Switch component - Reusable on/off toggle
// Graphite track when on, white knob — matches the "console" design system

import React from 'react';
import clsx from 'clsx';

interface SwitchProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label?: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export default function Switch({
  checked,
  onChange,
  disabled = false,
  label,
  title,
  size = 'md',
  className,
}: SwitchProps) {
  const dims = size === 'sm'
    ? { track: 'h-5 w-9', knob: 'h-4 w-4', translate: 'translate-x-4' }
    : { track: 'h-7 w-12', knob: 'h-5 w-5', translate: 'translate-x-6' };

  return (
    <label className={clsx('inline-flex items-center gap-2.5 select-none', disabled ? 'cursor-not-allowed' : 'cursor-pointer', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={typeof label === 'string' ? label : 'Toggle'}
        title={title}
        disabled={disabled}
        onClick={onChange}
        className={clsx(
          'relative inline-flex shrink-0 items-center rounded-full transition-colors duration-150',
          dims.track,
          checked ? 'bg-brand-500' : 'bg-gray-200',
          disabled ? 'opacity-60 cursor-not-allowed' : ''
        )}
      >
        <span
          className={clsx(
            'inline-block transform rounded-full bg-white shadow transition-transform duration-150',
            dims.knob,
            checked ? dims.translate : 'translate-x-1'
          )}
        />
      </button>
      {label && <span className="text-[13px] font-medium text-gray-900">{label}</span>}
    </label>
  );
}

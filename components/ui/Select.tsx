'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

interface SelectProps {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  id?: string;
  name?: string;
  className?: string;
  triggerClassName?: string;
  triggerProps?: Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    'type' | 'children' | 'disabled' | 'onClick' | 'onKeyDown' | 'id' | 'role' | 'aria-expanded' | 'aria-haspopup' | 'aria-controls' | 'aria-invalid'
  >;
  /** Shortcut for product tour targeting */
  'data-tour'?: string;
}

export default function Select({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select…',
  disabled = false,
  required = false,
  error,
  helperText,
  id,
  name,
  className,
  triggerClassName,
  triggerProps,
  'data-tour': dataTour,
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const listboxId = `${selectId}-listbox`;

  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const enabledOptions = options.filter((o) => !o.disabled);
  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption?.label ?? (value ? value : placeholder);

  const close = () => {
    setOpen(false);
    setHighlightIndex(-1);
  };

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        close();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const selectedIndex = enabledOptions.findIndex((o) => o.value === value);
    setHighlightIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [open, value, enabledOptions]);

  const selectValue = (next: string) => {
    onChange(next);
    close();
    triggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
      } else if (event.key === 'Enter' && highlightIndex >= 0) {
        selectValue(enabledOptions[highlightIndex].value);
      }
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }

      setHighlightIndex((prev) => {
        if (enabledOptions.length === 0) return -1;
        const delta = event.key === 'ArrowDown' ? 1 : -1;
        const next = prev + delta;
        if (next < 0) return enabledOptions.length - 1;
        if (next >= enabledOptions.length) return 0;
        return next;
      });
      return;
    }
  };

  const triggerClasses = clsx(
    'flex w-full items-center justify-between gap-2 text-left text-sm transition-colors duration-150',
    'rounded-lg border bg-[var(--surface)] text-gray-900',
    'focus:outline-none focus:ring-2 focus:ring-brand-500/30',
    error
      ? 'border-red-300 focus:ring-red-200'
      : 'border-gray-200',
    disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-gray-300',
    !selectedOption && !value && 'text-gray-400',
    triggerClassName,
  );

  return (
    <div className={clsx('relative', className)} ref={containerRef}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-gray-700"> *</span>}
        </label>
      )}

      {name && (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required}
          tabIndex={-1}
          aria-hidden
        />
      )}

      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-invalid={error ? true : undefined}
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        className={clsx(triggerClasses, 'px-3 py-2.5')}
        data-tour={dataTour}
        {...triggerProps}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          className={clsx('h-4 w-4 shrink-0 text-gray-400 transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-labelledby={label ? selectId : undefined}
          className="absolute z-50 mt-1.5 max-h-60 w-full overflow-auto rounded-xl border border-gray-200 bg-[var(--surface)] py-1 shadow-overlay"
        >
          {options.map((option) => {
            const enabledIndex = enabledOptions.indexOf(option);
            const isSelected = option.value === value;
            const isHighlighted = enabledIndex === highlightIndex;

            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled || undefined}
                onMouseEnter={() => {
                  if (!option.disabled && enabledIndex >= 0) {
                    setHighlightIndex(enabledIndex);
                  }
                }}
                onClick={() => {
                  if (!option.disabled) selectValue(option.value);
                }}
                className={clsx(
                  'flex cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-sm transition-colors',
                  option.disabled && 'cursor-not-allowed opacity-40',
                  !option.disabled && isHighlighted && 'bg-brand-50 text-brand-900',
                  !option.disabled && !isHighlighted && 'text-gray-900 hover:bg-gray-50',
                  isSelected && !isHighlighted && 'font-medium',
                )}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />}
              </li>
            );
          })}
        </ul>
      )}

      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
      {!error && helperText && <p className="mt-1.5 text-xs text-gray-700">{helperText}</p>}
    </div>
  );
}

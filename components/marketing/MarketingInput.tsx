'use client';

import { useRef } from 'react';
import clsx from 'clsx';
import { ensureGsapRegistered, gsap, useGSAP } from '@/lib/gsap-config';
import { mktVar } from '@/lib/mkt-css';
import { useMotionReduced } from '@/lib/motion';

type MarketingInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  helperText?: string;
};

ensureGsapRegistered();

export default function MarketingInput({
  label,
  error,
  helperText,
  className,
  id,
  ...props
}: MarketingInputProps) {
  const reduced = useMotionReduced();
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputId = id || `mkt-input-${label?.toLowerCase().replace(/\s+/g, '-') ?? 'field'}`;

  useGSAP(
    () => {
      if (reduced || !wrapRef.current) return;
      const input = wrapRef.current.querySelector('input');
      if (!input) return;

      const onFocus = () => {
        gsap.to(input, {
          borderColor: mktVar('--mkt-text-primary'),
          duration: 0.2,
          ease: 'power2.out',
        });
      };
      const onBlur = () => {
        gsap.to(input, {
          borderColor: error ? mktVar('--mkt-error-border') : mktVar('--mkt-border'),
          duration: 0.2,
          ease: 'power2.out',
        });
      };

      input.addEventListener('focus', onFocus);
      input.addEventListener('blur', onBlur);
      return () => {
        input.removeEventListener('focus', onFocus);
        input.removeEventListener('blur', onBlur);
      };
    },
    { scope: wrapRef, dependencies: [reduced, error] },
  );

  return (
    <div ref={wrapRef} className="w-full">
      {label ? (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-mkt-foreground">
          {label}
        </label>
      ) : null}

      <input
        id={inputId}
        className={clsx('mkt-input', error && 'border-[var(--mkt-error-border)]', className)}
        aria-invalid={error ? true : undefined}
        {...props}
      />

      {error ? (
        <p className="mt-1.5 text-sm text-mkt-tag-amber-text" role="alert">
          {error}
        </p>
      ) : null}

      {helperText && !error ? (
        <p className="mt-1.5 text-sm text-mkt-secondary">{helperText}</p>
      ) : null}
    </div>
  );
}

'use client';

import clsx from 'clsx';

type AuthAlertProps = {
  children: React.ReactNode;
  variant?: 'error' | 'info';
};

export default function AuthAlert({ children, variant = 'error' }: AuthAlertProps) {
  const isError = variant === 'error';

  return (
    <div
      role="alert"
      className={clsx(
        'mb-5 rounded-mkt-button px-4 py-3 text-sm leading-snug',
        isError
          ? 'border border-[var(--mkt-error-surface-border)] bg-mkt-tag-amber-bg text-mkt-tag-amber-text'
          : 'border border-mkt-border bg-mkt-surface-muted text-mkt-secondary',
      )}
    >
      {children}
    </div>
  );
}

'use client';

import clsx from 'clsx';
import { MKT } from '@/lib/marketing-design';

type AuthAlertProps = {
  children: React.ReactNode;
  variant?: 'error' | 'info';
};

export default function AuthAlert({ children, variant = 'error' }: AuthAlertProps) {
  const isError = variant === 'error';

  return (
    <div
      role="alert"
      className={clsx('mb-5 px-4 py-3 text-sm leading-snug')}
      style={{
        borderRadius: MKT.radius.button,
        border: `1px solid ${isError ? '#e8c4c4' : MKT.border}`,
        backgroundColor: isError ? MKT.tag.amber.bg : MKT.surfaceMuted,
        color: isError ? MKT.tag.amber.text : MKT.textSecondary,
      }}
    >
      {children}
    </div>
  );
}

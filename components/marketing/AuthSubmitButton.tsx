'use client';

import clsx from 'clsx';
import { MKT } from '@/lib/marketing-design';

type AuthSubmitButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  loadingLabel?: string;
};

export default function AuthSubmitButton({
  children,
  isLoading = false,
  loadingLabel,
  className,
  disabled,
  ...props
}: AuthSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled || isLoading}
      className={clsx(
        'mkt-cta flex w-full items-center justify-center gap-2 py-3 text-sm font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
      style={{ borderRadius: MKT.radius.button }}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          {loadingLabel ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}

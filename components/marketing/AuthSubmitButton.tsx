'use client';

import clsx from 'clsx';

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
        'flex w-full items-center justify-center gap-2 rounded-mkt-button bg-[#0668E1] py-3 text-sm font-medium text-white transition-colors hover:bg-[#0450b0] disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
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

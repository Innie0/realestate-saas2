// Button component - Reusable button with different variants and sizes
// This component provides a consistent button style across the app

import React from 'react';
import clsx from 'clsx';

/**
 * ButtonProps - Props for the Button component
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode; // Button text or content
  variant?: 'primary' | 'secondary' | 'outline' | 'outline-light' | 'white' | 'danger'; // Button style variant
  size?: 'sm' | 'md' | 'lg'; // Button size
  fullWidth?: boolean; // Whether button should take full width
  isLoading?: boolean; // Show loading state
}

/**
 * Button component
 * A flexible button component with multiple variants and sizes
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  // Base styles applied to all buttons — compact, crisp, no bounce
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg whitespace-nowrap select-none transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation';

  // Variant styles
  const variants = {
    primary: 'bg-brand-500 text-white hover:bg-brand-600 focus-visible:ring-brand-400/40 shadow-glow-brand hover:shadow-sm active:shadow-none',
    secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus-visible:ring-gray-300/60',
    outline: 'text-gray-700 bg-white ring-1 ring-inset ring-gray-300/70 hover:bg-gray-50 hover:ring-gray-400/60 focus-visible:ring-brand-400/30 shadow-sm',
    'outline-light': 'text-brand-700 bg-white ring-1 ring-inset ring-brand-300 hover:bg-brand-50 focus-visible:ring-brand-400/30',
    white: 'bg-white text-gray-900 hover:bg-gray-50 focus-visible:ring-gray-300/60 shadow-sm',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-400/40 shadow-sm',
  };

  // Size styles — fixed control heights keep buttons aligned with inputs
  const sizes = {
    sm: 'h-8 px-3 text-[13px]',
    md: 'h-9 px-4 text-sm',
    lg: 'h-11 px-5 text-[15px] font-semibold',
  };

  // Combine all styles using clsx utility
  const buttonClasses = clsx(
    baseStyles,
    variants[variant],
    sizes[size],
    fullWidth && 'w-full',
    className
  );

  return (
    <button
      className={buttonClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Show loading spinner if isLoading is true */}
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}


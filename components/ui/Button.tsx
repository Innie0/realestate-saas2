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
  // Base styles applied to all buttons
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg min-h-[44px] touch-manipulation';

  // Variant styles - different colors for different button types with gradients
  const variants = {
    primary: 'bg-gradient-to-r from-black via-gray-900 to-black text-white hover:from-gray-900 hover:via-gray-800 hover:to-gray-900 focus:ring-gray-400',
    secondary: 'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800 focus:ring-gray-500',
    outline: 'border-2 border-white text-white hover:bg-white/10 focus:ring-gray-400',
    'outline-light': 'border-2 border-white text-white hover:bg-white hover:text-black focus:ring-gray-400',
    white: 'bg-gradient-to-r from-white to-gray-50 text-black hover:from-gray-100 hover:to-gray-200 focus:ring-gray-400 border border-gray-200',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 focus:ring-red-500',
  };

  // Size styles - different padding for different sizes
  const sizes = {
    sm: 'px-3 sm:px-4 py-2 text-sm',
    md: 'px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base',
    lg: 'px-6 sm:px-8 py-3 sm:py-4 text-base font-semibold',
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


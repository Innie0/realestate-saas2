// Input component - Reusable text input field
// This component provides a consistent input style with label and error handling

import React from 'react';
import clsx from 'clsx';

/**
 * InputProps - Props for the Input component
 */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; // Optional label text
  error?: string; // Error message to display
  helperText?: string; // Helper text to display below input
}

/**
 * Input component
 * A flexible input field with label, error, and helper text support
 */
export default function Input({
  label,
  error,
  helperText,
  className,
  id,
  ...props
}: InputProps) {
  // Generate a unique ID if not provided
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  // Base input styles with gradient background
  const baseStyles = 'block w-full rounded-lg border px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 bg-white/10 backdrop-blur-sm border-white/20';

  // Conditional styles based on error state
  const inputClasses = clsx(
    baseStyles,
    error
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-gradient-to-r from-red-50 to-white' // Error state styles
      : 'border-gray-200 focus:border-black focus:ring-gray-400 hover:border-gray-300', // Normal state styles
    className
  );

  return (
    <div className="w-full">
      {/* Label - only shown if label prop is provided */}
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-white mb-1"
        >
          {label}
        </label>
      )}

      {/* Input field */}
      <input
        id={inputId}
        className={inputClasses}
        {...props}
      />

      {/* Error message - only shown if error prop is provided */}
      {error && (
        <p className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Helper text - only shown if helperText prop is provided and no error */}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
}


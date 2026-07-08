// Card component - Reusable card container
// This component provides a consistent card style for displaying content

import React from 'react';
import clsx from 'clsx';

/**
 * CardProps - Props for the Card component
 */
interface CardProps {
  children: React.ReactNode; // Card content
  className?: string; // Additional CSS classes
  padding?: 'none' | 'sm' | 'md' | 'lg'; // Padding size
  hover?: boolean; // Whether to show hover effect
}

/**
 * Card component
 * A container component with shadow and rounded corners
 */
export default function Card({
  children,
  className,
  padding = 'md',
  hover = false,
}: CardProps) {
  // Base card styles — soft surface with hairline ring (matches Surface)
  const baseStyles = 'rounded-2xl relative bg-white ring-1 ring-gray-900/[0.04] shadow-surface';
  const cardStyle = {};

  // Padding options
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  // Hover effect - adds subtle lift on hover
  const hoverStyles = hover ? 'transition-all duration-200 hover:shadow-raised hover:ring-gray-900/[0.07] hover:-translate-y-px cursor-pointer' : '';

  // Combine all styles
  const cardClasses = clsx(
    baseStyles,
    paddingStyles[padding],
    hoverStyles,
    className
  );

  return (
    <div className={cardClasses} style={cardStyle}>
      {children}
    </div>
  );
}


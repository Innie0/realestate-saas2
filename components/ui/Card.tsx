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
  // Base card styles — soft surface, minimal border
  const baseStyles = 'rounded-2xl relative bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]';
  const cardStyle = {};

  // Padding options
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  // Hover effect - adds subtle lift and glow on hover
  const hoverStyles = hover ? 'transition-all duration-200 hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.06)] cursor-pointer' : '';

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


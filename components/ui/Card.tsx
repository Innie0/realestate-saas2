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
  // Base card styles with dark theme and glassmorphism effect
  const baseStyles = 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl border border-white/10 relative';

  // Padding options
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  // Hover effect - adds subtle lift and glow on hover
  const hoverStyles = hover ? 'transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:border-white/20 hover:shadow-xl hover:shadow-purple-500/10 cursor-pointer' : '';

  // Combine all styles
  const cardClasses = clsx(
    baseStyles,
    paddingStyles[padding],
    hoverStyles,
    className
  );

  return (
    <div className={cardClasses}>
      {children}
    </div>
  );
}


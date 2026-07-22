'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { ShadcnButton, shadcnButtonVariants } from '@/components/ui/shadcn-button';
import { cn } from '@/lib/utils';

type AppVariant = 'primary' | 'secondary' | 'outline' | 'outline-light' | 'white' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: AppVariant;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
}

const variantMap: Record<AppVariant, React.ComponentProps<typeof ShadcnButton>['variant']> = {
  primary: 'default',
  secondary: 'secondary',
  outline: 'outline',
  'outline-light': 'outline',
  white: 'outline',
  danger: 'destructive',
};

const sizeMap = {
  sm: 'sm',
  md: 'default',
  lg: 'lg',
} as const;

const extraVariantClasses: Partial<Record<AppVariant, string>> = {
  'outline-light': 'text-brand-400 border-brand-300 hover:bg-brand-50',
  white: 'bg-card text-foreground',
};

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
  return (
    <ShadcnButton
      variant={variantMap[variant]}
      size={sizeMap[size]}
      className={cn(extraVariantClasses[variant], fullWidth && 'w-full', className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
      {children}
    </ShadcnButton>
  );
}

export { shadcnButtonVariants as buttonVariants } from '@/components/ui/shadcn-button';

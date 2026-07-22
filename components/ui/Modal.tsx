'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-[35rem]',
  xl: 'max-w-4xl',
};

/** App modal — shadcn Dialog with the legacy isOpen/onClose API. */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          'max-h-[90vh] overflow-y-auto gap-0 p-0 sm:rounded-lg',
          sizeClasses[size],
        )}
      >
        <DialogHeader className="border-b border-border px-5 py-4 text-left sm:px-6">
          <DialogTitle className="font-display text-base">{title}</DialogTitle>
        </DialogHeader>
        <div className="px-5 py-5 sm:px-6">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

// Modal component - Reusable modal dialog
// Used for displaying forms and dialogs

'use client';

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { modalBackdrop, modalContent, useMotionReduced } from '@/lib/motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: ModalProps) {
  const reduced = useMotionReduced();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-[35rem]',
    xl: 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <motion.div
            className="fixed inset-0 bg-gray-950/30 backdrop-blur-[2px]"
            variants={reduced ? undefined : modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
          />

          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              className={`relative w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--surface)] shadow-overlay ring-1 ring-white/[0.08]`}
              variants={reduced ? undefined : modalContent}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-gray-200 bg-[var(--surface)] px-5 pb-4 pt-5 sm:px-6">
                <h3 className="pr-2 text-base font-semibold tracking-tight text-gray-900">{title}</h3>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="-m-1.5 flex-shrink-0 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                >
                  <X className="w-[18px] h-[18px]" />
                </button>
              </div>

              <div className="px-5 sm:px-6 py-5">{children}</div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

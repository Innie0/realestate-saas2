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
    lg: 'max-w-2xl',
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
              className={`relative w-full ${sizeClasses[size]} rounded-2xl ring-1 ring-gray-900/[0.06] shadow-overlay max-h-[90vh] overflow-y-auto bg-white`}
              variants={reduced ? undefined : modalContent}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-4 border-b border-gray-100 sticky top-0 z-10 bg-white rounded-t-2xl">
                <h3 className="text-base font-semibold tracking-tight text-gray-900 pr-2">{title}</h3>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="-m-1.5 rounded-md p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
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

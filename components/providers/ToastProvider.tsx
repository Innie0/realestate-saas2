'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import clsx from 'clsx';

export type ToastVariant = 'success' | 'error' | 'info';

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  toast: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLES: Record<
  ToastVariant,
  { container: string; icon: React.ElementType; iconClass: string }
> = {
  success: {
    container: 'border-green-200 bg-green-50 text-green-900',
    icon: CheckCircle2,
    iconClass: 'text-green-600',
  },
  error: {
    container: 'border-red-200 bg-red-50 text-red-900',
    icon: AlertCircle,
    iconClass: 'text-red-600',
  },
  info: {
    container: 'border-gray-200 bg-[var(--surface)] text-gray-900',
    icon: Info,
    iconClass: 'text-brand-600',
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev.slice(-2), { id, message, variant }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (message) => toast(message, 'success'),
      error: (message) => toast(message, 'error'),
      info: (message) => toast(message, 'info'),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-[100] flex flex-col gap-2 sm:max-w-sm"
        aria-live="polite"
      >
        {toasts.map((item) => {
          const styles = VARIANT_STYLES[item.variant];
          const Icon = styles.icon;
          return (
            <div
              key={item.id}
              className={clsx(
                'pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg',
                styles.container,
              )}
              role="status"
            >
              <Icon className={clsx('w-5 h-5 shrink-0 mt-0.5', styles.iconClass)} />
              <p className="text-sm flex-1 leading-snug">{item.message}</p>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="shrink-0 text-current opacity-60 hover:opacity-100"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

const noopToast = () => undefined;

const FALLBACK_TOAST: ToastContextValue = {
  toast: noopToast,
  success: noopToast,
  error: noopToast,
  info: noopToast,
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  return ctx ?? FALLBACK_TOAST;
}

'use client';

import SWRProvider from '@/components/providers/SWRProvider';
import { ToastProvider } from '@/components/providers/ToastProvider';

export default function DashboardProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <SWRProvider>{children}</SWRProvider>
    </ToastProvider>
  );
}

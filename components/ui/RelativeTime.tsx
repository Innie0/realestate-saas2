'use client';

import { useMounted } from '@/hooks/useMounted';

function formatRelativeTime(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatStableDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

type RelativeTimeProps = {
  dateStr: string;
  className?: string;
};

/** Relative timestamp that avoids hydration mismatches from Date.now(). */
export default function RelativeTime({ dateStr, className }: RelativeTimeProps) {
  const mounted = useMounted();
  const label = mounted ? formatRelativeTime(dateStr) : formatStableDate(dateStr);

  return (
    <span className={className} suppressHydrationWarning>
      {label}
    </span>
  );
}

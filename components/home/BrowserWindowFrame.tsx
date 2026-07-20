'use client';

import { MKT } from '@/lib/marketing-design';

type BrowserWindowFrameProps = {
  children: React.ReactNode;
  className?: string;
};

/** Framer-style browser chrome — 32px bar, 3 dots, no shadow */
export default function BrowserWindowFrame({ children, className = '' }: BrowserWindowFrameProps) {
  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{
        borderRadius: MKT.radius.browser,
        border: `1px solid ${MKT.border}`,
        backgroundColor: MKT.surface,
      }}
    >
      <div
        className="flex items-center gap-2 px-2"
        style={{ height: 32, borderBottom: `1px solid ${MKT.border}` }}
        aria-hidden
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="rounded-full"
            style={{ width: 8, height: 8, backgroundColor: MKT.browserDot }}
          />
        ))}
      </div>
      <div style={{ backgroundColor: MKT.mockSurface }}>{children}</div>
    </div>
  );
}

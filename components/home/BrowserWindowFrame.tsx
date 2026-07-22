'use client';

type BrowserWindowFrameProps = {
  children: React.ReactNode;
  className?: string;
};

/** Framer-style browser chrome — 32px bar, 3 dots, no shadow */
export default function BrowserWindowFrame({ children, className = '' }: BrowserWindowFrameProps) {
  return (
    <div className={`overflow-hidden rounded-mkt-browser border border-mkt-border bg-mkt-surface ${className}`}>
      <div
        className="flex h-8 items-center gap-2 border-b border-mkt-border px-2"
        aria-hidden
      >
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-2 rounded-full bg-mkt-dot" />
        ))}
      </div>
      <div className="bg-mkt-mock">{children}</div>
    </div>
  );
}

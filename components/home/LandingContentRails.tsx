import type { ReactNode } from 'react';

type LandingContentRailsProps = {
  children: ReactNode;
};

/** Attio-style vertical borders on the content column (sections after hero). */
export default function LandingContentRails({ children }: LandingContentRailsProps) {
  return (
    <div className="relative mx-auto w-full max-w-mkt-content border-x border-mkt-border">
      {children}
    </div>
  );
}

import Link from 'next/link';
import MarketingFooterColumns from '@/components/marketing/MarketingFooterColumns';

export default function LandingFooter() {
  return (
    <footer className="border-t border-mkt-border bg-mkt-background">
      <div className="mx-auto max-w-mkt-content px-5 py-14 sm:px-8 lg:py-16">
        <MarketingFooterColumns
          brand={
            <>
              <Link
                href="/"
                className="font-display text-3xl font-medium tracking-[-0.03em] text-mkt-foreground transition-opacity hover:opacity-70 sm:text-4xl"
              >
                Oikaro
              </Link>
              <p className="mt-3 max-w-xs text-sm leading-[1.6] text-mkt-secondary">
                One workspace for listings, leads, clients, and transactions.
              </p>
            </>
          }
        />
      </div>
    </footer>
  );
}

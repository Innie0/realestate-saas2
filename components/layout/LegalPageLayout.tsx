import MarketingPageHeader from '@/components/marketing/MarketingPageHeader';

interface LegalPageLayoutProps {
  title: string;
  updated?: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function LegalPageLayout({
  title,
  updated,
  subtitle,
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="marketing-root min-h-screen bg-mkt-background text-mkt-foreground">
      <MarketingPageHeader />

      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 lg:py-14">
        <article className="rounded-mkt-card border border-mkt-border bg-mkt-surface p-8 lg:p-12">
          <header className="mb-10 border-b border-mkt-border pb-8">
            <h1 className="font-display text-3xl font-medium tracking-[-0.03em] text-mkt-foreground sm:text-4xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-3 text-base leading-[1.65] text-mkt-secondary">{subtitle}</p>
            ) : updated ? (
              <p className="mt-3 text-sm text-mkt-secondary">Last updated: {updated}</p>
            ) : null}
          </header>

          <div className="legal-prose">{children}</div>

          <footer className="mt-12 border-t border-mkt-border pt-8 text-center text-xs text-mkt-secondary">
            <p>© 2026 Oikaro. All rights reserved.</p>
          </footer>
        </article>
      </main>
    </div>
  );
}

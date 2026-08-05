import MarketingPageHeader from '@/components/marketing/MarketingPageHeader';
import MarketingSubpageFooter from '@/components/marketing/MarketingSubpageFooter';

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
    <div className="marketing-root min-h-screen bg-white text-mkt-foreground">
      <MarketingPageHeader />

      <main className="mx-auto max-w-3xl px-5 py-14 sm:px-8 lg:py-20">
        <header className="mb-12">
          <h1 className="font-display text-5xl font-semibold tracking-[-0.03em] text-mkt-foreground sm:text-6xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-5 text-base leading-[1.65] text-mkt-secondary">{subtitle}</p>
          ) : updated ? (
            <p className="mt-5 text-sm text-mkt-secondary">Last updated: {updated}</p>
          ) : null}
        </header>

        <div className="legal-prose">{children}</div>
      </main>

      <MarketingSubpageFooter />
    </div>
  );
}

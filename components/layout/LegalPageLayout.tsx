import MarketingPageHeader from '@/components/marketing/MarketingPageHeader';
import { MKT } from '@/lib/marketing-design';

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
    <div className="marketing-root min-h-screen" style={{ backgroundColor: MKT.background }}>
      <MarketingPageHeader />

      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 lg:py-14">
        <article
          className="p-8 lg:p-12"
          style={{
            borderRadius: MKT.radius.card,
            border: `1px solid ${MKT.border}`,
            backgroundColor: MKT.surface,
          }}
        >
          <header className="mb-10 border-b pb-8" style={{ borderColor: MKT.border }}>
            <h1
              className="font-display text-3xl font-medium tracking-[-0.03em] sm:text-4xl"
              style={{ color: MKT.textPrimary }}
            >
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-3 text-base leading-[1.65]" style={{ color: MKT.textSecondary }}>
                {subtitle}
              </p>
            ) : updated ? (
              <p className="mt-3 text-sm" style={{ color: MKT.textSecondary }}>
                Last updated: {updated}
              </p>
            ) : null}
          </header>

          <div className="legal-prose">{children}</div>

          <footer
            className="mt-12 border-t pt-8 text-center text-xs"
            style={{ borderColor: MKT.border, color: MKT.textSecondary }}
          >
            <p>© 2026 Oikaro. All rights reserved.</p>
          </footer>
        </article>
      </main>
    </div>
  );
}

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, LucideIcon } from 'lucide-react';
import { MKT } from '@/lib/marketing-design';

interface LegalPageLayoutProps {
  title: string;
  updated?: string;
  subtitle?: string;
  icon: LucideIcon;
  children: React.ReactNode;
}

export default function LegalPageLayout({
  title,
  updated,
  subtitle,
  icon: Icon,
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="marketing-root min-h-screen font-sans" style={{ backgroundColor: MKT.background }}>
      <header
        className="sticky top-0 z-10"
        style={{ borderBottom: `1px solid ${MKT.border}`, backgroundColor: MKT.surface }}
      >
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
              style={{ color: MKT.textSecondary }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <Image src="/logo.png" alt="Oikaro" width={140} height={42} priority className="h-8 w-auto" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 lg:px-8 lg:py-14">
        <article
          className="p-8 lg:p-12"
          style={{
            borderRadius: MKT.radius.card,
            border: `1px solid ${MKT.border}`,
            backgroundColor: MKT.surface,
          }}
        >
          <header className="mb-10 pb-8 border-b" style={{ borderColor: MKT.border }}>
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: MKT.background }}>
                <Icon className="w-6 h-6" strokeWidth={1.5} style={{ color: MKT.textPrimary }} />
              </div>
              <div>
                <h1 className="text-3xl font-medium tracking-[-0.02em]" style={{ color: MKT.textPrimary }}>
                  {title}
                </h1>
                {subtitle ? (
                  <p className="mt-1.5 text-sm leading-[1.6]" style={{ color: MKT.textSecondary }}>
                    {subtitle}
                  </p>
                ) : updated ? (
                  <p className="mt-1.5 text-xs" style={{ color: MKT.textSecondary }}>
                    Last updated: {updated}
                  </p>
                ) : null}
              </div>
            </div>
          </header>
          <div className="legal-prose">{children}</div>
          <footer className="mt-12 pt-8 border-t text-center text-xs" style={{ borderColor: MKT.border, color: MKT.textSecondary }}>
            <p>© 2026 Oikaro. All rights reserved.</p>
          </footer>
        </article>
      </main>
    </div>
  );
}

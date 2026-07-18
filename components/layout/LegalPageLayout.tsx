import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, LucideIcon } from 'lucide-react';

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
    <div className="marketing-root min-h-screen bg-[#F4F4F5] font-sans">
      <header className="sticky top-0 z-10 bg-[#F5F5F5]/90 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <Image
              src="/logo.png"
              alt="Oikaro"
              width={140}
              height={42}
              priority
              className="h-8 w-auto"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 lg:px-8 lg:py-14">
        <article className="rounded-2xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.06)] p-8 lg:p-12">
          <header className="mb-10 pb-8 border-b border-gray-100">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-gray-50">
                <Icon className="w-6 h-6 text-gray-700" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-gray-900">{title}</h1>
                {subtitle ? (
                  <p className="text-[12.5px] text-gray-700 mt-1.5">{subtitle}</p>
                ) : updated ? (
                  <p className="font-mono text-[11px] text-gray-600 mt-1.5">Last updated: {updated}</p>
                ) : null}
              </div>
            </div>
          </header>
          <div className="legal-prose">{children}</div>
          <footer className="mt-12 pt-8 border-t border-gray-100 text-center text-xs text-gray-700">
            <p>© 2026 Oikaro. All rights reserved.</p>
          </footer>
        </article>
      </main>
    </div>
  );
}

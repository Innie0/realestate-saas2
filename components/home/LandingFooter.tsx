import Link from 'next/link';
import MarketingFooterColumns from '@/components/marketing/MarketingFooterColumns';
import { SITE_NAME } from '@/lib/site-config';

export default function LandingFooter() {
  return (
    <footer className="bg-[#0668E1] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-mkt-content px-5 sm:px-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-stretch lg:gap-6">
          <div className="rounded-[28px] bg-white p-8 shadow-[0_24px_60px_-24px_rgba(4,40,90,0.45)] sm:p-10 lg:p-12">
            <MarketingFooterColumns
              brand={
                <>
                  <Link
                    href="/"
                    className="font-display text-3xl font-medium tracking-[-0.03em] text-mkt-foreground transition-opacity hover:opacity-70 sm:text-4xl"
                  >
                    {SITE_NAME}
                  </Link>
                  <p className="mt-3 max-w-xs text-sm leading-[1.6] text-mkt-secondary">
                    One workspace for listings, leads, clients, and transactions.
                  </p>
                </>
              }
            />
          </div>

          <div className="flex flex-col items-start justify-between gap-6 rounded-[28px] border-2 border-dashed border-white/35 p-8 sm:p-10">
            <p className="font-display text-2xl font-medium leading-[1.2] tracking-[-0.02em] text-white">
              Ready to close faster with Oikaro?
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth/login"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[15px] font-semibold text-[#111111] transition-opacity hover:opacity-90"
              >
                Sign in
                <span className="text-[#0668E1]" aria-hidden>
                  →
                </span>
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex h-11 items-center rounded-full bg-[#0A0A0A] px-[22px] text-[15px] font-semibold text-white transition-colors hover:bg-[#262626]"
              >
                Start free trial
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

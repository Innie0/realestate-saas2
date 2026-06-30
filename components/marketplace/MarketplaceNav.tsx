import Link from 'next/link';
import WordmarkLogo from '@/components/branding/WordmarkLogo';

export default function MarketplaceNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-28 items-center justify-between gap-4">
          <div className="flex items-center gap-6 lg:gap-8 min-w-0">
            <WordmarkLogo />
            <nav className="hidden xl:flex items-center gap-6 text-sm font-medium text-gray-700 shrink-0">
              <Link href="/" className="hover:text-brand-600 transition-colors whitespace-nowrap">
                For Sale
              </Link>
              <Link href="/for-agents" className="hover:text-brand-600 transition-colors whitespace-nowrap">
                For Agents
              </Link>
              <Link href="/about" className="hover:text-brand-600 transition-colors whitespace-nowrap">
                About
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Link
              href="/auth/signup"
              className="hidden sm:inline-flex text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors whitespace-nowrap"
            >
              Add listing
            </Link>
            <span className="hidden sm:block h-5 w-px bg-gray-200" aria-hidden />
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-lg border border-brand-500 px-4 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50 transition-colors whitespace-nowrap"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

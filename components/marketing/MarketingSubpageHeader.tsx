import Link from 'next/link';

export default function MarketingSubpageHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-[#F5F5F5]/95 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:h-24 lg:px-8">
        <Link
          href="/"
          className="font-mono text-[1.35rem] font-semibold tracking-[-0.04em] text-gray-900 sm:text-[1.5rem]"
        >
          Oikaro
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/products"
            className="hidden text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 sm:inline"
          >
            Products
          </Link>
          <Link
            href="/pricing"
            className="hidden text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 sm:inline"
          >
            Pricing
          </Link>
          <Link
            href="/auth/login"
            className="px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:text-brand-600"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

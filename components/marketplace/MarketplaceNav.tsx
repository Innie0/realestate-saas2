import Link from 'next/link';
import Image from 'next/image';

export default function MarketplaceNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-[4.5rem] items-center justify-between gap-4">
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/logo-wordmark.png"
              alt="Realestic"
              width={800}
              height={240}
              priority
              className="h-9 sm:h-10 w-auto object-contain"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/for-agents" className="hover:text-brand-600 transition-colors">
              For Agents
            </Link>
            <Link href="/pricing" className="hover:text-brand-600 transition-colors">
              Pricing
            </Link>
            <Link href="/about" className="hover:text-brand-600 transition-colors">
              About
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/auth/signup"
              className="hidden sm:inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              List a property
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-lg px-3 sm:px-4 py-2 text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/for-agents"
              className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-3 sm:px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
            >
              For Agents
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

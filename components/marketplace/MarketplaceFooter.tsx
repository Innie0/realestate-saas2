import Link from 'next/link';
import MarketplaceNav from '@/components/marketplace/MarketplaceNav';
import MarketplaceSearchBar from '@/components/marketplace/MarketplaceSearchBar';
import MarketplaceResults from '@/components/marketplace/MarketplaceResults';

export default function MarketplaceFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="text-sm text-gray-500">© 2026 Realestic. All rights reserved.</p>
            <p className="text-xs text-gray-400 mt-1">
              Are you an agent?{' '}
              <Link href="/for-agents" className="text-brand-600 hover:text-brand-700 font-medium">
                See Realestic tools
              </Link>
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-gray-500">
            <Link href="/for-agents" className="hover:text-brand-600 transition-colors">
              For Agents
            </Link>
            <Link href="/about" className="hover:text-brand-600 transition-colors">
              About
            </Link>
            <Link href="/privacy" className="hover:text-brand-600 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-brand-600 transition-colors">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-brand-600 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

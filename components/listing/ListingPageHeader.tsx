'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import WordmarkLogo from '@/components/branding/WordmarkLogo';
import { listingBackLabel } from '@/lib/public-listing';

interface ListingPageHeaderProps {
  returnTo?: string;
}

export default function ListingPageHeader({ returnTo = '/' }: ListingPageHeaderProps) {
  const router = useRouter();
  const label = listingBackLabel(returnTo);

  const handleBack = () => {
    if (returnTo && returnTo !== '/') {
      router.push(returnTo);
      return;
    }
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden />
          {label}
        </button>
        <WordmarkLogo className="h-10 sm:h-11 w-auto object-contain" />
      </div>
    </header>
  );
}

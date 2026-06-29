import MarketplaceHeroSearch from '@/components/marketplace/MarketplaceHeroSearch';
import type { MarketplaceFilters } from '@/lib/marketplace-shared';

interface MarketplaceHeroProps {
  initialFilters: MarketplaceFilters;
  compact?: boolean;
}

export default function MarketplaceHero({ initialFilters, compact = false }: MarketplaceHeroProps) {
  return (
    <section
      className={`relative overflow-hidden ${
        compact ? 'border-b border-gray-200 bg-white py-8' : 'min-h-[420px] sm:min-h-[480px] flex items-center'
      }`}
    >
      {!compact && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage:
                'linear-gradient(to bottom, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.94) 55%, rgba(255,255,255,1) 100%), url(/demo-house.png)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white" />
        </>
      )}

      <div className={`relative z-10 w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${compact ? '' : 'py-16 sm:py-20'}`}>
        {!compact && (
          <>
            <div className="flex justify-center gap-6 mb-6 text-sm font-semibold text-gray-700">
              <span className="border-b-2 border-gray-900 pb-1">For Sale</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-gray-900 tracking-tight mb-8 sm:mb-10">
              Your next home starts here
            </h1>
          </>
        )}

        {compact && (
          <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center sm:text-left">
            Refine your search
          </h2>
        )}

        <MarketplaceHeroSearch initialFilters={initialFilters} />
      </div>
    </section>
  );
}

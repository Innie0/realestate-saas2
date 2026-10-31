'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bath, BedDouble, ChevronLeft, ChevronRight, ExternalLink, Home, Ruler, X } from 'lucide-react';
import clsx from 'clsx';
import { PROFILE_LISTINGS_ROTATE_AFTER, type PublicListing } from '@/lib/profile-listings';
import { useMotionReduced } from '@/lib/motion';

const STATUS_LABEL: Record<PublicListing['status'], { text: string; className: string }> = {
  active: { text: 'For sale', className: 'bg-[#047857] text-white' },
  pending: { text: 'Pending', className: 'bg-[#B45309] text-white' },
  sold: { text: 'Sold', className: 'bg-[#111111] text-white' },
};

/** How long each listing stays in front before the row moves on. */
const ROTATE_MS = 5000;

/** Buyers expect the usual US format here ($495,000), unlike the dashboard's compact style. */
function priceText(l: PublicListing) {
  return l.price ? `$${Math.round(l.price).toLocaleString('en-US')}` : 'Price on request';
}

function detailsText(l: PublicListing) {
  return [
    l.bedrooms ? `${l.bedrooms} bd` : null,
    l.bathrooms ? `${l.bathrooms} ba` : null,
    l.squareFeet ? `${l.squareFeet.toLocaleString('en-US')} sq ft` : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

function linkLabel(url: string) {
  const host = url.toLowerCase();
  if (host.includes('zillow')) return 'View on Zillow';
  if (host.includes('redfin')) return 'View on Redfin';
  if (host.includes('realtor.com')) return 'View on Realtor.com';
  return 'View full listing';
}

function ListingCard({ listing, onOpen }: { listing: PublicListing; onOpen: () => void }) {
  const status = STATUS_LABEL[listing.status];
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-full w-full flex-col overflow-hidden rounded-mkt-card border border-mkt-border bg-white text-left transition-shadow hover:shadow-[var(--mkt-shadow-soft)]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-mkt-surface-muted">
        {listing.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element -- agent-uploaded listing photos
          <img
            src={listing.photos[0]}
            alt={listing.address}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-mkt-secondary">
            <Home className="h-8 w-8" strokeWidth={1.5} />
          </div>
        )}
        <span className={clsx('absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold', status.className)}>
          {status.text}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-lg font-semibold tracking-[-0.01em] text-mkt-foreground">{priceText(listing)}</p>
        <p className="mt-0.5 truncate text-sm font-medium text-mkt-foreground">{listing.address}</p>
        {listing.cityLine && <p className="truncate text-xs text-mkt-secondary">{listing.cityLine}</p>}
        {detailsText(listing) && <p className="mt-2 text-xs text-mkt-secondary">{detailsText(listing)}</p>}
      </div>
    </button>
  );
}

function ListingDetail({ listing, onClose }: { listing: PublicListing; onClose: () => void }) {
  const status = STATUS_LABEL[listing.status];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const askAboutHome = () => {
    onClose();
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={listing.address}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white sm:rounded-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-mkt-border bg-white/95 px-4 py-3 backdrop-blur">
          <span className={clsx('rounded-full px-2.5 py-1 text-[11px] font-semibold', status.className)}>{status.text}</span>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-mkt-secondary hover:bg-mkt-surface-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {listing.photos.length > 0 && (
          <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto p-3 [scrollbar-width:thin]">
            {listing.photos.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- agent-uploaded listing photos
              <img
                key={src + i}
                src={src}
                alt={`${listing.address} photo ${i + 1}`}
                loading={i === 0 ? 'eager' : 'lazy'}
                className="aspect-[4/3] w-[88%] shrink-0 snap-center rounded-xl object-cover sm:w-[70%]"
              />
            ))}
          </div>
        )}

        <div className="px-5 pb-6 pt-2">
          <p className="text-2xl font-semibold tracking-[-0.02em] text-mkt-foreground">{priceText(listing)}</p>
          <p className="mt-1 text-[15px] font-medium text-mkt-foreground">{listing.address}</p>
          {listing.cityLine && <p className="text-sm text-mkt-secondary">{listing.cityLine}</p>}

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-mkt-secondary">
            {listing.bedrooms && (
              <span className="inline-flex items-center gap-1.5"><BedDouble className="h-4 w-4" /> {listing.bedrooms} beds</span>
            )}
            {listing.bathrooms && (
              <span className="inline-flex items-center gap-1.5"><Bath className="h-4 w-4" /> {listing.bathrooms} baths</span>
            )}
            {listing.squareFeet && (
              <span className="inline-flex items-center gap-1.5"><Ruler className="h-4 w-4" /> {listing.squareFeet.toLocaleString('en-US')} sq ft</span>
            )}
          </div>

          {listing.description && (
            <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-mkt-secondary">{listing.description}</p>
          )}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={askAboutHome}
              className="inline-flex h-11 items-center justify-center rounded-mkt-button bg-[#0668E1] px-5 text-sm font-semibold text-white hover:bg-[#0450b0]"
            >
              {listing.status === 'sold' ? 'Ask about selling your home' : 'Ask about this home'}
            </button>
            {listing.listingUrl && (
              <a
                href={listing.listingUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-mkt-button border border-mkt-border px-5 text-sm font-medium text-mkt-foreground hover:bg-mkt-surface-muted"
              >
                {linkLabel(listing.listingUrl)} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The agent's listings on their public profile. A few listings simply display;
 * more than PROFILE_LISTINGS_ROTATE_AFTER rotate on their own (pausing while a
 * visitor is looking or swiping), with arrows and dots to move by hand.
 */
export default function ProfileListings({ listings }: { listings: PublicListing[] }) {
  const reduced = useMotionReduced();
  const trackRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<PublicListing | null>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const rotates = listings.length > PROFILE_LISTINGS_ROTATE_AFTER;

  const scrollToIndex = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[index] as HTMLElement | undefined;
    if (card) track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: 'smooth' });
  }, []);

  /** Last index whose card can be the first one shown (the row can't scroll past the end). */
  const lastStart = useCallback(() => {
    const track = trackRef.current;
    if (!track) return listings.length - 1;
    const cardWidth = (track.children[0] as HTMLElement | undefined)?.offsetWidth || track.clientWidth;
    const perView = Math.max(1, Math.round(track.clientWidth / cardWidth));
    return Math.max(0, listings.length - perView);
  }, [listings.length]);

  const go = useCallback(
    (delta: number) => {
      const end = lastStart();
      const next = active + delta > end ? 0 : active + delta < 0 ? end : active + delta;
      scrollToIndex(next);
    },
    [active, lastStart, scrollToIndex],
  );

  // Keep the dots in step with manual swipes
  useEffect(() => {
    const track = trackRef.current;
    if (!rotates || !track) return;
    const onScroll = () => {
      const cards = Array.from(track.children) as HTMLElement[];
      const left = track.scrollLeft;
      let best = 0;
      cards.forEach((c, i) => {
        if (Math.abs(c.offsetLeft - track.offsetLeft - left) < Math.abs(cards[best].offsetLeft - track.offsetLeft - left)) best = i;
      });
      setActive(best);
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => track.removeEventListener('scroll', onScroll);
  }, [rotates]);

  // Rotate on a timer, unless the visitor is interacting, a listing is open, or motion is reduced
  useEffect(() => {
    if (!rotates || reduced || paused || open) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') go(1);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [rotates, reduced, paused, open, go]);

  if (listings.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="mb-5 text-center">
        <h2 className="font-display text-lg font-medium text-mkt-foreground">Listings</h2>
        <p className="text-sm text-mkt-secondary">
          {listings.length} home{listings.length === 1 ? '' : 's'}
        </p>
      </div>

      {rotates ? (
        <>
          <div
            ref={trackRef}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {listings.map((l) => (
              <div key={l.id} className="w-[85%] shrink-0 snap-start sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)]">
                <ListingCard listing={l} onOpen={() => setOpen(l)} />
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous listings"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-mkt-border bg-white text-mkt-foreground hover:bg-mkt-surface-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex gap-1.5" aria-hidden>
              {listings.map((l, i) => (
                <span
                  key={l.id}
                  className={clsx('h-1.5 rounded-full transition-all', i === active ? 'w-5 bg-[#0668E1]' : 'w-1.5 bg-mkt-border')}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next listings"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-mkt-border bg-white text-mkt-foreground hover:bg-mkt-surface-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </>
      ) : (
        // A few listings sit centered, whatever the count
        <div className="flex flex-wrap justify-center gap-4">
          {listings.map((l) => (
            <div key={l.id} className="w-full sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)]">
              <ListingCard listing={l} onOpen={() => setOpen(l)} />
            </div>
          ))}
        </div>
      )}

      {open && <ListingDetail listing={open} onClose={() => setOpen(null)} />}
    </section>
  );
}

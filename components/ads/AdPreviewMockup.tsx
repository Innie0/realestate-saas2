'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { Globe, MoreHorizontal, Heart, MessageCircle, Send, Bookmark } from 'lucide-react';
import AnimatedTabPanels from '@/components/motion/AnimatedTabPanels';
import Surface from '@/components/ui/Surface';
import { EASE_OUT, useMotionReduced } from '@/lib/motion';
import type { AdCtaType } from '@/lib/ads/promotion-options';
import { getCtaLabel } from '@/lib/ads/promotion-options';
import { SITE_DOMAIN } from '@/lib/site-config';
import clsx from 'clsx';

export type AdPreviewPlatform = 'facebook' | 'instagram';

interface AdPreviewMockupProps {
  platform: AdPreviewPlatform;
  onPlatformChange: (platform: AdPreviewPlatform) => void;
  imageUrl: string | null;
  headline: string;
  primaryText: string;
  cta: AdCtaType;
  advertiserName: string;
  advertiserAvatar?: string | null;
  domain?: string;
  className?: string;
  emptyHint?: string;
}

const PLATFORM_TABS: { id: AdPreviewPlatform; label: string }[] = [
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
];

function AdvertiserAvatar({ name, url }: { name: string; url?: string | null }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (url) {
    return (
      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-200">
        <Image src={url} alt="" fill className="object-cover" sizes="36px" />
      </div>
    );
  }

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-semibold text-brand-800">
      {initials || 'You'}
    </div>
  );
}

function PreviewImage({ imageUrl, alt }: { imageUrl: string | null; alt: string }) {
  const reduced = useMotionReduced();

  return (
    <div className="relative aspect-[1.91/1] w-full overflow-hidden bg-gray-100">
      <AnimatePresence mode="wait">
        {imageUrl ? (
          <motion.div
            key={imageUrl}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE_OUT }}
            className="absolute inset-0"
          >
            <Image src={imageUrl} alt={alt} fill className="object-cover" sizes="400px" priority />
          </motion.div>
        ) : (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center text-[12px] text-gray-400"
          >
            Select a listing photo
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FacebookPreview({
  imageUrl,
  headline,
  primaryText,
  cta,
  advertiserName,
  advertiserAvatar,
  domain,
}: Omit<AdPreviewMockupProps, 'platform' | 'onPlatformChange' | 'className'>) {
  const reduced = useMotionReduced();

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2 min-w-0">
          <AdvertiserAvatar name={advertiserName} url={advertiserAvatar} />
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-gray-900 truncate">{advertiserName}</p>
            <p className="text-[10px] text-gray-700 flex items-center gap-1">
              Sponsored · <Globe className="h-2.5 w-2.5" />
            </p>
          </div>
        </div>
        <MoreHorizontal className="h-4 w-4 text-gray-400 shrink-0" />
      </div>

      <motion.p
        key={primaryText}
        initial={reduced ? false : { opacity: 0.6 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: EASE_OUT }}
        className="px-3 pt-2.5 pb-2 text-[12.5px] text-gray-800 leading-snug line-clamp-3"
      >
        {primaryText || 'Your ad message will appear here…'}
      </motion.p>

      <PreviewImage imageUrl={imageUrl} alt={headline} />

      <div className="px-3 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-gray-700 uppercase tracking-wide truncate">{domain}</p>
          <motion.p
            key={headline}
            initial={reduced ? false : { opacity: 0.6 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="text-[12px] font-semibold text-gray-900 truncate mt-0.5"
          >
            {headline || 'Listing headline'}
          </motion.p>
        </div>
        <span className="shrink-0 rounded-md bg-gray-200 px-2.5 py-1.5 text-[11px] font-semibold text-gray-700">
          {getCtaLabel(cta)}
        </span>
      </div>
    </div>
  );
}

function InstagramPreview({
  imageUrl,
  headline,
  primaryText,
  cta,
  advertiserName,
  advertiserAvatar,
}: Omit<AdPreviewMockupProps, 'platform' | 'onPlatformChange' | 'className' | 'domain'>) {
  const reduced = useMotionReduced();
  const caption = primaryText ? `${headline ? `${headline}\n\n` : ''}${primaryText}` : headline;

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <AdvertiserAvatar name={advertiserName} url={advertiserAvatar} />
          <div>
            <p className="text-[12px] font-semibold text-gray-900">{advertiserName}</p>
            <p className="text-[10px] text-gray-700">Sponsored</p>
          </div>
        </div>
        <MoreHorizontal className="h-4 w-4 text-gray-400" />
      </div>

      <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
        <AnimatePresence mode="wait">
          {imageUrl ? (
            <motion.div
              key={imageUrl}
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: EASE_OUT }}
              className="absolute inset-0"
            >
              <Image src={imageUrl} alt={headline} fill className="object-cover" sizes="400px" />
            </motion.div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[12px] text-gray-400">
              Select a listing photo
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-3 text-gray-800">
          <Heart className="h-5 w-5" strokeWidth={1.75} />
          <MessageCircle className="h-5 w-5" strokeWidth={1.75} />
          <Send className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <Bookmark className="h-5 w-5 text-gray-800" strokeWidth={1.75} />
      </div>

      <div className="px-3 pb-3 space-y-2">
        <motion.p
          key={caption}
          initial={reduced ? false : { opacity: 0.6 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
          className="text-[12px] text-gray-800 leading-snug line-clamp-4 whitespace-pre-line"
        >
          <span className="font-semibold">{advertiserName}</span>{' '}
          {caption || 'Your caption will appear here…'}
        </motion.p>
        <span className="inline-block rounded-md bg-brand-500 px-3 py-1.5 text-[11px] font-semibold text-white">
          {getCtaLabel(cta)}
        </span>
      </div>
    </div>
  );
}

export default function AdPreviewMockup({
  platform,
  onPlatformChange,
  imageUrl,
  headline,
  primaryText,
  cta,
  advertiserName,
  advertiserAvatar,
  domain = SITE_DOMAIN,
  className,
  emptyHint,
}: AdPreviewMockupProps) {
  const shared = {
    imageUrl,
    headline,
    primaryText,
    cta,
    advertiserName,
    advertiserAvatar,
    domain,
  };

  return (
    <Surface flat padding="md" className={clsx('lg:sticky lg:top-20', className)}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-label">Ad preview</p>
          <p className="text-caption text-gray-700 mt-0.5">Updates as you edit</p>
        </div>
        <div className="inline-flex rounded-lg bg-gray-100 p-0.5">
          {PLATFORM_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onPlatformChange(tab.id)}
              className={clsx(
                'px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-colors',
                platform === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-700 hover:text-gray-800'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatedTabPanels
        activeTab={platform}
        panels={[
          {
            id: 'facebook',
            content: <FacebookPreview {...shared} />,
          },
          {
            id: 'instagram',
            content: <InstagramPreview {...shared} />,
          },
        ]}
      />

      {emptyHint && (
        <p className="text-[12px] text-center text-gray-700 mt-3 px-2">{emptyHint}</p>
      )}

      <p className="text-[11px] text-gray-600 mt-3 text-center">
        Approximate preview · actual placement may vary
      </p>
    </Surface>
  );
}

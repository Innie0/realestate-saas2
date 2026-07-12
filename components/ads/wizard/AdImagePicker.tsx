'use client';

import Image from 'next/image';
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import clsx from 'clsx';
import type { AdDraftImage } from '@/lib/ads/ad-draft-types';

interface AdImagePickerProps {
  images: AdDraftImage[];
  onChange: (images: AdDraftImage[]) => void;
}

export default function AdImagePicker({ images, onChange }: AdImagePickerProps) {
  const sorted = [...images].sort((a, b) => a.order - b.order);

  const move = (index: number, dir: -1 | 1) => {
    const next = [...sorted];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((img, i) => ({ ...img, order: i })));
  };

  if (sorted.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center">
        <ImageIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-[13px] text-gray-500">Select a listing or add images to preview your ad.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[12px] font-medium text-gray-600 mb-2">
        Photos <span className="text-gray-400 font-normal">· first image is the main creative</span>
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sorted.map((img, index) => (
          <div key={img.url} className="relative shrink-0 group">
            <div
              className={clsx(
                'relative h-20 w-20 overflow-hidden rounded-lg border-2',
                index === 0 ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-gray-200'
              )}
            >
              <Image src={img.url} alt="" fill className="object-cover" sizes="80px" />
              {index === 0 && (
                <span className="absolute bottom-0 inset-x-0 bg-brand-500/90 text-[9px] font-semibold text-white text-center py-0.5">
                  Primary
                </span>
              )}
            </div>
            {sorted.length > 1 && (
              <div className="flex justify-center gap-0.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  className="p-0.5 rounded bg-gray-100 text-gray-600 disabled:opacity-30"
                  aria-label="Move left"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  disabled={index === sorted.length - 1}
                  onClick={() => move(index, 1)}
                  className="p-0.5 rounded bg-gray-100 text-gray-600 disabled:opacity-30"
                  aria-label="Move right"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

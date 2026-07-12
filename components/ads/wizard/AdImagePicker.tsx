'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
  ImageIcon,
  Loader2,
  Trash2,
  Upload,
} from 'lucide-react';
import clsx from 'clsx';
import type { AdDraftImage } from '@/lib/ads/ad-draft-types';
import { uploadAdCreativeFile } from '@/lib/ads/upload-ad-creative';

interface AdImagePickerProps {
  draftId: string;
  images: AdDraftImage[];
  onChange: (images: AdDraftImage[]) => void;
  label?: string;
  emptyHint?: string;
}

export default function AdImagePicker({
  draftId,
  images,
  onChange,
  label = 'Photos',
  emptyHint = 'Drag photos here or tap to upload. First image is the main creative.',
}: AdImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const sorted = [...images].sort((a, b) => a.order - b.order);

  const addUrls = (urls: string[]) => {
    const start = sorted.length;
    const next = [
      ...sorted,
      ...urls.map((url, i) => ({ url, order: start + i })),
    ].map((img, i) => ({ ...img, order: i }));
    onChange(next);
  };

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (list.length === 0) return;

    setUploading(true);
    setError('');
    try {
      const urls: string[] = [];
      for (const file of list) {
        const url = await uploadAdCreativeFile(file, draftId);
        urls.push(url);
      }
      addUrls(urls);
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files?.length) void uploadFiles(e.dataTransfer.files);
    },
    [draftId, sorted.length]
  );

  const move = (index: number, dir: -1 | 1) => {
    const next = [...sorted];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((img, i) => ({ ...img, order: i })));
  };

  const remove = (index: number) => {
    const next = sorted.filter((_, i) => i !== index).map((img, i) => ({ ...img, order: i }));
    onChange(next);
  };

  return (
    <div>
      <p className="text-[12px] font-medium text-gray-600 mb-2">
        {label}{' '}
        <span className="text-gray-400 font-normal">· first image is the main creative</span>
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={clsx(
          'relative rounded-lg border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-colors',
          dragOver
            ? 'border-brand-500 bg-brand-50/40'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) void uploadFiles(e.target.files);
            e.target.value = '';
          }}
        />
        {uploading ? (
          <Loader2 className="h-7 w-7 text-brand-500 mx-auto animate-spin" />
        ) : (
          <Upload className="h-7 w-7 text-gray-300 mx-auto mb-2" />
        )}
        <p className="text-[13px] text-gray-600">{emptyHint}</p>
        <p className="text-[11px] text-gray-400 mt-1">JPG, PNG, or WebP · up to 10MB each</p>
      </div>

      {error && (
        <p className="text-[12px] text-red-600 mt-2">{error}</p>
      )}

      {sorted.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 mt-3">
          {sorted.map((img, index) => (
            <div key={`${img.url}-${index}`} className="relative shrink-0 group">
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
              <div className="flex justify-center items-center gap-0.5 mt-1">
                <GripVertical className="h-3 w-3 text-gray-300" />
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    move(index, -1);
                  }}
                  className="p-0.5 rounded bg-gray-100 text-gray-600 disabled:opacity-30"
                  aria-label="Move left"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  disabled={index === sorted.length - 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    move(index, 1);
                  }}
                  className="p-0.5 rounded bg-gray-100 text-gray-600 disabled:opacity-30"
                  aria-label="Move right"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(index);
                  }}
                  className="p-0.5 rounded bg-red-50 text-red-600 hover:bg-red-100"
                  aria-label="Remove"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {sorted.length === 0 && !uploading && (
        <div className="mt-2 flex items-center gap-2 text-[12px] text-gray-400">
          <ImageIcon className="h-3.5 w-3.5" />
          No photos yet
        </div>
      )}
    </div>
  );
}

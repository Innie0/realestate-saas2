'use client';

import { Hand } from 'lucide-react';
import clsx from 'clsx';

type DragHintBadgeProps = {
  visible: boolean;
  isDragging: boolean;
};

export default function DragHintBadge({ visible, isDragging }: DragHintBadgeProps) {
  return (
    <div
      className={clsx(
        'pointer-events-none absolute left-1/2 top-1/2 z-20 flex size-[92px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-[#111111] text-white shadow-[0_10px_40px_rgba(0,0,0,0.16)] transition-opacity duration-300',
        visible && !isDragging ? 'opacity-100' : 'opacity-0',
      )}
      aria-hidden
    >
      <div className="flex flex-col items-center">
        <div className="mb-1 flex flex-col items-center gap-[3px]">
          <span className="block h-px w-3 rounded-full bg-white/30" />
          <span className="block h-px w-4 rounded-full bg-white/50" />
          <span className="block h-px w-5 rounded-full bg-white/70" />
        </div>
        <Hand className="size-6 rotate-[8deg] text-white" strokeWidth={1.6} />
      </div>
      <span className="mt-1.5 text-[13px] font-semibold leading-none tracking-[-0.01em]">
        Drag
      </span>
    </div>
  );
}

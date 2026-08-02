'use client';

import { Hand } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import clsx from 'clsx';

type DragCursorProps = {
  x: number;
  y: number;
  visible: boolean;
  dragging?: boolean;
};

function DragCursorContent({ dragging }: { dragging?: boolean }) {
  return (
    <div
      className={clsx(
        'flex size-[92px] flex-col items-center justify-center rounded-full bg-[#111111] text-white shadow-[0_10px_40px_rgba(0,0,0,0.16)] transition-transform duration-150',
        dragging && 'scale-[0.96]',
      )}
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

export default function DragCursor({ x, y, visible, dragging }: DragCursorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !visible) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed left-0 top-0 z-[200]"
      style={{ transform: `translate(${x}px, ${y}px) translate(-50%, -50%)` }}
      aria-hidden
    >
      <DragCursorContent dragging={dragging} />
    </div>,
    document.body,
  );
}

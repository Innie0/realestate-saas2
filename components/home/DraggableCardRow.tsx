'use client';

import { animate, motion, useMotionValue, type PanInfo } from 'framer-motion';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import clsx from 'clsx';
import { useMotionReduced } from '@/lib/motion';

type DraggableCardRowProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  style?: CSSProperties;
};

const SCROLL_ROW_CLASS =
  'overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

function clampScroll(el: HTMLDivElement, value: number) {
  const max = Math.max(0, el.scrollWidth - el.clientWidth);
  return Math.max(0, Math.min(value, max));
}

export function DraggableCardRow({
  children,
  className,
  contentClassName,
  style,
}: DraggableCardRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [finePointer, setFinePointer] = useState(false);
  const prefersReducedMotion = useMotionReduced();
  const x = useMotionValue(0);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)');
    const update = () => setFinePointer(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || prefersReducedMotion) return;

    const onWheel = (event: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;

      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (Math.abs(delta) < 0.5) return;

      event.preventDefault();
      el.scrollLeft = clampScroll(el, el.scrollLeft + delta);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [prefersReducedMotion, children]);

  const handleDrag = (_event: unknown, info: PanInfo) => {
    const el = containerRef.current;
    if (!el) return;

    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    const atStart = el.scrollLeft <= 0;
    const atEnd = el.scrollLeft >= max - 1;

    if ((atStart && info.delta.x > 0) || (atEnd && info.delta.x < 0)) {
      x.set(x.get() + info.delta.x * 0.08);
      return;
    }

    el.scrollLeft = clampScroll(el, el.scrollLeft - info.delta.x);
    x.set(0);
  };

  const handleDragEnd = (_event: unknown, info: PanInfo) => {
    setIsDragging(false);

    const el = containerRef.current;
    if (!el) return;

    animate(x, 0, { type: 'spring', stiffness: 400, damping: 35 });

    const target = clampScroll(el, el.scrollLeft - info.velocity.x * 0.25);
    animate(el.scrollLeft, target, {
      type: 'spring',
      stiffness: 260,
      damping: 35,
      onUpdate: (value) => {
        el.scrollLeft = value;
      },
    });
  };

  const rowClassName = clsx('flex w-max gap-7 px-10', contentClassName);
  const useMotionDrag = finePointer && !prefersReducedMotion;

  return (
    <div
      ref={containerRef}
      className={clsx(SCROLL_ROW_CLASS, className)}
      style={style}
      aria-label="Drag, swipe, or scroll horizontally to browse cards"
    >
      {useMotionDrag ? (
        <motion.div
          className={rowClassName}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.08}
          dragMomentum={false}
          onDragStart={() => setIsDragging(true)}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          style={{
            x,
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: isDragging ? 'none' : 'auto',
          }}
        >
          {children}
        </motion.div>
      ) : (
        <div className={rowClassName}>{children}</div>
      )}
    </div>
  );
}

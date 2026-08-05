'use client';

import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion';
import {
  Children,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import clsx from 'clsx';
import DragCursor from '@/components/home/DragCursor';
import { useMotionReduced } from '@/lib/motion';

type DraggableCardRowProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  style?: CSSProperties;
};

/** Max rotation (deg) applied to a card once it's a full card-width away from
 *  dead center — the active/centered card sits at 0deg, neighbors fan out
 *  from there as the row is dragged. */
const MAX_TILT_DEG = 7;

/** Wraps a single card so it can rotate based on its own distance from the
 *  row's center, independent of the shared drag position. `offsetLeft` is
 *  captured relative to the (positioned) outer container, so it already
 *  reflects each card's natural rest position — combining it with the live
 *  drag value `x` gives the card's actual on-screen distance from center at
 *  any moment during the drag. */
function TiltCard({
  x,
  containerRef,
  children,
}: {
  x: MotionValue<number>;
  containerRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef({ offset: 0, half: 1 });

  useEffect(() => {
    const measure = () => {
      const el = wrapperRef.current;
      const container = containerRef.current;
      if (!el || !container) return;
      const width = el.offsetWidth;
      metricsRef.current = {
        offset: el.offsetLeft + width / 2 - container.offsetWidth / 2,
        half: Math.max(width / 2, 1),
      };
      // `useTransform` only re-runs when `x` changes, so nudge it (no-op
      // value-wise) to re-derive tilt from the freshly measured metrics —
      // otherwise a resize wouldn't visibly update the tilt until the next drag.
      x.set(x.get());
    };

    measure();
    window.addEventListener('resize', measure);

    const observer = new ResizeObserver(measure);
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      window.removeEventListener('resize', measure);
      observer.disconnect();
    };
  }, [containerRef, x]);

  const rawTilt = useTransform(x, (latest) => {
    const { offset, half } = metricsRef.current;
    const distance = offset + latest;
    const t = Math.max(-1, Math.min(1, distance / half));
    return t * MAX_TILT_DEG;
  });
  // Springing the tilt (rather than following `x` 1:1) is what gives the
  // "straightens into place with some character" settle — a slight
  // overshoot as a card swings back to upright instead of a flat linear snap.
  const tilt = useSpring(rawTilt, { stiffness: 260, damping: 22, mass: 0.4 });

  return (
    <motion.div ref={wrapperRef} className="flex-none" style={{ rotate: tilt }}>
      {children}
    </motion.div>
  );
}

export function DraggableCardRow({
  children,
  className,
  contentClassName,
  style,
}: DraggableCardRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dragConstraintRef = useRef(0);
  const [dragConstraint, setDragConstraint] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const cursorRef = useRef({ x: 0, y: 0 });
  const prefersReducedMotion = useMotionReduced();
  const x = useMotionValue(0);

  const updateCursor = (clientX: number, clientY: number) => {
    cursorRef.current = { x: clientX, y: clientY };
    setCursor({ x: clientX, y: clientY });
  };

  useEffect(() => {
    const updateConstraint = () => {
      const container = containerRef.current;
      const content = contentRef.current;
      if (!container || !content) return;

      const constraint = Math.min(0, container.offsetWidth - content.scrollWidth);
      dragConstraintRef.current = constraint;
      setDragConstraint(constraint);
      x.set(Math.max(constraint, Math.min(0, x.get())));
    };

    updateConstraint();
    window.addEventListener('resize', updateConstraint);

    const observer = new ResizeObserver(updateConstraint);
    const container = containerRef.current;
    const content = contentRef.current;
    if (container) observer.observe(container);
    if (content) observer.observe(content);

    return () => {
      window.removeEventListener('resize', updateConstraint);
      observer.disconnect();
    };
  }, [children, x]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || prefersReducedMotion) return;

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      if (Math.abs(event.deltaX) < 0.5) return;

      event.preventDefault();
      const next = Math.max(
        dragConstraintRef.current,
        Math.min(0, x.get() - event.deltaX),
      );
      x.set(next);
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [prefersReducedMotion, x, children]);

  useEffect(() => {
    if (!isDragging) return;

    const onPointerMove = (event: PointerEvent) => {
      updateCursor(event.clientX, event.clientY);
    };

    window.addEventListener('pointermove', onPointerMove);
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [isDragging]);

  const handleDragEnd = () => {
    setIsDragging(false);
    const container = containerRef.current;
    if (!container) return;

    const { x: cx, y: cy } = cursorRef.current;
    const target = document.elementFromPoint(cx, cy);
    setIsHovering(Boolean(target && container.contains(target)));
  };

  if (prefersReducedMotion) {
    // The fixed height in `style` clips the horizontal-scroll variant; the
    // stacked fallback lays out vertically and must size itself naturally.
    return (
      <div className={clsx('flex flex-col gap-7 px-10', className)}>
        {children}
      </div>
    );
  }

  const showCustomCursor = isHovering || isDragging;

  return (
    <>
      <div
        ref={containerRef}
        className={clsx(
          'relative overflow-hidden overscroll-x-contain',
          showCustomCursor && 'cursor-none [&_*]:cursor-none',
          className,
        )}
        style={style}
        aria-label="Drag or swipe horizontally to browse cards"
        onPointerEnter={(event) => {
          setIsHovering(true);
          updateCursor(event.clientX, event.clientY);
        }}
        onPointerLeave={() => {
          if (!isDragging) setIsHovering(false);
        }}
        onPointerMove={(event) => {
          updateCursor(event.clientX, event.clientY);
        }}
      >
        <motion.div
          ref={contentRef}
          className={clsx('flex w-max gap-7 px-10', contentClassName)}
          drag="x"
          dragConstraints={{ left: dragConstraint, right: 0 }}
          dragElastic={0.08}
          dragTransition={{ power: 0.3, timeConstant: 250 }}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          style={{
            x,
            userSelect: isDragging ? 'none' : 'auto',
          }}
        >
          {Children.toArray(children).map((child) => (
            <TiltCard key={(child as { key?: string | null }).key} x={x} containerRef={containerRef}>
              {child}
            </TiltCard>
          ))}
        </motion.div>
      </div>

      <DragCursor
        x={cursor.x}
        y={cursor.y}
        visible={showCustomCursor}
        dragging={isDragging}
      />
    </>
  );
}

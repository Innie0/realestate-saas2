'use client';

import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
  type PanInfo,
} from 'framer-motion';
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
 *  dead center — the active/centered card sits at exactly 0deg, neighbors
 *  fan out from there as the row moves. */
const MAX_TILT_DEG = 7;

/** Wraps a single card so it can rotate based on its own distance from the
 *  row's center, independent of the shared drag position. `offsetLeft` is
 *  captured relative to the (positioned) outer container, so it already
 *  reflects each card's natural rest position — combining it with the live
 *  drag value `x` gives the card's actual on-screen distance from center at
 *  any moment. Bound directly to `x` (no extra spring here) so the tilt
 *  exactly mirrors whatever motion `x` is already doing — including the
 *  spring settle applied on snap — instead of adding a second, laggier
 *  spring on top that would read as floaty. */
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

  const tilt = useTransform(x, (latest) => {
    const { offset, half } = metricsRef.current;
    const distance = offset + latest;
    const t = Math.max(-1, Math.min(1, distance / half));
    return t * MAX_TILT_DEG;
  });

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
  const snapPointsRef = useRef<number[]>([]);
  const [dragConstraint, setDragConstraint] = useState(0);
  const [edgePad, setEdgePad] = useState(40);
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

  // Leading/trailing spacers sized to half the leftover space around a card
  // — without this, the first and last cards physically can't be dragged far
  // enough to reach the row's center, so they'd never settle "straight."
  useEffect(() => {
    const computeEdgePad = () => {
      const container = containerRef.current;
      const content = contentRef.current;
      const firstCard = content?.children[0] as HTMLElement | undefined;
      if (!container || !firstCard) return;
      setEdgePad(Math.max(16, (container.offsetWidth - firstCard.offsetWidth) / 2));
    };

    computeEdgePad();
    window.addEventListener('resize', computeEdgePad);

    const observer = new ResizeObserver(computeEdgePad);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      window.removeEventListener('resize', computeEdgePad);
      observer.disconnect();
    };
  }, [children]);

  useEffect(() => {
    const updateConstraint = () => {
      const container = containerRef.current;
      const content = contentRef.current;
      if (!container || !content) return;

      const constraint = Math.min(0, container.offsetWidth - content.scrollWidth);
      dragConstraintRef.current = constraint;
      setDragConstraint(constraint);

      snapPointsRef.current = Array.from(content.children).map((child) => {
        const el = child as HTMLElement;
        const offset = el.offsetLeft + el.offsetWidth / 2 - container.offsetWidth / 2;
        return Math.max(constraint, Math.min(0, -offset));
      });

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
  }, [children, x, edgePad]);

  /** Animates `x` to whichever snap point is nearest (optionally biased by a
   *  flick's velocity), so a card settles fully "straight" instead of
   *  resting at whatever arbitrary offset the drag happened to stop at. */
  const snapToNearest = (velocity = 0) => {
    const snaps = snapPointsRef.current;
    if (!snaps.length) return;

    const projected = x.get() + velocity * 0.15;
    let nearest = snaps[0];
    let minDistance = Math.abs(projected - nearest);
    for (const point of snaps) {
      const distance = Math.abs(projected - point);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = point;
      }
    }

    animate(x, nearest, { type: 'spring', stiffness: 300, damping: 30, mass: 0.7 });
  };

  const wheelSnapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

      if (wheelSnapTimeoutRef.current) clearTimeout(wheelSnapTimeoutRef.current);
      wheelSnapTimeoutRef.current = setTimeout(() => snapToNearest(0), 140);
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheel);
      if (wheelSnapTimeoutRef.current) clearTimeout(wheelSnapTimeoutRef.current);
    };
  }, [prefersReducedMotion, x, children]);

  useEffect(() => {
    if (!isDragging) return;

    const onPointerMove = (event: PointerEvent) => {
      updateCursor(event.clientX, event.clientY);
    };

    window.addEventListener('pointermove', onPointerMove);
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [isDragging]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const container = containerRef.current;
    if (container) {
      const { x: cx, y: cy } = cursorRef.current;
      const target = document.elementFromPoint(cx, cy);
      setIsHovering(Boolean(target && container.contains(target)));
    }

    snapToNearest(info.velocity.x);
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
          // Extra vertical clearance (canceled via matching negative margin
          // so it doesn't push surrounding sections) keeps a tilted card's
          // corners from being clipped by `overflow-hidden`.
          'relative -my-12 overflow-hidden overscroll-x-contain py-12',
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
          className={clsx('flex w-max gap-7', contentClassName)}
          style={{
            x,
            paddingLeft: edgePad,
            paddingRight: edgePad,
            userSelect: isDragging ? 'none' : 'auto',
          }}
          drag="x"
          dragConstraints={{ left: dragConstraint, right: 0 }}
          dragElastic={0.08}
          dragMomentum={false}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
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

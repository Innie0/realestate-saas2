'use client';

import { motion } from 'framer-motion';
import { ShadcnButton } from '@/components/ui/shadcn-button';
import { cn } from '@/lib/utils';
import { useMotionReduced } from '@/lib/motion';

function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
    duration: 20 + (i % 10),
  }));

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        className="h-full w-full text-mkt-foreground"
        viewBox="0 0 696 316"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.06 + path.id * 0.015}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={{
              pathLength: 1,
              opacity: [0.2, 0.45, 0.2],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: path.duration,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
            }}
          />
        ))}
      </svg>
    </div>
  );
}

function StaticPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        className="h-full w-full text-mkt-foreground"
        viewBox="0 0 696 316"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <title>Background Paths</title>
        {paths.map((path) => (
          <path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.06 + path.id * 0.015}
          />
        ))}
      </svg>
    </div>
  );
}

/** Decorative animated paths layer — no title or CTA. */
export function BackgroundPathsLayer({ className }: { className?: string }) {
  const reduced = useMotionReduced();

  return (
    <div
      className={cn(
        'relative h-full w-full overflow-hidden',
        '[mask-image:linear-gradient(to_bottom,transparent_0%,black_18%,black_88%,transparent_100%)]',
        className,
      )}
      aria-hidden
    >
      <div className="absolute inset-0">
        {reduced ? (
          <>
            <StaticPaths position={1} />
            <StaticPaths position={-1} />
          </>
        ) : (
          <>
            <FloatingPaths position={1} />
            <FloatingPaths position={-1} />
          </>
        )}
      </div>
    </div>
  );
}

export function BackgroundPaths({ title = 'Background Paths' }: { title?: string }) {
  const words = title.split(' ');
  const reduced = useMotionReduced();

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-mkt-background">
      <BackgroundPathsLayer className="absolute inset-0" />

      <div className="relative z-10 container mx-auto px-4 text-center md:px-6">
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="mx-auto max-w-4xl"
        >
          <h1 className="mb-8 text-5xl font-bold tracking-tighter sm:text-7xl md:text-8xl">
            {words.map((word, wordIndex) => (
              <span key={wordIndex} className="mr-4 inline-block last:mr-0">
                {word.split('').map((letter, letterIndex) => (
                  <motion.span
                    key={`${wordIndex}-${letterIndex}`}
                    initial={reduced ? false : { y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                      delay: wordIndex * 0.1 + letterIndex * 0.03,
                      type: 'spring',
                      stiffness: 150,
                      damping: 25,
                    }}
                    className="inline-block bg-gradient-to-r from-mkt-foreground to-mkt-secondary/80 bg-clip-text text-transparent"
                  >
                    {letter}
                  </motion.span>
                ))}
              </span>
            ))}
          </h1>

          <div className="group relative inline-block overflow-hidden rounded-2xl bg-gradient-to-b from-black/10 to-white/10 p-px shadow-lg backdrop-blur-lg transition-shadow duration-300 hover:shadow-xl">
            <ShadcnButton
              variant="ghost"
              className="rounded-[1.15rem] border border-mkt-border bg-mkt-surface/95 px-8 py-6 text-lg font-semibold text-mkt-foreground backdrop-blur-md transition-all duration-300 hover:bg-mkt-surface hover:shadow-md group-hover:-translate-y-0.5"
            >
              <span className="opacity-90 transition-opacity group-hover:opacity-100">
                Discover Excellence
              </span>
              <span className="ml-3 opacity-70 transition-all duration-300 group-hover:translate-x-1.5 group-hover:opacity-100">
                →
              </span>
            </ShadcnButton>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

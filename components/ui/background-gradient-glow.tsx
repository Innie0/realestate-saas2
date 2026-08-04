import { cn } from '@/lib/utils';

/** Brand blues + warm tan accents — tuned for marketing card backgrounds. */
const BRAND = {
  blueDeep: '#0452AD',
  blue: '#0668E1',
  blueLight: '#2E86FB',
  tan: '#C4A574',
  tanLight: '#D4B896',
  tanDeep: '#A68B5B',
} as const;

type GlowVariant = 'listings' | 'leads' | 'transactions';

const VARIANT_BACKGROUNDS: Record<GlowVariant, string> = {
  listings: `
    radial-gradient(ellipse 80% 55% at 12% 18%, rgba(196, 165, 116, 0.38), transparent 58%),
    radial-gradient(ellipse 70% 50% at 88% 28%, rgba(46, 134, 251, 0.28), transparent 60%),
    radial-gradient(ellipse 65% 55% at 72% 88%, rgba(4, 82, 173, 0.55), transparent 62%),
    linear-gradient(145deg, ${BRAND.blueDeep} 0%, ${BRAND.blue} 52%, ${BRAND.blueDeep} 100%)
  `,
  leads: `
    radial-gradient(ellipse 75% 60% at 78% 22%, rgba(212, 184, 150, 0.42), transparent 58%),
    radial-gradient(ellipse 68% 52% at 10% 72%, rgba(6, 104, 225, 0.45), transparent 60%),
    radial-gradient(ellipse 60% 48% at 42% 12%, rgba(166, 139, 91, 0.22), transparent 55%),
    linear-gradient(160deg, ${BRAND.blue} 0%, ${BRAND.blueDeep} 48%, ${BRAND.blue} 100%)
  `,
  transactions: `
    radial-gradient(ellipse 72% 58% at 8% 82%, rgba(196, 165, 116, 0.35), transparent 58%),
    radial-gradient(ellipse 68% 54% at 92% 15%, rgba(4, 82, 173, 0.5), transparent 60%),
    radial-gradient(ellipse 55% 45% at 55% 55%, rgba(212, 184, 150, 0.18), transparent 55%),
    linear-gradient(135deg, ${BRAND.blueDeep} 0%, ${BRAND.blueLight} 38%, ${BRAND.blueDeep} 100%)
  `,
};

export type BackgroundGradientGlowProps = {
  className?: string;
  variant?: GlowVariant;
};

export function BackgroundGradientGlow({
  className,
  variant = 'listings',
}: BackgroundGradientGlowProps) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 z-0', className)}
      style={{ background: VARIANT_BACKGROUNDS[variant] }}
    />
  );
}

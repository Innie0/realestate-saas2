import { cn } from '@/lib/utils';

/** Pitch-style mesh: deep brand blue + soft gray-white highlights. */
const BRAND = {
  navy: '#022654',
  blueDeep: '#0452AD',
  blue: '#0668E1',
  blueBright: '#2E86FB',
  mist: '#E8EAED',
  mistSoft: '#F0F2F5',
  mistLight: '#F7F8FA',
} as const;

type GlowBlob = {
  x: string;
  y: string;
  size: string;
  color: string;
  opacity: number;
  blur: number;
};

type GlowVariant = 'listings' | 'leads' | 'ads' | 'transactions' | 'research' | 'ask' | 'schedule';

const VARIANT_BLOBS: Record<GlowVariant, GlowBlob[]> = {
  listings: [
    { x: '88%', y: '18%', size: '72%', color: BRAND.mistSoft, opacity: 0.88, blur: 52 },
    { x: '12%', y: '78%', size: '68%', color: BRAND.blueDeep, opacity: 0.92, blur: 48 },
    { x: '55%', y: '55%', size: '50%', color: BRAND.blueBright, opacity: 0.55, blur: 44 },
    { x: '28%', y: '22%', size: '38%', color: BRAND.mist, opacity: 0.65, blur: 36 },
  ],
  leads: [
    { x: '82%', y: '72%', size: '70%', color: BRAND.mistLight, opacity: 0.82, blur: 50 },
    { x: '8%', y: '28%', size: '65%', color: BRAND.blue, opacity: 0.88, blur: 46 },
    { x: '62%', y: '12%', size: '48%', color: BRAND.blueBright, opacity: 0.65, blur: 40 },
    { x: '40%', y: '88%', size: '42%', color: BRAND.mist, opacity: 0.7, blur: 38 },
  ],
  ads: [
    { x: '85%', y: '25%', size: '70%', color: BRAND.mistSoft, opacity: 0.85, blur: 50 },
    { x: '10%', y: '75%', size: '66%', color: BRAND.blue, opacity: 0.9, blur: 46 },
    { x: '58%', y: '88%', size: '48%', color: BRAND.blueBright, opacity: 0.6, blur: 40 },
    { x: '30%', y: '12%', size: '40%', color: BRAND.mist, opacity: 0.65, blur: 36 },
  ],
  transactions: [
    { x: '15%', y: '82%', size: '68%', color: BRAND.mistSoft, opacity: 0.85, blur: 48 },
    { x: '92%', y: '20%', size: '62%', color: BRAND.navy, opacity: 0.95, blur: 44 },
    { x: '70%', y: '58%', size: '52%', color: BRAND.blueBright, opacity: 0.6, blur: 42 },
    { x: '48%', y: '8%', size: '36%', color: BRAND.mistLight, opacity: 0.6, blur: 34 },
  ],
  research: [
    { x: '90%', y: '85%', size: '68%', color: BRAND.mistSoft, opacity: 0.85, blur: 50 },
    { x: '10%', y: '15%', size: '64%', color: BRAND.blueDeep, opacity: 0.9, blur: 46 },
    { x: '48%', y: '48%', size: '46%', color: BRAND.blueBright, opacity: 0.55, blur: 40 },
    { x: '78%', y: '10%', size: '36%', color: BRAND.mist, opacity: 0.6, blur: 34 },
  ],
  ask: [
    { x: '12%', y: '88%', size: '70%', color: BRAND.mistLight, opacity: 0.85, blur: 50 },
    { x: '88%', y: '32%', size: '62%', color: BRAND.blue, opacity: 0.88, blur: 46 },
    { x: '40%', y: '18%', size: '46%', color: BRAND.blueBright, opacity: 0.55, blur: 40 },
    { x: '65%', y: '82%', size: '36%', color: BRAND.mist, opacity: 0.6, blur: 34 },
  ],
  schedule: [
    { x: '85%', y: '78%', size: '66%', color: BRAND.mistSoft, opacity: 0.85, blur: 48 },
    { x: '15%', y: '25%', size: '64%', color: BRAND.navy, opacity: 0.92, blur: 46 },
    { x: '55%', y: '65%', size: '48%', color: BRAND.blueBright, opacity: 0.58, blur: 40 },
    { x: '30%', y: '90%', size: '34%', color: BRAND.mistLight, opacity: 0.6, blur: 34 },
  ],
};

const VARIANT_BASE: Record<GlowVariant, string> = {
  listings: `linear-gradient(145deg, ${BRAND.navy} 0%, ${BRAND.blueDeep} 45%, ${BRAND.blue} 100%)`,
  leads: `linear-gradient(160deg, ${BRAND.blueDeep} 0%, ${BRAND.blue} 50%, ${BRAND.navy} 100%)`,
  ads: `linear-gradient(150deg, ${BRAND.navy} 0%, ${BRAND.blue} 55%, ${BRAND.blueBright} 100%)`,
  transactions: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.blueBright} 42%, ${BRAND.blueDeep} 100%)`,
  research: `linear-gradient(140deg, ${BRAND.navy} 0%, ${BRAND.blueDeep} 50%, ${BRAND.blue} 100%)`,
  ask: `linear-gradient(155deg, ${BRAND.blueDeep} 0%, ${BRAND.blue} 45%, ${BRAND.blueBright} 100%)`,
  schedule: `linear-gradient(130deg, ${BRAND.navy} 0%, ${BRAND.blueBright} 48%, ${BRAND.blueDeep} 100%)`,
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
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 z-0 overflow-hidden', className)}>
      <div className="absolute inset-0" style={{ background: VARIANT_BASE[variant] }} />
      {VARIANT_BLOBS[variant].map((blob, index) => (
        <div
          key={index}
          className="absolute rounded-full mix-blend-normal"
          style={{
            left: blob.x,
            top: blob.y,
            width: blob.size,
            height: blob.size,
            backgroundColor: blob.color,
            opacity: blob.opacity,
            filter: `blur(${blob.blur}px)`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  );
}

/** Outer gradient frame + screenshot chrome — keep heights in sync across breakpoints. */
export const PREVIEW_MAX_WIDTH = 580;
export const PREVIEW_FRAME_PADDING = 32;
export const PREVIEW_URL_BAR_HEIGHT = 32;
export const PREVIEW_IMAGE_HEIGHT = 312;
export const PREVIEW_BROWSER_CHROME = 32;

export const PREVIEW_CARD_HEIGHT =
  PREVIEW_FRAME_PADDING * 2 +
  PREVIEW_BROWSER_CHROME +
  PREVIEW_URL_BAR_HEIGHT +
  PREVIEW_IMAGE_HEIGHT;

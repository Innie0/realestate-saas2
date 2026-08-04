import { cn } from '@/lib/utils';

/** Pitch-style mesh: deep brand blue + saturated warm tan, high contrast blobs. */
const BRAND = {
  navy: '#022654',
  blueDeep: '#0452AD',
  blue: '#0668E1',
  blueBright: '#2E86FB',
  tan: '#D4A85C',
  tanWarm: '#E8C078',
  tanLight: '#F0D9A8',
} as const;

type GlowBlob = {
  x: string;
  y: string;
  size: string;
  color: string;
  opacity: number;
  blur: number;
};

type GlowVariant = 'listings' | 'leads' | 'transactions';

const VARIANT_BLOBS: Record<GlowVariant, GlowBlob[]> = {
  listings: [
    { x: '88%', y: '18%', size: '72%', color: BRAND.tanWarm, opacity: 0.95, blur: 52 },
    { x: '12%', y: '78%', size: '68%', color: BRAND.blueDeep, opacity: 0.92, blur: 48 },
    { x: '55%', y: '55%', size: '50%', color: BRAND.blueBright, opacity: 0.55, blur: 44 },
    { x: '28%', y: '22%', size: '38%', color: BRAND.tan, opacity: 0.7, blur: 36 },
  ],
  leads: [
    { x: '82%', y: '72%', size: '70%', color: BRAND.tanLight, opacity: 0.9, blur: 50 },
    { x: '8%', y: '28%', size: '65%', color: BRAND.blue, opacity: 0.88, blur: 46 },
    { x: '62%', y: '12%', size: '48%', color: BRAND.blueBright, opacity: 0.65, blur: 40 },
    { x: '40%', y: '88%', size: '42%', color: BRAND.tan, opacity: 0.75, blur: 38 },
  ],
  transactions: [
    { x: '15%', y: '82%', size: '68%', color: BRAND.tanWarm, opacity: 0.92, blur: 48 },
    { x: '92%', y: '20%', size: '62%', color: BRAND.navy, opacity: 0.95, blur: 44 },
    { x: '70%', y: '58%', size: '52%', color: BRAND.blueBright, opacity: 0.6, blur: 42 },
    { x: '48%', y: '8%', size: '36%', color: BRAND.tanLight, opacity: 0.65, blur: 34 },
  ],
};

const VARIANT_BASE: Record<GlowVariant, string> = {
  listings: `linear-gradient(145deg, ${BRAND.navy} 0%, ${BRAND.blueDeep} 45%, ${BRAND.blue} 100%)`,
  leads: `linear-gradient(160deg, ${BRAND.blueDeep} 0%, ${BRAND.blue} 50%, ${BRAND.navy} 100%)`,
  transactions: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.blueBright} 42%, ${BRAND.blueDeep} 100%)`,
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
export const PREVIEW_IMAGE_HEIGHT = 280;
export const PREVIEW_BROWSER_CHROME = 32;

export const PREVIEW_CARD_HEIGHT =
  PREVIEW_FRAME_PADDING * 2 +
  PREVIEW_BROWSER_CHROME +
  PREVIEW_URL_BAR_HEIGHT +
  PREVIEW_IMAGE_HEIGHT;

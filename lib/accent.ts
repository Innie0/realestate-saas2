// Semantic accent palette — one hue per module, used consistently across
// the dashboard so icons/badges/metrics are color-coded by meaning:
//   violet  → brand / AI
//   sky     → leads (new, incoming)
//   teal    → clients / people
//   emerald → money (transactions, pipeline)
//   amber   → time (follow-ups, due, projects in flight)
//   rose    → urgent / overdue / calendar
// Class strings are literal so Tailwind's content scan picks them up.

export type Accent = 'champagne' | 'sky' | 'teal' | 'emerald' | 'amber' | 'rose' | 'gray';

interface AccentClasses {
  /** Icon/text color on a light chip. */
  text: string;
  /** Tinted chip background. */
  bg: string;
  /** Chip ring. */
  ring: string;
  /** Solid dot / accent bar. */
  solid: string;
  /** Chip = bg + ring + text, for icon containers. */
  chip: string;
}

export const ACCENT: Record<Accent, AccentClasses> = {
  champagne: {
    text: 'text-champagne-600',
    bg: 'bg-champagne-50',
    ring: 'ring-champagne-200/60',
    solid: 'bg-champagne-500',
    chip: 'bg-champagne-50 ring-1 ring-champagne-200/60 text-champagne-600',
  },
  sky: {
    text: 'text-sky-600',
    bg: 'bg-sky-50',
    ring: 'ring-sky-200/60',
    solid: 'bg-sky-500',
    chip: 'bg-sky-50 ring-1 ring-sky-200/60 text-sky-600',
  },
  teal: {
    text: 'text-teal-600',
    bg: 'bg-teal-50',
    ring: 'ring-teal-200/60',
    solid: 'bg-teal-500',
    chip: 'bg-teal-50 ring-1 ring-teal-200/60 text-teal-600',
  },
  emerald: {
    text: 'text-emerald-600',
    bg: 'bg-emerald-50',
    ring: 'ring-emerald-200/60',
    solid: 'bg-emerald-500',
    chip: 'bg-emerald-50 ring-1 ring-emerald-200/60 text-emerald-600',
  },
  amber: {
    text: 'text-amber-600',
    bg: 'bg-amber-50',
    ring: 'ring-amber-200/60',
    solid: 'bg-amber-500',
    chip: 'bg-amber-50 ring-1 ring-amber-200/60 text-amber-600',
  },
  rose: {
    text: 'text-rose-600',
    bg: 'bg-rose-50',
    ring: 'ring-rose-200/60',
    solid: 'bg-rose-500',
    chip: 'bg-rose-50 ring-1 ring-rose-200/60 text-rose-600',
  },
  gray: {
    text: 'text-gray-700',
    bg: 'bg-gray-50',
    ring: 'ring-gray-200/70',
    solid: 'bg-gray-400',
    chip: 'bg-gray-50 ring-1 ring-gray-200/70 text-gray-700',
  },
};

/** Tinted avatar styles (slightly stronger than chips, for initials). */
export const AVATAR: Record<Accent, string> = {
  champagne: 'bg-champagne-100 text-champagne-700',
  sky: 'bg-sky-100 text-sky-700',
  teal: 'bg-teal-100 text-teal-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
  gray: 'bg-gray-100 text-gray-600',
};

const AVATAR_POOL: Accent[] = ['champagne', 'sky', 'teal', 'emerald', 'amber', 'rose'];

/** Deterministic accent for a person's name — same name, same color. */
export function nameAccent(name?: string | null): Accent {
  const safeName = name ?? '';
  let hash = 0;
  for (let i = 0; i < safeName.length; i++) {
    hash = (hash * 31 + safeName.charCodeAt(i)) | 0;
  }
  return AVATAR_POOL[Math.abs(hash) % AVATAR_POOL.length];
}

/** Avatar classes for a person's name. */
export function nameAvatarClasses(name?: string | null): string {
  return AVATAR[nameAccent(name)];
}

/** Module → accent mapping, so every page colors itself the same way. */
export const MODULE_ACCENT = {
  leads: 'sky',
  clients: 'teal',
  transactions: 'emerald',
  projects: 'amber',
  calendar: 'rose',
  ai: 'champagne',
  research: 'champagne',
} as const satisfies Record<string, Accent>;

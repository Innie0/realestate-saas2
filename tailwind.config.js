/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        'display-sm': ['1.75rem', { lineHeight: '2.125rem', letterSpacing: '-0.025em', fontWeight: '600' }],
        'title': ['1.0625rem', { lineHeight: '1.5rem', letterSpacing: '-0.015em', fontWeight: '600' }],
        'body': ['0.9375rem', { lineHeight: '1.5rem', fontWeight: '400' }],
        'caption': ['0.8125rem', { lineHeight: '1.25rem', fontWeight: '400' }],
        'label': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.04em', fontWeight: '500' }],
      },
      boxShadow: {
        // Elevation scale — used only where the "console" system explicitly
        // calls for a border-less floating surface (dropdowns, modals).
        // Most cards now rely on 1px hairline borders instead (see Surface `flat`).
        'surface': '0 1px 2px rgba(24,24,27,0.04), 0 4px 12px rgba(24,24,27,0.03)',
        'raised': '0 2px 4px rgba(24,24,27,0.05), 0 12px 24px -4px rgba(24,24,27,0.08)',
        'overlay': '0 24px 48px -12px rgba(24,24,27,0.18), 0 8px 16px -8px rgba(24,24,27,0.08)',
        'glow-brand': '0 1px 2px rgba(24,24,27,0.18), 0 6px 16px -4px rgba(24,24,27,0.25)',
      },
      colors: {
        // "Console" neutral scale — precise cool-warm grays from the graphite
        // dashboard design handoff. fafafa canvas, e8e8e6 card borders,
        // 18181b primary text. Pixel-matched to the handoff's design tokens.
        gray: {
          50: '#fafafa',
          100: '#f5f5f4',
          150: '#efefed',
          200: '#e8e8e6',
          300: '#d4d4d0',
          400: '#c9c9c4',
          450: '#a0a09c',
          500: '#8e8e8a',
          600: '#78786f',
          700: '#55554f',
          800: '#302f2c',
          900: '#18181b',
          950: '#000000',
        },
        // "Ink" — near-black graphite accent (replaces violet/champagne as the
        // primary interactive color: buttons, links, active nav state).
        ink: {
          DEFAULT: '#1c1c1a',
          900: '#1c1c1a',
          800: '#000000',
          700: '#000000',
          600: '#4a4a4e',
        },
        // brand === graphite accent per the handoff.
        //   500  primary action bg / active text (#1c1c1a)
        //   600  hover/pressed (#000000)
        //   200  active-nav tint bg (#e7e7e4)
        //   100  light pill bg (#ececea)
        //   400  avatar gradient stop (#4a4a4e)
        brand: {
          50: '#fafafa',
          100: '#ececea',
          200: '#e7e7e4',
          300: '#c9c9c4',
          400: '#4a4a4e',
          500: '#1c1c1a',
          600: '#000000',
          700: '#000000',
          800: '#000000',
          900: '#000000',
          DEFAULT: '#1c1c1a',
        },
        primary: {
          50: '#fafafa',
          100: '#ececea',
          200: '#e7e7e4',
          300: '#c9c9c4',
          400: '#4a4a4e',
          500: '#1c1c1a',
          600: '#000000',
          700: '#000000',
          800: '#000000',
          900: '#000000',
          DEFAULT: '#1c1c1a',
        },
        // Champagne — legacy signature accent, still used for AI/research
        // module coloring and person-avatar variety. Not part of the new
        // console screen, kept for pages not yet migrated to this system.
        champagne: {
          50: '#f8f2e6',
          100: '#efe2c8',
          200: '#e3cda2',
          300: '#d3b077',
          400: '#c29656',
          500: '#a87c43',
          600: '#896237',
          700: '#6a4c2d',
        },
        // ── Semantic hues — restored to near-stock Tailwind values. The
        // console handoff's hex values match Tailwind's default palette
        // almost exactly (amber-600/700, rose-600, teal-700, emerald-600),
        // confirming the design leans on crisp standard semantics rather
        // than a muted custom scale. Only the lightest tint steps are
        // hand-tuned to the handoff's exact warm-tinted backgrounds.
        amber: {
          50: '#fef6e7',
          100: '#f5e6c8',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        teal: {
          50: '#e6f7f4',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        // emerald, rose, sky: rely on Tailwind's built-in defaults (no
        // override needed — this key is intentionally omitted).
      },
    },
  },
  plugins: [],
};

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
        sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'ui-serif', 'Georgia', 'serif'],
      },
      fontSize: {
        'display-sm': ['1.75rem', { lineHeight: '2.125rem', letterSpacing: '-0.025em', fontWeight: '600' }],
        'title': ['1.0625rem', { lineHeight: '1.5rem', letterSpacing: '-0.015em', fontWeight: '600' }],
        'body': ['0.9375rem', { lineHeight: '1.5rem', fontWeight: '400' }],
        'caption': ['0.8125rem', { lineHeight: '1.25rem', fontWeight: '400' }],
        'label': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.04em', fontWeight: '500' }],
      },
      boxShadow: {
        // Elevation scale — the ONLY shadows used in the app.
        // Warm-tinted (near-black warm base) for the "private office" canvas.
        'surface': '0 1px 2px rgba(28,25,23,0.04), 0 4px 12px rgba(28,25,23,0.03)',
        'raised': '0 2px 4px rgba(28,25,23,0.05), 0 12px 24px -4px rgba(28,25,23,0.08)',
        'overlay': '0 24px 48px -12px rgba(28,25,23,0.18), 0 8px 16px -8px rgba(28,25,23,0.08)',
        // Soft graphite lift for primary CTAs.
        'glow-brand': '0 1px 2px rgba(28,25,23,0.18), 0 6px 16px -4px rgba(28,25,23,0.25)',
      },
      colors: {
        // Warm neutral scale (Tailwind "stone") — the paper-warm base of the
        // "private office" theme. Cards are white on a warm off-white canvas.
        gray: {
          50: '#faf9f7',
          100: '#f4f2ef',
          200: '#e7e4df',
          300: '#d5d1ca',
          400: '#a8a29a',
          500: '#78716a',
          600: '#57534d',
          700: '#44403b',
          800: '#292524',
          900: '#1c1917',
          950: '#0f0d0c',
        },
        // "Ink" — warm near-black graphite. The primary action color and the
        // anchor for headings. Replaces the previous violet brand.
        ink: {
          DEFAULT: '#1c1917',
          900: '#1c1917',
          800: '#292524',
          700: '#38332f',
          600: '#4a443e',
        },
        // brand === graphite. Buttons (500/600), links (600/700), tints (50).
        // Deliberately neutral: the color comes from the muted accents below.
        brand: {
          50: '#f6f5f3',
          100: '#ece9e5',
          200: '#dad5cf',
          300: '#b6afa6',
          400: '#736c64',
          500: '#2c2926',
          600: '#1c1917',
          700: '#151210',
          800: '#100e0c',
          900: '#0b0a09',
          DEFAULT: '#1c1917',
        },
        primary: {
          50: '#f6f5f3',
          100: '#ece9e5',
          200: '#dad5cf',
          300: '#b6afa6',
          400: '#736c64',
          500: '#2c2926',
          600: '#1c1917',
          700: '#151210',
          800: '#100e0c',
          900: '#0b0a09',
          DEFAULT: '#1c1917',
        },
        // Champagne — the one warm signature accent, used sparingly for
        // highlights (active states, "today" pills, premium touches).
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
        // ── Muted "private office" reskins of the semantic hues ──────────
        // Existing components reference emerald/amber/rose/sky/teal directly;
        // desaturating the scales here recolors every badge/accent at once.
        // emerald → sage (money · active · positive)
        emerald: {
          50: '#eef3f0',
          100: '#dbe8e1',
          200: '#bad6c9',
          300: '#8fbca8',
          400: '#619a82',
          500: '#4c7d68',
          600: '#3e6455',
          700: '#334f44',
          800: '#2b4038',
          900: '#243530',
        },
        // teal → deep sage (clients · people)
        teal: {
          50: '#eef3f2',
          100: '#d9e8e3',
          200: '#b5d2ca',
          300: '#86b4a8',
          400: '#569285',
          500: '#43786a',
          600: '#356156',
          700: '#2d4e46',
          800: '#284039',
          900: '#243530',
        },
        // amber → copper (time · follow-ups · warnings)
        amber: {
          50: '#f8f1e5',
          100: '#efe0c6',
          200: '#e1c797',
          300: '#cea86a',
          400: '#bd8f4a',
          500: '#a5773b',
          600: '#875f31',
          700: '#6b4b28',
          800: '#573e24',
          900: '#4a3420',
        },
        // rose → clay (urgent · overdue)
        rose: {
          50: '#f7ece9',
          100: '#eed8d1',
          200: '#deb6aa',
          300: '#c98b79',
          400: '#b56650',
          500: '#a1503c',
          600: '#854032',
          700: '#6c352a',
          800: '#5a2f26',
          900: '#4d2a22',
        },
        // sky → steel blue (leads · info)
        sky: {
          50: '#eff2f5',
          100: '#dce4ea',
          200: '#bccdd9',
          300: '#93aec2',
          400: '#6789a4',
          500: '#4e708a',
          600: '#3f5b70',
          700: '#36495a',
          800: '#313e4c',
          900: '#2c3742',
        },
        // green → sage (mirrors emerald; used by "success" states)
        green: {
          50: '#eef3f0',
          100: '#dbe8e1',
          200: '#bad6c9',
          300: '#8fbca8',
          400: '#619a82',
          500: '#4c7d68',
          600: '#3e6455',
          700: '#334f44',
          800: '#2b4038',
          900: '#243530',
        },
        // red → clay (danger/errors, muted but still clearly an alert)
        red: {
          50: '#f7ece9',
          100: '#eed8d1',
          200: '#deb6aa',
          300: '#c98b79',
          400: '#b56650',
          500: '#a1503c',
          600: '#8f4634',
          700: '#6c352a',
          800: '#5a2f26',
          900: '#4d2a22',
        },
        // blue / indigo / violet → steel (fold cool accents into the theme)
        blue: {
          50: '#eff2f5',
          100: '#dce4ea',
          200: '#bccdd9',
          300: '#93aec2',
          400: '#6789a4',
          500: '#4e708a',
          600: '#3f5b70',
          700: '#36495a',
          800: '#313e4c',
          900: '#2c3742',
        },
        indigo: {
          50: '#eff2f5',
          100: '#dce4ea',
          200: '#bccdd9',
          300: '#93aec2',
          400: '#6789a4',
          500: '#4e708a',
          600: '#3f5b70',
          700: '#36495a',
          800: '#313e4c',
          900: '#2c3742',
        },
        violet: {
          50: '#f8f2e6',
          100: '#efe2c8',
          200: '#e3cda2',
          300: '#d3b077',
          400: '#c29656',
          500: '#a87c43',
          600: '#896237',
          700: '#6a4c2d',
          800: '#573f26',
          900: '#493420',
        },
      },
    },
  },
  plugins: [],
};

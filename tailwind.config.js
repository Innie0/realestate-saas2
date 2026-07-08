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
        // Ink-tinted (near-black base) so they sit naturally on the cool canvas.
        'surface': '0 1px 2px rgba(16,16,20,0.04), 0 4px 12px rgba(16,16,20,0.03)',
        'raised': '0 2px 4px rgba(16,16,20,0.05), 0 12px 24px -4px rgba(16,16,20,0.08)',
        'overlay': '0 24px 48px -12px rgba(16,16,20,0.18), 0 8px 16px -8px rgba(16,16,20,0.08)',
        // Violet glow for primary CTAs and focus moments.
        'glow-brand': '0 1px 2px rgba(109,40,217,0.25), 0 4px 16px -2px rgba(124,58,237,0.35)',
      },
      colors: {
        // Cool neutral scale (Tailwind "zinc") — harmonizes with the violet
        // brand color and the ink sidebar. Replaces the previous warm stone.
        gray: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        // "Ink" — the near-black anchor used by the dashboard sidebar/shell.
        ink: {
          DEFAULT: '#101014',
          900: '#101014',
          800: '#16161c',
          700: '#1e1e26',
          600: '#2a2a34',
        },
        // "Signal" violet — primary action color. Deliberately not the blue /
        // green / red every other real-estate product uses. Scale is shifted
        // one step dark (500 = violet-600) so white-on-brand-500 stays AA.
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#7c3aed',
          600: '#6d28d9',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#3c1a78',
          DEFAULT: '#7c3aed',
        },
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#7c3aed',
          600: '#6d28d9',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#3c1a78',
          DEFAULT: '#7c3aed',
        },
      },
    },
  },
  plugins: [],
};

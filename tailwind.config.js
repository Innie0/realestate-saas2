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
        // Warm-tinted (stone-900 base) so they sit naturally on the warm canvas.
        'surface': '0 1px 2px rgba(28,25,23,0.04), 0 4px 12px rgba(28,25,23,0.03)',
        'raised': '0 2px 4px rgba(28,25,23,0.05), 0 12px 24px -4px rgba(28,25,23,0.08)',
        'overlay': '0 24px 48px -12px rgba(28,25,23,0.18), 0 8px 16px -8px rgba(28,25,23,0.08)',
      },
      colors: {
        // Warm neutral scale (Tailwind "stone") — replaces the default cool
        // gray so borders/text/badges harmonize with the warm #F3F3F2 canvas.
        gray: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
          950: '#0c0a09',
        },
        brand: {
          50: '#fff4ed',
          100: '#ffe6d5',
          200: '#ffcab0',
          300: '#ffa77a',
          400: '#fd7f2e',
          500: '#fc5c03',
          600: '#e04a02',
          700: '#b93902',
          800: '#922e08',
          900: '#772809',
          DEFAULT: '#fc5c03',
        },
        primary: {
          50: '#fff4ed',
          100: '#ffe6d5',
          200: '#ffcab0',
          300: '#ffa77a',
          400: '#fd7f2e',
          500: '#fc5c03',
          600: '#e04a02',
          700: '#b93902',
          800: '#922e08',
          900: '#772809',
          DEFAULT: '#fc5c03',
        },
      },
    },
  },
  plugins: [],
};

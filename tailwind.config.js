/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
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
      colors: {
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

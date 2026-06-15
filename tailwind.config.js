/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
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

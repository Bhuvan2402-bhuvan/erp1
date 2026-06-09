/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f6fc',
          100: '#d5e7f7',
          200: '#a3c9eb',
          300: '#6da4d6',
          400: '#3a7ebd',
          500: '#165c9f',
          600: '#0f457a',
          700: '#09335a',
          800: '#052440', // Logo Deep Navy
          900: '#03172b',
        },
        logo: {
          navy: '#052440',
          teal: '#41A19D',
          green: '#25974F',
          gold: '#765B48',
          amber: '#D9A05B',
        }
      }
    },
  },
  plugins: [],
};

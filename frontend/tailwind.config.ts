/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0A1628',
          900: '#0A1628',
          800: '#0F2137',
          700: '#142B46',
          600: '#1A385A',
        },
        gold: {
          DEFAULT: '#F4B942',
          500: '#F4B942',
          400: '#F6C55E',
          600: '#E8A832',
        },
      },
    },
  },
  plugins: [],
}

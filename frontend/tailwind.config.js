/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        green: {
          DEFAULT: '#00e5a0',
          light: '#00b07a',
        },
        blue: {
          brand: '#4da6ff',
          'brand-light': '#2277dd',
        },
        amber: {
          brand: '#ffb547',
          'brand-light': '#d48a00',
        },
        red: {
          brand: '#ff6b6b',
          'brand-light': '#dd4444',
        },
        surface: {
          dark: '#0f1117',
          card: '#1a1d27',
          border: '#2a2d3a',
        },
      },
    },
  },
  plugins: [],
}

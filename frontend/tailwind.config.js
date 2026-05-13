/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ms: {
          black: '#0a0a0a',
          darker: '#111111',
          dark: '#1a1a1a',
          card: '#1f1f1f',
          border: '#2a2a2a',
          muted: '#6b6b6b',
          gold: '#c9a84c',
          'gold-light': '#e0c468',
          'gold-dark': '#a8882e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
}

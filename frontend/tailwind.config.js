/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: {
          50: '#f6f6f5', 100: '#e7e6e3', 200: '#d0cdc7', 300: '#aeaaa0',
          400: '#867f72', 500: '#6b6459', 600: '#57514a', 700: '#48433d',
          800: '#302b26', 900: '#1c1815', 950: '#0f0d0b',
        },
        ivory: { 50: '#fefdfb', 100: '#fbf8f2', 200: '#f5efe2', 300: '#ede2ca' },
        sand: { 100: '#f2e9d8', 200: '#e6d5b8', 300: '#d8bf94', 400: '#c9a877' },
        stone: { 100: '#e9e4dc', 200: '#d3cabb', 300: '#b3a693' },
        terracotta: { 400: '#d38361', 500: '#c06a44', 600: '#a4522f', 700: '#843f25' },
        olive: { 400: '#8b8a5f', 500: '#71704a', 600: '#5a5939' },
        bronze: { 400: '#a68a5b', 500: '#8c7148' },
      },
      fontFamily: {
        serif: ['"Fraunces"', '"Georgia"', 'serif'],
        sans: ['"Inter"', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 20px -4px rgba(28, 24, 21, 0.08)',
        card: '0 4px 30px -6px rgba(28, 24, 21, 0.12)',
        lifted: '0 12px 50px -12px rgba(28, 24, 21, 0.25)',
      },
      letterSpacing: { widest2: '0.2em' },
    },
  },
  plugins: [],
};

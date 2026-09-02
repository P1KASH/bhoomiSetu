/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef2f7',
          100: '#d4dde9',
          200: '#a8b9d1',
          300: '#6f88ad',
          400: '#3f5e85',
          500: '#234268',
          600: '#173052',
          700: '#112440',
          800: '#0c1b33',
          900: '#081326',
          950: '#050b1a',
        },
        forest: {
          50: '#ecf6ee',
          100: '#cfe6d4',
          200: '#9fcca9',
          300: '#62ad72',
          400: '#3a8f4c',
          500: '#1f6e32',
          600: '#175828',
          700: '#134522',
          800: '#0f371d',
          900: '#0b2916',
        },
        saffron: {
          50: '#fef3e6',
          100: '#fce0bd',
          200: '#f7c077',
          300: '#f29a2f',
          400: '#e07d10',
          500: '#c2640a',
          600: '#9c4e09',
          700: '#763a08',
          800: '#532b07',
          900: '#371c05',
        },
        sand: {
          50: '#fbfaf6',
          100: '#f5f1e8',
          200: '#e9e0cd',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 2px 0 rgba(12,27,51,0.06), 0 1px 3px 0 rgba(12,27,51,0.08)',
        lift: '0 4px 14px -2px rgba(12,27,51,0.12), 0 2px 6px -2px rgba(12,27,51,0.08)',
      },
    },
  },
  plugins: [],
};

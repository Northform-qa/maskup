/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#3B6D11',
          light: '#4a8a15',
          dark: '#2d5409',
          50: '#f3f8ee',
          100: '#dff0d0',
          200: '#bde1a0',
          300: '#93cc63',
          400: '#6db332',
          500: '#3B6D11',
          600: '#2d5409',
          700: '#234107',
          800: '#1a3005',
          900: '#111f03',
        },
        cream: {
          DEFAULT: '#F7F5F0',
          50: '#FDFCFA',
          100: '#F7F5F0',
          200: '#EEE9DF',
          300: '#E0D9CC',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

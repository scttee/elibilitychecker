/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        civic: {
          ink: '#111827',
          accent: '#0b4f8a',
          soft: '#eef3f8',
          border: '#d1d5db',
          success: '#14532d',
          warn: '#92400e'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}

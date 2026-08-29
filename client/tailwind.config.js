/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        safe: {
          low: '#10B981',      // Emerald Green
          moderate: '#F59E0B', // Amber
          high: '#F97316',     // Orange
          critical: '#EF4444', // Red
          dark: '#0F172A',
          card: '#1E293B',
          accent: '#3B82F6'
        }
      }
    },
  },
  plugins: [],
}

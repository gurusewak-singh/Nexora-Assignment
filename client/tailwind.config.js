// client/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#111827',     // Very dark gray, almost black
        'brand-mid': '#1F2937',      // Mid-dark gray
        'brand-light': '#374151',    // Lighter gray for cards/modals
        'brand-primary': '#38BDF8',  // A vibrant, friendly blue
        'brand-secondary': '#818CF8',// A soft purple for accents
        'brand-text': '#E5E7EB',     // Off-white for primary text
        'brand-text-muted': '#9CA3AF',// Gray for secondary text
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
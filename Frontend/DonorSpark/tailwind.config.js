/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'hero-gradient': 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      },
    },
  },
  plugins: [],
}

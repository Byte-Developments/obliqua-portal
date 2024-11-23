/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'portal-purple': '#8B5CF6',
        'portal-purple-light': '#A78BFA',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
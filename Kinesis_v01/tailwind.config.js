/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'geist-mono': ['Geist Mono', 'monospace'],
        'racing-sans': ['Racing Sans One', 'cursive'],
        sans: ['Racing Sans One', 'cursive'],
      },
    },
  },
  plugins: [],
};

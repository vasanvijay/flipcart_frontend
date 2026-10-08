/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2874f0",
        secondary: "#fb641b",
        background: "#f1f3f6",
        'dark-text': "#212121",
        'light-text': "#878787"
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 4px 0 rgba(0,0,0,.08)',
        'card-hover': '0 4px 16px 0 rgba(0,0,0,.2)',
        'nav': '0 1px 2px 0 rgba(0,0,0,.1)',
      }
    },
  },
  plugins: [],
}


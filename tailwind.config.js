/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#191919',
        'primary-light': '#333333',
        'primary-dark': '#000000',
      },
      height: {
        '112': '28rem',  // 448px
        '120': '30rem',  // 480px
        '128': '32rem',  // 512px
      },
      maxWidth: {
        '7xl': '80rem',  // 1280px
      }
    },
  },
  plugins: [],
}
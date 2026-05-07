/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./paypal/**/*.html",
    "./paypal/**/*.js",
    "./*.js"
  ],
  theme: {
    extend: {
      colors: {
        ppBlue: '#001C64',
        ppAction: '#0070BA',
        ppBg: '#FFFFFF',
        ppSurface: '#F5F7FA',
        ppBorder: '#E5E7EB'
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif']
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}

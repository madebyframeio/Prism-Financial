/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./*.js"],
  theme: {
    extend: {
      colors: {
        primary: "#056dae",
        secondary: "#004B8D",
        accent: "#FCCC44",
        bankGray: "#F4F4F4",
        bankText: "#333333",
        borderGray: "#D1D1D1"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}

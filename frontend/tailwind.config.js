/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx}',
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#E53935',
        secondary: '#FFD600',
        accent: '#2E7D32',
        background: '#FFFBEA',
        dark: '#1A1A1A',
        textmain: '#2C2C2C',
        textsub: '#5C5C5C',
        gold: '#D4AF37',
        sky: '#4FC3F7'
      },
      fontFamily: {
        playfair: ['"Playfair Display"', 'serif'],
        poppins: ['Poppins', 'sans-serif']
      },
      borderRadius: {
        '2xl': '1rem'
      }
    }
  },
  plugins: []
}

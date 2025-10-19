/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#5b13ec',
        background: {
          DEFAULT: '#161022',
          dark: '#0F0D1A',
          light: '#f6f6f8',
        },
        card: 'rgba(255,255,255,0.06)',
        cardBorder: 'rgba(255,255,255,0.12)',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./**/*.html",
    "./assets/js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        'karl': {
          'dark': '#0a140a',
          'green': '#DDEDD2',
          'brown': '#F2D1A4',
          'gold': '#D4A574',
          'cream': '#FFF8E7',
          'bg-primary': '#0a140a',
          'bg-secondary': '#050a05',
          'bg-card': '#1a2e1a',
          'bg-hover': '#2d4a2d',
          'text-primary': '#DDEDD2',
          'text-secondary': '#a7f3d0',
          'text-muted': '#3d5a3d',
          'border-primary': '#DDEDD2',
          'border-secondary': '#2d4a2d',
          'border-muted': '#1a2e1a',
        },
        'success': '#DDEDD2',
        'error': '#F2D1A4',
        'warning': '#D4A574',
        'info': '#DDEDD2',
      },
      spacing: {
        'touch': '44px',
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
      fontSize: {
        'base': ['16px', { lineHeight: '1.6' }], // Prevents iOS zoom
      },
    },
  },
  plugins: [],
}


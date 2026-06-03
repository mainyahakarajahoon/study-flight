/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        fids: {
          bg: '#000000',
          amber: '#F5A623',
          gold: '#FFD700',
          white: '#FFFFFF',
          dim: '#888888',
        },
        flight: {
          bg: '#050d2a',
          accent: '#3B82F6',
        },
      },
      fontFamily: {
        fids: ['"Share Tech Mono"', '"Courier New"', 'monospace'],
        inter: ['"Inter"', 'system-ui', 'sans-serif'],
        boarding: ['"Playfair Display"', 'serif'],
      },
      keyframes: {
        blink: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        blink: 'blink 1s step-end infinite',
        'fade-in': 'fade-in 0.5s ease-out',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        'primary': {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a'
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'float': 'float 6s ease-in-out infinite',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin': 'spin 1s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px) translateZ(0)' },
          '100%': { opacity: '1', transform: 'translateY(0) translateZ(0)' },
        },
        float: {
          '0%, 100%': { 
            transform: 'translateY(0px) rotate(0deg) translateZ(0)', 
            opacity: '0.4' 
          },
          '50%': { 
            transform: 'translateY(-15px) rotate(180deg) translateZ(0)', 
            opacity: '0.8' 
          },
        },
        bounceGentle: {
          '0%, 100%': { 
            transform: 'translateY(0) translateZ(0)' 
          },
          '50%': { 
            transform: 'translateY(-5px) translateZ(0)' 
          },
        },
        pulse: {
          '0%, 100%': { 
            opacity: '1', 
            transform: 'scale(1) translateZ(0)' 
          },
          '50%': { 
            opacity: '0.8', 
            transform: 'scale(1.05) translateZ(0)' 
          },
        },
        spin: {
          'from': { 
            transform: 'rotate(0deg) translateZ(0)' 
          },
          'to': { 
            transform: 'rotate(360deg) translateZ(0)' 
          },
        },
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
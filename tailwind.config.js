/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a'
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        'fade-in': 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in-up': 'fadeInUp 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'slide-in': 'slideIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'float': 'float 6s ease-in-out infinite',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin': 'spin 1s linear infinite',
        'smooth-scroll': 'smoothScroll 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px) translateZ(0)' },
          '100%': { opacity: '1', transform: 'translateY(0) translateZ(0)' },
        },
        fadeInUp: {
          '0%': { 
            opacity: '0', 
            transform: 'translateY(30px) translateZ(0)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'translateY(0) translateZ(0)' 
          },
        },
        slideIn: {
          '0%': { 
            opacity: '0', 
            transform: 'translateX(-20px) translateZ(0)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'translateX(0) translateZ(0)' 
          },
        },
        smoothScroll: {
          '0%': { 
            transform: 'translateY(20px) translateZ(0)',
            opacity: '0.8'
          },
          '100%': { 
            transform: 'translateY(0) translateZ(0)',
            opacity: '1'
          },
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
        'smooth-ease': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'smooth-in': 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
        'smooth-out': 'cubic-bezier(0.215, 0.61, 0.355, 1)',
        'smooth-in-out': 'cubic-bezier(0.645, 0.045, 0.355, 1)',
      },
      scrollBehavior: ['smooth'],
    },
  },
  plugins: [],
}
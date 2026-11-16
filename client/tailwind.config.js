/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF1F1',
          100: '#FFE0E0',
          200: '#FFC5C5',
          300: '#FF9B9B',
          400: '#F96363',
          500: '#E83A3A',
          600: '#C81E2E',
          700: '#A51724',
          800: '#87171F',
          900: '#70171D',
          950: '#3E070A',
        },
        accent: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
        },
        ink: {
          50: '#F7F5F2',
          100: '#EDE8E2',
          200: '#D9D0C7',
          300: '#B8AA9D',
          400: '#94847A',
          500: '#6F6058',
          600: '#574A44',
          700: '#3D332E',
          800: '#241D19',
          900: '#14100E',
          950: '#0B0806',
        },
        cream: {
          50: '#FDFBF7',
          100: '#FBF6EE',
          200: '#F5ECDE',
          300: '#EDDFCB',
          400: '#E2CEB2',
        },
      },
      fontFamily: {
        display: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 12px 40px -18px rgba(20,16,14,0.18)',
        card: '0 24px 70px -34px rgba(20,16,14,0.35)',
        glow: '0 16px 40px -14px rgba(200,30,46,0.5)',
        nav: '0 10px 30px -22px rgba(20,16,14,0.45)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.75rem',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'bounce-dot': {
          '0%, 80%, 100%': { transform: 'translateY(0)', opacity: '0.45' },
          '40%': { transform: 'translateY(-4px)', opacity: '1' },
        },
      },
      animation: {
        marquee: 'marquee 30s linear infinite',
        float: 'float 7s ease-in-out infinite',
        'fade-up': 'fade-up 0.6s ease-out both',
        shimmer: 'shimmer 1.7s infinite',
        'bounce-dot': 'bounce-dot 1.2s infinite',
      },
    },
  },
  plugins: [],
};

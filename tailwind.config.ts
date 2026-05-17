import type { Config } from 'tailwindcss';

// Paleta oficial MIDSEA Academy:
//   #1800AA azul profundo  → midsea-deep / midsea-ocean
//   #0D9488 teal           → midsea-lagoon
//   #F9B21C naranja        → midsea-coral / nexos
//   #000000 negro          → midsea-ink
//   Derivados: foam (bg claro), sun (naranja claro), nexos-dark.

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        midsea: {
          deep: '#1800AA',
          ocean: '#1800AA',
          lagoon: '#0D9488',
          foam: '#EEF1FF',
          coral: '#F9B21C',
          sun: '#FCD46F',
          ink: '#000000'
        },
        nexos: {
          DEFAULT: '#F9B21C',
          dark: '#C88500'
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['var(--font-inter)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif']
      },
      boxShadow: {
        wave: '0 12px 30px -12px rgba(24, 0, 170, 0.35)'
      },
      keyframes: {
        ripple: {
          '0%': { transform: 'scale(0.95)', opacity: '0.8' },
          '100%': { transform: 'scale(1.6)', opacity: '0' }
        },
        floatY: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' }
        }
      },
      animation: {
        ripple: 'ripple 1.2s ease-out infinite',
        floatY: 'floatY 3.5s ease-in-out infinite'
      }
    }
  },
  plugins: []
};

export default config;

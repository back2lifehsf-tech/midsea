import type { Config } from 'tailwindcss';

// Paleta oficial MIDSEA Academy:
//   #1800AA azul profundo  → midsea-deep / midsea-ocean
//   #0D9488 teal           → midsea-lagoon
//   #F9B21C naranja        → midsea-coral / coin
//   #000000 negro          → midsea-ink
//   Derivados: foam (bg claro), sun (naranja claro), coin-dark.

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
        coin: {
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
        },
        // Avatar Angela keyframes (estados idle/explaining/celebrating/resting)
        breathe: {
          '0%, 100%': { transform: 'scale(0.98)' },
          '50%': { transform: 'scale(1.02)' }
        },
        blink: {
          '0%, 92%, 100%': { transform: 'scaleY(1)' },
          '95%, 97%': { transform: 'scaleY(0.1)' }
        },
        thinkDot: {
          '0%, 80%, 100%': { transform: 'translateY(0)', opacity: '0.4' },
          '40%': { transform: 'translateY(-3px)', opacity: '1' }
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' }
        },
        zzzFloat: {
          '0%': { transform: 'translateY(0)', opacity: '0' },
          '20%': { opacity: '1' },
          '100%': { transform: 'translateY(-10px)', opacity: '0' }
        },
        sparkleSpin: {
          '0%, 100%': { transform: 'scale(0.7) rotate(0deg)', opacity: '0.5' },
          '50%': { transform: 'scale(1) rotate(20deg)', opacity: '1' }
        }
      },
      animation: {
        ripple: 'ripple 1.2s ease-out infinite',
        floatY: 'floatY 3.5s ease-in-out infinite',
        breathe: 'breathe 3.5s ease-in-out infinite',
        blink: 'blink 5s ease-in-out infinite',
        thinkDot: 'thinkDot 1.2s ease-in-out infinite',
        bounceSoft: 'bounceSoft 1.4s ease-in-out infinite',
        zzzFloat: 'zzzFloat 2.4s ease-in-out infinite',
        sparkleSpin: 'sparkleSpin 1.6s ease-in-out infinite'
      }
    }
  },
  plugins: []
};

export default config;

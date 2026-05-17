import type { Config } from 'tailwindcss';

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
          deep: '#0B3D5C',
          ocean: '#1A6E8E',
          lagoon: '#3FB8AF',
          foam: '#E8F6F4',
          coral: '#FF7A66',
          sun: '#FFC857',
          ink: '#0A1F2C'
        },
        nexos: {
          DEFAULT: '#FFC857',
          dark: '#E0A92E'
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        wave: '0 12px 30px -12px rgba(11, 61, 92, 0.45)'
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

import type { Config } from 'tailwindcss';

// Paleta oficial MIDSEA Academy (v2 — Warm Academic, extraída del mockup aprobado):
//
//   TEAL (acción, progreso, activo):
//     midsea-lagoon        #3D9E7A  → chips activos, checkmarks, pull quote, avatar Angela
//     midsea-lagoon-light  #E8F5F0  → fondo suave de chip activo y badges sutiles
//
//   AMBER (coins, reflexión cristiana):
//     coin.DEFAULT         #E8921A  → ícono y texto de coins
//     coin.light           #FEF3E2  → fondo badge coins y card reflexión
//     coin.dark            #C47A1A  → texto reflexión y labels amber oscuros
//
//   NEUTROS:
//     midsea-ink           #1A1A1A  → texto principal (casi negro)
//     midsea-muted         #6B7280  → texto secundario y metadata
//     midsea-border        #E5E7EB  → bordes de cards y separadores
//     midsea-surface       #FAFAFA  → fondo de página
//     midsea-foam          #FFFFFF  → fondo de cards
//
//   LEGADO (sin cambio — compatibilidad con componentes existentes):
//     midsea-deep / midsea-ocean  #1800AA  → botones primary, nav

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
          // Legado — no cambiar, usados por Button, nav y AngelaChat
          deep: '#1800AA',
          ocean: '#1800AA',
          // Teal (Warm Academic — mockup aprobado)
          lagoon: '#3D9E7A',
          'lagoon-light': '#E8F5F0',
          // Neutros
          foam: '#FFFFFF',
          surface: '#FAFAFA',
          border: '#E5E7EB',
          ink: '#1A1A1A',
          muted: '#6B7280',
          // Aliases legado
          coral: '#E8921A',
          sun: '#FEF3E2',
        },
        coin: {
          DEFAULT: '#E8921A',
          light: '#FEF3E2',
          dark: '#C47A1A',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['var(--font-inter)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        serif: ['var(--font-lora)', 'Georgia', 'serif']
      },
      boxShadow: {
        wave: '0 12px 30px -12px rgba(61, 158, 122, 0.20)',
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.06)',
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

# CLAUDE.md - Midsea Project Instructions

## Project Identity
Midsea - Plataforma de homeschooling bilingue (es/en) con AI tutoring y gamificacion.
Rebrand completo de EduNexo. CERO referencias al nombre viejo.

## Documento Maestro
PRD.md en la raiz es la fuente de verdad.
Lee ese archivo antes de cualquier tarea de codigo.
Si hay conflicto entre estas instrucciones y el PRD, gana el PRD.

## Stack (confirmar en PRD.md)
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- NextAuth.js / Clerk
- OpenAI SDK (streaming)
- next-intl (i18n)
- Zustand + React Query

## Reglas de Oro
1. No EduNexo: grep antes de commitear. Cero referencias al nombre viejo.
2. i18n primero: Todo texto de UI usa t('key') de next-intl. Nunca hardcodees.
3. Gamificacion aislada: Logica de puntos/niveles en src/lib/gamification/.
4. AI streaming: Respuestas del tutor palabra por palabra. No esperes JSON completo.
5. Seguridad: API keys solo en .env.local (servidor). Nunca en componentes React.
6. Responsive mobile-first: Tailwind breakpoints estandar.
7. a11y: Labels, aria-labels, contrastes AA.

## Estructura de Directorios
```
PRD.md                    # Fuente de verdad
src/
  app/                    # Rutas Next.js App Router
  components/             # UI reutilizable
    ui/                   # Componentes base
    gamification/         # Badges, niveles, progreso
    tutoring/             # Chat con AI, sesiones
    auth/                 # Login, registro
  lib/
    gamification/         # Motor de puntos y logros
    i18n/                 # Config es/en
    prisma.ts             # Cliente singleton
    openai.ts             # Cliente servidor AI
  types/                  # Interfaces globales
public/assets/            # Logo Midsea, iconos, ilustraciones
docs/                     # Documentacion extra
```

## Como Trabajar con Claude Code
1. claude -> inicia sesion en el directorio del proyecto
2. Pide a Claude que lea PRD.md antes de empezar cualquier feature
3. Usa prompts especificos: "Implementa la feature X del PRD.md, seccion Y"
4. Revisa que Claude no haya introducido strings hardcodeados ni referencias a EduNexo
5. Commitea con mensajes claros: feat(gamificacion): add badge progression engine

## Comandos Utiles
```bash
# Buscar referencias residuales al nombre viejo
grep -ri "edunexo" .

# Type-check antes de commitear
npm run type-check
```

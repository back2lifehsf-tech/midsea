# Midsea Development Skill

## Context
Midsea es una plataforma de homeschooling bilingue (es/en) con tutoria AI integrada y sistema de gamificacion.
Rebrand completo de EduNexo - NO debe existir ninguna referencia a EduNexo en el nuevo codebase.

## Mandatory First Step
Antes de escribir o modificar cualquier archivo, lee PRD.md para entender:
- Stack tecnologico y arquitectura
- Features actuales y roadmap
- Convenciones de codigo establecidas
- Estructura de directorios definida

## Core Rules
1. Zero EduNexo: Ningun string, variable, ruta, comentario o asset puede referenciar "EduNexo" o "edunexo".
2. Bilingue obligatorio: Todo texto visible al usuario debe pasar por i18n. Nunca hardcodees strings directamente en componentes.
3. Gamificacion centralizada: Toda logica de puntos, badges, niveles y recompensas en src/lib/gamification/.
4. AI Tutoring con streaming: Las interacciones con el tutor AI deben usar streaming de respuestas.
5. Seguridad de API keys: Las claves de servicios externos solo en variables de entorno del servidor.
6. Mobile-first: Todo componente debe ser responsive. Breakpoints: sm (640px), md (768px), lg (1024px).
7. Accesibilidad (a11y): Todos los inputs necesitan labels, botones con aria-labels, contrastes WCAG AA.

## Directory Patterns
- src/app/ o src/pages/: Rutas y layouts
- src/components/: Componentes reutilizables (ui/, gamification/, tutoring/, auth/)
- src/lib/: Utilidades, APIs, hooks genericos
- src/lib/gamification/: Motor de gamificacion
- src/lib/i18n/: Configuracion de idiomas y diccionarios
- src/types/: Interfaces y tipos TypeScript globales
- public/assets/: Imagenes, fuentes, iconos de marca Midsea
- docs/: Documentacion adicional fuera del PRD

## Workflow
1. Lee PRD.md
2. Identifica el dominio afectado (auth, tutoring, gamificacion, etc.)
3. Planifica archivos nuevos/modificados. Nunca modifiques mas de 3-4 archivos sin confirmar con el usuario.
4. Implementa siguiendo las reglas de arriba.
5. Verifica que no haya strings hardcodeados ni referencias a EduNexo.
6. Explica brevemente que hiciste y que archivos tocaste.

## Tech Stack Assumptions (override via PRD.md)
Si el PRD no especifica, asume:
- Frontend: Next.js 14+ (App Router) + TypeScript + Tailwind CSS
- Backend/API: Next.js API Routes o serverless functions
- DB: PostgreSQL via Prisma ORM
- Auth: NextAuth.js o Clerk
- AI: OpenAI SDK con streaming
- i18n: next-intl
- Estado: Zustand (cliente), React Query (servidor)

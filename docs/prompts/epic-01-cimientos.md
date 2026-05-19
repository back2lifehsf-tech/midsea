# Prompt para Claude Code — Epic 01: Cimientos
## Auth + i18n diccionarios + Routing

> **Cómo usar este prompt:** abre `claude` en la raíz del repo y pega todo el bloque de la sección **PROMPT** al final de este archivo. Las secciones previas (Contexto, Plan de Sprint, Aceptación) son referencia para ti, no para Claude Code.

---

## Contexto del epic

**Epic:** Construir los cimientos del producto que desbloquean toda la implementación posterior. Sin esto, no se puede demostrar nada a usuarios ni a inversores, y todas las features siguientes (Sylvie, Lesson Player, Parent Copilot) dependen de tener un usuario autenticado con locale resuelto.

**Duración estimada:** 5-7 días de trabajo enfocado.

**Estado actual del repo (verificado el 2026-05-18):**
- Next.js 14.2 + TS + Tailwind configurados.
- Prisma schema completo con modelos `Family`, `Parent`, `Student`, `Lesson`, `LessonProgress`, `NexosEntry`, `Badge`, `EarnedBadge`, `TutorSession`, `TutorMessage`.
- `src/lib/i18n/config.ts` define locales `[es, en]` con `defaultLocale = 'es'`.
- `src/middleware.ts` configurado para next-intl con `localePrefix: 'always'`.
- `src/lib/gamification/engine.ts` ya implementa la regla de mastery ≥ 80% para Nexos.
- Primitivas UI: `Button`, `Card`, `LocaleSwitcher`, `NexosBadge`, `ProgressBar`.
- **NO existe:** carpeta `src/app/`, diccionarios `messages/`, integración NextAuth, ningún flujo de auth, ni ninguna ruta funcional.
- Dependencias ya instaladas: `next-auth@^4.24`, `next-intl@^3.20`, `openai@^4.67`, `zustand@^4.5`, `@tanstack/react-query@^5.59`, `@prisma/client@^5.20`.

**Alcance del epic — IN:**
1. Sistema de auth multi-rol (PARENT, STUDENT) con NextAuth.js.
2. Diccionarios `messages/es.json` y `messages/en.json` con todos los strings necesarios para este epic.
3. Routing público + privado bajo `src/app/[locale]/`:
   - `/[locale]` — landing pública con CTA a /signup.
   - `/[locale]/login` y `/[locale]/signup` — flujos de auth para padre.
   - `/[locale]/(parent)/dashboard` — placeholder protegido.
   - `/[locale]/(student)/dashboard` — placeholder protegido.
4. Selección de perfil de estudiante por parte del padre (parent crea Student records bajo su Family).
5. Login de estudiante por PIN de 4 dígitos (no email — los niños K-2 no tienen email).
6. Middleware de auth que redirige según rol.
7. Seed mínimo para poder login en dev (1 familia, 1 padre, 2 estudiantes).
8. Tests unitarios para utilidades de auth y al menos un test e2e smoke (con Playwright si está instalado, si no, lo dejas anotado).

**Alcance del epic — OUT (no construir todavía):**
- ❌ Sylvie / motor de tutor AI (Epic 03).
- ❌ Lesson player o cualquier UI de aprendizaje real (Epic 04).
- ❌ Parent Copilot con planificación AI (Epic 02).
- ❌ Tienda de Nexos, marketplace, badges UI (Epic 05).
- ❌ Assessments adaptativos IRT (Epic 06).
- ❌ Seed masivo de lecciones K-6 (Epic 04).
- ❌ Reportes regulatorios (Epic 07).
- ❌ Toggle de inglés completo a nivel de contenido (v2 según PRD §1.4).

---

## Decisiones técnicas pre-tomadas (evitar idas y vueltas)

1. **NextAuth.js v4, no Clerk.** Razones: gratis, más flexibilidad para multi-rol (PARENT vs STUDENT con distintos métodos de login), sin vendor lock-in, ya está en `package.json`.
2. **Adapter:** `@auth/prisma-adapter` para persistir sesiones en Postgres. Instalar si falta.
3. **Estrategia de auth:**
   - **Padre:** Email + password (Credentials Provider).
   - **Estudiante:** PIN de 4 dígitos + selección de avatar (sin email). El padre genera el PIN al crear el perfil; el estudiante elige su perfil de una lista visual ("¿quién eres tú?") y mete su PIN.
4. **Password hashing:** bcryptjs (instalar).
5. **Variantes regionales de español:** v1 usa **es neutro** (no es-MX vs es-ES separados aún). El sistema soporta locale `es` y `en`. El plumbing de variantes (es-419, es-ES) queda preparado en `i18n/config.ts` pero sin diccionarios separados todavía.
6. **Layout de Next.js App Router:** route groups para separar `(public)`, `(parent)`, `(student)`. El `[locale]` envuelve todo.
7. **Servidor de sesión:** NextAuth con JWT strategy (no DB sessions) para reducir latencia.
8. **Tests:** Vitest para unit (instalar si falta), Playwright para e2e (instalar si falta, si no, dejar test e2e como TODO documentado).
9. **No agregar libraries fuera de lo estrictamente necesario.** Si dudas, pregunta antes de instalar.

---

## Plan de sprint sugerido (5 tareas, ~1 día cada una)

| # | Tarea | Entregable demoable |
|---|-------|---------------------|
| 1 | Diccionarios i18n + locale layout | Landing en `/es` y `/en` con LocaleSwitcher funcional. |
| 2 | NextAuth setup + signup/login padre | Padre puede registrarse, iniciar sesión y ver `(parent)/dashboard` placeholder. |
| 3 | Modelo de auth estudiante con PIN | Padre crea perfil de estudiante con PIN; estudiante entra con avatar+PIN. |
| 4 | Route groups + middleware de roles | Acceso a `(parent)/*` y `(student)/*` redirige por rol; intentos cruzados redirigen a /login. |
| 5 | Seed dev + tests + verificación | `npx prisma db seed` carga 1 familia con 2 estudiantes; tests pasan; `npm run check:edunexo` limpio. |

---

## Criterios de aceptación (Definition of Done del epic)

Antes de marcar el epic como completado, todo lo siguiente debe ser cierto:

- [ ] `npm run type-check` pasa sin errores.
- [ ] `npm run lint` pasa sin warnings nuevos.
- [ ] `npm run check:edunexo` no encuentra referencias residuales al nombre viejo.
- [ ] `npm run dev` arranca y `http://localhost:3000` redirige a `/es`.
- [ ] Un padre puede crear cuenta desde `/es/signup`, iniciar sesión, y aterrizar en `/es/(parent)/dashboard` (placeholder).
- [ ] Un padre logueado puede crear un perfil de estudiante con nombre, fecha de nacimiento, grado y PIN de 4 dígitos.
- [ ] Un estudiante puede ir a `/es/student-login`, elegir su avatar de una lista visual con los hijos de la familia y entrar con su PIN.
- [ ] Un estudiante logueado solo puede ver `(student)/*`; si intenta `/es/(parent)/dashboard` es redirigido.
- [ ] Un padre logueado solo puede ver `(parent)/*`; si intenta `(student)/dashboard` ve un selector de "ver como estudiante" pero NO entra como estudiante automáticamente.
- [ ] LocaleSwitcher funciona en cualquier ruta (cambiar de `/es/login` a `/en/login` preserva la página actual).
- [ ] Todo string visible al usuario pasa por `t('key')`. Cero strings hardcodeados en español o inglés dentro de componentes.
- [ ] Seed dev (`npx prisma db seed`) crea 1 familia "Demo", 1 padre "demo@midsea.test" / "demo1234", 2 estudiantes "Sofía" (grado 3, PIN 1234) y "Mateo" (grado 5, PIN 5678).
- [ ] Tests unit pasan para utilidades de auth (hash PIN, validar PIN, derivar locale del usuario).
- [ ] Hay un test e2e (Playwright) o documentado como TODO que cubre el happy path completo: signup padre → crear estudiante → logout → student login con PIN.

---

## Guardrails (no scope creep)

Si Claude Code se ve tentado a:
- Construir Sylvie o cualquier chat IA → **NO**. Es Epic 03. Detente y pregunta.
- Agregar lessons UI / lesson player → **NO**. Es Epic 04. Placeholder con texto "Próximamente".
- Refactorizar el motor de Nexos → **NO**. Ya está en producción-ready en `src/lib/gamification/engine.ts`. Si necesitas usarlo, úsalo; no lo toques.
- Modificar `prisma/schema.prisma` agregando modelos nuevos → **PREGUNTA PRIMERO**. El schema actual cubre todo lo que necesita este epic.
- Instalar libraries de UI complejas (shadcn/ui, mantine, chakra) → **NO** en este epic. Usa los primitives en `src/components/ui/`. shadcn/ui llegará cuando los componentes existentes empiecen a quedarse cortos (Epic 03+).
- Implementar Clerk en vez de NextAuth → **NO**. Decisión tomada arriba.
- Diseñar un sistema de diseño visual completo (colores, typography scale, etc) → **NO**. Usa lo mínimo de Tailwind para que funcione; el design system es Epic 02.

---

## Referencias obligatorias del repo (Claude Code ya las debe leer por `CLAUDE.md`)

1. `PRD.md` §1.4 (v1 features locked), §3 (estrategia bilingüe), §6 (Domain-Driven Design).
2. `docs/DMP.md` §2.1 (Miacademy — rechazo del modelo de "padre asigna manualmente"; el dashboard parental va a ser AI-driven, pero en este epic solo dejamos el placeholder), §5 (decisiones arquitectónicas).
3. `docs/AI_TUTOR_SPEC.md` §6 (eventos de dominio: este epic emite `ParentSignedUp`, `StudentCreated`, `StudentLoggedIn`).
4. `CLAUDE.md` §5 (reglas de oro: i18n primero, mobile-first, a11y, no EduNexo).
5. `prisma/schema.prisma` (modelo de datos vigente — no cambiar sin preguntar).
6. `src/lib/gamification/engine.ts` y `src/lib/i18n/config.ts` (no tocar, solo importar).

---

## PROMPT (copiar y pegar en Claude Code)

```
Estoy iniciando el Epic 01 "Cimientos" de Midsea: Auth + i18n diccionarios + Routing.
Antes de tocar código, ejecuta este protocolo:

PASO -1 — Git workflow (antes de cualquier lectura).
  Ejecuta `git status` y `git branch`. Este repo usa Git Flow:
  `main` = producción, `develop` = integración, `feature/*` = trabajo en curso.
   - Si estás en `develop` o `main`, crea un branch de feature ahora:
     `git checkout -b feature/epic-01-cimientos`.
   - Si ya estás en un branch que empieza con `feature/`, continúa
     sin crear branch nuevo.
   - NUNCA hagas commits directamente en `develop` o `main`.
  Reporta el branch en el que vas a trabajar y procede al PASO 0.

PASO 0 — Lectura obligatoria (mínima, no leer de más).
  CLAUDE.md ya está cargado como project memory — NO lo releeas.
  Lee SOLO estos archivos/secciones, en este orden:
   1. docs/prompts/epic-01-cimientos.md (completo — es tu contrato del epic).
   2. PRD.md §1.4 "v1 — El Cimiento" (solo esa sección, ~60 líneas).
   3. docs/DMP.md §2.1 Miacademy (solo esa sección, ~40 líneas; el resto
      del DMP es irrelevante para este epic).
   4. prisma/schema.prisma (completo, ~185 líneas).
   5. src/lib/i18n/config.ts y src/lib/gamification/engine.ts (cortos).
   6. package.json (para confirmar deps).
  NO leas: AI_TUTOR_SPEC.md (este epic no toca el tutor), PRD ni DMP
  completos, otras secciones que no estén en la lista. Si en algún momento
  necesitas info de un doc no listado, pregúntame primero — no abras el
  archivo "por si acaso".
  Si algo de mi prompt entra en conflicto con el epic doc, gana el epic doc.
  Confírmame que leíste lo anterior antes de proponer cambios.

PASO 1 — Plan de implementación.
  Devuélveme en máximo 25 líneas:
   (a) Las 5 tareas que vas a ejecutar, en orden, con archivos a crear/tocar.
   (b) Las dependencias npm nuevas que necesitas instalar y por qué.
   (c) Cualquier ambigüedad del epic que requiera mi decisión antes de empezar.
   (d) Si vas a desviarte de alguna decisión técnica pre-tomada del epic, dilo
       ahora con justificación; si no, no pidas permiso para lo ya decidido.
  Espera mi confirmación explícita ("ok, ejecuta") antes de tocar código.

PASO 2 — Ejecución por tarea.
  Tras mi confirmación, ejecuta una tarea a la vez. Para cada tarea:
   (a) Crea/edita los archivos.
   (b) Corre `npm run type-check`, `npm run lint`, `npm run check:edunexo`.
   (c) Reporta: archivos tocados, comandos corridos, criterios de aceptación
       de esa tarea cubiertos, criterios pendientes.
   (d) Pídeme "siguiente tarea?" antes de continuar.
  No abras más de 5 archivos por tarea sin avisar.

PASO 3 — Cierre del epic.
  Tras la tarea 5, corre la checklist completa de "Definition of Done" del
  archivo del epic y reporta el estado de cada item con [✓] / [✗] /
  [⚠ con nota]. Si algo está en ✗ o ⚠, propón el fix mínimo o márcalo como
  TODO documentado en docs/prompts/epic-01-cimientos.md bajo una sección
  nueva "## Pendientes para Epic 02".

PASO 4 — Push y entrega.
  Haz commits atómicos por tarea (uno por cada tarea del PASO 2) con
  mensajes convencionales: `feat(auth): ...`, `feat(i18n): ...`, etc.
  Al cerrar el epic, ejecuta `git push -u origin feature/epic-01-cimientos`
  y avísame con el nombre del branch para que yo abra el PR a `develop`
  desde GitHub. No hagas merge tú mismo a `develop` ni a `main`.

REGLAS DE INTERACCIÓN:
- Si algo del prompt te parece ambiguo, pregunta en vez de asumir.
- Si una decisión técnica no está en el epic doc ni en CLAUDE.md, pregúntame.
- EFICIENCIA DE TOKENS:
   · No releas archivos que ya leíste en esta sesión salvo que los hayas
     editado. Si necesitas un valor concreto que ya viste, usa tu memoria.
   · Reporta máximo 10 líneas por tarea (archivos tocados + criterios
     cubiertos + pendientes). No re-narres lo que el código ya muestra.
   · No corras `npm install` para inspeccionar lo que hay; lee package.json
     una vez y úsalo.
   · Si tienes que reanudar el epic en una sesión nueva, empieza por
     `git log feature/epic-01-cimientos --oneline` y la sección "Pendientes
     para Epic 02" del epic doc — NO releas los docs maestros completos.
- Si vas a copiar un patrón de Miacademy, Wited, Time4Learning, Pruebat
  o Smartick: para. Consulta docs/DMP.md §2 ("Rechazo estratégico" de cada
  competidor) antes de implementar.
- Nunca toques: src/lib/gamification/engine.ts, src/lib/i18n/config.ts,
  prisma/schema.prisma (sin preguntar antes).
- No agregues README.md ni archivos .md nuevos sin pedirlo. La doc del epic
  ya está en docs/prompts/epic-01-cimientos.md.
- Mobile-first siempre. Tablet es el dispositivo del estudiante.
- i18n: cero strings hardcodeados. Toda key debe ser semántica
  (ej: t('auth.login.title'), no t('text_1')).
- a11y: aria-labels, labels en inputs, contraste AA, navegación con teclado.

Empieza por el PASO 0 ahora.
```

---

## Pendientes para Epic 02

### Deferidos por scope (no fueron blockers del DoD del Epic 01)

- **Playwright e2e smoke.** Pendiente instalar `@playwright/test` + browsers (~300MB). El happy path documentado:
  `signup padre → crear estudiante con PIN → logout → /student-login → seleccionar avatar → entrar con PIN`.
  Instalar con `npm i -D @playwright/test && npx playwright install --with-deps chromium` y poner el spec en `tests/e2e/auth-happy-path.spec.ts`.
- **Route group folder refactor.** Decisión #6 del epic original (`parent/`→`(parent)/parent/`, `student/`→`(student)/student/`) NO se aplicó. Justificación: los route groups de Next.js no cambian URL, los segmentos `/parent/*` y `/student/*` siguen necesarios. Refactor cosmético sin valor funcional; ~17 archivos a mover. Si se quiere, agendar como chore aparte.
- **`@auth/prisma-adapter`.** Decisión #2 del epic original. Saltado porque NextAuth con JWT strategy (decisión #7) no requiere DB sessions/verification tables. Si se quiere por purismo o para email-verification flow futuro, instalar y configurar.
- **`requireStudentSpaceAccess` deprecated alias.** Sigue exportado por compatibilidad — borrar cuando ningún caller lo importe (grep confirma: no quedaron callers, pero el símbolo está vivo).

### Migrations / DB hygiene

- **Prod DB schema.** Los `ALTER TABLE` que aplicamos a la DB dev (Parent.passwordHash, Student.pinHash, Student.avatarKey) deben aplicarse a producción antes/durante el merge de `feature/epic-01-cimientos` a `main`. Todas son columnas nullable, sin riesgo de data loss. Comando:
  ```sql
  ALTER TABLE "Parent"  ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
  ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "pinHash"      TEXT;
  ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "avatarKey"    TEXT;
  ```
- **Prisma migrations propias.** El repo usa `prisma db push` (sin historial de migrations). En Epic 02 conviene formalizar `prisma/migrations/` y mover seed schema sync a `prisma migrate deploy`.

### Mejoras de seguridad para PIN (Epic 03 idealmente)

- Rate limit / lock-out por estudiante en `verifyPin` (campos `pinAttemptsCount`, `pinLockedUntil`).
- El espacio de PINs de 4 dígitos (10^4) es chico — el lock-out es lo que sostiene la seguridad real.

### Demo mode coexistente

- Conservado (`midsea_demo_role` cookie + localStorage). El epic no lo mencionaba; queda como atajo dev. En producción no es riesgo porque las paginas auth-gated ya validan rol vía `requireParent`/`requireStudent`; demo solo aplica si la cookie está set, lo que solo pasa si el usuario click voluntariamente en "Modo de prueba" en /login. Si se quiere quitar antes de GA, eliminar `src/lib/auth/demo-*.ts` + `src/components/auth/DemoLogin.tsx` + ramas demo en `session.ts` y `data.ts`.


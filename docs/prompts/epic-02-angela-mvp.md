# Prompt para Claude Code — Epic 02: Angela MVP
## Chat con memoria + streaming SSE en `/stuck`

> **Cómo usar:** abre `claude` en la raíz del repo, lee tú mismo las secciones de Contexto/Plan/Aceptación, y pega solo el bloque bajo **PROMPT** al final de este archivo.

---

## Contexto del epic

**Epic:** Construir Angela en su forma más mínima viable y demoable: un tutor conversacional con memoria persistente y respuesta en streaming, integrado únicamente en el flujo `/stuck`. Sin esto, Midsea no se diferencia de "otra plataforma de homeschool". Con esto, es el único producto con AI tutor agentic bilingüe del mercado (ver DMP §2.5 y §6.1 #1).

**Duración estimada:** 10-12 días de trabajo enfocado.

**Estado actual del repo (verificado tras Epic 01):**
- Auth multi-rol funcionando (parent email/password, student PIN+avatar).
- i18n con diccionarios `messages/es.json` y `messages/en.json`.
- Rutas `[locale]/(parent)/*` y `[locale]/(student)/*` protegidas.
- Placeholders ya existen en `src/app/[locale]/student/{stuck,prep,explore,review}/page.tsx`.
- Placeholder de lesson page en `src/app/[locale]/student/lessons/[slug]/page.tsx`.
- Schema de Prisma con `TutorSession` y `TutorMessage` listos para usar.
- `package.json` ya incluye `openai@^4.67`.
- Branch viejo `feature/angela-v1` existe pero por decisión del equipo se ignora — empezamos limpio.

**Alcance del epic — IN:**
1. `src/lib/tutor/` con tres motores mínimos:
   - `StudentContextEngine.ts` — carga perfil persistente del estudiante desde DB (últimas N interacciones, mastery por subject, locale preferido).
   - `SessionContextEngine.ts` — gestiona el contexto volátil de la conversación activa (últimos turnos en memoria).
   - `ResponseGenerator.ts` — llama OpenAI con streaming, devuelve un `AsyncIterable<string>` de tokens.
2. `src/lib/tutor/prompts/angela-es.ts` y `angela-en.ts` — system prompts bilingües para Angela (identidad, tono, reglas pedagógicas).
3. API endpoint SSE `src/app/api/tutor/chat/route.ts` que recibe un mensaje del estudiante y devuelve tokens en streaming.
4. UI components:
   - `src/components/tutoring/AngelaAvatar.tsx` — avatar visual con al menos 4 estados (idle / pensando / hablando / animando).
   - `src/components/tutoring/AngelaChat.tsx` — UI del chat con render incremental de tokens en streaming, scroll automático, input con `Enter` to send.
   - Store Zustand `src/lib/tutor/store.ts` para estado del chat y avatar.
5. Integración en `src/app/[locale]/student/stuck/page.tsx`: la página actual se convierte en host del chat de Angela a pantalla completa.
6. Persistencia: cada turno crea/actualiza `TutorSession` y `TutorMessage`. Al cargar `/stuck`, se cargan los últimos 20 mensajes del estudiante con Angela (memoria entre sesiones).
7. Rate limit suave por estudiante: 50 mensajes / 24h en v1 (configurable en `.env`). Al exceder, mensaje amable de Angela ("Hoy hemos hablado mucho — vuelve mañana, descansé bien y te explico todo otra vez").
8. Logging de tokens consumidos por sesión para monitorear costos OpenAI.
9. Tests unit para `StudentContextEngine`, `SessionContextEngine`, rate limiter, y el parser de tokens del stream.
10. Smoke e2e (o documentado como TODO si Playwright sigue pendiente): estudiante entra → `/stuck` → escribe pregunta → recibe respuesta streaming → recarga → ve historial.

**Alcance del epic — OUT (no construir todavía):**
- ❌ `CurriculumContextEngine` (qué lección está activa). Depende de contenido real K-6. Lo construimos en Epic 04 cuando exista seed.
- ❌ `CognitiveAdapter` (formato visual/auditivo/kinestésico). Epic 03.
- ❌ `EmotionDetector` (frustración por velocidad/errores). Epic 03.
- ❌ `ActionParser` (acciones estructuradas: pintar diagrama, lanzar ejercicio). Epic 04, depende de UI orchestrator.
- ❌ Function calling / tools de OpenAI. Epic 03+.
- ❌ Integración en `/prep`, `/explore`, `/review`. Quedan como placeholders Epic 01.
- ❌ Voice input. Post-PMF.
- ❌ Avatar Rive 3D. v1 usa Lottie o SVG con estados.
- ❌ Code-switching automático ES/EN dentro de una respuesta. v1 responde en el locale de la sesión.

---

## Decisiones técnicas pre-tomadas

1. **Modelo OpenAI:** `gpt-4o-mini` para v1. Suficiente para chat conversacional simple, ~10x más barato que `gpt-4o`. El `model` queda como variable de entorno para upgradear fácil.
2. **Streaming:** SSE con `Response` de Next.js App Router (`new Response(stream, { headers: { 'Content-Type': 'text/event-stream' }})`). NO usar Server Actions para streaming — son await-completos.
3. **Persistencia:**
   - Una `TutorSession` por día por estudiante (no por mensaje). Si el estudiante vuelve al día siguiente, nueva sesión.
   - Cada turno (user + assistant) son dos `TutorMessage` en la sesión activa.
   - El `content` del assistant se persiste solo cuando el stream termina (no chunk por chunk).
4. **Memoria entre sesiones:** al iniciar una nueva `TutorSession`, se cargan los últimos 20 `TutorMessage` del estudiante (de cualquier sesión previa) y se prependen como contexto histórico. NO se hace embedding/RAG en v1 — basta con cargar literal los últimos N mensajes.
5. **System prompt:** vive en `src/lib/tutor/prompts/angela-{es,en}.ts` como string template con placeholders para `{studentName}`, `{gradeLevel}`, `{recentMastery}`. Se compone dinámicamente por `ResponseGenerator`.
6. **Avatar:** SVG con clases CSS que cambian por estado, o Lottie si quieres animación. Estados mínimos: `idle`, `thinking`, `speaking`, `celebrating`. Los estados emocionales completos del AI_TUTOR_SPEC §2.2 (verde/amarillo/azul/naranja/rojo/blanco) son Epic 03.
7. **Rate limit:** implementado en memoria (Redis sería ideal pero NO instalamos Redis en este epic). Conteo persistido en una tabla nueva `TutorUsageDaily` (studentId + date + msgCount). Migration mínima en `prisma/schema.prisma` (pedir aprobación antes).
8. **Errores OpenAI:** si la API falla, Angela responde con un mensaje amable en su idioma ("Algo me confundió en la cabeza, ¿puedes intentar de nuevo en un minuto?"). Loguear el error real con `console.error`, NO exponerlo al usuario.
9. **Costos:** loguear `prompt_tokens`, `completion_tokens` y `total_tokens` por turno en `TutorMessage.metadata` (campo nuevo si se agrega al schema; o tabla aparte si se evita migration).
10. **No instalar Redis, no instalar Pinecone/Weaviate, no instalar Langchain.** Stack mínimo: openai SDK + Prisma + Zustand. Punto.

---

## Plan de sprint sugerido (6 tareas, ~10-12 días)

| # | Tarea | Días | Entregable demoable |
|---|-------|------|---------------------|
| 1 | Tutor lib base: `StudentContextEngine` + `SessionContextEngine` + tests unit | 2 | Función que dado un studentId devuelve el contexto histórico completo en JSON. |
| 2 | `ResponseGenerator` + system prompts ES/EN + cliente OpenAI singleton | 2 | Script CLI de prueba que envía un mensaje y recibe stream en consola. |
| 3 | API endpoint SSE `/api/tutor/chat` + persistencia de turnos | 1.5 | curl al endpoint devuelve tokens en streaming; turno persistido en DB. |
| 4 | UI: `AngelaAvatar` (estados) + `AngelaChat` (chat con streaming) + store Zustand | 2.5 | UI funcional en una página de test (`/dev/angela-test`) sin auth requerido. |
| 5 | Integración en `/stuck` + memoria entre sesiones + rate limit | 1.5 | Estudiante autenticado va a `/stuck`, chatea, cierra, vuelve al día siguiente y Angela recuerda. |
| 6 | Tests + logging de costos + cleanup de `/dev/angela-test` + Playwright smoke o TODO | 1.5 | Tests pasan; tokens loguean; happy path verificable. |

---

## Criterios de aceptación (Definition of Done)

- [ ] `npm run type-check` y `npm run lint` pasan limpios.
- [ ] `npm run check:edunexo` no encuentra referencias.
- [ ] Un estudiante autenticado puede ir a `/es/student/stuck`, escribir un mensaje y recibir una respuesta de Angela token por token (streaming visible al ojo humano, NO esperar la respuesta completa).
- [ ] La respuesta llega en español si el locale es `es`, en inglés si es `en`.
- [ ] Tras cerrar y reabrir `/stuck` en la misma sesión del día, el chat muestra el historial del día.
- [ ] Al día siguiente, Angela hace referencia al pasado (verificable con un mensaje tipo "¿recuerdas lo que hablamos ayer sobre fracciones?") porque cargó los últimos 20 turnos del estudiante.
- [ ] El avatar cambia de estado al menos entre `idle` → `thinking` → `speaking` → `idle`.
- [ ] Si el estudiante manda el mensaje #51 en 24h, recibe el mensaje de rate limit en su idioma; Angela no llama a OpenAI.
- [ ] Si OpenAI devuelve error, el usuario ve mensaje amable y no un stack trace.
- [ ] Cada turno deja registro en `TutorSession`, `TutorMessage` y conteo en `TutorUsageDaily`.
- [ ] El `OPENAI_API_KEY` vive solo en `.env.local` y NUNCA en código cliente.
- [ ] Tests unit verifican: hashing de contexto, prepend de memoria, rate limit, fallback en error.
- [ ] Cero strings hardcodeados; todos los textos de UI pasan por `t('tutor.angela.*')` con keys nuevas en `messages/es.json` y `en.json`.

---

## Guardrails (no scope creep)

Si Claude Code se siente tentado a:
- Construir `CurriculumContextEngine`, `CognitiveAdapter`, `EmotionDetector`, `ActionParser` → **NO**. Esos son Epic 03/04. Detente y pregunta.
- Usar `gpt-4o` en vez de `gpt-4o-mini` → **NO**. Cambio queda como variable de entorno upgradable, no hardcoded.
- Instalar Redis, Pinecone, Weaviate, Langchain, LlamaIndex → **NO**. v1 usa solo Postgres + openai SDK.
- Implementar function calling / tools → **NO**. Epic 03.
- Copiar el patrón de Max AI de Wited (chatbot sin memoria, respondiendo "qué son fracciones" genéricamente) → **PROHIBIDO ESTRICTO**. Ver DMP §2.2 — esa es la antítesis de Angela. Angela SIEMPRE conoce al estudiante por nombre, grado y al menos 5 turnos previos.
- Escalar a humano asíncrono tipo "Profe Express" de Wited → **NO** en este epic ni en los siguientes. Angela es siempre AI; el humano viene vía Study Pods en Epic 06+.
- Construir voice input → **NO**. Post-PMF.
- Diseñar 6 estados completos del avatar (estados emocionales del AI_TUTOR_SPEC §2.2) → **NO** en este epic. Solo los 4 funcionales (`idle`, `thinking`, `speaking`, `celebrating`). Los emocionales necesitan `EmotionDetector` que es Epic 03.
- Tocar `src/lib/gamification/engine.ts` o `prisma/schema.prisma` sin preguntar → **NO**. La migration para `TutorUsageDaily` se pide explícitamente; cualquier otro cambio de schema requiere mi aprobación.

---

## PROMPT (copiar y pegar en Claude Code)

```
Estoy iniciando el Epic 02 "Angela MVP" de Midsea: chat con memoria +
streaming SSE en /stuck. Antes de tocar código, ejecuta este protocolo.

PASO -1 — Git workflow.
  Verifica `git status` y `git branch`. Si estás en `develop` o `main`,
  crea `feature/epic-02-angela-mvp` con `git checkout -b`. Si ya estás en
  un branch `feature/*`, continúa. Nunca commits directos a develop/main.

PASO 0 — Lectura mínima (no leas de más).
  CLAUDE.md ya está cargado como project memory — NO lo releeas.
  Lee SOLO, en orden:
   1. docs/prompts/epic-02-angela-mvp.md (completo — tu contrato del epic).
   2. docs/AI_TUTOR_SPEC.md §2 (Visión Angela), §3.1 (flujo /stuck),
      §4.1 (arquitectura), §4.2 (StudentContextEngine).
   3. docs/DMP.md §2.2 (Wited — qué NO copiar de Max AI).
   4. prisma/schema.prisma (revisar TutorSession y TutorMessage; no editar).
   5. src/lib/auth/session.ts (cómo obtener student activo).
   6. src/app/[locale]/student/stuck/page.tsx (el placeholder actual).
   7. messages/es.json (solo para confirmar estructura de keys existente).
  NO leas: PRD ni DMP completos, AI_TUTOR_SPEC §5+ (estado-máquina y otros
  son Epic 03), src/app/[locale]/student/{prep,explore,review}/page.tsx
  (este epic no los toca).
  Si necesitas info de un archivo no listado, pregunta antes de abrirlo.
  Confírmame que leíste lo anterior.

PASO 1 — Plan de implementación (máx 30 líneas).
  Devuélveme:
   (a) Las 6 tareas en orden con archivos a crear/tocar.
   (b) Dependencias npm nuevas (si las hay) y por qué.
   (c) La migration de Prisma propuesta para `TutorUsageDaily` y cualquier
       campo nuevo en `TutorMessage` (metadata de tokens). Espera mi OK
       antes de correr `prisma migrate dev`.
   (d) Ambigüedades que necesiten mi decisión.
  Espera "ok, ejecuta" antes de tocar código.

PASO 2 — Ejecución por tarea.
  Una tarea a la vez. Para cada una:
   (a) Crea/edita archivos.
   (b) Corre `npm run type-check`, `npm run lint`, `npm run check:edunexo`.
   (c) Reporta máx 10 líneas: archivos tocados, criterios cubiertos,
       pendientes. No re-narres lo que el código ya muestra.
   (d) Pídeme "siguiente tarea?" antes de continuar.

PASO 3 — Cierre del epic.
  Tras la tarea 6, corre la checklist completa de "Definition of Done" del
  archivo del epic y reporta [✓] / [✗] / [⚠ con nota] por cada item.
  Pendientes documentados en una sección nueva
  "## Pendientes para Epic 03" al final del epic doc.

PASO 4 — Push y entrega.
  Commits atómicos por tarea con mensajes convencionales:
  `feat(tutor): scaffold StudentContextEngine`,
  `feat(tutor): SSE endpoint for chat streaming`, etc.
  Al cerrar el epic, `git push -u origin feature/epic-02-angela-mvp` y
  avísame para que abra el PR a `develop`. No hagas merge tú mismo.

REGLAS DE INTERACCIÓN:
- Si algo es ambiguo, pregunta en vez de asumir.
- Decisiones técnicas no listadas en el epic doc ni en CLAUDE.md →
  pregúntame.
- EFICIENCIA DE TOKENS:
   · No releas archivos ya leídos salvo que los hayas editado.
   · Reportes máx 10 líneas por tarea.
   · No corras `npm install` para inspeccionar deps; lee package.json una vez.
   · Si reanudas en sesión nueva: empieza por `git log feature/epic-02-angela-mvp --oneline`
     y la sección "Pendientes" del epic doc. NO releas docs maestros completos.
- ANTI-COPIA: si te ves tentado a hacer Angela como Max AI de Wited
  (sin memoria, sin contexto, respondiendo genéricamente): para. Lee
  docs/DMP.md §2.2 ("Rechazo estratégico" de Wited) y propón la
  alternativa de Midsea.
- Nunca toques sin preguntar: src/lib/gamification/engine.ts,
  src/lib/i18n/config.ts, src/lib/auth/* (ya cerrado en Epic 01),
  prisma/schema.prisma fuera del scope acordado en PASO 1(c).
- Mobile-first siempre. Angela en mobile = bottom sheet o pantalla completa,
  no modal flotante.
- i18n: cero strings hardcodeados. Keys nuevas bajo `tutor.angela.*`.
- a11y: el chat debe ser navegable por teclado, con aria-live="polite"
  para los tokens que entran en streaming.

Empieza por el PASO -1 ahora.
```

---

## Pendientes para Epic 03

### Limpieza de v1 (sylvie-v1) — no se borró en Epic 02
Los archivos del branch viejo `feature/sylvie-v1` fueron *renombrados* a Angela pero NO eliminados porque siguen montados desde rutas en producción (`student/layout.tsx` monta `AngelaWidget`; `lessons/[slug]/page.tsx` usa `LessonSurface`). El epic 02 sólo cubrió `/stuck`. Para Epic 03:
- Decidir si el "Pedir ayuda al tutor" dentro de la lección abre el nuevo `StuckChat` reutilizable, o si vive como mini-chat aparte.
- Borrar el widget flotante `AngelaWidget` (contradice CLAUDE.md §5.4 — Sylvie en mobile = bottom sheet o pantalla completa, no modal flotante).
- Eliminar `LessonContext.ts`, `ProactiveIntervention.ts`, `angela-state.ts`, `prompts/angela-system.ts`. Eran scaffolding sin uso real del LLM.
- Endpoint viejo `src/app/api/tutor/route.ts` (no es el `/chat` nuevo): revisar si tiene callers; si no, borrar.

### Rename físico de DB (Nexos → Coin)
Schema usa `@@map("NexosEntry")`, `@@map("NexosReason")`, `@map("rewardNexos")` para preservar nombres viejos en DB. Cuando estabilicemos esquema post-PMF:
- `ALTER TABLE "NexosEntry" RENAME TO "CoinEntry";`
- `ALTER TYPE "NexosReason" RENAME TO "CoinReason";`
- `ALTER TABLE "Lesson" RENAME COLUMN "rewardNexos" TO "rewardCoin";`
- `ALTER TABLE "Badge" RENAME COLUMN "rewardNexos" TO "rewardCoin";`
- Renombrar índices y constraints asociados (no se renombran automáticamente).
- Quitar todas las @@map / @map del schema.

### Branch name vs rebrand
La feature branch sigue siendo `feature/epic-02-sylvie-mvp` por consistencia con PR refs ya creados. No se renombra para evitar romper webhooks de Vercel — el contenido sí está rebranded.

### Memoria semántica
v1 carga literal últimos 20 turnos del estudiante. Cuando un estudiante tenga >50 sesiones, el contexto se vuelve ruidoso. Epic 03+:
- Embeddings de turnos relevantes con pgvector (Supabase soporta).
- Retrieval por similitud al mensaje actual en vez de cronológico.
- Resumen periódico ("Angela aprendió que María bate 80% en fracciones pero falla en geometría") como contexto persistente comprimido.

### Cognitive profile + emotion detection
Per `AI_TUTOR_SPEC §4.2` y §2.2 — no construido en v1:
- `CognitiveAdapter`: detectar y adaptar formato (visual/auditivo/kinestésico) según historial.
- `EmotionDetector`: clasificar turno del estudiante (frustrado/curioso/aburrido) por velocidad de respuesta + texto.
- Estados emocionales del avatar (alerta/descanso) — v1 solo tiene los 4 funcionales (idle/thinking/speaking/celebrating).

### CurriculumContext + Actions
Cuando exista contenido K-6 real (Epic 04):
- `CurriculumContextEngine`: sabe qué lección está activa, prerequisitos, próximos pasos.
- `ActionParser`: detectar `[VISUAL: diagrama]`, `[EXERCISE: tipo]`, `[ALERT: razón]` en el stream y disparar UI orchestration.
- Function calling de OpenAI para tools (lookup competencia, lanzar ejercicio, alertar padre).

### Rate limiting
- Hardening con Redis (sliding window real) cuando dejemos Postgres-only.
- Cap configurable por familia/plan (gratis vs Pro vs Family).
- Exponer al padre cuántos mensajes lleva el hijo (transparencia de uso).

### Tests E2E
Playwright sigue pendiente desde Epic 01:
- Smoke happy path: login → student → /stuck → mandar mensaje → recibir stream → recargar → chat vacío (UI clean per-visit).
- Memory: mensaje #1 ("me gustan los gatos") → recargar → mensaje #2 ("¿qué animal mencioné?") → Angela referencia gatos.
- Rate limit: simular 51 mensajes → mensaje #51 devuelve string de cap.

### UI: separar memoria backend vs UI
Decisión tomada en Epic 02 tras feedback del usuario: la UI del chat empieza limpia cada visita; la memoria vive solo en backend (StudentContextEngine carga últimos 20 turnos al endpoint, no a la UI). Epic 03 puede revisitar:
- ¿Botón "ver historial completo"? (No por defecto — distrae al niño).
- ¿Conversation list para el padre? (transparencia algorítmica del AI_TUTOR_SPEC §8.2).

### Vitest cold-start flake
Primer `vitest run` después de cambios en `src/` falla con "Cannot read properties of undefined (reading 'config')" en el primer test file. Segundo run siempre pasa. Documentar / abrir issue upstream / migrar a vitest workspaces.

### Cleanup demo mode
Heredado de Epic 01 Pendientes. Demo cookies + `DEMO_PARENT_CONTEXT` siguen en el código aunque la UI demo se borró. Decisión de equipo: ¿borramos por completo o mantenemos como modo de prueba interno?

### Prisma migrations formales
Heredado de Epic 01. Seguimos en `prisma db push` + raw SQL ad-hoc (mismo patrón en Epic 02 para `metadata` + `TutorUsageDaily`). Mover a `prisma migrate dev` con carpeta `prisma/migrations/` versionada.

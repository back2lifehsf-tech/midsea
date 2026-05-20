# Prompt para Claude Code — Epic 03: Angela Adaptativa + Higiene
## Estados emocionales + perfil cognitivo + cierre auth

> **Cómo usar:** abre `claude` en la raíz del repo, lee tú mismo las secciones de Contexto/Plan/Aceptación, y pega solo el bloque bajo **PROMPT** al final de este archivo.

---

## Contexto del epic

**Epic:** Cerrar la deuda técnica que dejó Epic 02 (limpieza de v1 sylvie + auth hygiene de Epic 01) y dar el siguiente salto cualitativo de Angela: que **detecte cómo se siente el estudiante** (EmotionDetector), que **adapte el formato de su explicación** al perfil cognitivo del estudiante (CognitiveAdapter), y que **el avatar refleje el estado emocional** (6 estados del AI_TUTOR_SPEC §2.2, no solo los 4 funcionales del MVP). Con esto Angela deja de ser "ChatGPT con system prompt" y empieza a ser un tutor real adaptativo.

**Duración estimada:** 8-10 días de trabajo enfocado.

**Estado actual del repo (verificado al cerrar Epic 02):**
- Auth multi-rol funcionando (Epic 01) — pero **falta lockout** de PIN; el espacio 10^4 es chico.
- Angela MVP en `/stuck` con chat streaming + memoria persistente (Epic 02).
- `src/lib/tutor/` con `StudentContextEngine`, `SessionContextEngine`, `ResponseGenerator`, `rate-limit`, `sse-parser`, `store`, `types`.
- **Deuda viva:** `AngelaWidget` flotante montado desde `student/layout.tsx`; `LessonSurface` montado desde `lessons/[slug]/page.tsx`; archivos zombie `LessonContext.ts`, `ProactiveIntervention.ts`, `angela-state.ts`, `prompts/angela-system.ts`; endpoint viejo `src/app/api/tutor/route.ts` (el nuevo es `/api/tutor/chat`).
- Tests unit pasan (con flake conocido de vitest cold-start).
- **NO existe:** `EmotionDetector`, `CognitiveAdapter`, estados emocionales del avatar, Playwright instalado, rate-limit/lockout en `verifyPin`.

**Alcance del epic — IN:**

1. **Limpieza v1 sylvie** (housekeeping que tiene que pasar antes de meter más capas de estado al avatar):
   - Borrar `src/components/tutoring/AngelaWidget.tsx` y desmontarlo de `src/app/[locale]/student/layout.tsx` (contradice CLAUDE.md §5.4 — mobile no usa modal flotante).
   - Decidir destino de "Pedir ayuda" dentro de la lección: o abre `/stuck` reusando el chat real, o se borra `LessonSurface.tsx` junto con `AngelaWidget`. Decisión por defecto: reusar `/stuck` (un solo chat de Angela en todo el producto).
   - Borrar archivos zombie: `src/lib/tutor/LessonContext.ts`, `src/lib/tutor/ProactiveIntervention.ts`, `src/lib/tutor/angela-state.ts`, `src/lib/tutor/prompts/angela-system.ts`.
   - Borrar endpoint viejo `src/app/api/tutor/route.ts` tras confirmar grep sin callers (el nuevo es `/api/tutor/chat`).

2. **`EmotionDetector`** en `src/lib/tutor/EmotionDetector.ts`:
   - Input: turno del estudiante (texto + tiempo de respuesta desde el turno previo de Angela).
   - Output: `{ emotion: 'frustrated' | 'curious' | 'neutral' | 'bored' | 'confused', confidence: 0..1 }`.
   - v1 es heurística pura (sin LLM extra para clasificar — eso duplica costo):
     - Texto corto + signos repetidos ("???", "ugh", "no entiendo") → `frustrated`.
     - Respuesta < 3s + pregunta de seguimiento → `curious`.
     - Respuesta > 90s sin contexto adicional → `bored` o `confused` según turno previo.
     - Default `neutral`.
   - Persistencia: `emotion` se loguea en `TutorMessage.metadata` para análisis post-hoc.

3. **`CognitiveAdapter`** en `src/lib/tutor/CognitiveAdapter.ts`:
   - Lee historial del estudiante (vía `StudentContextEngine`) y deriva una preferencia provisional de formato: `visual` | `verbal` | `kinesthetic` | `unknown`.
   - v1 es heurística sobre tags de turnos previos:
     - El estudiante pidió "muéstrame" / "dibuja" / "diagrama" ≥ 3 veces → `visual`.
     - El estudiante respondió mejor (sin re-pregunta) cuando Angela usó listas vs. prosa → `verbal`.
     - El estudiante pidió "déjame intentar" / "dame un ejemplo para hacer" → `kinesthetic`.
   - Output se inyecta al system prompt como `formatHint: "Este estudiante aprende mejor con {visual|listas|práctica activa}"`.
   - **NO** es function calling todavía. Solo modula el prompt. (Function calling es Epic 04 cuando exista contenido K-6 real.)

4. **Avatar con 6 estados emocionales** (AI_TUTOR_SPEC §2.2):
   - Mapping: `idle`→verde, `thinking`→azul, `speaking`→verde animado, `celebrating`→amarillo, `concerned`→naranja (cuando EmotionDetector marca `frustrated` o `confused`), `resting`→blanco (cuando llega cap diario).
   - Implementación: extender `src/components/tutoring/AngelaAvatar.tsx` para aceptar `emotion` además de `state` funcional. Los estados emocionales se calculan en el store Zustand a partir del último `EmotionDetector` output y del rate-limit status.

5. **PIN lockout + rate-limit** (cierre de deuda Epic 01):
   - Campos nuevos en `Student`: `pinAttemptsCount Int @default(0)`, `pinLockedUntil DateTime?`.
   - `verifyPin` incrementa contador en fallo; al 5° fallo, `pinLockedUntil = now + 15min`; en éxito, resetea.
   - Mensaje i18n amable: "Demasiados intentos. Pídele a tu papá/mamá que te ayude." (`auth.student.locked`).
   - Padre puede resetear el lock desde su dashboard (botón "Desbloquear" en la card del estudiante).

6. **Playwright E2E smoke** (cierre de deuda Epic 01 + Epic 02):
   - Instalar `@playwright/test` + `chromium`.
   - Specs en `tests/e2e/`:
     - `auth-happy-path.spec.ts` — signup padre → crear estudiante → logout → student login con PIN.
     - `auth-lockout.spec.ts` — 5 intentos fallidos → lockout → padre desbloquea.
     - `angela-stuck.spec.ts` — estudiante entra a `/stuck`, manda mensaje, recibe stream, recarga, ve historial.
   - CI: nuevo script `npm run test:e2e` que corre Playwright en headless.

**Alcance del epic — OUT (no construir todavía):**

- ❌ **Memoria semántica con pgvector / embeddings.** Sigue cargando últimos 20 turnos literal. Epic 03b o post-PMF según señal de PMF.
- ❌ **`CurriculumContextEngine`.** Necesita seed real de contenido K-6 — Epic 04.
- ❌ **`ActionParser`** + function calling de OpenAI. Epic 04, depende de UI orchestrator.
- ❌ **Voice input / TTS.** Post-PMF.
- ❌ **Rate-limit con Redis.** El Postgres-only de Epic 02 sigue siendo suficiente.
- ❌ **Rename DB Nexos → Coin.** Post-PMF, no es blocker funcional.
- ❌ **Prisma migrations formales (`prisma/migrations/`).** Sigue `prisma db push` + raw SQL ad-hoc; formalizar en Epic 04 cuando haya seed de contenido masivo.
- ❌ **Limpieza demo mode.** Ticket aparte. No bloquea nada.
- ❌ **Route group folder refactor.** Cosmético, sigue diferido.
- ❌ **`@auth/prisma-adapter`.** JWT strategy sigue siendo suficiente.

---

## Decisiones técnicas pre-tomadas

1. **EmotionDetector es heurístico, no llama LLM.** Razón: clasificar emoción con LLM duplica latencia y costo por turno. Si la heurística da false positives molestos, Epic 04 puede agregar un mini-clasificador con `gpt-4o-mini` cacheado, pero v1 va sin.
2. **CognitiveAdapter inyecta al system prompt, no usa function calling.** Function calling pertenece a Epic 04 cuando existan tools reales (lanzar ejercicio, abrir lección). En este epic solo modulamos el texto del prompt.
3. **Estados emocionales del avatar son derivados, no estado nuevo en DB.** Se calculan en el store Zustand a partir de `EmotionDetector` output + rate-limit status. No persistir.
4. **PIN lockout: 5 intentos, 15 minutos.** Suficiente para ralentizar fuerza bruta sin frustrar a niños que olvidan el PIN. El padre puede resetear manualmente desde su dashboard sin esperar los 15 min.
5. **Migration mínima en `prisma/schema.prisma`** para `pinAttemptsCount` + `pinLockedUntil` en `Student`. Es la única migration aprobada de este epic. Pedir confirmación antes de correr `prisma db push`.
6. **Playwright se instala con chromium-only** (`--with-deps chromium`). Firefox/WebKit no aportan en v1 — el target son niños en tablet/Chromium.
7. **No instalar:** Redis, pgvector, Pinecone, Langchain, LlamaIndex, ningún SDK de emotion analysis externo. Stack de Epic 02 sigue siendo suficiente.
8. **El branch sigue Git Flow.** Branch del epic: `feature/epic-03-adaptativa`. PR a `develop` al cerrar.

---

## Plan de sprint sugerido (6 tareas, ~8-10 días)

| # | Tarea | Días | Entregable demoable |
|---|-------|------|---------------------|
| 1 | Limpieza v1 sylvie: borrar AngelaWidget + LessonSurface + zombies + ruta vieja /api/tutor | 1.5 | `grep -r AngelaWidget src/` devuelve cero matches; build pasa; `/stuck` sigue funcionando idéntico. |
| 2 | EmotionDetector heurístico + tests unit + logging en TutorMessage.metadata | 1.5 | Llamada `detect(turn, latencyMs)` devuelve `{emotion, confidence}`; tabla de casos cubierta. |
| 3 | CognitiveAdapter (lectura de historial + format hint en system prompt) + tests | 1.5 | Estudiante con 3 turnos "muéstrame" recibe siguiente respuesta enriquecida con `formatHint: visual`. |
| 4 | Avatar con 6 estados emocionales + integración con store Zustand | 1 | Demo: turno frustrado → avatar va a `concerned` (naranja); cap diario → `resting` (blanco). |
| 5 | PIN lockout + reset desde dashboard padre + migration `Student.pinAttempts/pinLockedUntil` | 1.5 | 5 intentos fallidos lockean al estudiante; padre ve botón "Desbloquear" en su dashboard. |
| 6 | Playwright instalado + 3 specs E2E (auth happy / lockout / Angela stuck) + script npm run test:e2e | 1.5 | `npm run test:e2e` corre los 3 specs en chromium headless y pasan. |

---

## Criterios de aceptación (Definition of Done)

- [ ] `npm run type-check` y `npm run lint` pasan limpios.
- [ ] `npm run check:edunexo` sin matches.
- [ ] `grep -r "AngelaWidget\|LessonSurface\|ProactiveIntervention\|LessonContext\|angela-state\|prompts/angela-system" src/` devuelve cero matches funcionales (puede quedar en tests si se reescriben).
- [ ] `/stuck` sigue funcionando idéntico al cierre de Epic 02 — el chat no rompe por la limpieza.
- [ ] `EmotionDetector.detect()` cubre los 5 casos: frustrated, curious, neutral, bored, confused.
- [ ] `CognitiveAdapter.deriveFormat()` devuelve `visual`/`verbal`/`kinesthetic`/`unknown` con al menos 8 turnos de historial; con menos devuelve `unknown` y no inyecta `formatHint`.
- [ ] El system prompt de Angela incluye dinámicamente `formatHint` cuando aplique (verificable inspeccionando el prompt enviado a OpenAI en logs).
- [ ] El avatar muestra los 6 estados (`idle/thinking/speaking/celebrating/concerned/resting`); el switch a `concerned` ocurre cuando `EmotionDetector` devuelve `frustrated` o `confused` ≥ 2 turnos seguidos.
- [ ] 5 intentos fallidos de PIN dejan al estudiante con `pinLockedUntil` set; al sexto intento, `/student-login` muestra mensaje i18n y bloquea submit.
- [ ] El padre ve en su dashboard a cada estudiante con un estado de PIN (`activo` / `bloqueado hasta HH:MM`) y un botón "Desbloquear" cuando aplica.
- [ ] Migration de `Student.pinAttemptsCount` y `Student.pinLockedUntil` aplicada en dev; documentada para prod en "Pendientes para Epic 04".
- [ ] Playwright instalado; `npm run test:e2e` corre 3 specs y los 3 pasan en chromium headless.
- [ ] Cero strings hardcodeados; keys nuevas bajo `auth.student.locked.*`, `tutor.angela.emotion.*`, `parent.dashboard.unlock.*`.
- [ ] `TutorMessage.metadata` incluye `emotion` y `cognitiveHint` (cuando aplica) para análisis post-hoc.

---

## Guardrails (no scope creep)

Si Claude Code se siente tentado a:
- Construir `CurriculumContextEngine` o seed K-6 → **NO**. Epic 04. Detente y pregunta.
- Implementar function calling de OpenAI → **NO**. Epic 04, depende de tools reales.
- Llamar a OpenAI desde `EmotionDetector` para clasificar emoción → **NO**. v1 es heurística pura. Si crees que la heurística es insuficiente, repórtalo como Pendiente para Epic 04, no lo "arregles" instalando un clasificador LLM.
- Instalar Redis para rate-limit o lockout → **NO**. Postgres con `Student.pinLockedUntil` es suficiente.
- Instalar pgvector / embeddings para memoria semántica → **NO**. Epic 03b.
- Renombrar `NexosEntry` → `CoinEntry` en DB → **NO**. Sigue con `@@map`. Post-PMF.
- Formalizar `prisma/migrations/` → **NO** en este epic. Documentar como Pendiente y seguir con `prisma db push`.
- Borrar el modo demo (`midsea_demo_role`, `DEMO_PARENT_CONTEXT`) → **NO**. Ticket aparte. Si lo ves en el código, ignóralo.
- Tocar `src/lib/gamification/engine.ts`, `src/lib/i18n/config.ts`, `src/lib/auth/*` fuera del cambio puntual de PIN lockout → **NO** sin preguntar.
- Cambiar el modelo OpenAI (`gpt-4o-mini` → `gpt-4o`) porque "responde mejor con cognitiveHint" → **NO**. El upgrade de modelo es decisión de producto, no de implementación.

---

## Referencias obligatorias del repo (Claude Code ya las debe leer por `CLAUDE.md`)

1. `docs/AI_TUTOR_SPEC.md` §2.2 (6 estados emocionales del avatar), §4.2 (`StudentContextEngine`), §4.3 (`CognitiveAdapter`), §4.4 (`EmotionDetector`).
2. `docs/prompts/epic-02-angela-mvp.md` "## Pendientes para Epic 03" (contrato de deuda).
3. `docs/prompts/epic-01-cimientos.md` "## Pendientes para Epic 02" sección PIN security.
4. `docs/DMP.md` §2.5 (UVP: tutor adaptativo bilingüe) — confirmar que estamos resolviendo el problema, no inventando uno.
5. `prisma/schema.prisma` modelo `Student` (cambio mínimo: dos columnas).
6. `src/lib/tutor/` completo — entender qué hay antes de tocar.
7. `src/components/tutoring/AngelaAvatar.tsx` y `src/components/tutoring/AngelaChat.tsx` — extender, no reescribir.

---

## PROMPT (copiar y pegar en Claude Code)

```
Estoy iniciando el Epic 03 "Angela Adaptativa + Higiene" de Midsea:
limpieza v1 sylvie + EmotionDetector + CognitiveAdapter + 6 estados del
avatar + PIN lockout + Playwright. Antes de tocar código, ejecuta este
protocolo.

PASO -1 — Git workflow.
  Verifica `git status` y `git branch`. Si estás en `develop` o `main`,
  crea `feature/epic-03-adaptativa` con `git checkout -b`. Si ya estás
  en un branch `feature/*`, continúa. Nunca commits directos a develop/main.

PASO 0 — Lectura mínima (no leas de más).
  CLAUDE.md ya está cargado como project memory — NO lo releeas.
  Lee SOLO, en orden:
   1. docs/prompts/epic-03-adaptativa.md (completo — tu contrato del epic).
   2. docs/prompts/epic-02-angela-mvp.md "## Pendientes para Epic 03"
      (la sección al final, ~60 líneas — es el contrato de deuda heredada).
   3. docs/AI_TUTOR_SPEC.md §2.2 (estados emocionales), §4.3
      (CognitiveAdapter), §4.4 (EmotionDetector). NO leas otras secciones.
   4. prisma/schema.prisma modelo `Student` (solo ese modelo, ~25 líneas).
   5. src/lib/tutor/ListaDirectorio: `ls src/lib/tutor/` y luego abre
      ResponseGenerator.ts, StudentContextEngine.ts y store.ts (los demás
      solo si los vas a tocar — anuncia antes de abrir).
   6. src/components/tutoring/AngelaAvatar.tsx y AngelaChat.tsx (cortos).
   7. src/app/[locale]/student/layout.tsx (donde AngelaWidget está montado
      — para saber cómo desmontarlo).
   8. src/app/[locale]/student/lessons/[slug]/page.tsx + LessonSurface.tsx
      (para decidir destino de "Pedir ayuda").
   9. src/lib/auth/session.ts y verifyPin (búscalo con grep; no leas
      auth/* entero).
  NO leas: PRD, DMP completos, AI_TUTOR_SPEC fuera de §2.2/§4.3/§4.4,
  archivos del módulo que no vas a tocar este epic.
  Si necesitas info de un archivo no listado, pregunta antes de abrirlo.
  Confírmame que leíste lo anterior antes de proponer cambios.

PASO 1 — Plan de implementación (máx 35 líneas).
  Devuélveme:
   (a) Las 6 tareas en orden con archivos a crear/tocar/borrar.
   (b) Dependencias npm nuevas (`@playwright/test`) y comando de install
       confirmado.
   (c) Migration propuesta para `Student.pinAttemptsCount` y
       `Student.pinLockedUntil`. Espera mi OK antes de correr `prisma db push`.
   (d) Decisión sobre `LessonSurface`/"Pedir ayuda" — propón opción A
       (reusar `/stuck`) u opción B (borrar todo). Default A.
   (e) Cualquier ambigüedad que necesite mi decisión antes de empezar.
   (f) Si vas a desviarte de alguna decisión técnica pre-tomada, dilo
       ahora con justificación.
  Espera mi confirmación explícita ("ok, ejecuta") antes de tocar código.

PASO 2 — Ejecución por tarea.
  Una tarea a la vez. Para cada una:
   (a) Crea/edita/borra archivos.
   (b) Corre `npm run type-check`, `npm run lint`, `npm run check:edunexo`.
   (c) Reporta máx 10 líneas: archivos tocados, criterios cubiertos,
       pendientes. No re-narres lo que el código ya muestra.
   (d) Pídeme "siguiente tarea?" antes de continuar.

PASO 3 — Cierre del epic.
  Tras la tarea 6, corre la checklist completa de "Definition of Done"
  del archivo del epic y reporta [✓] / [✗] / [⚠ con nota] por cada item.
  Pendientes documentados en una sección nueva
  "## Pendientes para Epic 04" al final del epic doc, agrupados por:
  (a) deuda funcional (Curriculum, ActionParser, function calling, memoria
  semántica), (b) deuda de infra (Prisma migrations formales, Redis,
  Nexos→Coin rename), (c) deuda heredada (demo mode cleanup, vitest
  cold-start flake, route group refactor).

PASO 4 — Push y entrega.
  Commits atómicos por tarea con mensajes convencionales:
  `chore(tutor): remove v1 sylvie widget and zombies`,
  `feat(tutor): EmotionDetector heuristic v1`,
  `feat(tutor): CognitiveAdapter format hint`,
  `feat(tutor): 6-state emotional avatar`,
  `feat(auth): PIN lockout with parent reset`,
  `test(e2e): Playwright smoke for auth + Angela`.
  Al cerrar el epic, `git push -u origin feature/epic-03-adaptativa` y
  avísame para que abra el PR a `develop`. No hagas merge tú mismo.

REGLAS DE INTERACCIÓN:
- Si algo es ambiguo, pregunta en vez de asumir.
- Decisiones técnicas no listadas en el epic doc ni en CLAUDE.md →
  pregúntame.
- EFICIENCIA DE TOKENS:
   · No releas archivos ya leídos salvo que los hayas editado.
   · Reportes máx 10 líneas por tarea.
   · No corras `npm install` para inspeccionar deps; lee package.json
     una vez.
   · Si reanudas en sesión nueva: empieza por
     `git log feature/epic-03-adaptativa --oneline` y la sección
     "Pendientes" del epic doc. NO releas docs maestros completos.
- ANTI-COPIA: si te ves tentado a implementar emotion detection como un
  clasificador LLM extra (estilo Khanmigo "sentiment pass"): para. v1
  es heurística pura. Si crees que la heurística falla, repórtalo como
  Pendiente para Epic 04, no lo "arregles" duplicando llamadas a OpenAI.
- Nunca toques sin preguntar: src/lib/gamification/engine.ts,
  src/lib/i18n/config.ts, src/lib/auth/* fuera del cambio puntual de
  PIN lockout, prisma/schema.prisma fuera del scope acordado en PASO 1(c).
- Mobile-first siempre. El avatar `concerned` y `resting` deben
  funcionar igual en mobile que en desktop.
- i18n: cero strings hardcodeados. Keys nuevas bajo `auth.student.locked.*`,
  `tutor.angela.emotion.*`, `parent.dashboard.unlock.*`.
- a11y: el avatar emocional cambia de color pero ALSO de aria-label
  (no solo color — accesible para daltonismo).

Empieza por el PASO -1 ahora.
```

---

## Pendientes para Epic 04

*(Esta sección se completa al cerrar Epic 03. Estructura esperada: deuda funcional / deuda de infra / deuda heredada — ver PASO 3 del prompt.)*

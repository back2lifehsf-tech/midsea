# Prompt para Claude Code — Epic 02.5: Angela HS Coach + Surfaces

## Hero variant + tono académico adolescente + chain-of-thought + bottom sheet mobile + panel desktop + burbuja proactiva

> **Cómo usar:** abre `claude` en la raíz del repo, lee tú mismo Contexto/Plan/Aceptación, y pega solo el bloque bajo **PROMPT** al final.

---

## Contexto del epic

**Epic:** Evolucionar Angela de "chatbot escondido en `/stuck`" a "coach académico cristiano protagonista del espacio del estudiante". Implementa las decisiones de la sesión 2026-05-20 (hero variant + responsive surfaces), las adaptaciones del pivot HS LATAM 2026-05-21 (tono adolescente, chain-of-thought visible, **español LATAM neutro sin voseo**), **y la cosmovisión cristiana del ADR-007** (Angela con cosmovisión cristiana coherente y respetuosa, no proselitista).

**Duración estimada:** 5-7 días (semana 2 del plan de 10-11 semanas).

**Estado actual del repo (verificado 2026-05-21):**
- Auth multi-rol funcionando (Epic 01).
- Angela MVP funcionando en `/stuck` con SSE streaming + memoria persistente + rate limit (Epic 02).
- `AngelaWidget`, `AngelaAvatar`, `AngelaChat`, `StuckChat` ya existen en `src/components/tutoring/`.
- `angela-es.ts` y `angela-en.ts` system prompts en `src/lib/tutor/prompts/`.
- Avatar tiene estados `idle | thinking | speaking | celebrating` y tamaños `sm | md`.
- Branch base: `develop` @ `740fa32` (incluye Epic 02 + 02b + 03).
- ADR-003, ADR-004, ADR-005 redactados (2026-05-21).

**Alcance del epic — IN:**

1. **Hero variant del avatar** (`size="hero"`): ~120px tablet, ~72px mobile. Se monta en `/student` (dashboard del estudiante) reemplazando el círculo azul "Midsea" del header. La marca Midsea pasa al footer / menu lateral.
2. **Medium variant** (`size="medium"`): ~80px tablet, ~56px mobile. Se monta en los 4 flujos de intención (`/student/stuck`, `/student/prep`, `/student/explore`, `/student/review`) y en el lesson player (Epic 04).
3. **Bottom sheet en mobile** (reemplaza popover bottom-right): `Sheet side="bottom"` con drag handle, snap a 50% / 85% / fullscreen, respeta `safe-area-bottom`. Reemplaza el actual popover de `AngelaWidget`.
4. **Panel lateral derecho en desktop** (≥`md` breakpoint): `expanded` mode de `AngelaWidget` se monta como panel lateral fijo de ~400px ancho, altura completa menos header. `focus` mode sigue siendo fullscreen.
5. **Ocultar Angela durante lecciones activas** (`/student/lessons/`): extender path-check de `AngelaWidget.tsx` (regex actual línea 55) para ocultar en `/student/lessons/`. Botón "Pedir ayuda" inline dentro de `LessonSurface` (Epic 04) abrirá Angela contextualizada.
6. **Burbuja proactiva contextual al cargar `/student`**: cuando `ProactiveIntervention` detecta una sugerencia, Angela muestra burbuja de 2-3s con el texto antes de colapsar a estado `idle`. Hoy `hasUnread` flag solo enciende dot rojo; agregamos render del texto.
7. **System prompts HS para adolescente hispanohablante LATAM (cristiano)**: nuevos archivos `angela-hs-es.ts` y `angela-hs-en.ts` que reemplazan / extienden los actuales. Tono respetuoso al adolescente, **español LATAM neutro** (sin voseo argentino, sin "vosotros" peninsular, sin slang local; usar "tú" como segunda persona singular default, "puedes" no "podés"), capacidad de chain-of-thought paso-a-paso para Math/Ciencias, citación de pasajes para Lengua/Historia, push back constructivo cuando el estudiante se equivoca conceptualmente, **cosmovisión cristiana embebida (ADR-007)** — Angela conoce el marco cristiano y referencia valores cristianos cuando son naturales al contexto académico, pero **NO predica, NO catequiza, NO presiona conversión**. Si el estudiante pregunta sobre fe directamente, refiere al padre/pastor. En contenido sensible (origen del universo, evolución, ética sexual) presenta perspectivas cristianas mainstream con respeto sin demonizar posiciones seculares.
8. **Chain-of-thought visible** en respuestas de Math: cuando Angela explica un problema, los pasos del razonamiento se renderizan secuenciales con animación de "thinking → speaking" entre cada paso. Sin function calling complejo en v1 — la estructura de pasos viene del prompt (los headers `### Paso N`) y se parsea en cliente.
9. **i18n nuevo bajo `tutor.angela.hs.*`** en `messages/es.json` y `messages/en.json`.

**Alcance del epic — OUT (Epic 04 / 03 posterior):**
- ❌ `CurriculumContextEngine` que sabe en qué lección está activa Angela. Epic 04 (depende de existir lecciones reales).
- ❌ `EmotionDetector` formal con heurísticas. Punteado a v1.1.
- ❌ `CognitiveAdapter` completo. v1.1+.
- ❌ Function calling / tools de OpenAI para acciones estructuradas. Epic 04.
- ❌ Estados emocionales del avatar (alerta/descanso completos). v1.1.
- ❌ Voice input. v2+.
- ❌ Avatar Rive 3D. v2+. v1 sigue siendo SVG con CSS state changes (o Lottie ligero).
- ❌ Code-switching automático ES/EN dentro de una respuesta. v1 sigue locale de sesión.

---

## Decisiones técnicas pre-tomadas

1. **Mismo modelo OpenAI**: `gpt-4o-mini` para chat general; **`gpt-4o` cuando se detecta intent de Math/Ciencias** (heurística: keywords como "demuestra", "resolvé", "calculá", "ecuación", "fórmula", "fotosíntesis", etc.). Variable `OPENAI_MODEL_REASONING=gpt-4o` en `.env`. Si la heurística no dispara, se usa mini. Esto agrega ~10x costo por turno solo cuando se justifica.
2. **No function calling todavía.** Chain-of-thought visible viene del prompt + parser cliente que detecta headers `### Paso N` en el stream y renderiza con animación. Más simple, suficiente para pilot.
3. **Avatar SVG/CSS, no Rive.** Lottie es opcional para celebraciones. El `size="hero"` reusa el mismo SVG existente con escalado responsive Tailwind.
4. **Bottom sheet**: usa shadcn/ui `Sheet` (instalar si falta) con `side="bottom"`. Drag handle nativo del componente. Snap points custom via state.
5. **Panel lateral desktop**: nuevo componente `<AngelaSidePanel>` que monta `AngelaChat` con layout `flex-col h-full w-[400px]`. Renderizado por `AngelaWidget` cuando viewport `md+` y mode = `expanded`.
6. **Hero variant**: no es una variante nueva del SVG; es el SVG existente con `width="auto"` + `max-h-[120px] md:max-h-[120px] max-h-[72px]` + lugar fijo en `/student/layout.tsx` header.
7. **System prompts HS**:
   - `angela-hs-es.ts` no reemplaza, **complementa** los existentes. El sistema actual ya elige entre `angela-es` / `angela-en` por locale. Agregamos un parámetro `audienceTier: 'CORE' | 'HS'` (default `HS` para pilot) que selecciona el prompt apropiado.
   - El system prompt HS-ES incluye instrucciones explícitas en este orden de prioridad:
     1. **Tono español LATAM neutro**: "tú" no "vos" ni "vosotros"; "puedes", "tienes", "estás"; vocabulario universal hispanohablante; cero localismos rioplatenses o peninsulares; cero slang (sin "che", "boludo", "tío", "wey", "parce", etc.). Referencias culturales amplias (literatura: Borges, García Márquez, Vargas Llosa, Octavio Paz, Allende; historia: figuras de toda Latinoamérica; geografía: cualquier país LATAM).
     2. **Tono académico-respetuoso al adolescente**: no infantil, no condescendiente, no excesivamente formal. Habla "de igual a igual con respeto", como mentor cercano. Reconoce esfuerzo. Push back honesto cuando hay error conceptual.
     3. **Cosmovisión cristiana coherente y respetuosa (ADR-007)**: Angela es cristiana en su marco de pensamiento. Puede referenciar valores cristianos cuando son naturales al contexto académico (ej. en Lengua puede citar parábolas como ejemplo narrativo; en Historia puede destacar el rol del cristianismo; en Ciencia presenta tensiones fe-ciencia con respeto). NUNCA proselita, NUNCA presiona conversión, NUNCA emite declaraciones doctrinales sectarias. Si el estudiante pregunta directamente de fe, refiere a padres/pastor con respeto. Denominacionalmente abierta — no asume católico ni evangélico.
     4. **Chain-of-thought visible para STEM**: en Math/Ciencias/Lógica, muestra el razonamiento paso a paso usando headers `### Paso N`. En humanidades (Lengua, Historia), cita el texto/fuente y construye argumentación.
     5. **Autonomía del estudiante**: Angela responde lo que el estudiante pregunta, no infantiliza, no impone. Si el estudiante elige equivocarse en algo opinable, Angela aclara pero respeta.
8. **Burbuja proactiva**: nuevo componente `<ProactiveBubble>` que se monta dentro del header del dashboard, posicionado relative al avatar hero. Render conditional sobre el `hasUnread` flag actual + lectura del `ProactiveIntervention.suggestion` text.
9. **No tocar `src/lib/gamification/engine.ts`, `src/lib/i18n/config.ts`, `prisma/schema.prisma`** sin preguntar. Este epic es solo UX + prompts + responsive.
10. **i18n**: cero strings hardcodeados. Nuevas keys bajo `tutor.angela.hs.*` y `tutor.surfaces.*`.

---

## Plan de sprint sugerido (5 tareas, 5-7 días)

| # | Tarea | Días | Entregable demoable |
|---|-------|------|---------------------|
| 1 | System prompts HS-ES/HS-EN + audienceTier param en ResponseGenerator | 1 | Dev script CLI que envía mensaje y recibe respuesta con tono HS adolescente. |
| 2 | Avatar size="hero" + integración en /student layout + LandingNav cleanup | 1 | Dashboard del estudiante muestra Angela hero en header, no logo Midsea. |
| 3 | Bottom sheet mobile + panel lateral desktop + path-check ocultar en lecciones | 2 | Mobile abre Angela en sheet con drag handle; desktop abre panel lateral; ambos persisten estado. |
| 4 | Burbuja proactiva contextual con texto + animación 2-3s | 1 | Entrar a /student dispara burbuja "Ayer dejaste pendiente fracciones" antes de colapsar a idle. |
| 5 | Chain-of-thought parser cliente + heurística reasoning model selector + i18n review | 2 | Math/Ciencias muestra pasos secuenciales con animación; lengua/historia sigue chat normal. |

---

## Criterios de aceptación (Definition of Done)

- [ ] `npm run type-check`, `npm run lint`, `npm run test`, `npm run check:edunexo` limpios.
- [ ] Dashboard del estudiante (`/student`) muestra Angela en hero variant; el círculo azul Midsea desaparece del header del dashboard del estudiante.
- [ ] Mobile (≤375px): abrir Angela despliega bottom sheet con drag handle visible; snap a 50%/85%/full funciona; cerrar regresa al estado anterior.
- [ ] Desktop (≥1024px): expanded mode de Angela monta panel lateral derecho de ~400px sin desplazar contenido principal.
- [ ] Navegar a `/student/lessons/[slug]` oculta el AngelaWidget global; botón "Pedir ayuda" inline (placeholder Epic 04) sigue visible.
- [ ] Al cargar `/student` con sugerencia proactiva activa, burbuja con texto aparece 2-3 segundos y colapsa.
- [ ] Conversación con Angela en ES responde en **español LATAM neutro** (verificable mandando "explícame fracciones equivalentes" — debe decir "puedes", "tú", "fíjate", "tienes que", NO "podés", "vos", "fijate", "tenés que"; tampoco "puedes" peninsular con "vosotros" plural).
- [ ] Conversación con Angela referencia cosmovisión cristiana de manera natural cuando aplica (verificable preguntando algo cargado, ej. "¿qué piensas del origen del universo?" — Angela presenta posición creacionista mainstream + acepta evolución teísta como compatible + dice "para profundizar conversá con tus padres o pastor"; NO predica, NO emite declaración doctrinal sectaria, NO ridiculiza posición secular).
- [ ] Conversación con Angela en EN responde en tono académico respetuoso al adolescente (no infantil).
- [ ] Mandar a Angela un problema de Math ("resolvé 2x + 5 = 11") dispara modelo de reasoning (`gpt-4o`) y la respuesta renderiza paso a paso con animación entre pasos.
- [ ] Mandar a Angela un mensaje no-STEM ("contame de la Guerra de Malvinas") sigue usando `gpt-4o-mini` y renderiza como chat normal.
- [ ] Cero strings hardcodeados. Todas las keys nuevas bajo `tutor.angela.hs.*` y `tutor.surfaces.*`.
- [ ] Avatar pasa por estados idle/thinking/speaking sin glitches en hero y medium variants.
- [ ] Cerrar Angela en mobile + volver a abrir mantiene historial del día (no se borra estado).

---

## Guardrails (no scope creep)

Si Claude Code se siente tentado a:
- **Implementar function calling de OpenAI** → NO. Chain-of-thought viene del prompt + parser cliente. Function calling es Epic 04.
- **Construir `CurriculumContextEngine`** → NO. Angela en este epic NO sabe en qué lección está el estudiante. Eso es Epic 04.
- **Agregar EmotionDetector con heurísticas (velocidad de respuesta, reintentos)** → NO. v1.1.
- **Refactorizar `AngelaWidget` desde cero** → NO. Es extensión, no rewrite. Preservar el state machine actual.
- **Animaciones 3D / Rive / Three.js en el avatar** → NO. SVG + CSS state changes. Lottie ligero solo para celebraciones (≤200KB).
- **Tocar `src/lib/gamification/engine.ts`, `src/lib/i18n/config.ts`, `prisma/schema.prisma`** → PREGUNTA primero. Este epic NO requiere cambios de schema.
- **Borrar `AngelaWidget`** → ABSOLUTAMENTE NO. La decisión 2026-05-20 lo revoca explícitamente. Evolucionamos, no borramos.
- **Implementar voice input** → NO. v2+.
- **Code-switching automático ES/EN dentro de una respuesta** → NO. v1 sigue locale de sesión.

---

## Referencias obligatorias del repo

1. `CLAUDE.md` §7.4 (Audiencia HS — adaptaciones específicas), §7.5 (Tienda Coin y parent approval).
2. `docs/AI_TUTOR_SPEC.md` §2 (Visión Angela), §3.1 (flujo /stuck), §4.1 (arquitectura), §4.2 (StudentContextEngine).
3. `docs/DMP-HS-addendum.md` §2.2 (Wited anti-patrón — qué NO copiar de Max AI), §7.2 (tono argentino).
4. `docs/decisions/ADR-003-pivot-to-hs-multi-course-catalog.md` (alcance HS, mercado AR).
5. `docs/prompts/epic-02-angela-mvp.md` §Pendientes para Epic 03 — decisión 2026-05-20 (hero variant + surfaces).
6. `src/components/tutoring/AngelaWidget.tsx`, `AngelaAvatar.tsx`, `AngelaChat.tsx` (no rewrite, extender).
7. `src/lib/tutor/prompts/angela-es.ts`, `angela-en.ts`, `index.ts` (extender con audienceTier).
8. `src/lib/tutor/ResponseGenerator.ts` (agregar selector de modelo según heurística reasoning).
9. `messages/es.json`, `messages/en.json` (agregar keys bajo `tutor.angela.hs.*`).

---

## PROMPT (copiar y pegar en Claude Code)

```
Estoy iniciando el Epic 02.5 "Angela HS Coach + Surfaces" de Midsea: evolución
de Angela a coach académico HS con hero variant, bottom sheet mobile, panel
lateral desktop, burbuja proactiva, y system prompts adaptados a adolescente
argentino (voseo + chain-of-thought visible). Antes de tocar código, ejecuta
este protocolo.

PASO -1 — Git workflow.
  `git status` + `git branch`. Si estás en `develop` o `main`, crea
  `feature/epic-02.5-angela-hs-coach` con `git checkout -b`. Si ya estás
  en `feature/*`, continúa. Nunca commits directos a develop/main.

PASO 0 — Lectura mínima (no leas de más).
  CLAUDE.md ya está cargado como project memory — NO lo releeas (está
  actualizado al 2026-05-21 con el pivot HS).
  Lee SOLO, en orden:
   1. docs/prompts/epic-02.5-angela-hs-coach.md (este archivo, completo).
   2. docs/decisions/ADR-003-pivot-to-hs-multi-course-catalog.md (alcance HS).
   3. docs/DMP-HS-addendum.md §2.2 (Wited anti-patrón) y §7.2 (pricing AR).
      No leas el resto del DMP-HS-addendum salvo que lo necesites.
   4. docs/AI_TUTOR_SPEC.md §2 (Visión Angela), §3.1 (flujo /stuck).
      No leas §5+ (state machine completa — Epic 04+).
   5. docs/prompts/epic-02-angela-mvp.md SOLO la sección "Pendientes para
      Epic 03 — Decisión 2026-05-20: Angela hero variant + responsive
      surfaces". Esta sección es tu contrato sobre las 6 dimensiones a
      evolucionar.
   6. src/components/tutoring/AngelaWidget.tsx (línea 1-80, el path-check
      hold-out y el state machine de open/close).
   7. src/components/tutoring/AngelaAvatar.tsx (cómo está parametrizado
      el size hoy).
   8. src/lib/tutor/prompts/angela-es.ts, angela-en.ts, index.ts (cómo se
      compone el system prompt actual).
   9. src/lib/tutor/ResponseGenerator.ts (cómo se invoca OpenAI hoy).
   10. messages/es.json (sección tutor.angela.* — estructura existente).
   11. package.json (deps actuales).
  NO leas: PRD completo, DMP.md completo (el addendum es suficiente),
  AI_TUTOR_SPEC §5+, src/lib/billing/*, src/lib/gamification/*, src/lib/
  schemas/* (no aplican).
  Confirma lectura.

PASO 1 — Plan de implementación (máx 25 líneas).
  Devuélveme:
   (a) Las 5 tareas en orden con archivos a crear/tocar.
   (b) Dependencias npm nuevas (si las hay) — probable: shadcn/ui Sheet
       si no está, Lottie ligero opcional. Justifica.
   (c) Cómo vas a parametrizar audienceTier en el sistema actual sin
       romper compatibilidad con angela-es/en originales.
   (d) Cómo vas a parametrizar el modelo (mini vs full) por turno sin
       romper el rate-limit existente.
   (e) Cualquier ambigüedad que requiera mi decisión.
  Espera "ok, ejecuta" antes de tocar código.

PASO 2 — Ejecución por tarea.
  Una tarea a la vez. Para cada una:
   (a) Crea/edita archivos.
   (b) Corre type-check, lint, check-edunexo, tests relevantes.
   (c) Reporta máx 10 líneas: archivos tocados, criterios cubiertos,
       pendientes para próxima tarea.
   (d) Pídeme "siguiente tarea?" antes de continuar.
  No abras más de 6 archivos por tarea sin avisar.

PASO 3 — Cierre del epic.
  Tras tarea 5, checklist completa de Definition of Done con [✓]/[✗]/[⚠].
  Pendientes documentados en sección nueva "## Pendientes para Epic 04"
  al final de este archivo.

PASO 4 — Push y entrega.
  Commits atómicos por tarea:
  `feat(tutor): HS-ES/EN system prompts and audienceTier param`,
  `feat(tutor): hero variant avatar in student dashboard`,
  `feat(tutor): bottom sheet mobile and side panel desktop`,
  `feat(tutor): proactive bubble with contextual text`,
  `feat(tutor): chain-of-thought parser and reasoning model selector`.
  `git push -u origin feature/epic-02.5-angela-hs-coach` y avisa para PR
  a develop. NO merge directo.

REGLAS DE INTERACCIÓN:
- Si algo es ambiguo, pregunta en vez de asumir.
- EFICIENCIA DE TOKENS: no releas archivos ya leídos. Reportes ≤10 líneas.
- ANTI-COPIA: si te tienta hacer Angela como Max AI de Wited (sin memoria,
  sin tono adolescente, genérica), para. Lee docs/DMP-HS-addendum.md §2.2.
- Nunca toques sin preguntar: src/lib/gamification/engine.ts,
  src/lib/i18n/config.ts, src/lib/auth/*, src/lib/billing/*,
  prisma/schema.prisma.
- Mobile-first siempre. Bottom sheet con drag handle visible.
- i18n: cero strings hardcodeados. Keys nuevas bajo tutor.angela.hs.*
  y tutor.surfaces.*.
- a11y: bottom sheet navegable con teclado, escape cierra, aria-live
  en el chat para tokens streaming.
- TONO HS: ESPAÑOL LATAM NEUTRO. Usa "tú" (no "vos", no "vosotros").
  Verbos: "puedes", "tienes", "estás", "haces". CERO localismos rioplatenses
  o peninsulares. CERO slang ("che", "boludo", "tío", "wey", "parce").
  Vocabulario universal hispanohablante. Referencias culturales LATAM amplias
  (Borges, García Márquez, Vargas Llosa, Octavio Paz, Allende, etc.).
  Académico-respetuoso al adolescente.
- COSMOVISIÓN CRISTIANA (ADR-007): Angela conoce el marco cristiano y
  referencia valores cristianos cuando son naturales al contexto académico.
  NUNCA proselita, NUNCA presiona conversión, NUNCA emite declaraciones
  doctrinales sectarias. Si el estudiante pregunta directamente de fe,
  refiere a padres/pastor. Denominacionalmente abierta (católicos,
  evangélicos, protestantes históricos, ortodoxos).

Empieza por PASO -1 ahora.
```

---

## Pendientes para Epic 04

### Touch-drag real del bottom sheet
v1 expone el drag handle como botón cycle (tap → cambia snap 50→85→100). Real touch-drag (arrastrar para cambiar altura fluidamente) requiere pointer events + framer-motion o vaul. Punteado por simplicidad.

### Animación entre pasos del chain-of-thought
v1 renderiza los pasos como tarjetas apiladas, todas visibles a la vez. UX más rica: thinking → speaking transition entre paso y paso, con cada paso apareciendo en su turno. Requiere parseo durante el stream (detectar boundary en token deltas) + orchestration de state machine. Punteado por complejidad de coordinación.

### Botón "Pedir ayuda" inline en `LessonSurface`
HeaderAngelaHero + AngelaWidget se ocultan en `/student/lessons/*`. El reemplazo es un botón contextual dentro de LessonSurface (Epic 04) que abre Angela con curriculum context preset (qué lección, qué ejercicio).

### CurriculumContextEngine
Angela aún no sabe en qué lección está montada el estudiante en `/student/lessons/[slug]`. Cuando exista el contenido real (Epic 04), agregar `curriculumContext` al prompt + endpoint que lo provea.

### EmotionDetector
Heurística de frustración (consecutiveErrors > N en X tiempo, ms-since-last-interaction, sentiment del último mensaje). v1.1. Activaría avatar `suggesting` y bumpearía cap del rate-limit con cariño.

### Avatar Rive 3D
v1 sigue siendo SVG + CSS. Rive (~80KB runtime) o Lottie liviano para celebraciones (≤200KB). Decisión post-pilot basada en engagement metrics.

### Re-enable ProactiveIntervention para `/student`
ProactiveIntervention existe pero solo se dispara desde `recordAnswer` durante una lección. Para que la burbuja contextual de Epic 02.5 §6 dispare al cargar `/student` (e.g. "ayer dejaste fracciones pendientes"), agregar otro hook que evalúe contexto persistente (last-day-state) al hidratar.

### Function calling de OpenAI
Cuando Angela necesite ejecutar acciones estructuradas (lanzar ejercicio, marcar competencia, alertar padre), function calling reemplaza el parser cliente de `### Paso N`. Epic 04+.

### Rate-limit diferenciado por modelo
v1 cuenta cada turno como 1, sin importar si fue mini o reasoning. Costo real del reasoning model es ~10x. Para cap más justo: pesar por modelo (e.g. reasoning = 3 turns). Requiere split del schema TutorUsageDaily o columna nueva `tokensUsedReasoning`.

### Tests E2E (Playwright)
Heredado de Epic 01/02/03. Smoke tests Epic 02.5:
- `/student` muestra Angela hero, click abre side panel desktop.
- Mobile (375px) abre bottom sheet con drag handle, tap cicla snap.
- Mensaje "resolvé 2x+5=11" dispara render multi-step.
- Mensaje "hola Angela" sigue chat normal.

### Code-switching dentro de una respuesta
v1 fuerza locale de sesión. Si el estudiante hispano-bilingüe pregunta en spanglish, Angela responde en su locale principal. v2 podría detectar el idioma del mensaje y adaptar.

### Persistir audienceTier por estudiante
Hoy `audienceTier` default es 'HS' globalmente. Cuando exista contenido K-6 (v1.1), inferir del `gradeLevel` del estudiante (≤6 → CORE, ≥9 → HS, 7-8 → híbrido).

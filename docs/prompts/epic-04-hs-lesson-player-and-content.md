# Prompt para Claude Code — Epic 04-HS: Lesson Player + Pipeline de Generación + Activación de Cursos

## El epic más grande del pilot: 9 cursos en catálogo, ~400-500 lecciones generadas, lesson player completo, selector de cursos por hijo

> **Cómo usar:** abre `claude` en la raíz del repo, lee tú mismo las secciones de Contexto/Plan/Aceptación, y pega solo el bloque bajo **PROMPT** al final.

---

## Contexto del epic

**Epic:** Construir el núcleo del producto que el pilot necesita ver funcionando: el **catálogo HS Pilot Mínimo de 8 cursos** visible públicamente, el padre activa cursos por hijo desde el Parent Copilot, el estudiante consume lecciones en un lesson player con KaTeX + 4 tipos de actividad + quiz, y el pipeline de generación con AI puebla el catálogo con **~280 lecciones** de calidad pedagógica defendible **a partir de los outlines reales del founder en `docs/content/source/`**.

> **Actualización 2026-05-21 post-audit**: el alcance original (~400-500 lecciones en 9 cursos) se ajustó a **8 cursos / ~280 lecciones** tras auditar el contenido real. Ver `docs/curriculum/midsea-hs-catalog.md` para la lista de 8 cursos. Los 14 cursos restantes entran en rolling release post-pilot. Adicionalmente, el pipeline debe soportar **dos formatos de outline** detectados (A y B), ver ADR-006 actualizado.

**Duración estimada:** 3 semanas de implementación (semanas 3-5 del plan) + ~1 semana ejecutando el pipeline de generación + review humano del founder (~5-7 días). Puede solaparse con semanas 4-5. Total ~3-4 semanas wallclock.

**Estado actual del repo (verificado 2026-05-21):**
- Auth multi-rol funcionando (Epic 01).
- Angela MVP en `/stuck` con SSE streaming (Epic 02).
- Angela HS coach con hero/medium variants + tono adolescente (Epic 02.5, completado antes de este).
- Stripe billing por estudiante (Epic 03).
- Schema actual tiene `Lesson` + `LessonProgress` + `CoinEntry` + `Badge` pero **NO tiene** `Course` ni `Competency` ni `StudentCourseEnrollment`.
- `src/lib/gamification/engine.ts` implementa la regla mastery ≥80% → 100 Coin. Reusable.
- `src/app/[locale]/student/lessons/[slug]/page.tsx` es placeholder.
- Branch base: `develop` post-Epic 02.5.

**Alcance del epic — IN:**

1. **Migration Prisma con catálogo completo (ADR-005 §7)**:
   - Enums nuevos: `SubjectArea` (MATH, LANGUAGE, ENGLISH_ESL, HISTORY, SCIENCE, MUSIC), `GradeBand` (CICLO_BASICO, CICLO_ORIENTADO, TRANSVERSAL).
   - Tablas nuevas: `Course`, `Competency`, `LessonCompetency`, `StudentCourseEnrollment`, `QuizQuestion`.
   - Extender `Lesson` existente con `courseId` FK + campos para activities (JSON).
   - Migration SQL idempotente en `prisma/migrations/manual/0004-catalog-courses-enrollments.sql`. Aplicación al dev + scripts para prod cuando se merge.

2. **Catálogo HS Pilot Mínimo seeded — 8 cursos**:
   - `prisma/seed-catalog.mjs` que inserta los 8 cursos (slug + título + descripción + gradeBand + subject) basado en `docs/curriculum/midsea-hs-catalog.md`.
   - Los 8 cursos: `math-grade-9`, `math-grade-10`, `language-grade-9-10`, `english-esl-grade-9`, `english-esl-grade-10`, `history-ancient-civ-2-grade-9-10`, `science-biology-grade-9-10`, `music-grade-9`.
   - Cada curso queda `published = true` listo para activar.

3. **Pipeline de generación de contenido (ADR-006)**:
   - `scripts/prompts/lesson-generator-v1.md`: prompt versionado para GPT-4o. **Incluye instrucciones de tono español LATAM neutro (no voseo) + cosmovisión cristiana embebida (ADR-007)**.
   - `scripts/parsers/outline-parser.mjs`: **parser dual** que detecta automáticamente Formato A (Primaria-style con "Producto del estudiante") vs Formato B (HS-denso con 2 temas/mes). Salida normalizada: lista de `{mes, tema, contenidos, handsOn[], producto?}`. Ver ADR-006.
   - `scripts/generate-lesson.mjs`: CLI que toma course + tema + n y genera JSON lección. **Lee outline source desde `docs/content/source/` según mapeo de `docs/curriculum/temas-grado-materia.md`**.
   - `scripts/generate-course.mjs`: bulk generate de un curso entero (todos los temas del outline, 2-4 lecciones por tema).
   - `scripts/review-lesson.mjs`: CLI helper para abrir lección generada, editarla, mover a curated/.
   - `scripts/ingest-lesson.mjs`: valida JSON contra Zod schema + inserta en DB.
   - `scripts/ingest-course.mjs`: bulk ingest de un curso entero.
   - `src/lib/schemas/lesson-ingest.ts`: Zod schema canónico de una lección generada.

4. **Lesson player UI**:
   - `src/app/[locale]/student/lessons/[slug]/page.tsx`: render completo de una lección con SSR del contenido + interacción cliente.
   - `src/components/learning/LessonRenderer.tsx`: parser markdown → JSX con soporte de KaTeX inline + blocks, imágenes placeholder, headers/listas/tablas.
   - `src/components/learning/Activities.tsx`: 4 tipos — `MultipleChoice`, `FillInBlank`, `ShortAnswer`, `StepByStep` (selector de pasos para Math).
   - `src/components/learning/Quiz.tsx`: render del quiz final con scoring + dispara `gamificationEngine.awardCoinIfMastery`.
   - `src/components/learning/AskAngelaButton.tsx`: botón inline "Pedir ayuda" que abre Angela con contexto de la lección (Epic 04.5 integración completa; en este epic basta con `redirect a /stuck?lessonSlug=X`).

5. **Selector de cursos por hijo en Parent Copilot**:
   - `src/app/[locale]/parent/students/[id]/page.tsx`: panel detallado del estudiante con cursos activos + catálogo disponible.
   - `src/components/parent/CourseActivationDialog.tsx`: modal que muestra detalles del curso y CTA "Activar para [nombre]".
   - `POST /api/parent/students/[id]/enrollments`: API para crear/eliminar `StudentCourseEnrollment`.
   - Actualizar dashboard de estudiante (`/student`) para mostrar cards de cursos activos en lugar de placeholders.

6. **Catálogo público pre-signup**:
   - `src/app/[locale]/catalog/page.tsx`: grid público de los 9 cursos con descripción extendida + temas + CTAs hacia signup.
   - Linked desde landing footer + hero secundario.

7. **Integración con gamification engine**:
   - Al completar quiz con score ≥80% → llamar `awardCoin(studentId, lessonId, 100)`.
   - Hooks en `LessonProgress` upsert: cuando `masteryPct` crosses 80 por primera vez, dispara award + actualiza `EarnedBadge` si aplica.

8. **i18n nuevo bajo `student.lessons.*`, `parent.courses.*`, `catalog.*`**.

**Alcance del epic — OUT (Epic 05 / 06 / v1.1):**
- ❌ Tienda Coin (Epic 05).
- ❌ EmotionDetector + CognitiveAdapter (v1.1).
- ❌ CurriculumContextEngine completo con awareness real-time (v1.1 — en este epic se pasa lessonSlug por query param).
- ❌ Function calling de Angela (Epic 04.5 mini, v1.1 completo).
- ❌ Imágenes generadas con AI (placeholder en v1).
- ❌ Reportes regulatorios formales (v1.1).
- ❌ Spaced repetition / assessments adaptativos IRT (Epic 06).
- ❌ Cursos primaria K-6 y secundaria 7°-8° (v1.1).

---

## Decisiones técnicas pre-tomadas

1. **OpenAI para generación**: `gpt-4o` (no mini) para calidad pedagógica HS. Costo estimado: ~$0.05-0.10 por lección × 500 lecciones = $25-50 totales. Aceptable.
2. **No function calling todavía** — el prompt produce JSON estructurado, el script parsea con `JSON.parse(content)` después de extraer del code fence.
3. **KaTeX para fórmulas**: `katex` + `react-katex` (instalar). Render server-side donde sea posible para SEO del catálogo público.
4. **4 tipos de actividad solamente en v1**: multiple_choice, fill_in_blank, short_answer (validado por keywords + regex, no LLM en cliente), step_by_step (selector de orden de pasos para Math).
5. **Quiz scoring server-side**: el cliente envía respuestas, el server calcula score contra `QuizQuestion.correctAnswer` (no exponer answers en el bundle).
6. **No drag-and-drop en v1**: postponed a v1.1. step_by_step usa selección ordenada de pasos numerados.
7. **Activación de curso es inmediata** (sin proration, sin cobro adicional). Plan Core incluye todo el catálogo.
8. **Catálogo público pre-signup** es read-only SSR. Las preview cards muestran # lecciones + # competencias + descripción + temas pero NO el contenido de las lecciones.
9. **No tocar sin preguntar**: `src/lib/auth/*`, `src/lib/billing/*`, `src/lib/tutor/*` (Epic 02 + 02.5 cerrados), `src/lib/gamification/engine.ts` (regla de mastery ya implementada — solo extender via hooks).
10. **Imágenes**: placeholder `{{IMAGE: descripción}}` renderiza como caja gris con texto italic. Sin generación AI en v1.
11. **Pipeline ejecutable en background**: el founder corre `node scripts/generate-course.mjs --course math-ciclo-basico` y se queda 30-60 min generando todas las lecciones del curso en lotes. Output va a `outputs/gen/` (gitignored).
12. **Review humano**: founder edita JSON a mano o via `scripts/review-lesson.mjs`. Mueve a `outputs/curated/` cuando aprueba. Luego corre `scripts/ingest-course.mjs --course math-ciclo-basico` para insertar a DB.

---

## Plan de sprint sugerido (8 tareas, 3-4 semanas)

| # | Tarea | Días | Entregable demoable |
|---|-------|------|---------------------|
| 1 | Migration Prisma 0004 + seed catálogo Pilot Mínimo (8 cursos) | 1.5 | DB tiene los 8 cursos, las 6 enums, las 5 tablas nuevas. `npm run prisma:studio` los muestra. |
| 2 | Pipeline scripts: parser dual A/B + generate + review + ingest + Zod schema | 2.5 | CLI flow completo: parser detecta formato del outline → genera 1 lección → revisar → ingerir → ver en DB. |
| 3 | Prompt v1 de generación (español LATAM + cosmovisión cristiana) + validación con 1 curso piloto (math-grade-9, 5 lecciones manuales) | 2 | 5 lecciones generadas + revisadas + ingestadas. Calidad mínima aceptable verificada: tono LATAM neutro, sin voseo, cosmovisión cristiana presente sin proselitismo. |
| 4 | Generación masiva: founder corre pipeline para los 8 cursos | (paralelo, 5-7 días wallclock del founder) | ~280 lecciones generadas en `outputs/gen/`. |
| 5 | Lesson player UI: renderer + 4 activities + quiz + integración gamification | 3 | Estudiante puede abrir una lección, hacer actividades, completar quiz, ganar Coin si mastery ≥80%. |
| 6 | Selector de cursos en Parent Copilot + APIs de enrollment | 2 | Padre puede activar/desactivar cursos por hijo desde dashboard. Hijo ve cursos activos en /student. |
| 7 | Catálogo público pre-signup `/[locale]/catalog` + linking desde landing | 1 | Visitor en landing puede ver los 8 cursos con descripción y CTAs a signup. |
| 8 | Tests + Playwright smoke + bulk ingest de todos los cursos curados | 2 | Tests unit pasan (incluyendo parser dual); e2e cubre el happy path; DB tiene los 8 cursos poblados con ~280 lecciones. |

---

## Criterios de aceptación (Definition of Done)

- [ ] `npm run type-check`, `npm run lint`, `npm run test`, `npm run check:edunexo` limpios.
- [ ] Migration 0004 aplicada a dev sin perder data. SQL idempotente verificado re-ejecutándolo.
- [ ] Los 8 cursos del catálogo Pilot Mínimo están en DB con `published = true`.
- [ ] Padre demo logueado puede ir a `/parent/students/[id]`, ver "Catálogo disponible" con los 9 cursos, click en uno abre modal de activación, "Activar para [nombre]" crea `StudentCourseEnrollment` activo.
- [ ] Estudiante logueado va a `/student`, ve cards de cursos activos. Click en una card lleva a vista del curso con próxima lección sugerida.
- [ ] Estudiante completa una lección con quiz score ≥80% → balance Coin del estudiante aumenta por 100.
- [ ] `LessonProgress` se persiste con `masteryPct` y `status`.
- [ ] Fórmulas KaTeX renderizan correctamente en lecciones de Math.
- [ ] Los 4 tipos de actividad (multiple_choice, fill_in_blank, short_answer, step_by_step) renderizan e validan respuestas correctamente.
- [ ] Catálogo público `/[locale]/catalog` accesible sin login, muestra los 8 cursos del Pilot Mínimo.
- [ ] **Tono y cosmovisión verificados en 5 lecciones samples**: lecciones generadas usan español LATAM neutro (sin voseo, sin "vosotros"), referencian cosmovisión cristiana donde es natural sin proselitismo, ningún error doctrinal sectario.
- [ ] **Parser dual A/B funcional**: testeable con 2 outlines de muestra (uno formato A como Sociales Civ Antigua II, uno formato B como Matemática 10), ambos parsean correctamente a la estructura normalizada.
- [ ] Pipeline de generación: corriendo `node scripts/generate-lesson.mjs --course math-ciclo-basico --competency ARG-MATH-CB-01-01 --n 1` produce un JSON válido en `outputs/gen/` que pasa el Zod schema.
- [ ] Pipeline de ingesta: corriendo `node scripts/ingest-lesson.mjs <path>` con un JSON curated inserta correctamente en DB y es idempotente.
- [ ] Cero strings hardcodeados; todas las keys nuevas bajo `student.lessons.*`, `parent.courses.*`, `catalog.*`.
- [ ] Playwright smoke: signup parent → activar 1 curso para hijo → student login → abrir lección → completar quiz → ver Coin.
- [ ] **(Founder track)**: al menos 100 lecciones generadas + revisadas + ingestadas distribuidas en los 9 cursos. No bloquea el DoD del código pero sí el lanzamiento del pilot.

---

## Guardrails (no scope creep, no copia)

- ❌ **NO copies el patrón "asignación manual lección por lección" de Time4Learning** — Midsea activa cursos completos, no lecciones sueltas.
- ❌ **NO copies el catálogo cerrado por grado de Wited** — el padre activa lo que quiere, sin paquetes.
- ❌ **NO implementes function calling de Angela** todavía. Epic 04.5+ o v1.1.
- ❌ **NO implementes drag-and-drop activities** en v1. v1.1.
- ❌ **NO generes imágenes con AI en este epic**. Placeholder con descripción italic.
- ❌ **NO toques** `src/lib/auth/*`, `src/lib/billing/*`, `src/lib/tutor/*`, `src/lib/gamification/engine.ts` core (solo extender via hooks).
- ❌ **NO implementes spaced repetition / IRT**. Epic 06.
- ❌ **NO implementes assessment de calibración** al entrar al curso (Epic 06).
- ❌ **NO publiques al catálogo público lecciones individuales** — solo metadata del curso (descripción, # lecciones, temas). El contenido vive detrás del paywall.
- ❌ **NO instales libraries** fuera de las necesarias: `katex`, `react-katex`. Si dudas, pregunta.

---

## Referencias obligatorias del repo

1. `CLAUDE.md` §7.4 (audiencia HS), §10 (glosario actualizado).
2. `docs/decisions/ADR-003-pivot-to-hs-multi-course-catalog.md` (alcance pilot).
3. `docs/decisions/ADR-005-per-student-course-activation.md` (modelo Course/Competency/Enrollment).
4. `docs/decisions/ADR-006-content-generation-pipeline.md` (arquitectura del pipeline).
5. `docs/DMP-HS-addendum.md` §2.2 (anti-patrones Wited), §6 (los 4 moats).
6. `docs/curriculum/midsea-hs-catalog.md` (los 9 cursos con metadata).
7. `docs/curriculum/temas-grado-materia.md` (outline humano para el pipeline AI).
8. `prisma/schema.prisma` (no editar fuera del scope §1 sin avisar).
9. `src/lib/gamification/engine.ts` (regla mastery ≥80%, integrar via hooks).
10. `src/lib/auth/session.ts` (cómo obtener parent/student activo).
11. `messages/es.json`, `messages/en.json` (estructura existente).

---

## PROMPT (copiar y pegar en Claude Code)

```
Estoy iniciando el Epic 04-HS "Lesson Player + Pipeline de Generación +
Activación de Cursos" de Midsea — el epic más grande del pilot HS Argentina.
Antes de tocar código, ejecuta este protocolo.

PASO -1 — Git workflow.
  `git status` + `git branch`. Si no estás en `feature/epic-04-hs-*`,
  crea `feature/epic-04-hs-lesson-player` desde `develop` (debe tener
  ya merged Epic 02.5). Nunca commits directos a develop/main.

PASO 0 — Lectura mínima.
  CLAUDE.md ya cargado como project memory — NO releeas (está actualizado
  al 2026-05-21).
  Lee SOLO, en orden:
   1. docs/prompts/epic-04-hs-lesson-player-and-content.md (este archivo).
   2. docs/decisions/ADR-003-pivot-to-hs-multi-course-catalog.md.
   3. docs/decisions/ADR-005-per-student-course-activation.md.
   4. docs/decisions/ADR-006-content-generation-pipeline.md.
   5. docs/curriculum/midsea-hs-catalog.md (los 9 cursos).
   6. docs/curriculum/temas-grado-materia.md (outline curricular).
   7. docs/DMP-HS-addendum.md §6 (los 4 moats — no leer el resto salvo
      que lo necesites para una decisión específica).
   8. prisma/schema.prisma (estado actual, NO editar hasta tarea 1).
   9. src/lib/gamification/engine.ts (regla mastery, NO modificar).
   10. src/app/[locale]/student/lessons/[slug]/page.tsx (placeholder actual).
   11. src/lib/auth/session.ts (cómo obtener parent/student activo).
   12. messages/es.json (estructura de keys).
   13. package.json (deps actuales).
  NO leas: PRD completo (el pivot ya está consolidado en §1.4 actualizado),
  AI_TUTOR_SPEC §5+, src/lib/billing/*, src/lib/tutor/* (Epic 02+02.5
  cerrados), src/components/parent/billing/* (Epic 03 cerrado).
  Confirma lectura.

PASO 1 — Plan de implementación (máx 30 líneas).
  Devuélveme:
   (a) Las 8 tareas en orden con archivos a crear/tocar.
   (b) Dependencias npm nuevas: `katex`, `react-katex`. Confirma si ya
       están o si las instalás.
   (c) La migration Prisma 0004 (resumen de tablas + enums). Espera mi
       OK antes de aplicar.
   (d) Ambigüedades.
  Espera "ok, ejecuta" antes de tocar código.

PASO 2 — Ejecución por tarea (8 tareas, una a la vez).
  Para cada tarea:
   (a) Crea/edita archivos (máx 7 archivos por tarea sin avisar).
   (b) Corre type-check, lint, check-edunexo, tests relevantes.
   (c) Para tarea 1: aplicá migration a dev y verifica.
   (d) Para tareas 5-6: smoke manual del flujo afectado.
   (e) Reporta máx 12 líneas: archivos tocados, criterios cubiertos,
       pendientes para próxima tarea.
   (f) Pídeme "siguiente tarea?" antes de continuar.

PASO 3 — Cierre del epic.
  Tras tarea 8 (y mi confirmación de que el bulk de contenido está
  ingestado), checklist completa de Definition of Done con [✓]/[✗]/[⚠].
  Pendientes documentados en sección nueva "## Pendientes para Epic 05"
  al final de este archivo.

PASO 4 — Push y entrega.
  Commits atómicos por tarea, mensajes convencionales:
  `feat(catalog): prisma migration 0004 + seed catalog`,
  `feat(content): generation pipeline scripts + Zod schema`,
  `feat(content): generator prompt v1 + math-ciclo-basico pilot`,
  `feat(learning): lesson player renderer + activities + quiz`,
  `feat(parent): course activation dialog and APIs`,
  `feat(public): public catalog page pre-signup`,
  `test(epic-04): playwright smoke and unit tests`,
  `chore(content): bulk ingest of curated lessons`.
  `git push -u origin feature/epic-04-hs-lesson-player` y avisa para PR
  a develop.

REGLAS DE INTERACCIÓN:
- Si algo es ambiguo, pregunta en vez de asumir.
- EFICIENCIA DE TOKENS: no releas archivos ya leídos. Reportes ≤12 líneas
  por tarea.
- ANTI-COPIA:
   · NO copies asignación manual lección por lección (Time4Learning).
   · NO copies paquete cerrado por grado (Wited).
   · NO copies gamificación cosmética (Miacademy).
- Nunca toques sin preguntar: src/lib/auth/*, src/lib/billing/*,
  src/lib/tutor/*, src/lib/gamification/engine.ts core (solo extender
  via hooks), src/lib/i18n/config.ts.
- Mobile-first siempre. Tablet primary para estudiante.
- i18n: cero strings hardcodeados. Keys nuevas bajo `student.lessons.*`,
  `parent.courses.*`, `catalog.*`.
- a11y: lesson player navegable por teclado, KaTeX con aria-labels,
  quiz con focus management entre preguntas.
- VAPOR PROHIBIDO: NO crees MasteryMap con datos fake. Solo se llena
  cuando hay LessonProgress real. NO dispares assessment IRT — Epic 06.
- PIPELINE: el founder corre la generación en paralelo a tus tareas
  3-8. Cuando llegues a tarea 8 (bulk ingest), confirmá que hay JSONs
  curated en outputs/curated/ antes de proceder.

Empieza por PASO -1 ahora.
```

---

## Pendientes para Epic 05 (placeholder)

A llenar al cierre del epic. Antemano se anticipan:
- Tienda Coin con productos premium + parent approval (Epic 05).
- Coin packs comprables vía Stripe (Epic 05).
- CurriculumContextEngine real-time con awareness de lección activa (Epic 05.5 o v1.1).
- Reportes regulatorios para Argentina + diáspora (v1.1).
- Imágenes generadas para Geometry/Ciencias (v1.1 con review).
- Spaced repetition / IRT (Epic 06).

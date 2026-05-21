# ADR-006 — Pipeline de generación de contenido: outline humano → AI → revisión humana → ingesta

| Campo | Valor |
|---|---|
| **Estado** | Aceptado |
| **Fecha** | 2026-05-21 |
| **Decisores** | Founder / Product Lead (Omar) |
| **Relacionado con** | ADR-003 (alcance pilot HS), ADR-005 (modelo Course/Lesson/Competency) |
| **Bloquea** | Epic 04-HS (Lesson Player + Pipeline + Activación) |

## Contexto

El pilot HS (9°-12°) requiere generar ~24 cursos con ~15-25 lecciones cada uno, ~400-500 lecciones totales en 10-11 semanas. El founder tiene:

- **Outlines curriculares por grado por materia** ya construidos: temas, módulos, actividades hands-on indicadas. Esto es la curaduría pedagógica humana, hecha por alguien que sabe qué tiene que aprender un estudiante HS argentino.
- **Material de referencia en Google Drive** en 6 carpetas (una por materia: Matemáticas, Lengua/Español, Inglés ESL, Sociales, Ciencias, Música). Formato actual presumido: Word/PDF/Google Docs según última audit del usuario.

Lo que NO existe:
- Lecciones individuales escritas en formato Midsea (markdown + actividades estructuradas + quiz + metadata de competencia).
- Quizzes con pregunta + opciones + respuesta correcta + explicación.
- Validación pedagógica formal externa (no hay educador en el equipo dedicado a review).

La pregunta arquitectónica: ¿cómo va el material existente a lecciones de Midsea con calidad pedagógica defendible en pilot, sin tomar más de 4-5 semanas, sin presupuesto para contratar educadores?

## Decisión

### 1. Arquitectura del pipeline: cuatro etapas

```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ ETAPA 1         │   │ ETAPA 2         │   │ ETAPA 3         │   │ ETAPA 4         │
│ Outline humano  │   │ Generación AI   │   │ Review humano   │   │ Ingesta al      │
│ (pre-existente) │ → │ (GPT-4o)        │ → │ (founder)       │ → │ lesson player   │
│                 │   │                 │   │                 │   │ (Prisma seed)   │
└─────────────────┘   └─────────────────┘   └─────────────────┘   └─────────────────┘
       ↓                      ↓                     ↓                      ↓
  Google Drive            Stage area en       Markdown editado en      Lesson rows
  + temas-grado.md        outputs/gen/        outputs/curated/         + Competency
                          como JSON           idem JSON                + LessonCompetency
                                                                       + quiz JSON
```

### 2. Etapa 1 — Outline humano (insumo, ya existe)

**Fuente**: el material en Google Drive + un documento maestro `docs/curriculum/temas-grado-materia.md` que va a vivir en el repo y que articula:

- Para cada combinación (grado, materia): lista ordenada de **módulos** (temas grandes).
- Para cada módulo: lista de **competencias** (verbos demostrables: "Resuelve ecuaciones cuadráticas por factorización", "Identifica el sujeto y predicado en oraciones compuestas").
- Para cada competencia: **actividad hands-on sugerida** (1-3 actividades), nivel de dificultad, conocimientos previos requeridos.

**Realidad post-audit del corpus (2026-05-21)**: el founder NO mantiene un archivo de outline canónico unificado. En cambio tiene **65 outlines individuales en `docs/content/source/`** (12 grados × 6 materias). El archivo `docs/curriculum/temas-grado-materia.md` que sí existe es un **índice canónico** que mapea cada outline a un curso del catálogo, NO una transcripción del contenido.

**Dos formatos coexistentes en el corpus** (el parser debe soportar ambos):

### Formato A — "Primaria-style con Producto del estudiante"

Aplicado por: toda Primaria, Sociales HS, Música HS, Inglés ESL todos los niveles (con variante "Semana tipo 4 días").

```markdown
# Materia – <Grado>

[Metadata: calendario Marzo-Diciembre, frecuencia, enfoque, base curricular]

## MES – <Título de unidad/tema>

Contenidos: <lista breve>

### Actividades Hands-On

- Actividad 1
- Actividad 2
- ...

Producto del estudiante: <entregable>
```

Variante de Inglés ESL agrega "Semana tipo (4 días)" con Día 1-4 incluyendo "reflexión cristiana" o "valores cristianos" en Día 4.

### Formato B — "HS-denso con 2 temas/mes"

Aplicado por: Lengua HS, Matemática HS, Ciencias HS.

```markdown
Materia – <Grados>
Planificación Anual Completa con Actividades Hands-On
Marzo–Diciembre (Argentina)
==========================================

Duración: 10 meses | Frecuencia: 4 días por semana – 4 horas diarias
Enfoque cristiano, <adjetivo>, <adjetivo>.

## MES

### Tema: <Tema 1 del mes>

Actividades Hands-On:
- Actividad 1
- Actividad 2
- Actividad 3
- Actividad 4

### Tema: <Tema 2 del mes>

Actividades Hands-On:
- Actividad 1
- ...
```

**Sin "Producto del estudiante"** explícito. 2 temas por mes. Carga horaria mayor (4 hs/día).

### Detección automática del formato

El parser (`scripts/parsers/outline-parser.mjs`) detecta el formato vía heurística simple:

```javascript
function detectFormat(markdown) {
  if (/Producto del estudiante:/i.test(markdown)) return 'A';
  if (/^## .+\n\n### Tema:/m.test(markdown) && !/Producto del estudiante:/i.test(markdown)) return 'B';
  return 'A'; // default si ambiguo
}
```

### Salida normalizada del parser

Ambos formatos se normalizan a la misma estructura:

```typescript
type ParsedOutline = {
  courseSlug: string;
  metadata: { gradeBand, frecuencia, enfoque, baseCurricular };
  months: Array<{
    monthName: string; // "Marzo", "Abril", ...
    monthIndex: number; // 1-10
    topics: Array<{
      title: string;
      contents?: string;       // del Formato A
      handsOn: string[];
      product?: string;        // solo del Formato A
      christianFocus?: boolean; // detectado por keywords
    }>
  }>
};
```

El generador (`scripts/generate-lesson.mjs`) consume esta estructura normalizada — el formato del outline original es transparente al prompt.

**El founder mantiene los outlines en sus `.docx` originales (con copia .md vía pandoc) en `docs/content/source/`.** El pipeline lee los .md.

### 3. Etapa 2 — Generación AI (script automatizable)

**Tecnología**: OpenAI SDK con `gpt-4o` (no `gpt-4o-mini` — para generación de contenido pedagógico HS importa la calidad, el costo por lección es ~$0.05-0.10 vs $0.005 de mini; con 500 lecciones eso son $25-50 totales, manejable).

**Script**: `scripts/generate-lesson.mjs` que toma:
- `--course <slug>` (ej. `math-ciclo-basico`)
- `--competency <code>` (ej. `ARG-MATH-CB-01-01`)
- `--lesson-of-competency <n>` (ej. `1` si la competencia se cubre en 3 lecciones)

Y genera:
- Lección en JSON estructurado:
  ```json
  {
    "competencyCode": "ARG-MATH-CB-01-01",
    "courseSlug": "math-ciclo-basico",
    "titleEs": "Suma y resta de fracciones con denominador distinto",
    "titleEn": "Adding and subtracting fractions with different denominators",
    "estMinutes": 8,
    "summaryEs": "...",
    "contentMarkdownEs": "...",
    "contentMarkdownEn": "...",
    "activities": [
      {
        "type": "multiple_choice",
        "promptEs": "...",
        "options": ["...", "...", "...", "..."],
        "correctIndex": 2,
        "explanationEs": "..."
      },
      { "type": "fill_in_blank", "..." },
      { "type": "step_by_step", "..." }
    ],
    "quiz": {
      "questions": [
        { "type": "multiple_choice", "..." },
        { "type": "short_answer", "..." },
        ...
      ]
    },
    "handsOnSuggestion": "Cortar una pizza real en 8 partes y combinar fracciones con tus padres.",
    "metadata": {
      "model": "gpt-4o",
      "promptVersion": "v2.1",
      "generatedAt": "2026-05-21T14:23:00Z",
      "tokensUsed": 3421
    }
  }
  ```
- Output en `outputs/gen/<course-slug>/<competency-code>-<n>.json`. Esta carpeta NO se commitea al repo (`.gitignore`) — son borradores.

**Prompt estructurado** (vive en `scripts/prompts/lesson-generator-v1.md` con versioning, para evitar drift entre lotes):

```
Eres Angela, una educadora hispanohablante especializada en homeschool
cristiano para adolescentes de secundaria de toda Latinoamérica.

Vas a redactar UNA lección de Midsea con base en:
- Curso: {courseTitleEs}
- Tema: {topicTitle} (del mes {monthName})
- Esta lección es la {n}/{total} que cubre el tema.
- Actividades hands-on sugeridas por el currículo: {handsOnList}
- Producto del estudiante esperado (si formato A): {product}
- Enfoque del outline: {christianFocusDeclaration} (ej. "cristiano, analítico y aplicado")

REGLAS DE TONO (CRÍTICAS — verificables):
1. **ESPAÑOL LATAM NEUTRO**. Usa "tú" como segunda persona singular,
   nunca "vos" (Argentina/UY/etc.) ni "vosotros" (España).
   Verbos: "puedes", "tienes", "estás", "haces" — NO "podés/tenés/estás/hacés"
   ni "podéis/tenéis/estáis/hacéis".
   Vocabulario universal hispanohablante. CERO localismos rioplatenses
   ("che", "boludo", "fijate"), peninsulares ("tío", "vale", "guay"),
   mexicanos ("güey", "chido"), colombianos ("parce", "bacano"), etc.
   Cuando referencies cultura, usa amplitud LATAM:
   literatura — Borges, García Márquez, Vargas Llosa, Octavio Paz, Allende, Bolaño, etc.
   historia — figuras y eventos de toda LATAM, no solo un país.

2. **TONO ACADÉMICO-RESPETUOSO AL ADOLESCENTE**. No infantil, no condescendiente.
   "De igual a igual con respeto", como mentor cercano.

3. **COSMOVISIÓN CRISTIANA DENOMINACIONALMENTE ABIERTA (ADR-007)**.
   Angela tiene cosmovisión cristiana coherente. Puede referenciar valores
   cristianos cuando son naturales al contexto académico (ej. en Lengua, citar
   una parábola como ejemplo narrativo; en Historia, destacar rol del cristianismo;
   en Ciencia, presentar tensiones fe-ciencia con respeto). NUNCA proselita,
   NUNCA presiona conversión, NUNCA emite declaración doctrinal sectaria
   (católica-only o evangélica-only). Si el outline declara "Enfoque cristiano,
   analítico y aplicado" o similar, incluye reflexión espiritual sutil donde es
   natural (NO forzado). Si el outline tiene "Reflexión fe y ciencia" o
   "Cierre bíblico" como actividad hands-on, redacta esa sección con respeto
   denominacionalmente abierto.

REGLAS DE CONTENIDO:
4. 6-10 minutos de duración (~600-900 palabras de contenido + actividades).
5. 3 actividades intercaladas en el contenido (no al final).
6. Quiz final de 4-5 preguntas mezclando tipos.
7. Una "actividad hands-on" extra al final conectada al mundo físico
   (toma de las sugeridas en el outline o derivada).
8. Bilingüe: redacta la lección en ES LATAM neutro primero; el campo EN
   es traducción cultural, no literal.
9. JSON estricto según schema, sin texto fuera del JSON.

FORMATO MARKDOWN:
- Headers ## y ###.
- KaTeX inline para fórmulas: `$x^2 + 2x + 1$`.
- Bloques de código para programación: ```python ... ```
- Imágenes: incluye placeholder `{{IMAGE: descripción}}` que la etapa 3 reemplaza.
- Listas y tablas markdown standard.
- Para chain-of-thought en Math/Ciencias: usa `### Paso N` para cada paso del razonamiento.
```

Throughput esperado:
- 1 lección generada: ~30-60 segundos de wallclock GPT-4o.
- 1 sesión de trabajo de 2-3h del founder: ~30-50 lecciones generadas en background.
- 500 lecciones totales: ~15-20 horas de tiempo de generación, ejecutable en lotes overnight.

### 4. Etapa 3 — Review humano

**El founder revisa cada JSON generado.** Tiempo estimado: 5-10 min por lección, dependiendo de calidad del primer pass.

Herramientas mínimas para este paso:
- `scripts/review-lesson.mjs <path>`: opens an interactive CLI que muestra la lección en formato legible (markdown renderizado en terminal), permite editar inline en un editor preferido, y guarda en `outputs/curated/`.
- Alternativa low-tech: el founder abre el JSON en VSCode, edita a mano, y mueve a `outputs/curated/`.

**Checklist de review (impreso al editar)**:
- [ ] El contenido es **correcto** (no hay errores conceptuales ni de hechos).
- [ ] El tono es respetuoso al adolescente argentino, no infantil.
- [ ] Las 3 actividades intercaladas son **demostrables** (no son adornos; obligan al estudiante a pensar).
- [ ] El quiz tiene **respuestas correctas inequívocas** (no ambigüedad entre dos opciones).
- [ ] La actividad hands-on es **realista** (no requiere material costoso ni inaccesible).
- [ ] Las fórmulas KaTeX **renderizan bien** (mental check del LaTeX).
- [ ] Las imágenes placeholder están **marcadas** con descripción suficiente para generar/conseguir después.
- [ ] La traducción EN es **culturalmente correcta** (no calque literal).

**~280 lecciones × 7 min promedio = ~33 horas de review** (post-audit del Pilot Mínimo de 8 cursos, 2026-05-21). Esto es ~4-5 días full-time dedicado, manejable en la ventana del Epic 04. Si el alcance crece (rolling release de los 14 cursos restantes post-pilot), el review se hace en lotes en las 6-8 semanas siguientes al lanzamiento.

**Mitigación**: priorizar review por **uso esperado en el pilot**. Las lecciones de la primera mitad de cada curso son más importantes que las del final — los estudiantes piloto van a tocar las iniciales en sus primeras 4 semanas. Lecciones del segundo tercio pueden tener review más rápida o ser refinadas en hot-fix mode si llegan a usarse.

### 5. Etapa 4 — Ingesta al lesson player

**Script**: `scripts/ingest-lesson.mjs <path-to-curated-json>` que:
- Valida el JSON contra el schema Zod (`src/lib/schemas/lesson-ingest.ts`).
- Verifica que la `competencyCode` existe en la DB; si no, error.
- Verifica que el `courseSlug` existe; si no, error.
- Inserta `Lesson` + `LessonCompetency` rows. Si la lección ya existe (por `slug = competencyCode-n`), hace UPDATE (idempotente).
- Inserta los quiz items en una tabla `QuizQuestion` (nueva, ver Epic 04).
- Loguea el ingest a `prisma/seed-log.md` para trazabilidad.

**Ingesta en bulk**: `scripts/ingest-course.mjs <course-slug>` corre el ingest sobre todos los JSON en `outputs/curated/<course-slug>/`.

### 6. Imágenes y media

**Decisión consciente: v1 sin imágenes generadas por AI.** Razones: imágenes con DALL-E/Midjourney añaden costo + revisión + riesgo de errores conceptuales (diagrama matemático mal). En su lugar:

- **Placeholder `{{IMAGE: descripción}}`** se preserva en el contenido markdown.
- En el lesson player, renderiza como una caja con la descripción en italic — el estudiante la lee y entiende qué imagen iría ahí.
- Post-pilot: el founder agrega imágenes reales lección por lección priorizando las que más se necesitan (Geometry > Lengua, por ejemplo).
- Para Matemáticas: KaTeX cubre todas las fórmulas; los diagramas geométricos sí necesitan imágenes y son la prioridad #1.

**Diagramas geométricos**: opción rápida que sí es factible — generar SVG con código (GPT-4o sabe generar SVG de geometría básica). Se discute en Epic 04 si vale la pena el complexity adicional.

### 7. Versionado y trazabilidad

- Cada JSON en `outputs/curated/` lleva `metadata.promptVersion` + `metadata.reviewedAt` + `metadata.reviewedBy`.
- El seed log en `prisma/seed-log.md` registra cada ingest con timestamp, lesson slug, hash del contenido.
- Si un prompt nuevo se introduce (v2.2, v2.3), las lecciones anteriores NO se regeneran automáticamente — el founder decide cuáles vale la pena re-generar.

### 8. Calidad mínima aceptable para el pilot

**No hay educador externo en el equipo para validación pedagógica formal antes del pilot.** Mitigación realista:

- El founder es la primera línea de review (etapa 3) y debe ser estricto.
- En las primeras 2 semanas del pilot, se invitan a **2-3 padres piloto a hacer "review de calidad"** de los cursos que su hijo va a tomar. Cualquier feedback es input directo.
- Lecciones marcadas como "necesita rework" entran a un backlog `outputs/curated/rework.md`.
- **No se promete acreditación** ni equivalencia formal en pilot. Disclaimer claro: "Pilot académico de Midsea — contenido revisado por el equipo fundador, no acreditado todavía."

### 9. Lo que NO entra en v1

- Generación automática de imágenes (postponed a v1.1).
- Validación automática de quiz answers con LLM (las respuestas vienen del generation; la validación es solo del schema).
- A/B testing de versiones de una misma lección.
- Adaptación dinámica de dificultad (Epic 06 IRT).
- Auto-translation de cualquier campo (la traducción EN es generada en el mismo paso que ES, no después).

## Consecuencias

**Positivas.**
- Pipeline factible para una persona full-time en 4-5 semanas.
- Curaduría humana al principio + final (outline + review) preserva calidad pedagógica.
- Costo de generación GPT-4o ($25-50 totales) es despreciable.
- Versionado de prompts permite iterar rápido sin perder trazabilidad.
- Si un padre piloto reporta un error en lección X, regenerar X solo es ~$0.10 y 60 segundos.

**Negativas.**
- 58 horas de review humano sigue siendo el bottleneck real. Mitigación: priorización + rework as we go.
- Calidad de lecciones generadas en materias humanísticas (Lengua, Historia) puede ser inferior a STEM. Mitigación: review más estricto en esas materias + samples de Drive como contexto rico.
- Sin imágenes, lecciones de Geometry y Ciencias se ven crudas. Mitigación: placeholder claro + sprint dedicado a imágenes post-pilot.
- Pilot lanza con disclaimer de "no acreditado todavía". Riesgo de pérdida de familias que esperan transcript oficial. Mitigación: copy honesto en signup + path a v2 con WASC/Cognia mencionado.

## Alternativas descartadas

| Alternativa | Razón |
|---|---|
| Contratar educadores hispanos para escribir 500 lecciones | Tiempo (3-6 meses) + presupuesto ($5K-15K). No es el plan. |
| Ingestar PDFs/Word directamente como lección (sin generación) | El formato actual no es estructurado para lesson player. Generar es más limpio. |
| Usar `gpt-4o-mini` para reducir costo | Calidad insuficiente para HS argentino. El ahorro ($45) no justifica el riesgo de churn. |
| Generar todo en bulk una vez, sin iteración de prompts | El primer prompt nunca es el mejor. Versionado permite mejorar. |
| Skip review humano, ingestar generado directo | Garantiza errores conceptuales que matan trust. Inaceptable. |

## Referencias cruzadas

- `ADR-003-pivot-to-hs-multi-course-catalog.md` (alcance del catálogo).
- `ADR-005-per-student-course-activation.md` (modelo Course/Lesson/Competency).
- `docs/curriculum/temas-grado-materia.md` (a crear — outline humano source of truth).
- Epic 04-HS (implementa el pipeline completo).

---

*Revisar este ADR cuando: (a) el pilot arroje feedback sobre errores conceptuales en lecciones, (b) decidamos agregar imágenes generadas a escala, (c) contratemos educador para review pedagógica formal, (d) consideremos publicar el catálogo a marketplaces externos.*

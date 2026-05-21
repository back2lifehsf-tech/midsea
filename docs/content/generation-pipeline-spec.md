# Pipeline de Generación de Contenido — Spec operacional

> Acompañante operacional del `ADR-006-content-generation-pipeline.md`. Mientras el ADR describe la arquitectura, este documento es **el manual para el founder** sobre cómo ejecutarlo paso a paso, qué outputs esperar, cómo iterar el prompt, y qué hacer cuando algo sale mal.

---

## 0. Pre-requisitos antes de generar la primera lección

### 0.1 Outline curricular humano

Antes de generar nada, debe existir `docs/curriculum/temas-grado-materia.md` con la estructura curricular validada por el founder. Este archivo es **fuente de verdad pedagógica**.

Formato canónico ya documentado en ADR-006 §2:

```markdown
# Matemáticas — Ciclo Básico (9°-10°)

## Módulo 1: Operaciones con números reales

### Competencia ARG-MATH-CB-01-01: Opera con números racionales

**Actividades hands-on:**
- Resolver problemas de reparto proporcional con bloques físicos o monedas.
- Construir una recta numérica gigante en el piso con cinta de papel y ubicar racionales.

**Prerequisites:** ninguna (entry-level del ciclo).
**Difficulty:** básica.
**Lecciones estimadas:** 3-4.
```

**Status actual (2026-05-21)**: este archivo NO existe todavía. Crearlo es el primer paso del Epic 04 tarea 0 (o el founder lo hace fuera del repo y se commite cuando esté listo). Se nutre del material en Google Drive + curaduría del founder + (cuando esté conectado el MCP de Drive) revisión asistida.

### 0.2 Material de referencia en Google Drive

Las 6 carpetas compartidas con el connector de Drive (cuando se conecte):
1. Inglés ESL
2. Español (Lengua)
3. Matemáticas
4. Ciencias
5. Sociales (Historia)
6. Música (electiva)

**Cómo se usa**: el prompt de generación recibe como contexto la **referencia textual** de los documentos relevantes a la competencia que se está generando. NO se inyectan los PDFs/Word completos (overhead de tokens y ruido). Se hace cherry-pick por temática.

### 0.3 Variables de entorno

En `.env.local`:

```bash
OPENAI_API_KEY=sk-...              # (ya existe del Epic 02)
OPENAI_MODEL_GENERATION=gpt-4o     # nuevo: para generación pedagógica
OPENAI_MODEL=gpt-4o-mini           # ya existe, sigue para chat de Angela
```

---

## 1. Comando: generar una lección individual

```bash
node scripts/generate-lesson.mjs \
  --course math-ciclo-basico \
  --competency ARG-MATH-CB-01-01 \
  --n 1
```

**Qué hace**:
1. Lee `docs/curriculum/temas-grado-materia.md` y busca la competencia `ARG-MATH-CB-01-01`.
2. Lee la metadata del curso `math-ciclo-basico` desde `docs/curriculum/midsea-hs-catalog.md`.
3. (Opcional, si Drive conectado) busca documentos relevantes en la carpeta Matemáticas que cubran el tema.
4. Construye el prompt según `scripts/prompts/lesson-generator-v1.md` con substituciones.
5. Llama a OpenAI con `gpt-4o`.
6. Parsea el JSON devuelto en el code fence.
7. Valida contra `src/lib/schemas/lesson-ingest.ts` (Zod).
8. Escribe a `outputs/gen/math-ciclo-basico/ARG-MATH-CB-01-01-1.json`.

**Tiempo wallclock**: 30-90 segundos por lección.

**Costo**: ~$0.05-0.10 por lección.

**Output esperado** (formato JSON, ver schema en ADR-006 §3):
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
  "activities": [ ... ],
  "quiz": { ... },
  "handsOnSuggestion": "Cortar una pizza real en 8 partes...",
  "metadata": { ... }
}
```

---

## 2. Comando: generar todas las lecciones de un curso (bulk)

```bash
node scripts/generate-course.mjs --course math-ciclo-basico
```

**Qué hace**:
1. Lee todas las competencias del curso `math-ciclo-basico` del outline.
2. Para cada competencia, calcula cuántas lecciones generar (campo `Lecciones estimadas: N` del outline).
3. Loopea: para cada `(competency, n)` no presente en `outputs/gen/`, llama a `generate-lesson.mjs`.
4. Skip de lecciones ya generadas (idempotente — si re-corres, no duplica).
5. Logueá progreso con throttle (10 req/min para no superar rate limits de OpenAI gpt-4o).
6. Output total: 25-30 archivos JSON para Matemáticas Ciclo Básico.

**Tiempo wallclock**: 30-60 min para un curso entero.

**Costo**: $1.25-3.00 por curso. Total para 9 cursos: ~$12-25.

---

## 3. Comando: revisar una lección generada

```bash
node scripts/review-lesson.mjs outputs/gen/math-ciclo-basico/ARG-MATH-CB-01-01-1.json
```

**Qué hace**:
1. Renderiza la lección en formato legible en la terminal (markdown rendered, KaTeX as code, actividades como JSON pretty-printed).
2. Imprime el checklist de review (ADR-006 §4).
3. Espera input del founder:
   - `[a] Approve` → mueve a `outputs/curated/math-ciclo-basico/ARG-MATH-CB-01-01-1.json` + setea `metadata.reviewedAt` y `metadata.reviewedBy`.
   - `[e] Edit` → abre el archivo en `$EDITOR` (default: code, vim, nano), espera close, valida nuevamente con Zod, mueve a curated/.
   - `[r] Reject` → mueve a `outputs/rejected/...json` con un comentario en `outputs/rejected/log.md`.
   - `[s] Skip` → deja en gen/ sin tocar.

**Alternativa low-tech**: el founder puede directamente abrir el JSON en VSCode, editarlo a mano, y mover el archivo de `outputs/gen/` a `outputs/curated/` (mismo path estructura). El script `ingest-lesson.mjs` no se entera si pasaste por `review-lesson` o no.

**Tiempo wallclock**: 5-10 minutos por lección dependiendo de calidad del primer pass.

---

## 4. Comando: ingestar lecciones curadas a DB

```bash
# Una lección individual
node scripts/ingest-lesson.mjs outputs/curated/math-ciclo-basico/ARG-MATH-CB-01-01-1.json

# Un curso entero (bulk)
node scripts/ingest-course.mjs --course math-ciclo-basico
```

**Qué hace `ingest-lesson`**:
1. Lee el JSON.
2. Valida contra Zod.
3. Conecta a DB (DATABASE_URL del `.env.local` — el founder es responsable de que apunte al ambiente correcto).
4. Verifica que `competencyCode` existe en DB; si no, error con sugerencia de correr seed-catalog primero.
5. Verifica que `courseSlug` existe; si no, error.
6. Upsert de `Lesson` (idempotente por slug `<competencyCode>-<n>`).
7. Upsert de `LessonCompetency` join row.
8. Upsert de `QuizQuestion` rows del quiz.
9. Loguea a `prisma/seed-log.md` con hash del JSON.

**Qué hace `ingest-course`**: lo mismo en loop sobre todos los `outputs/curated/<course-slug>/*.json`.

**Idempotencia**: re-correr no duplica filas, actualiza si el JSON cambió (compara hash).

**Tiempo**: ~1-2 segundos por lección ingestada.

---

## 5. Workflow recomendado para el founder

### Día 1-2 (de la generación):
- Corre `generate-course.mjs --course math-ciclo-basico` (genera ~28 lecciones overnight).
- Mientras corre, prepara el outline para los próximos 2 cursos en `temas-grado-materia.md`.

### Día 3-5:
- Review intensivo del primer curso (5-10 min × 28 = 2-5 horas distribuidas).
- Encuentra patrones de errores comunes (ej. "Angela está siendo demasiado formal con voseo").
- Actualiza `lesson-generator-v1.md` → `v2.md` con correcciones.
- Re-genera lecciones específicas con problemas con el prompt nuevo (`--force-regenerate` flag opcional).

### Día 6-7:
- Ingesta el primer curso a DB.
- Verifica visualmente en `/student/lessons/[slug]` que el render funciona.
- Repite el ciclo con el segundo curso (Lengua Ciclo Básico).

### Día 8-21:
- Generación + review + ingesta de los 7 cursos restantes en paralelo al desarrollo del lesson player UI (Epic 04 tareas 5-7).

### Día 22 en adelante:
- Hot-fix loop: cuando un padre piloto reporta un error en una lección, regenerar esa lección sola toma ~2 min + 1 min de review + 1 min de re-ingesta. Total 4-5 min.

---

## 6. Estructura de directorios del pipeline

```
midsea/
├── docs/
│   ├── curriculum/
│   │   ├── midsea-hs-catalog.md         # 9 cursos del pilot
│   │   ├── store-catalog.md             # 12 productos premium
│   │   └── temas-grado-materia.md       # OUTLINE curricular humano (a crear)
│   └── content/
│       └── generation-pipeline-spec.md  # ESTE ARCHIVO
├── scripts/
│   ├── prompts/
│   │   ├── lesson-generator-v1.md       # prompt versionado
│   │   └── lesson-generator-v2.md       # versions futuras
│   ├── generate-lesson.mjs              # 1 lección
│   ├── generate-course.mjs              # curso entero
│   ├── review-lesson.mjs                # CLI de review
│   ├── ingest-lesson.mjs                # 1 lección a DB
│   └── ingest-course.mjs                # curso entero a DB
└── outputs/                             # GITIGNORED
    ├── gen/                             # lecciones generadas, pre-review
    │   ├── math-ciclo-basico/
    │   │   ├── ARG-MATH-CB-01-01-1.json
    │   │   ├── ARG-MATH-CB-01-01-2.json
    │   │   └── ...
    │   └── ...
    ├── curated/                         # lecciones revisadas y aprobadas
    │   ├── math-ciclo-basico/
    │   │   └── ...
    │   └── ...
    └── rejected/                        # lecciones que el founder rechazó
        ├── log.md
        └── math-ciclo-basico/
            └── ...
```

**Gitignore additions** (agregar al `.gitignore`):
```
outputs/gen/
outputs/curated/
outputs/rejected/
```

(Los JSONs no se commitean — la DB es la fuente de verdad después de ingesta.)

---

## 7. Iteración del prompt

El prompt `scripts/prompts/lesson-generator-v1.md` es **el secreto del producto**. Iteramos sobre él como código:

- **v1.0**: prompt inicial, basado en ADR-006 §3.
- **v1.1 - v1.N**: cambios menores (mejor especificación de tono, ejemplos few-shot agregados, etc.).
- **v2.0**: rewrite mayor (ej. agregar instrucción de KaTeX más estricta).

Cada lección generada lleva `metadata.promptVersion` = "v1.0", "v1.1", etc. Cuando se hace un cambio de prompt, las lecciones existentes NO se regeneran automáticamente; el founder decide si vale la pena re-generar las primeras N.

**Reglas para iterar**:
1. Si una sola lección sale mal, edítala a mano. NO cambies el prompt.
2. Si 3+ lecciones de la misma materia tienen el mismo problema, cambia el prompt.
3. Documenta cada cambio del prompt con un commit message claro: `prompt(v1.2): add explicit voseo argentino examples`.
4. Bump de versión major (v2.0) requiere review de "¿qué pasa con las lecciones v1.x?". Decisión consciente.

---

## 8. Calidad mínima aceptable

Marker rojo: regenerar la lección
- Error conceptual (un teorema mal enunciado, una fecha histórica equivocada).
- Tono claramente infantil o claramente robótico.
- Quiz con respuesta ambigua (dos opciones técnicamente correctas).
- Actividad imposible de hacer (requiere material costoso o digital específico).
- Traducción EN literal mal hecha ("Verduras de estación" → "vegetables of station").

Marker amarillo: aprobar con edición menor
- Frase rara pero no incorrecta.
- Actividad cumplible pero un poco débil.
- Una fórmula KaTeX que no renderiza idealmente.

Marker verde: aprobar tal cual
- Tono correcto, contenido correcto, actividades demandantes, quiz inequívoco.

**Política de pilot**: aspirar a 60% verde, 30% amarillo (editado), 10% rojo (regenerado). Si rojo > 20% para un curso, el prompt necesita iteración antes de seguir.

---

## 9. Limitaciones reconocidas del pipeline v1

- **Sin validación pedagógica externa**: el founder es la primera y última línea. Mitigación: invitar 2-3 padres piloto a hacer "review de calidad" en primeras 2 semanas del pilot.
- **Sin imágenes generadas**: placeholders renderizan como caja con descripción italic. El estudiante mentalmente "imagina" lo que iría. Geometry y Ciencias afectadas. Sprint dedicado a imágenes post-pilot.
- **Sin testing automatizado del contenido pedagógico**: solo el schema Zod. No hay manera de detectar "este teorema está mal" sin un humano. Mitigación: el feedback de padres piloto se vuelve test cases.
- **Calidad inferior esperada en humanidades vs STEM**: GPT-4o es excelente con math procedural, bueno con LA estructural, débil con sutilezas culturales. Mitigación: review más estricto en Lengua, Historia, Música.
- **Limited a contenido textual + KaTeX**: diagramas geométricos, gráficos de funciones, animaciones físicas: punteados. v1.1 explora SVG generado con código.

---

## 10. Métricas del pipeline (a trackear durante generación)

Mantener una tabla viva en `outputs/pipeline-metrics.md`:

| Curso | Total competencias | Lecciones generadas | Reviewed | Curated | Ingested | Tiempo total (h) | Costo OpenAI ($) |
|---|---|---|---|---|---|---|---|
| math-ciclo-basico | 12 | 28 | 28 | 26 (2 regenerated) | 26 | 6.5 | $2.40 |
| language-ciclo-basico | ... | | | | | | |
| ... | | | | | | | |

Permite calibrar realismo del plan y detectar cursos problemáticos.

---

*Última actualización: 2026-05-21. Actualizar después de generar el primer curso con datos reales de tiempo + costo + calidad.*

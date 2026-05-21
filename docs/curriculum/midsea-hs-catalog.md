# Catálogo HS Midsea — Pilot Mínimo (8 cursos)

> Source of truth del catálogo del pilot HS Argentina. **Reescrito 2026-05-21 tras audit del contenido real**.
>
> Decisión scope: **Pilot Mínimo de 8 cursos cubriendo grados 9-10 en las 6 materias core**. Razón: el catálogo HS completo son 22 cursos con ~1,100-1,500 lecciones — imposible de generar + revisar en 10 semanas. El Pilot Mínimo valida el moat (Angela coach + Coin economy + catálogo a la carta + cristiano explícito) con ~320 lecciones, ejecutable en 4-5 semanas de pipeline + review. Los 14 cursos restantes entran en rolling release post-pilot (Semanas 11+).
>
> Cada curso aquí descrito corresponde a una fila en `Course` (Prisma), insertada por `prisma/seed-catalog.mjs` durante Epic 04 tarea 1. El `slug` es la clave canónica.

---

## Mapeo de niveles argentinos → enums Midsea

| Sistema argentino | Año internacional | GradeBand Midsea |
|---|---|---|
| 1° Año Secundario | 9° grade | CICLO_BASICO |
| 2° Año Secundario | 10° grade | CICLO_BASICO |
| 3° Año Secundario | 11° grade | CICLO_ORIENTADO |
| 4° Año Secundario | 12° grade | CICLO_ORIENTADO |
| 5°/6° Año (orientación) | 13° (post-12) | CICLO_ORIENTADO |

**Pilot Mínimo cubre solamente CICLO_BASICO (9°-10°)**. CICLO_ORIENTADO (11°-12°) entra en rolling release post-pilot.

---

## Los 8 cursos del Pilot Mínimo

### 1. Matemática — Grado 9°

| Campo | Valor |
|---|---|
| **slug** | `math-grade-9` |
| **subject** | `MATH` |
| **gradeBand** | `CICLO_BASICO` |
| **title_es** | Matemática — Grado 9° |
| **title_en** | Mathematics — Grade 9 |
| **description_es** | Fundamentos del razonamiento matemático de Secundaria: operaciones con números reales, ecuaciones de primer grado, funciones lineales, geometría plana, proporcionalidad. 4 días/semana × 4 horas diarias. Enfoque cristiano, analítico y aplicado. |
| **description_en** | Foundations of secondary mathematical reasoning: real number operations, first-degree equations, linear functions, plane geometry, proportionality. 4 days/week × 4 hours daily. Christian, analytical and applied approach. |
| **# temas estimados (de outline)** | 20 (2 temas × 10 meses) |
| **# lecciones a generar** | ~40 (2 lecciones cortas por tema) |
| **Source file** | `docs/content/source/Matematicas/Secundaria/Matematica_9_Marzo_Diciembre_Completo.md` |
| **Formato outline** | B (Mes → 2 Temas → Hands-On) |

### 2. Matemática — Grado 10°

| Campo | Valor |
|---|---|
| **slug** | `math-grade-10` |
| **subject** | `MATH` |
| **gradeBand** | `CICLO_BASICO` |
| **title_es** | Matemática — Grado 10° |
| **title_en** | Mathematics — Grade 10 |
| **description_es** | Profundización: conjuntos y lógica, álgebra avanzada, ecuaciones cuadráticas, funciones cuadráticas y exponenciales, trigonometría, geometría espacial, estadística y probabilidad, modelización. 4 días/semana × 4 horas diarias. Enfoque cristiano, analítico y aplicado. |
| **description_en** | Deepening: sets and logic, advanced algebra, quadratic equations, quadratic and exponential functions, trigonometry, spatial geometry, statistics and probability, modeling. 4 days/week × 4 hours daily. Christian, analytical and applied approach. |
| **# temas estimados** | 20 (2 temas × 10 meses) |
| **# lecciones a generar** | ~40 |
| **Source file** | `docs/content/source/Matematicas/Secundaria/Matematica_10_Marzo_Diciembre_Completo.md` |
| **Formato outline** | B |

### 3. Lengua y Literatura — Grados 9°-10° (combinado)

| Campo | Valor |
|---|---|
| **slug** | `language-grade-9-10` |
| **subject** | `LANGUAGE` |
| **gradeBand** | `CICLO_BASICO` |
| **title_es** | Lengua y Literatura — Grados 9°-10° |
| **title_en** | Spanish Language and Literature — Grades 9-10 |
| **description_es** | Comprensión lectora, narrativa, gramática avanzada, ortografía y estilo, textos informativos y expositivos, argumentación, ensayo, poesía y figuras retóricas, teatro y diálogo, periodismo, literatura. Lectura crítica de obras clásicas. 4 días/semana × 4 horas diarias. Enfoque cristiano, crítico y académico. |
| **description_en** | Reading comprehension, narrative, advanced grammar, spelling and style, informative and expository texts, argumentation, essay, poetry and rhetorical figures, theater and dialogue, journalism, literature. Critical reading of classic works. 4 days/week × 4 hours daily. Christian, critical and academic approach. |
| **# temas estimados** | 20 |
| **# lecciones a generar** | ~40 |
| **Source file** | `docs/content/source/Espanol/Secundaria/Lengua_9th, 10th_ Completo_Completo.md` |
| **Formato outline** | B |
| **Nota** | El outline cubre 2 años. Las lecciones generadas se etiquetan con `targetGrade` 9° o 10° para que el padre vea la progresión. |

### 4. Inglés ESL — Grado 9° (A2)

| Campo | Valor |
|---|---|
| **slug** | `english-esl-grade-9` |
| **subject** | `ENGLISH_ESL` |
| **gradeBand** | `CICLO_BASICO` |
| **title_es** | Inglés ESL — Grado 9° (A2) |
| **title_en** | English ESL — Grade 9 (A2) |
| **description_es** | Inglés como segunda lengua para nivel A2 según CEFR. Vocabulario, gramática estructural básica, comprensión auditiva, expresión oral guiada, lectura de textos cortos. Día 4 de cada semana incluye reflexión con valores cristianos. 4 días/semana. |
| **description_en** | English as second language for CEFR A2 level. Vocabulary, basic structural grammar, listening comprehension, guided oral expression, short text reading. Day 4 of each week includes reflection with Christian values. 4 days/week. |
| **# temas estimados** | 10 (1 unidad mensual) |
| **# lecciones a generar** | ~40 (4 lecciones por unidad mensual, correspondientes a los 4 días) |
| **Source file** | `docs/content/source/English ESL/Secundaria/Ingles_ESL_Grado_9_Completo_Final.md` |
| **Formato outline** | A con "Semana tipo 4 días" |

### 5. Inglés ESL — Grado 10° (A2+/B1)

| Campo | Valor |
|---|---|
| **slug** | `english-esl-grade-10` |
| **subject** | `ENGLISH_ESL` |
| **gradeBand** | `CICLO_BASICO` |
| **title_es** | Inglés ESL — Grado 10° (A2+ / Transición a B1) |
| **title_en** | English ESL — Grade 10 (A2+ / Transition to B1) |
| **description_es** | Inglés A2 consolidado con transición a B1. Comunicación académica básica, pasado-presente-futuro, identidad y metas, educación, vida diaria, salud, comunidad, opiniones, experiencias pasadas, planes futuros, lectura y escritura. Aplicación de valores cristianos en decisiones y comunicación. 4 días/semana. |
| **description_en** | Consolidated A2 with transition to B1. Basic academic communication, past-present-future, identity and goals, education, daily life, health, community, opinions, past experiences, future plans, reading and writing. Christian values applied to decision-making and communication. 4 days/week. |
| **# temas estimados** | 10 (1 unidad mensual) |
| **# lecciones a generar** | ~40 |
| **Source file** | `docs/content/source/English ESL/Secundaria/Ingles_ESL_Grado_10_Completo_Final.md` |
| **Formato outline** | A con "Semana tipo 4 días" |

### 6. Sociales — Civilización Antigua II (Grados 9°-10°)

| Campo | Valor |
|---|---|
| **slug** | `history-ancient-civ-2-grade-9-10` |
| **subject** | `HISTORY` |
| **gradeBand** | `CICLO_BASICO` |
| **title_es** | Civilización Antigua II — Grados 9°-10° |
| **title_en** | Ancient Civilization II — Grades 9-10 |
| **description_es** | Continuidad histórica desde el mundo clásico hasta la transición medieval: Mundo Helenístico, Roma Antigua (República e Imperio), Cristianismo primitivo, Caída del Imperio Romano, Imperio Bizantino, Mundo Islámico medieval, Europa medieval temprana, Iglesia y cultura medieval. 4 días/semana × 1 hora diaria. |
| **description_en** | Historical continuity from the classical world to the medieval transition: Hellenistic World, Ancient Rome (Republic and Empire), Early Christianity, Fall of the Roman Empire, Byzantine Empire, Medieval Islamic World, Early Medieval Europe, Church and medieval culture. 4 days/week × 1 hour daily. |
| **# temas estimados** | 10 (1 unidad mensual) |
| **# lecciones a generar** | ~20 (2 lecciones por mes, cortas dado 1h/día) |
| **Source file** | `docs/content/source/Ciencias Sociales/Secundaria/Civilizacion_Antigua_II_Grados_9_10.md` |
| **Formato outline** | A con "Producto del estudiante" |

### 7. Ciencias — Biología (Grados 9°-10°)

| Campo | Valor |
|---|---|
| **slug** | `science-biology-grade-9-10` |
| **subject** | `SCIENCE` |
| **gradeBand** | `CICLO_BASICO` |
| **title_es** | Biología — Grados 9°-10° |
| **title_en** | Biology — Grades 9-10 |
| **description_es** | Biología como ciencia, célula y organelos, membrana celular y metabolismo, mitosis y meiosis, genética y ADN, mutaciones y herencia, sistemas del cuerpo, ecología y biodiversidad, biotecnología y ética científica. Incluye experimentos reales (ósmosis, extracción de ADN). 4 días/semana × 4 horas diarias. Enfoque cristiano, científico y ético — integración fe y ciencia. |
| **description_en** | Biology as science, cell and organelles, cell membrane and metabolism, mitosis and meiosis, genetics and DNA, mutations and inheritance, body systems, ecology and biodiversity, biotechnology and scientific ethics. Includes real experiments (osmosis, DNA extraction). 4 days/week × 4 hours daily. Christian, scientific and ethical approach — faith and science integration. |
| **# temas estimados** | 20 (2 temas × 10 meses) |
| **# lecciones a generar** | ~40 |
| **Source file** | `docs/content/source/Ciencias/Secundaria/Ciencias_9,10_ Biologia .md` |
| **Formato outline** | B |

### 8. Música — Grado 9°

| Campo | Valor |
|---|---|
| **slug** | `music-grade-9` |
| **subject** | `MUSIC` |
| **gradeBand** | `CICLO_BASICO` |
| **title_es** | Música — Grado 9° |
| **title_en** | Music — Grade 9 |
| **description_es** | Apreciación musical avanzada e introducción a la teoría: notación, escalas, ritmo y métrica, formas musicales, géneros, instrumentos clásicos y populares, historia de la música, repertorio sagrado y secular. 2 días/semana. |
| **description_en** | Advanced musical appreciation and introduction to theory: notation, scales, rhythm and meter, musical forms, genres, classical and popular instruments, music history, sacred and secular repertoire. 2 days/week. |
| **# temas estimados** | 10 (1 unidad mensual) |
| **# lecciones a generar** | ~20 (2 lecciones por mes) |
| **Source file** | `docs/content/source/Musica/Secundaria/Musica_9_Secundaria.md` |
| **Formato outline** | A |

---

## Resumen del Pilot Mínimo

| # | Curso | Subject | GradeBand | # lecciones estimadas | Formato |
|---|---|---|---|---|---|
| 1 | Matemática 9° | MATH | CICLO_BASICO | ~40 | B |
| 2 | Matemática 10° | MATH | CICLO_BASICO | ~40 | B |
| 3 | Lengua y Literatura 9°-10° | LANGUAGE | CICLO_BASICO | ~40 | B |
| 4 | Inglés ESL Grado 9° | ENGLISH_ESL | CICLO_BASICO | ~40 | A semanal |
| 5 | Inglés ESL Grado 10° | ENGLISH_ESL | CICLO_BASICO | ~40 | A semanal |
| 6 | Sociales — Civilización Antigua II | HISTORY | CICLO_BASICO | ~20 | A producto |
| 7 | Ciencias — Biología | SCIENCE | CICLO_BASICO | ~40 | B |
| 8 | Música — Grado 9° | MUSIC | CICLO_BASICO | ~20 | A |
| | **Total** | | | **~280 lecciones** | |

Más ~30-40 lecciones de los productos premium de tienda Coin = **~320 lecciones totales para el pilot**. Manejable en 4-5 semanas con review humano.

---

## Cursos del catálogo HS completo (post-pilot, rolling release)

Los 14 cursos restantes del catálogo HS real entran en rolling release durante las 6-8 semanas posteriores al lanzamiento del pilot:

| # | Curso | Source file | Cuándo |
|---|---|---|---|
| 9 | Matemática 11° | `Matematica_11_Secundaria_HandsOn_Completo.md` | v1.1 Sem 11-12 |
| 10 | Matemática 12° | `Matematica_12_Secundaria_HandsOn_Completo.md` | v1.1 Sem 11-12 |
| 11 | Lengua 11° | `Lengua_11_Secundaria_HandsOn_Completo.md` | v1.1 Sem 12-13 |
| 12 | Lengua 12° | `Lengua_12_Secundaria_HandsOn_Completo.md` | v1.1 Sem 12-13 |
| 13 | Inglés ESL 11° (B1) | `Ingles_ESL_Grado_11_Completo_Final.md` | v1.1 Sem 12-13 |
| 14 | Inglés ESL 12° (B1+/B2) | `Ingles_ESL_Grado_12_Completo_Final.md` | v1.1 Sem 12-13 |
| 15 | Historia Mundial I (11°) | `Historia_Mundial_I_11_Secundaria.md` | v1.1 Sem 13-14 |
| 16 | Historia Mundial II (12°) | `Historia_Mundial_II_12_Secundaria.md` | v1.1 Sem 13-14 |
| 17 | Ciencias — Ecología (10°) | `Ciencias_10_Secundaria_Ecologia.md` | v1.1 Sem 14-15 |
| 18 | Ciencias — Química (11°) | `Ciencias_11_Secundaria_Quimica.md` | v1.1 Sem 14-15 |
| 19 | Ciencias — Física (12°) | `Ciencias_12_Secundaria_Fisica.md` | v1.1 Sem 14-15 |
| 20 | Música 10° | `Musica_10_Secundaria.md` | v1.1 Sem 13 |
| 21 | Música 11° | `Musica_11_Secundaria.md` | v1.1 Sem 13 |
| 22 | Música 12° | `Musica_12_Secundaria.md` | v1.1 Sem 13 |

**v1.2 (Sem 16-24+)**: expansión a Primaria (1°-6°) + Middle School (7°-8°) usando el pipeline ya validado. ~30 cursos adicionales con outlines de Primaria + Middle School.

---

## Notas operativas para el pipeline (ADR-006)

### Modelo "1 tema mensual → N lecciones cortas"

Cada outline define **temas por mes** (Formato A) o **2 temas por mes** (Formato B). El pipeline genera **2-4 lecciones cortas (~6-10 min cada una)** por tema, NO 1 lección por tema. Razones:

- Lecciones cortas mantienen engagement adolescente (ADR-007 ICP).
- Permiten consumo self-paced sin sentir que "una lección" es un compromiso de 60 min.
- Cada lección cubre 1 sub-concepto del tema, evaluable independientemente.
- Mastery por lección × 80% = 100 Coin (gamification engine existente).

### Codes de competencia

Prefijo `ARG-<SUBJECT>-G<NN>-M<NN>-T<NN>-L<NN>`:
- `ARG-MATH-G09-M01-T01-L01` = Matemática Grado 9, Marzo (mes 1), Tema 1, Lección 1
- `ARG-ESL-G10-M03-T01-L02` = Inglés ESL Grado 10, Mayo (mes 3), Tema 1, Lección 2
- `ARG-HIS-G09_10-M04-T01-L01` = Sociales Civ Antigua II (grados 9-10 combinado), Junio, Tema 1, Lección 1

### Cómo el catálogo se relaciona con los outlines del founder

Los outlines del founder (en `docs/content/source/`) NO son la fuente de verdad del catálogo, son el **insumo del pipeline**. El catálogo (este archivo) define **qué cursos existen, su slug, sus IDs en Prisma**. El pipeline lee los outlines + genera lecciones que se ingestean al curso correspondiente vía `slug`.

---

*Última actualización: 2026-05-21 (Reescritura completa post-audit del contenido real). Actualizar este archivo si: (a) se agregan/quitan cursos del pilot, (b) se ajustan estimaciones de # lecciones con datos reales del pipeline, (c) cursos del rolling release post-pilot se promueven o se mueven en el calendario.*

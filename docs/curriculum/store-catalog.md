# Catálogo de Tienda Coin — Productos premium del pilot

> Source of truth de los productos premium que se desbloquean con Coin. Cada item aquí corresponde a una fila en `StoreItem` (Prisma), insertada por `prisma/seed-store.mjs` durante Epic 05 tarea 1.
>
> Precios sugeridos calibrados para que un estudiante activo (~30 lecciones/mes con mastery ≥80% = 3,000 Coin/mes) pueda costear 1 producto premium mensual sin Coin packs. Estudiantes muy activos o con Coin packs comprados por el padre acceden a más.

---

## 1. Cursos especializados (5 productos)

### 1.1 Preparación CBC Matemática UBA

| Campo | Valor |
|---|---|
| **slug** | `cbc-math-uba` |
| **type** | `SPECIALIZED_COURSE` |
| **priceCoin** | 2,500 |
| **estMinutes** | ~8 horas (5-7 lecciones de 60-90 min) |
| **title_es** | Preparación CBC Matemática (UBA) |
| **title_en** | UBA CBC Math Prep |
| **description_es** | Curso intensivo de preparación para el CBC de Matemática de la Universidad de Buenos Aires y universidades nacionales argentinas. Cubre los temas exigidos en el examen: funciones, derivadas, integrales, geometría analítica, problemas tipo. Incluye 4 simulacros de examen con corrección detallada por Angela. |
| **description_en** | Intensive prep course for UBA and Argentinian national universities Math entrance exam. Covers: functions, derivatives, integrals, analytical geometry, exam-type problems. Includes 4 mock exams with detailed Angela-graded feedback. |
| **Por qué este producto** | El CBC es el "rite of passage" universitario argentino. Padres pagan miles de pesos por cursos presenciales o digitales para este examen. Midsea ofrece el mismo valor pedagógico a través del esfuerzo del hijo. |

### 1.2 Preparación CBC Lengua y Comprensión Lectora

| Campo | Valor |
|---|---|
| **slug** | `cbc-language-uba` |
| **type** | `SPECIALIZED_COURSE` |
| **priceCoin** | 2,500 |
| **estMinutes** | ~7 horas |
| **title_es** | Preparación CBC Lengua y Comprensión Lectora (UBA) |
| **title_en** | UBA CBC Reading and Writing Prep |
| **description_es** | Preparación específica para el CBC de Lengua: comprensión lectora de textos académicos, producción de ensayos argumentativos cortos, gramática avanzada, vocabulario académico. Incluye 4 ensayos modelo con feedback de Angela y rubric oficial UBA. |
| **description_en** | Specific prep for UBA CBC Spanish: academic reading comprehension, short argumentative essay writing, advanced grammar, academic vocabulary. Includes 4 model essays with Angela feedback and official UBA rubric. |

### 1.3 Programación con Python para HS

| Campo | Valor |
|---|---|
| **slug** | `python-for-hs` |
| **type** | `SPECIALIZED_COURSE` |
| **priceCoin** | 2,000 |
| **estMinutes** | ~10 horas (12 lecciones de 30-50 min) |
| **title_es** | Programación con Python para Secundaria |
| **title_en** | Python Programming for High School |
| **description_es** | Introducción rigurosa a programación con Python desde cero. Variables, condicionales, loops, funciones, listas, diccionarios, archivos, intro a OOP. Cada lección termina con un proyecto pequeño construible. Útil para CBC Algoritmos y para electivas universitarias. |
| **description_en** | Rigorous introduction to Python programming from scratch. Variables, conditionals, loops, functions, lists, dictionaries, files, intro to OOP. Each lesson ends with a small buildable project. Useful for university CS electives. |

### 1.4 Análisis Literario Avanzado: Borges y Cortázar

| Campo | Valor |
|---|---|
| **slug** | `borges-cortazar-analysis` |
| **type** | `SPECIALIZED_COURSE` |
| **priceCoin** | 1,800 |
| **estMinutes** | ~6 horas |
| **title_es** | Análisis literario avanzado: Borges y Cortázar |
| **title_en** | Advanced Literary Analysis: Borges and Cortázar |
| **description_es** | Deep dive en dos autores fundamentales argentinos. Análisis estructural, recursos narrativos, temas recurrentes, contextos históricos. Lectura guiada de cuentos seleccionados ("El Aleph", "Casa Tomada", "El sur", "Continuidad de los parques") con discusión orientada por Angela. |
| **description_en** | Deep dive into two fundamental Argentine authors. Structural analysis, narrative resources, recurring themes, historical contexts. Guided reading of selected short stories with discussion oriented by Angela. |

### 1.5 Historia del Arte Argentino

| Campo | Valor |
|---|---|
| **slug** | `argentine-art-history` |
| **type** | `SPECIALIZED_COURSE` |
| **priceCoin** | 1,500 |
| **estMinutes** | ~5 horas |
| **title_es** | Historia del Arte Argentino |
| **title_en** | History of Argentine Art |
| **description_es** | Recorrido por las grandes corrientes del arte argentino desde el s. XIX al presente. Cándido López, Berni, Quinquela Martín, Soldi, MALBA contemporáneo. Conexiones con contexto histórico-social. Útil para estudiantes interesados en humanidades. |
| **description_en** | Journey through major currents of Argentine art from 19th century to present. Cándido López, Berni, Quinquela Martín, Soldi, contemporary MALBA. Connections with historical-social context. Useful for humanities-oriented students. |

---

## 2. Masterclasses cortas (4 productos)

### 2.1 Técnicas de estudio para exámenes finales

| Campo | Valor |
|---|---|
| **slug** | `study-techniques-finals` |
| **type** | `MASTERCLASS` |
| **priceCoin** | 600 |
| **estMinutes** | ~90 min (3 lecciones de 30 min) |
| **title_es** | Técnicas de estudio para exámenes finales |
| **title_en** | Study Techniques for Final Exams |
| **description_es** | Masterclass corta sobre las técnicas de estudio más efectivas según la evidencia: spaced repetition, active recall, interleaving, mind maps, Pomodoro. Aplicación práctica para preparar finales de Secundaria y CBC. |
| **description_en** | Short masterclass on the most effective study techniques per evidence: spaced repetition, active recall, interleaving, mind maps, Pomodoro. Practical application for final exams and university prep. |

### 2.2 Cómo escribir un ensayo argumentativo

| Campo | Valor |
|---|---|
| **slug** | `argumentative-essay-writing` |
| **type** | `MASTERCLASS` |
| **priceCoin** | 700 |
| **estMinutes** | ~2 horas (4 lecciones) |
| **title_es** | Cómo escribir un ensayo argumentativo |
| **title_en** | How to Write an Argumentative Essay |
| **description_es** | Estructura, thesis statement, párrafos de desarrollo, contrargumentos, conclusión. Práctica con 2 ensayos modelo corregidos por Angela con rubric académica. Útil para Lengua HS, CBC Lengua, y producción escrita general. |
| **description_en** | Structure, thesis statement, body paragraphs, counterarguments, conclusion. Practice with 2 model essays graded by Angela with academic rubric. Useful for Spanish HS, university entrance, and general writing. |

### 2.3 Speed reading académico

| Campo | Valor |
|---|---|
| **slug** | `academic-speed-reading` |
| **type** | `MASTERCLASS` |
| **priceCoin** | 500 |
| **estMinutes** | ~75 min |
| **title_es** | Speed reading académico |
| **title_en** | Academic Speed Reading |
| **description_es** | Técnicas para aumentar velocidad de lectura sin perder comprensión: scanning, skimming, sub-vocalización reducida, pre-reading. Especialmente útil para Lengua HS, Historia, y carreras universitarias con mucha bibliografía. |
| **description_en** | Techniques to increase reading speed without losing comprehension: scanning, skimming, reduced sub-vocalization, pre-reading. Especially useful for HS Language, History, and university programs with heavy reading load. |

### 2.4 Notas Cornell para humanidades

| Campo | Valor |
|---|---|
| **slug** | `cornell-notes-humanities` |
| **type** | `MASTERCLASS` |
| **priceCoin** | 500 |
| **estMinutes** | ~60 min |
| **title_es** | Notas Cornell para humanidades |
| **title_en** | Cornell Notes for Humanities |
| **description_es** | Sistema Cornell de toma de notas aplicado a Historia, Literatura, Filosofía. Cómo estructurar notas, hacer resúmenes laterales, generar cue questions, integrar con repaso espaciado. Práctica guiada con material real. |
| **description_en** | Cornell note-taking system applied to History, Literature, Philosophy. How to structure notes, write side summaries, generate cue questions, integrate with spaced review. Guided practice with real material. |

---

## 3. Módulos electivos (3 productos)

### 3.1 Música — Teoría avanzada

| Campo | Valor |
|---|---|
| **slug** | `music-advanced-theory` |
| **type** | `ELECTIVE_MODULE` |
| **priceCoin** | 2,200 |
| **estMinutes** | ~8 horas |
| **title_es** | Música — Teoría avanzada |
| **title_en** | Music — Advanced Theory |
| **description_es** | Teoría musical avanzada: armonía, modulaciones, contrapunto, análisis de forma musical. Apropiado para estudiantes que estudian un instrumento o composición. Construido sobre el outline propio de Música del founder. |
| **description_en** | Advanced music theory: harmony, modulations, counterpoint, musical form analysis. Appropriate for students studying an instrument or composition. Built on founder's own Music outline. |
| **Nota** | Si demanda alta en pilot, se promueve a curso del catálogo Core en v1.1. |

### 3.2 Geografía aplicada con GIS básico

| Campo | Valor |
|---|---|
| **slug** | `geography-with-gis` |
| **type** | `ELECTIVE_MODULE` |
| **priceCoin** | 1,800 |
| **estMinutes** | ~6 horas |
| **title_es** | Geografía aplicada con GIS básico |
| **title_en** | Applied Geography with Basic GIS |
| **description_es** | Geografía contemporánea aplicada: cambio climático, geopolítica, recursos naturales, demografía. Incluye introducción a herramientas GIS (Google Earth Engine, QGIS) con ejercicios prácticos. Complementa Historia Universal HS. |
| **description_en** | Contemporary applied geography: climate change, geopolitics, natural resources, demography. Includes intro to GIS tools (Google Earth Engine, QGIS) with practical exercises. Complements World History HS. |

### 3.3 Filosofía para Secundaria: introducción

| Campo | Valor |
|---|---|
| **slug** | `philosophy-intro-hs` |
| **type** | `ELECTIVE_MODULE` |
| **priceCoin** | 1,500 |
| **estMinutes** | ~5 horas |
| **title_es** | Filosofía para Secundaria: introducción |
| **title_en** | Philosophy for High School: Introduction |
| **description_es** | Introducción accesible a la filosofía: Sócrates, Platón, Aristóteles, Descartes, Kant, Nietzsche, filosofía contemporánea. Énfasis en pensamiento crítico, argumentación lógica, formulación de preguntas filosóficas. Apropiado para HS argentino que tiene Filosofía como materia obligatoria en 4°-5°. |
| **description_en** | Accessible intro to philosophy: Socrates, Plato, Aristotle, Descartes, Kant, Nietzsche, contemporary philosophy. Emphasis on critical thinking, logical argumentation, philosophical questioning. Appropriate for Argentine HS with Philosophy as required subject in 4-5° year. |

---

## Resumen catálogo tienda Coin

| Tipo | # productos | Rango precios | Promedio |
|---|---|---|---|
| SPECIALIZED_COURSE | 5 | 1,500 - 2,500 Coin | 2,060 |
| MASTERCLASS | 4 | 500 - 700 Coin | 575 |
| ELECTIVE_MODULE | 3 | 1,500 - 2,200 Coin | 1,833 |
| **Total** | **12 productos** | | |

---

## Coin packs comprables (Stripe SKUs)

| Pack | Coin | Precio USD | $ por 100 Coin |
|---|---|---|---|
| Small | 1,000 | $9 | $0.90 |
| Medium | 3,000 | $25 | $0.83 (best value) |
| Large | 7,000 | $50 | $0.71 |

Estos NO son productos del `StoreItem` table — son SKUs de Stripe directamente. El padre los compra desde Parent Copilot via Stripe Payment Element. El webhook `payment_intent.succeeded` con metadata `productType=coin_pack` acredita Coin al hijo destinatario via `awardCoin` (gamification engine).

---

## Calibración esperada en pilot

Asumiendo un estudiante "activo" que completa ~30 lecciones del catálogo base/mes con mastery ≥80%:

- **Coin ganado/mes**: 30 × 100 = **3,000 Coin/mes**.
- **Productos premium accesibles en 1 mes sin Coin packs**:
  - 5 masterclasses (3,000 Coin), o
  - 1 curso especializado (1,500-2,500 Coin) + 0-1 masterclass, o
  - 1 módulo electivo (1,500-2,200 Coin) + 0-1 masterclass.
- **Si el padre regala un Coin pack Medium ($25 = 3,000 Coin)**: el estudiante duplica su capacidad para ese mes.

Este balance es deliberado: **un estudiante puede acceder a contenido premium real solo con esfuerzo, sin Coin packs**. Los Coin packs son aceleradores, no gating.

---

*Última actualización: 2026-05-21. Actualizar este archivo si: (a) se agregan/quitan productos en pilot post-feedback, (b) se ajustan precios con datos reales de velocidad de Coin earning, (c) Música se promueve a catálogo Core.*

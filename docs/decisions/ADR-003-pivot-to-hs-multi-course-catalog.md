# ADR-003 — Pivot a High School + Catálogo de cursos a la carta (Argentina-first)

| Campo | Valor |
|---|---|
| **Estado** | Aceptado |
| **Fecha** | 2026-05-21 |
| **Decisores** | Founder / Product Lead (Omar) |
| **Supersede** | PRD §1.4 v1 ("El Cimiento" K-6) |
| **Relacionado con** | ADR-004 (Coin), ADR-005 (activación por curso), ADR-006 (ingestion) |
| **Bloquea** | Epic 02.5-HS, Epic 04-HS, Epic 05-HS |

## Contexto

El PRD versión 2.0 definía v1 como cobertura K-6 en español para "Madre Homeschooler Estratégica" en LATAM/España/US Hispanic, lanzando con un grado y materias core, expandiendo gradualmente. Dos cambios estratégicos posteriores reescriben este alcance:

1. **Contenido disponible.** El founder tiene contenido propio en proceso de terminar para High School en 6 materias: Matemáticas, Lengua, Inglés ESL, Historia Universal, Historia de Argentina, Ciencias. Empezar por HS aprovecha lo que ya existe y elimina el cuello de botella principal del plan original (generación + revisión pedagógica con AI de contenido K-6 desde cero).

2. **Insight competitivo sobre Wited.** Wited (competidor regional principal en LATAM) cubre primaria + secundaria pero **vende el grado completo como paquete cerrado**. El padre paga, se entera después qué materias incluye, no puede sustituir cursos ni quitar materias irrelevantes. Es el modelo del colegio tradicional vestido de SaaS. Esto es una limitación brutal que Midsea va a resolver con un **catálogo de cursos curados activables a la carta por hijo**.

## Decisión

### 1. Pivot del alcance v1

v1 ya **no es K-6 en un grado piloto con dos materias**. v1 es **HS completo (9°-12°) en 6 materias, lanzado como catálogo de cursos curados que el padre activa selectivamente por hijo**, con mercado geográfico inicial Argentina y región rioplatense.

Cobertura K-6 (primaria) y 7°-8° (secundaria temprana) se difieren a **v1.1 post-pilot**, generadas / curadas con AI assist usando el pipeline ya validado en HS.

### 2. Mercado geográfico del pilot

**LATAM cristiano hispanohablante completo desde día 1**, con lanzamiento inicial **focalizado en Argentina + diáspora argentina** por la disponibilidad del contenido base (currículo argentino "Diseño Curricular de Educación Primaria – Argentina" en el corpus del founder).

Mercado total accesible:
- **Argentina** (mercado lead del pilot, ~5K homeschoolers + crecimiento).
- **Diáspora argentina** en España (~250K), US (~290K, especialmente FL/TX/CA), Brasil (~40K), Chile (~70K), México (~30K).
- **México** (privado-libre permite homeschooling, mercado cristiano-evangélico + católico tradicional creciente, ~15K homeschoolers).
- **Colombia, Chile, Costa Rica, Perú, Ecuador, Bolivia, Paraguay, Uruguay, Venezuela, República Dominicana** (mercados emergentes, regulación variable).
- **US Hispanic** (~25% evangélicos según Pew Research, mercado homeschool cristiano hispano creciente, ~50-80K familias).

Razones para abrir el pilot a LATAM amplio (no solo Argentina):
- Limitar el pilot a "Argentina-only" cierra ~80% del mercado potencial sin necesidad.
- El contenido base es argentino pero culturalmente accesible para cualquier hispanohablante (la Historia de Argentina es un curso del catálogo, NO un requisito; las familias mexicanas activan otros cursos y la diáspora argentina activa Historia de Argentina como cultura familiar).
- Angela habla **español LATAM neutro** (sin voseo, sin localismos), entendible por todos los hispanohablantes.
- Stripe en USD permite cobro desde cualquier país LATAM sin fricción.
- Las regulaciones de homeschooling varían por país; Midsea ofrece el producto y el padre asume responsabilidad legal local (disclaimer en signup).

Mercados secundarios pilot (los listados arriba) son **bienvenidos desde el lanzamiento**, no "post-validación". El messaging del landing habla a "familias cristianas hispanas", no solo argentinas.

**Variantes culturales (v1.1+)**: con el pipeline ya validado, se agregan **Historia de México**, **Historia de Colombia**, **Historia de República Dominicana**, **Historia de Costa Rica**, etc. como cursos paralelos. La estrategia de "Historia de cada país latino" en Primaria (mencionada por el founder) materializa esta expansión post-pilot.

### 3. Catálogo de cursos del pilot (HS only)

| Curso | Nivel | Materia origen | Estado contenido |
|---|---|---|---|
| Matemáticas HS — Ciclo Básico | 9°-10° | Matemáticas | Existente, normalizar |
| Matemáticas HS — Ciclo Orientado | 11°-12° | Matemáticas | Existente, normalizar |
| Lengua y Literatura HS — Ciclo Básico | 9°-10° | Lengua | Existente, normalizar |
| Lengua y Literatura HS — Ciclo Orientado | 11°-12° | Lengua | Existente, normalizar |
| Inglés ESL — Intermedio | (transversal HS) | Inglés ESL | Existente, normalizar |
| Inglés ESL — Avanzado | (transversal HS) | Inglés ESL | Existente, normalizar |
| Historia Universal HS | (transversal HS) | Historia Universal | Existente, normalizar |
| Historia de Argentina HS | (transversal HS) | Historia de Argentina | Existente, normalizar |
| Ciencias HS | (transversal HS) | Ciencias | Existente, normalizar |

**Total: 9 cursos en catálogo inicial.** El padre activa los que su hijo necesita; cada curso es independiente con su propia Ruta de Aprendizaje, MasteryMap y Coin.

Granularidad de las materias HS argentina:
- "Ciclo Básico" = 1°-2° año del Secundario argentino (9°-10° equivalente internacional).
- "Ciclo Orientado" = 3°-5°/6° año (11°-12° equivalente).
- Inglés ESL e Historia se manejan por nivel transversal, no por año estricto, porque el contenido es así de origen.
- Ciencias se mantiene integrado en v1; en v1.1 se desglosa a Biología / Química / Física si la calidad del contenido lo justifica.

### 4. Pricing reconfirmado bajo el nuevo modelo

Sin cambio de los tiers del ADR-001, pero **la definición de "qué incluye Core $29"** se actualiza:

- **Core $29/estudiante/mes**: acceso ilimitado a todo el catálogo base. El padre activa cuántos cursos quiera por hijo, sin límite.
- **Pro $45/estudiante/mes**: todo lo de Core + bonus Coin 1.5× por mastery + reportes regulatorios (Argentina + jurisdicciones del pilot) + descuento -20% en productos premium de tienda Coin + prioridad soporte.
- **Family $69/familia/mes**: hasta 4 estudiantes con acceso Core.

La diferenciación con Pro NO es "más cursos" (todos tienen acceso ilimitado al catálogo). Es **valor agregado** (Coin, reportes, descuentos). Esto es deliberado para diferenciar el modelo del de Wited (paquetes cerrados por nivel) y de Miacademy (paquete único con upsells cosméticos).

### 5. Tienda Coin posicionada como expansión

Ver ADR-004 en detalle. Para este ADR basta con: el Coin es moneda interna con poder pedagógico real (no cosmético). Productos premium de la tienda son cursos especializados, masterclasses y módulos extra **fuera del catálogo base** (ej. preparación para CBC universitario, electivas, AP-equivalentes), desbloqueables con Coin acumulado por mastery o con Coin packs comprables. El padre puede regalar Coin packs vía Stripe.

### 6. Schema impact

Cambios al modelo Prisma (detalle pleno en Epic 04 y Epic 05):

- **`Course`** (nuevo): id, slug, title_es/en, description_es/en, gradeBand (CICLO_BASICO / CICLO_ORIENTADO / TRANSVERSAL), subject (MATH / LANGUAGE / ENGLISH_ESL / HISTORY_UNIVERSAL / HISTORY_AR / SCIENCE), orderIndex, published.
- **`Lesson`** existente: agregar `courseId` FK obligatorio.
- **`Competency`** (nuevo): id, courseId FK, code, description_es/en, prerequisites (selfRel many-to-many).
- **`LessonCompetency`** (nuevo, join): lessonId × competencyId.
- **`StudentCourseEnrollment`** (nuevo): studentId × courseId + activatedAt + activatedBy (parentId) + active boolean. Reemplaza el modelo implícito de "tu grado define qué ves".
- **`MasteryMap`** queda derivable de `LessonProgress` agregado por `Competency`. No necesita tabla separada en v1.

Migration documentada como **`prisma/migrations/manual/0004-catalog-courses-enrollments.sql`** (sigue el patrón del Epic 03 hasta que migremos a Prisma migrations formales en Epic 06).

### 7. UX del Parent Copilot

El dashboard parental se rediseña:

- Sección "Mis Estudiantes" muestra cards de hijos con: avatar + nombre + edad + **cursos activos** (chips) + total mensual.
- Click en un hijo abre **panel de gestión del estudiante** con: cursos activados, botón "Agregar curso" que abre el catálogo del pilot, botón "Desactivar" por curso (efecto inmediato o al fin de período, decisión Epic 04).
- El catálogo del pilot es visible para todos los padres pre-signup también (landing → "Ver catálogo completo") para reducir el "te enteras después de pagar" de Wited.

### 8. Lo que NO cambia

- ADR-001 (billing stack Stripe) sigue siendo fuente de verdad. Los nuevos productos (Coin packs) son SKUs adicionales.
- ADR-002 (Angela como nombre canónico) sigue.
- Stack técnico, principios de DDD, i18n, mobile-first, a11y, anti-EduNexo, anti-copia: todo igual.
- Bilingüe es-es/es-419/en. El pilot Argentina default es-AR (es-419 con variantes léxicas mínimas).

## Consecuencias

**Positivas.**
- Contenido propio elimina el riesgo pedagógico de generar K-6 con AI desde cero.
- Pilot HS Argentina tiene mercado claro, regulación tolerante, y target de pago acostumbrado a SaaS en USD.
- Catálogo a la carta es moat narrativo directo contra Wited ("no compras paquetes; activas lo que tu hijo necesita").
- Coin como moneda económica + tienda premium se mantiene como diferenciador único en HS hispanohablante.
- Menos contenido total que K-12 amplio = más calidad por curso = pilot más defendible.

**Negativas.**
- Abandona el ICP original (madre con hijo K-6) explícito. Hay que re-perfilar al padre de adolescente argentino, que es más exigente, más price-sensitive y más conservador. Mitigación: pilot beta cerrada permite aprender sobre este ICP antes de marketing masivo.
- "K-12 completo" como story se difiere a v1.1. En el pilot, Midsea es "HS argentino a la carta". El messaging debe ser honesto sobre el alcance actual.
- Wited y MiaPrep ya tienen brand awareness en sus segmentos. Midsea es desconocido. Pilot por boca-a-boca + comunidad homeschooler argentina es la única forma realista de los primeros 30 usuarios.

## Alternativas descartadas

| Alternativa | Razón |
|---|---|
| Mantener K-6 v1 y generar contenido con AI | Cuello de botella pedagógico real; sin educador K-6 hispano en el equipo, la calidad sería mediocre. |
| HS pero en US Hispanic primero (Florida/Texas) | Sin contenido específico para esos currículos (Common Core ≠ Secundario argentino); requiere adaptación cultural costosa. |
| K-12 completo con catálogo amplio desde día 1 | Imposible en 10 semanas con una persona y contenido HS-only. |
| Solo Math + Lengua HS (scope C original) | Subutiliza el contenido que YA tienes en 4 materias adicionales (Inglés, 2 Historias, Ciencias). |

## Referencias cruzadas

- `PRD.md` §1.4 (v1 redefinido), §1.6 (v1 HS Pilot Argentina — nueva sección).
- `docs/DMP-HS-addendum.md` (Wited como anti-patrón principal post-pivot).
- `ADR-004-coin-as-internal-currency.md`.
- `ADR-005-per-student-course-activation.md`.
- `ADR-006-content-ingestion-pipeline.md`.
- `docs/curriculum/midsea-hs-catalog.md` (mapa de los 9 cursos).
- Epic 04-HS (Lesson Player + Ingestion + Course Activation).

---

*Revisar este ADR cuando: (a) el pilot Argentina arroje datos sobre retention y conversion en los primeros 90 días, (b) el contenido K-6 esté listo para v1.1, (c) decidamos expandir a otro país hispanohablante con currículo distinto.*

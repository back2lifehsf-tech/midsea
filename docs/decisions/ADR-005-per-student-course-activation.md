# ADR-005 — Activación de cursos por estudiante (catálogo a la carta, no paquete cerrado)

| Campo | Valor |
|---|---|
| **Estado** | Aceptado |
| **Fecha** | 2026-05-21 |
| **Decisores** | Founder / Product Lead (Omar) |
| **Relacionado con** | ADR-003 (pivot HS), ADR-004 (Coin), Epic 04-HS |
| **Anti-patrón principal de referencia** | Wited (paquete cerrado por grado) |

## Contexto

Wited, competidor regional principal en LATAM, vende **el grado completo** como paquete cerrado: el padre paga, se entera después qué materias incluye, no puede sustituir ni quitar. Miacademy y Time4Learning son menos restrictivos pero igual asumen "el hijo está en el grado X = ve todo el contenido del grado X por default; el padre puede ajustar manualmente pero la curaduría queda en el algoritmo o el patchwork."

Midsea va a una tercera arquitectura: **catálogo de cursos curados, el padre activa cuáles toma cada hijo**. Cada curso es una unidad independiente con su propio MasteryMap, su propia Ruta de Aprendizaje, y su propio balance de Coin generado. El grado del hijo es referencia (para sugerir defaults), no constraint.

## Decisión

### 1. Modelo de activación

**`StudentCourseEnrollment`** es la fuente de verdad de "qué cursos está tomando cada hijo". No hay relación implícita "grado del Student → cursos visibles". El catálogo está disponible para todos; lo que cambia por hijo es qué está **activado**.

```prisma
model StudentCourseEnrollment {
  id              String   @id @default(cuid())
  student         Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  studentId       String
  course          Course   @relation(fields: [courseId], references: [id], onDelete: Restrict)
  courseId        String
  activatedAt     DateTime @default(now())
  activatedBy     Parent   @relation(fields: [activatedByParentId], references: [id])
  activatedByParentId String
  deactivatedAt   DateTime?
  // Si deactivatedAt != null y futuro, el curso se desactiva al final del período pagado.
  // Si deactivatedAt != null y pasado, el curso ya está inactivo.
  active          Boolean  @default(true)

  @@unique([studentId, courseId])
  @@index([studentId, active])
}
```

### 2. Reglas de activación

- **Sin límite numérico en plan Core.** El padre puede activar tantos cursos por hijo como quiera. El precio mensual del estudiante ($29 Core, $45 Pro, $69 Family) no cambia por número de cursos activos.
- **Activación es inmediata.** Click del padre en "Activar Geometry para Sofía" → el curso aparece en el dashboard de Sofía sin delay.
- **Desactivación es opcional y reversible.** El padre puede desactivar un curso para limpiar el dashboard del hijo; el progreso (LessonProgress, Coin ya ganado) no se pierde. Si reactiva en el futuro, el hijo retoma desde donde quedó.
- **Default al crear estudiante**: 0 cursos activados. El padre elige activamente durante onboarding del Student. Esto es deliberado contra "el algoritmo asume y te molesta después" de Wited.
- **Hard cap no operativo**: 50 cursos activos por estudiante en v1 (proteger DB de abuso accidental). No es UX visible; nadie va a activar 50.

### 3. UX en el Parent Copilot

**Vista "Mis Estudiantes"** (dashboard principal del padre):

Cards por hijo:
- Avatar + nombre + edad
- Chips de cursos activos (visible: hasta 5, "+ N más" si hay más)
- Coin balance del hijo
- "Última actividad": "Sofía completó Lección 3 de Geometry hace 2h"
- Acción: "Ver perfil completo" → panel detallado

**Panel detallado del estudiante** (`/parent/students/[id]`):

- Header: foto + nombre + edad + curso(s) "favorito(s)" según uso reciente
- Sección "Cursos activos": lista de chips con progress bar por curso + acción "Desactivar"
- Sección "Catálogo disponible": grid de cursos NO activados con CTA "Activar para [nombre]"
- Sección "Solicitudes de tienda Coin": badge si hay PurchaseStatus = PENDING_APPROVAL
- Sección "Ajustes": idioma preferido, notas para Angela, PIN, auto-approve Coin, etc.

**Activar un curso** (modal o sheet):
- Card del curso con descripción extendida, # lecciones, # competencias, tiempo promedio.
- CTA primario: "Activar para [nombre del hijo]"
- Sin confirmación de cobro (incluido en subscription).
- Toast de confirmación: "✅ Geometry está activado. Avisamos a Sofía."

### 4. UX en el espacio del estudiante

**Dashboard del estudiante** (`/student`):

- Hero variant de Angela visible (ver Epic 02.5-HS).
- Sección "Mis cursos": cards horizontales swipeables (mobile) o grid (desktop), una por curso activo.
- Cada card muestra: nombre del curso + progress bar + próxima lección sugerida + CTA "Continuar".
- Si 0 cursos activados: empty state amistoso con copy "Cuando tu papá active cursos los verás acá. Mientras tanto, podés pasear por el catálogo." (link a `/student/catalog` que muestra el catálogo en read-only — sin botón de activar, eso es solo del padre).

**Cambio de curso en mid-actividad**: si el estudiante está en la mitad de una lección de Math y quiere cambiar a Lengua, navega con el switcher del dashboard. No hay flujo de "salir del grado y entrar a otro" como Wited; cada curso es un espacio independiente.

### 5. Reglas de billing al desactivar

- **Desactivación NO genera prorrateo ni reembolso.** El plan Core $29 da acceso ilimitado al catálogo; desactivar cursos es organizar el dashboard, no ahorrar dinero.
- Si el padre quiere bajar el costo, debe cancelar la subscription del Student completo (no desactivar cursos uno por uno). Esto está alineado con ADR-001 §6.

### 6. Reglas de visibilidad del catálogo para no-pagantes

**Pre-signup (landing page)**:
El catálogo completo es **visible públicamente** en `/[locale]/catalog`. Cada card es read-only con descripción + temas cubiertos + nivel + cantidad de lecciones. CTA por card: "Comenzar para activar este curso" → `/signup?role=parent&plan=core`.

Esto contra-ataca directamente el "no sabes qué hay hasta pagar" de Wited. **Es un differentiator de marketing tan importante como el moat de producto.**

**Familia con subscription activa pero curso no activado**: el padre puede previsualizar lección 1 de cualquier curso del catálogo (sample mode). El hijo puede ver el catálogo pero no abrir lecciones hasta que el padre active el curso para él.

### 7. Schema impact (Prisma) — resumen

Cambios mínimos al modelo de dominio (detalle pleno en Epic 04):

```prisma
enum GradeBand {
  CICLO_BASICO         // 9°-10° (1°-2° Secundario Argentino)
  CICLO_ORIENTADO      // 11°-12° (3°-5° Secundario Argentino)
  TRANSVERSAL          // Inglés ESL, Historia, Música — no atados a 1 año
  // En v1.1 se agregan: PRIMARIA_CICLO_1, PRIMARIA_CICLO_2, SECUNDARIA_BASICA, etc.
}

enum SubjectArea {
  MATH
  LANGUAGE
  ENGLISH_ESL
  HISTORY
  SCIENCE
  MUSIC
  ELECTIVE_OTHER       // catch-all v1.1
}

model Course {
  id              String       @id @default(cuid())
  slug            String       @unique
  title_es        String
  title_en        String
  description_es  String       @db.Text
  description_en  String       @db.Text
  subject         SubjectArea
  gradeBand       GradeBand
  orderIndex      Int          @default(0)
  published       Boolean      @default(false)
  thumbnailUrl    String?
  createdAt       DateTime     @default(now())

  lessons         Lesson[]
  competencies    Competency[]
  enrollments     StudentCourseEnrollment[]

  @@index([subject, gradeBand, published])
}

model Competency {
  id              String   @id @default(cuid())
  course          Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  courseId        String
  code            String   // "ARG-MATH-CB-01" — semantic key
  description_es  String   @db.Text
  description_en  String   @db.Text
  orderIndex      Int      @default(0)
  prerequisites   Competency[] @relation("CompetencyPrereqs")
  unblocks        Competency[] @relation("CompetencyPrereqs")

  lessons         LessonCompetency[]

  @@unique([courseId, code])
}

// Lesson existente: agregar courseId
model Lesson {
  // ... campos existentes
  course          Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  courseId        String
  competencies    LessonCompetency[]
}

model LessonCompetency {
  lesson          Lesson      @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  lessonId        String
  competency      Competency  @relation(fields: [competencyId], references: [id], onDelete: Cascade)
  competencyId    String
  weight          Int         @default(100)  // % contribution to competency mastery

  @@id([lessonId, competencyId])
}
```

Migration documentada en `prisma/migrations/manual/0004-catalog-courses-enrollments.sql` (idempotente, aditiva).

### 8. Cómo el grado del Student se relaciona con la activación

**El grado del Student (campo `gradeLevel`) sigue existiendo y se usa como heurística**, no como gate:

- En el flow de "Activar curso" en Parent Copilot, los cursos cuyo `gradeBand` corresponde al grado del hijo aparecen primero, marcados como "Recomendado para [nombre]".
- Cursos de gradeBand distinto siguen visibles pero al final del listado.
- El padre tiene control total: si su hijo de 9° está adelantado y quiere Geometry de 10°-11°, activa y listo.

**No hay validación dura "este curso es solo para 11°-12°"**. La pedagogía adaptativa de Midsea (Coin por mastery, Angela coach) maneja la dificultad real.

## Consecuencias

**Positivas.**
- Moat anti-Wited operativo desde día 1: catálogo visible pre-signup, activación granular post-signup, sin paquetes cerrados.
- Familia con hijos de edades distintas obtiene valor diferencial: un padre con hijos en 9° y 12° puede armar planes muy distintos sin pagar más.
- Estudiantes adelantados o atrasados respecto del grado nominal no quedan castigados por el catálogo.
- Simplifica el código: enrollment es una sola tabla, no hay lógica enredada de "grado del student × calendario × catálogo".

**Negativas.**
- Más decisiones para el padre durante onboarding. Mitigación: defaults inteligentes ("Activamos los 4 cursos del nivel de Sofía y podés ajustar después") + tour de 60 segundos.
- Si el padre activa 8 cursos para un hijo y nunca los toca, dashboard del estudiante se ve sobrecargado. Mitigación: empty state amistoso si 0 progreso, sugerencia inline "Sofía no abrió Música hace 30 días — ¿desactivar para enfocar?".
- Reportes regulatorios (v1.1) deben adaptarse: la jurisdicción no espera "el chico está en 10°, acá la grilla". Espera "el chico cursó estas materias por estas horas". Compatible pero requiere mapping cuidadoso.

## Alternativas descartadas

| Alternativa | Razón |
|---|---|
| Paquete por grado (Wited-style) | Es el anti-patrón que estamos resolviendo. |
| Asignación manual lección por lección (Time4Learning-style) | Demasiada carga operativa para el padre. Curso = unidad mínima de activación. |
| Limit de cursos activos por plan (Core 3, Pro ilimitado) | Complica el pricing sin ganar diferenciación. Mejor que Pro suba en valor agregado (Coin, reportes), no en feature gating del catálogo. |
| Cobro adicional por curso | Vuelve al modelo Wited "pagás por lo que ves". Pierde el moat. |
| Activación automática según grado | Sirve como default pero no como regla; el control es del padre. |

## Referencias cruzadas

- `ADR-003-pivot-to-hs-multi-course-catalog.md` (alcance del catálogo HS).
- `docs/DMP-HS-addendum.md` (Wited anti-patrón principal).
- `docs/curriculum/midsea-hs-catalog.md` (los 9 cursos del pilot con `gradeBand` por curso).
- Epic 04-HS implementa este ADR.

---

*Revisar este ADR cuando: (a) el pilot arroje feedback sobre fricción del flujo de activación, (b) consideremos abrir el catálogo a marketplace de terceros (publishers externos en v3+), (c) el modelo Family con multi-hijos genere casos edge en activación.*

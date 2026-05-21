# CLAUDE.md — Prompt de Arquitectura para Midsea

> **Rol:** Eres el arquitecto de software principal de Midsea.  
> **Misión:** Construir una plataforma de homeschooling bilingüe con AI tutoring y gamificación que sea **funcionalmente superior** a cualquier referencia (Wited, Miacademy, etc.).  
> **Regla de oro:** Midsea NO es un clon de nadie. Las referencias demuestran el problema; Midsea resuelve mejor.

---

## 1. DOCUMENTOS MAESTROS

1. **PRD.md** (raíz) — Estrategia de producto, ICP, roadmap. **Leer antes de cualquier tarea.**
2. **docs/DMP.md** — Documento Maestro de Posicionamiento Competitivo (versión original, K-12 amplio). **Consultar para decisiones de feature que toquen diferenciación, UX core o pricing en alcance NO-pilot.** Contexto caro (~4,200 palabras).
3. **docs/DMP-HS-addendum.md** — Addendum activo que sobrescribe el DMP para el scope del pilot HS Argentina. **Leer antes de DMP.md cuando la tarea toca pilot HS (9°-12°, catálogo a la carta, Coin economy, Wited anti-patrón).**
4. **docs/AI_TUTOR_SPEC.md** — Especificación técnica del tutor AI "Angela" y experiencia estudiante. **Leer antes de tocar cualquier código en `src/lib/tutor/` o `src/app/[locale]/(student)/`.**
5. **docs/decisions/ADR-*.md** — Architecture Decision Records. Foundational para entender el por qué del estado actual:
   - ADR-001: Stripe billing stack + suscripción por estudiante.
   - ADR-002: Angela como nombre canónico (no Sylvie).
   - ADR-003: Pivot a HS Argentina + catálogo de cursos a la carta.
   - ADR-004: Coin como moneda interna con poder pedagógico.
   - ADR-005: Activación de cursos por estudiante (anti-Wited).
   - ADR-006: Pipeline de generación de contenido (outline humano → AI → review → ingesta).
   - ADR-007: Midsea como plataforma cristiana explícita (ICP, tono Angela, messaging, moat).
6. **Este archivo (CLAUDE.md)** — Reglas de código, stack, estructura, convenciones. **Leer siempre.**

**Jerarquía de conflictos:** ADR específicos > PRD.md > docs/DMP-HS-addendum.md (para scope HS pilot) > docs/DMP.md > docs/AI_TUTOR_SPEC.md > CLAUDE.md.

**Regla anti-copia.** Si una tarea sugiere replicar un patrón de Wited (paquete cerrado por grado, asistencia humana asíncrona, UI escolar densa), Miacademy (gamificación cosmética), Time4Learning, MiaPrep (acreditación cara) o Smartick, primero verifica en `docs/DMP-HS-addendum.md §8` (anti-patrones canónicos) si ese patrón está marcado como "Anti-patrón a evitar". Si lo está, propón la alternativa de Midsea en lugar de implementar la copia.

---

## 2. PROJECT IDENTITY

**Midsea** — Plataforma de homeschooling **cristiana bilingüe** (español LATAM neutro, inglés escalado) con AI tutoring agentic, gamificación con poder pedagógico real, y catálogo de cursos a la carta.

- Rebrand completo de EduNexo. **CERO referencias al nombre viejo.**
- **Identidad cristiana explícita (ADR-007)**: cosmovisión cristiana denominacionalmente abierta, no proselitista, embedida en contenido y en tono de Angela. NO hay toggle "modo secular" — familias seculares no son el ICP.
- **Mercado total**: **familias cristianas hispanohablantes de toda Latinoamérica** + diáspora hispana en US/Europa/Brasil. NO es producto "argentino" — es producto **LATAM amplio**. Pilot lanza con foco Argentina + diáspora argentina por la disponibilidad del contenido base, pero está diseñado desde día 1 para servir a México, Colombia, Chile, Perú, República Dominicana, Costa Rica, Venezuela, US Hispanic, etc.
- **Pilot v1 (en desarrollo, lanzamiento ~10-11 semanas)**: HS Pilot Mínimo (8 cursos cubriendo 9°-10° en las 6 materias core), 10-30 familias cristianas beta — mayoría argentinas/diáspora por el contenido base, abierto a otros LATAM.
- **v1.1 post-pilot**: rolling release de 14 cursos restantes HS (Mat 11-12, Lengua 11/12, Inglés ESL 11/12, Ciencias adicionales, Historia Mundial I+II, Música 10-12). Más adelante: expansión a K-6 + 7°-8° con variantes culturales por país latino (Historia de México, RD, Colombia, Costa Rica, etc.).
- Precio: $29/mes Core, $45/mes Pro, $69/mes Family (4 hijos) — todo USD. Plan Core incluye acceso ilimitado al catálogo base + cuantos cursos quiera activar el padre por hijo.
- **Coin** como moneda interna: se gana por mastery ≥80%, se gasta en productos premium de la tienda (cursos especializados, masterclasses, electivos). Padre puede regalar Coin packs comprables en Stripe ($9/$25/$50).
- **Tono Angela y UI**: **español LATAM neutro** (es-419). Sin voseo argentino, sin "vosotros" español peninsular, sin slang local pesado. Vocabulario académico comprensible para cualquier estudiante hispanohablante (ej. "computadora" no "ordenador" ni "compu"; "auto" o "carro" según contexto neutro; "tarea" para schoolwork). Variantes regionales son personalización futura (v2+), no v1.
- **Ritmo**: self-paced con sugerencia. El año escolar argentino (Marzo-Diciembre) del contenido base es referencia pedagógica pero NO constraint — familias con calendarios distintos (mexicano Agosto-Junio, US Septiembre-Junio, etc.) también son bienvenidas. El sistema sugiere "tu mes recomendado es X según cuándo empezaste".

---

## 3. STACK TÉCNICO

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| **Framework** | Next.js 14+ (App Router) | SSR para SEO, SPA para app experience |
| **Lenguaje** | TypeScript | Type safety en todo el proyecto |
| **Estilos** | Tailwind CSS | Utility-first, responsive, consistente |
| **DB** | PostgreSQL + Prisma | Relacional para dominios DDD |
| **Cache/Realtime** | Redis | Sesiones, contexto de tutor, cache |
| **Auth** | NextAuth.js / Clerk | Multi-rol (estudiante, padre, tutor humano) |
| **AI** | OpenAI SDK (GPT-4o-mini → GPT-4o) | Streaming, function calling, vision |
| **i18n** | next-intl | Español nativo, inglés escalado, es-419/es-ES |
| **Estado UI** | Zustand + TanStack Query | Local state + server state sync |
| **Animaciones** | Framer Motion + Rive (avatar Angela) | Fluidas, interactivas, performantes |
| **Canvas/Workspace** | React-Flow / TLDraw (futuro) | Mapa de competencias visual |

---

## 4. ESTRUCTURA DE DIRECTORIOS

```
PRD.md                          # Fuente de verdad estratégica
AI_TUTOR_SPEC.md                # Especificación técnica del tutor AI
CLAUDE.md                       # Este archivo
src/
  app/                          # Rutas Next.js App Router
    [locale]/                   # next-intl routing
      (student)/                # Layout del estudiante
        dashboard/              # Canvas principal (NO grid de materias tipo Wited)
        learn/                  # Rutas de aprendizaje por competencias
        stuck/                  # "Estoy atascado" — flujo de emergencia
        prep/                   # "Practicar para prueba" — plan adaptativo
        explore/                # "Aprender algo nuevo" — descubrimiento
        review/                 # "Revisar lo que sé" — spaced repetition
        classes/                # Clases grupales/particulares
        tools/                  # Herramientas (calculadora, notas, etc.)
        store/                  # Tienda Coin
        profile/                # Perfil del estudiante
      (parent)/                 # Layout del padre
        dashboard/              # Parent Copilot — 5 min overview
        reports/                # Reportes regulatorios
        planner/                # Planificador semanal AI
        insights/               # Análisis predictivo
        settings/               # Configuración familiar
      api/                      # API Routes
        tutor/                  # Endpoints del tutor AI
        assessment/             # Assessments adaptativos (IRT)
        gamification/           # Motor de puntos y logros
        content/                # Micro-lecciones
  components/
    ui/                         # Componentes base (shadcn/ui style)
    tutoring/                   # Angela: avatar, chat, widget, hints
    gamification/               # Badges, niveles, progreso, tienda
    learning/                   # Canvas de competencias, micro-lecciones
    auth/                       # Login, registro, multi-rol
    parent/                     # Componentes del dashboard parental
  lib/
    tutor/                      # Motor del tutor AI
      AngelaStateMachine.ts     # Máquina de estados del avatar
      StudentContextEngine.ts   # Perfil cognitivo persistente
      CurriculumContextEngine.ts # Contexto curricular en tiempo real
      SessionContextEngine.ts   # Contexto de sesión volátil
      CognitiveAdapter.ts       # Adaptador de formato/dificultad
      EmotionDetector.ts        # Detección de frustración/engagement
      ResponseGenerator.ts      # Generación de respuestas (OpenAI)
      ActionParser.ts           # Parser de acciones del LLM
    gamification/               # Motor de puntos, logros, economía
    i18n/                       # Config next-intl, diccionarios
    prisma.ts                   # Cliente singleton Prisma
    openai.ts                   # Cliente servidor OpenAI
    irt.ts                      # Item Response Theory para assessments
  types/                        # Interfaces globales TypeScript
  hooks/                        # Custom React hooks
public/
  assets/
    angela/                     # Animaciones Rive/Lottie del avatar
    badges/                     # Iconos de logros
    worlds/                     # Ilustraciones de mundos temáticos
```

---

## 5. REGLAS DE ORO DEL CÓDIGO

### 5.1. i18n Primero
- **TODO texto de UI usa `t('key')` de next-intl.**
- Nunca hardcodees strings en español o inglés.
- Las keys deben ser semánticas: `t('tutor.angela.greeting')`, no `t('text_1')`.

### 5.2. AI Streaming
- Respuestas de Angela **palabra por palabra** (SSE streaming).
- Nunca esperes JSON completo antes de mostrar algo al usuario.
- Usar `ActionParser` para detectar acciones (visual, ejercicio, alerta) del stream.

### 5.3. Seguridad
- API keys solo en `.env.local` (servidor).
- Nunca en componentes React o en el bundle del cliente.
- Validar todos los inputs con Zod.

### 5.4. Responsive Mobile-First
- Tablet es el dispositivo principal del estudiante.
- Mobile: bottom sheets, swipe gestures, voice input.
- Desktop: canvas/workspace, drag & drop, shortcuts.

### 5.5. a11y
- Labels, aria-labels, contrastes AA mínimo.
- Voice input para pre-lectores (K-2).
- Keyboard navigation para todo.

### 5.6. No EduNexo
- `grep -ri "edunexo" .` antes de cada commit.
- Cero referencias al nombre viejo en código, comentarios, assets.

---

## 6. PRINCIPIOS DE ARQUITECTURA DE DOMINIO

### 6.1. Domain-Driven Design (DDD)
- El dominio principal es **`StudentProgression`**, no `ContentCatalog`.
- Entidades centrales: `Learner`, `Competency`, `LearningPath`, `StudyPod`, `MentorSession`, `Assessment`.
- **Evita a toda costa** modelar el sistema como un CMS escolar (materias, grados, unidades como entidades dominantes).

### 6.2. Modularidad extrema
- Cada dominio (`tutor`, `gamification`, `learning`, `parent`) es independiente.
- Comunicación vía eventos de dominio, no imports directos.
- La IA no es un servicio monolítico; es un **orquestador de capacidades**.

### 6.3. API-First & Event-Driven
- Cada dominio expone una API REST/GraphQL interna.
- Eventos: `CompetencyUnlocked`, `StudyPodMatched`, `AssessmentCompleted`, `AngelaIntervened`.

---

## 7. PRINCIPIOS DE EXPERIENCIA DE USUARIO

### 7.1. Navegación por intención (NO por jerarquía)
El estudiante nunca debe pensar "¿en qué materia está esto?". Debe pensar "¿qué necesito ahora?".

**Estados de intención principales:**
1. **`/stuck`** — "Estoy atascado en una tarea"
2. **`/prep`** — "Quiero practicar para una prueba"
3. **`/explore`** — "Quiero aprender algo nuevo"
4. **`/review`** — "Quiero revisar lo que ya sé"

### 7.4. Audiencia HS (pilot) — adaptaciones específicas

El ICP del pilot es **padre/madre de adolescente hispanohablante cristiano de 13-17 años** (no madre con niño K-6 del PRD original). Mayoría en Argentina + diáspora argentina al lanzar, abierto a familias cristianas de toda LATAM. UX adaptado:

- **Sin voice-first para pre-lectores** — todos los estudiantes pilot saben leer en español.
- **Sin gamificación cosmética infantil** — los adolescentes no se emocionan con badges decorativos. Coin tiene poder pedagógico real (desbloquea cursos premium, ver ADR-004).
- **Mayor autonomía del estudiante** — el adolescente decide cuándo estudiar, cuánto, qué orden. El padre supervisa con Parent Copilot (5 min/día), no microgestiona.
- **Catálogo de cursos visible públicamente pre-signup** — anti-Wited. El padre y el estudiante pueden auditar qué hay antes de pagar.
- **Activación de cursos por hijo, no por grado** — el grado del estudiante es heurística para sugerir defaults, no constraint del catálogo (ADR-005).
- **Tono académico-respetuoso de Angela en español LATAM neutro** — sin infantilismo, sin voseo argentino, sin "vosotros" peninsular, sin slang local pesado. Vocabulario universal hispanohablante. Capacidad de chain-of-thought visible para Math/Ciencias. Referencias culturales amplias (cuando habla de literatura puede citar Borges, García Márquez, Vargas Llosa, Octavio Paz — no solo argentinos).

### 7.5. Tienda Coin y parent approval (ADR-004)

- Productos premium en `/student/store` solo se compran con Coin (no cash directo).
- Toda compra requiere aprobación del padre por default; opcional auto-approve hasta X Coin/semana.
- Padre puede regalar Coin packs vía Stripe ($9 = 1000 Coin, $25 = 3000, $50 = 7000).
- El catálogo base (los 9 cursos del pilot HS) NUNCA cuesta Coin — está incluido en la subscription mensual.

### 7.6. Identidad cristiana en el producto (ADR-007)

- **Angela** tiene cosmovisión cristiana coherente y respetuosa, sin ser predicadora ni catequista. Puede referenciar valores cristianos naturalmente cuando son relevantes; nunca presiona conversión.
- **Contenido curricular** está informado por cosmovisión cristiana: textos cristianos clásicos cuando aplique en Lengua, rol del cristianismo en Historia, ciencia rigurosa con marco respetuoso, ESL con contextos cristianos, Música con repertorio sagrado clásico.
- **"Momento de reflexión"** opcional al cierre de cada lección — un versículo o pregunta que conecte el aprendizaje con valores cristianos sin forzar (campo `reflectionEs`/`reflectionEn` en `Lesson`).
- **Denominacionalmente abierto**: contenido apto para católicos, evangélicos, protestantes históricos, ortodoxos. Doctrinas específicas se delegan al padre/pastor.
- **Signup explícito**: el padre acepta durante registration que Midsea es plataforma cristiana. Sin opt-out post-signup.
- **No proselitismo**: la fe del adolescente es respetada. Angela no presiona conversión ni emite declaraciones doctrinales sectarias.

### 7.2. Cero Clicks Profundos
Ninguna acción core debe requerir más de 3 clicks desde la pantalla principal.
- Command palette (Ctrl+K / Cmd+K) para navegación universal.
- Bottom sheets en mobile en vez de páginas anidadas.
- Inline editing siempre que sea posible.

### 7.3. Diseño Emocional
- Estados de carga que educan ("Analizando tus patrones de error...").
- Micro-animaciones en desbloqueos de competencias.
- Paleta por **estado emocional/intención**, no por materia:
  - 🔵 Focus (práctica profunda)
  - 🟢 Discovery (exploración)
  - 🟠 Recovery (revisión de errores)
  - 🟣 Collaboration (Study Pods)

---

## 8. CÓMO TRABAJAR CON CLAUDE CODE

1. **Lee PRD.md siempre. Lee docs/AI_TUTOR_SPEC.md si la tarea toca el tutor o la experiencia del estudiante. Lee docs/DMP.md si la tarea toca diferenciación, UX core o pricing.**
2. **Pregunta primero, codea después.** Si una tarea parece requerir una jerarquía Materia→Grado→Unidad, detente y replantéala como una Ruta de Competencias.
3. **Piensa en estados emocionales.** ¿Este componente reduce ansiedad o la aumenta? ¿Es claro qué hacer siguiente?
4. **Mantén la IA integrada, no aislada.** No crees un "componente de chatbot". Crea un "servicio de explicación adaptativa" que se invoque desde `/stuck`, `/prep`, etc.
5. **Documenta decisiones de arquitectura.** Si introduces un nuevo dominio o entidad, actualiza AI_TUTOR_SPEC.md.
6. **Testea con intenciones, no con datos.** Un test debe simular: "María está atascada en una ecuación de 5° básico" → no "María abre la unidad 3 de matemáticas".
7. **Revisa i18n.** Todo texto nuevo debe tener su key en los diccionarios.
8. **Type-check antes de commitear.** `npm run type-check`.

---

## 9. COMANDOS ÚTILES

```bash
# Buscar referencias residuales al nombre viejo
grep -ri "edunexo" .

# Type-check antes de commitear
npm run type-check

# Generar tipos de Prisma
npx prisma generate

# Seed de datos de prueba
npx prisma db seed

# Lint
npm run lint

# Test unitarios
npm run test
```

---

## 10. GLOSARIO DE TÉRMINOS DE DOMINIO

| Término | Definición |
|---------|-----------|
| **Angela** | Tutor AI de Midsea. Agente autónomo con memoria, perfil cognitivo y contexto curricular. Tono académico-respetuoso para HS (no infantil). |
| **Competencia** | Habilidad demostrable y medible (ej: "Resuelve ecuaciones lineales con dos incógnitas"). Modelo `Competency` en Prisma, agrupada por `Course`. |
| **Curso (Course)** | Unidad mínima de activación en el catálogo. Cada curso tiene N competencias y N lecciones. El padre activa cursos por hijo (ADR-005). |
| **Ruta de Aprendizaje** | Secuencia adaptativa de competencias dentro de un curso para alcanzar un objetivo. |
| **Micro-lección** | Unidad de contenido de 3-10 minutos, con un solo objetivo de aprendizaje. Generada por pipeline ADR-006. |
| **Coin** | Moneda interna con poder pedagógico real. Se gana por mastery ≥80% en lecciones del catálogo base. Se gasta en productos premium de la tienda (ADR-004). NO es cosmética. |
| **Coin pack** | SKU comprable en Stripe que el padre regala al hijo: $9/1000 Coin, $25/3000 Coin, $50/7000 Coin. |
| **StoreItem** | Producto premium en la tienda Coin (curso especializado, masterclass, electivo). Solo se compra con Coin, no con cash directo. |
| **MasteryMap** | Mapa de competencias del estudiante por curso activo. Nivel 0-4 por concepto. Derivable de `LessonProgress` agregado por `Competency`. |
| **Parent Copilot** | Dashboard del padre con planificación AI, alertas proactivas, reportes regulatorios (v1.1+), gestión de cursos activos por hijo, aprobación de compras en tienda Coin. |
| **Catálogo a la carta** | El padre activa cursos selectivamente por hijo, sin límite numérico en plan Core. Anti-patrón de "paquete cerrado por grado" de Wited (ADR-005). |
| **Study Pod** | Grupo de 3-4 estudiantes emparejados por debilidades complementarias. v2+ post-PMF. |
| **ProactiveHint** | Sugerencia no-intrusiva de Angela cuando detecta dificultad. Burbuja contextual al cargar dashboard. |
| **IRT** | Item Response Theory. Algoritmo para assessments adaptativos. v2+ (Epic 06). |
| **Ciclo Básico / Orientado** | Niveles del Secundario argentino. Básico = 9°-10° (1°-2° Sec AR); Orientado = 11°-12° (3°-5° Sec AR). Mapeados a `GradeBand` enum. |

---

*Última actualización: 2026-05-21 (Pivot a HS Argentina + Coin economy + catálogo a la carta + pipeline de generación).*  
*Este documento es un contrato vivo. Si el dominio evoluciona, este prompt debe evolucionar.*

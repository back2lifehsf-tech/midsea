# CLAUDE.md — Prompt de Arquitectura para Midsea

> **Rol:** Eres el arquitecto de software principal de Midsea.  
> **Misión:** Construir una plataforma de homeschooling bilingüe con AI tutoring y gamificación que sea **funcionalmente superior** a cualquier referencia (Wited, Miacademy, etc.).  
> **Regla de oro:** Midsea NO es un clon de nadie. Las referencias demuestran el problema; Midsea resuelve mejor.

---

## 1. DOCUMENTOS MAESTROS

1. **PRD.md** (raíz) — Estrategia de producto, ICP, roadmap. **Leer antes de cualquier tarea.**
2. **docs/DMP.md** — Documento Maestro de Posicionamiento Competitivo: análisis de 5 competidores, UVP por audiencia, priorización estratégica. **Consultar antes de decisiones de feature que toquen diferenciación, UX core o pricing.** No leer para bugs triviales o ajustes UI sin implicaciones estratégicas: es contexto caro (~4,200 palabras).
3. **docs/AI_TUTOR_SPEC.md** — Especificación técnica del tutor AI "Angela" y experiencia estudiante. **Leer antes de tocar cualquier código en `src/lib/tutor/` o `src/app/[locale]/(student)/`.**
4. **Este archivo (CLAUDE.md)** — Reglas de código, stack, estructura, convenciones. **Leer siempre.**

**Jerarquía de conflictos:** PRD.md > docs/DMP.md > docs/AI_TUTOR_SPEC.md > CLAUDE.md

**Regla anti-copia.** Si una tarea sugiere replicar un patrón de Miacademy, Wited, Time4Learning, Pruebat.org o Smartick, primero verifica en `docs/DMP.md §2` si ese patrón está marcado como "Rechazo estratégico". Si lo está, propón la alternativa de Midsea en lugar de implementar la copia.

---

## 2. PROJECT IDENTITY

**Midsea** — Plataforma de homeschooling bilingüe (español nativo, inglés escalado) con AI tutoring agentic y gamificación profunda.

- Rebrand completo de EduNexo. **CERO referencias al nombre viejo.**
- Target: Padres homeschoolers en LATAM, España, comunidades hispanas en EE.UU.
- Precio: $29/mes Core, $45/mes Pro, $69/mes Family (4 hijos).

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
| **Angela** | Tutor AI de Midsea. Agente autónomo con memoria, perfil cognitivo y contexto curricular. |
| **Competencia** | Habilidad demostrable y medible (ej: "Resuelve ecuaciones lineales con dos incógnitas"). |
| **Ruta de Aprendizaje** | Secuencia adaptativa de competencias para alcanzar un objetivo. |
| **Micro-lección** | Unidad de contenido de 3-10 minutos, con un solo objetivo de aprendizaje. |
| **Coin** | Moneda virtual de Midsea. Se gana por mastery (80%+), no por tiempo. |
| **MasteryMap** | Mapa de competencias del estudiante. Nivel 0-4 por concepto. |
| **Parent Copilot** | Dashboard del padre con planificación AI, alertas proactivas y reportes regulatorios. |
| **Study Pod** | Grupo de 3-4 estudiantes emparejados por debilidades complementarias. |
| **ProactiveHint** | Sugerencia no-intrusiva de Angela cuando detecta dificultad. |
| **IRT** | Item Response Theory. Algoritmo para assessments adaptativos. |

---

*Última actualización: 2026-05-18 (DMP.md añadido a jerarquía de documentos maestros).*  
*Este documento es un contrato vivo. Si el dominio evoluciona, este prompt debe evolucionar.*

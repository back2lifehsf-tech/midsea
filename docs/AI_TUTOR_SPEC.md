# AI_TUTOR_SPEC.md — Especificación del Tutor AI y Experiencia Estudiante Midsea

> **Documento técnico para Claude Code.**  
> **Basado en análisis de Wited (referencia funcional) + PRD.md (estrategia Midsea).**  
> **Regla:** Midsea NO copia Wited. Wited demuestra el problema; Midsea resuelve mejor.

---

## 1. ANÁLISIS COMPETITIVO: Qué hace Wited (y por qué es insuficiente)

### 1.1. Estructura de Wited observada en el video

| Sección | Qué hace Wited | Por qué es mediocre |
|---------|---------------|---------------------|
| **Sidebar** | Menú estático: Inicio, Aprender, Preguntar, Clases, Herramientas, Tienda, Perfil | Jerárquico, no responde a intención. El estudiante debe "saber dónde buscar". |
| **Inicio** | Cards de materias con % completado + chatbot Max AI + Profe Express | Dashboard pasivo. Max AI es un chatbot genérico sin contexto del estudiante. |
| **Max AI** | Chat flotante con avatar estático. Responde preguntas tipo "qué son fracciones". | **NO** sabe qué lección estás haciendo. **NO** detecta frustración. **NO** adapta el formato. Es Google con avatar. |
| **Learning Path** | Lista lineal de temas con checkmarks (Biología → Unidad 1 → 14 temas → Quiz) | Secuencia rígida. Si fallas un tema, no hay adaptación. Solo "repite". |
| **Profe Express** | Formulario para enviar pregunta a profesor humano (5 disponibles/mes) | Latencia de horas. No escalable. El estudiante espera en vez de aprender. |
| **Calificaciones** | Tabla Excel-style con notas N°1-N°5 y promedio final | Datos crudos sin insights. El padre debe interpretar. |
| **Estadísticas** | Barras de progreso por materia + contadores de actividades | Métricas de actividad, no de aprendizaje. "131 temas aprobados" ≠ "dominó fracciones". |
| **Desafíos** | Puzzles de lógica tipo "¿cuál número va en la X?" con recompensa de MaxPoints | Gamificación superficial. Los puzzles no conectan con el currículo. Pérdida de puntos por error = motivación extrínseca tóxica. |
| **Perfil** | Formulario básico: nombre, usuario, curso, cumpleaños, zona horaria | Cero personalización del perfil de aprendizaje. |

### 1.2. Problemas fundamentales de Wited que Midsea debe resolver

1. **Max AI no tiene memoria ni contexto.** Cada conversación empieza de cero. No sabe que el estudiante ya vio fracciones ayer o que falló 3 veces en denominadores.
2. **Navegación por descubrimiento, no por intención.** El estudiante debe recordar "esto va en Biología, Unidad 3".
3. **Feedback loop roto.** Error → "incorrecto" → sin explicación adaptada. El estudiante no aprende del error.
4. **Gamificación sin propósito.** MaxPoints por puzzles aislados ≠ mastery del currículo.
5. **Cero adaptación al estilo de aprendizaje.** Visual, kinestésico, auditivo: a todos les explica igual.
6. **Profe Express como parche.** La IA debería resolver 90% de dudas en tiempo real; el humano es escalón superior, no fallback.

---

## 2. VISIÓN: El Tutor AI de Midsea — "Sylvie"

### 2.1. Identidad de Sylvie

Sylvie no es un chatbot. Es un **agente educativo autónomo** con:
- **Memoria persistente** de cada interacción, error, éxito, preferencia.
- **Perfil cognitivo** del estudiante (visual, textual, kinestésico, auditivo).
- **Contexto curricular** en tiempo real (sabe en qué lección está, qué prerequisitos faltan, qué viene después).
- **Detección emocional** por texto (frustración, confianza, aburrimiento) y velocidad de respuesta.
- **Multimodalidad** (texto, voz, imágenes generadas, diagramas interactivos).
- **Bilingüismo nativo** (español default, inglés escalado, code-switching natural).

### 2.2. Estados de Sylvie (avatar dinámico)

El avatar de Sylvie **cambia de estado visual** según el contexto:

| Estado | Trigger visual | Comportamiento |
|--------|---------------|----------------|
| 🟢 **Activo/Atento** | Estudiante en lección, respondiendo correctamente | Animación sutil (respiración, parpadeo). Disponible pero no intrusivo. |
| 🟡 **Sugiriendo** | Detecta pausa >15s o patrón de error | Se acerca suavemente. "¿Necesitas una pista?" o "¿Te explico de otra forma?" |
| 🔵 **Explicando** | Estudiante pidió ayuda o Sylvie intervino | Animación de "pensando" → explicación con gestos (si avatar 3D/Lottie). |
| 🟠 **Animando** | Estudiante completó lección o superó obstáculo | Celebración personalizada (baile, confeti, sonido). |
| 🔴 **Alerta** | Frustración detectada (>3 errores seguidos, tiempo excesivo) | Notificación suave al estudiante + alerta al padre (si configurado). |
| ⚪ **Descanso** | Estudiante inactivo >5 min | Se "duerme" o hace otra cosa. No intrusivo. |

**Implementación:** Avatar como componente React con estados manejados por Zustand. Animaciones via Lottie o Rive (preferido para interacción). Estados definidos por el `TutorStateMachine` (ver sección 5).

---

## 3. FLUJOS DE INTERACCIÓN PRINCIPALES

### 3.1. Flujo "Estoy atascado" (/stuck) — MEJORADO vs Wited

```
Wited: Estudiante escribe "fracciones" → Max AI explica qué son fracciones genéricamente.
       No sabe que el estudiante está en la lección de "suma de fracciones".
       No sabe que falló 2 veces en el mismo ejercicio.

Midsea: Estudiante hace click en Sylvie (siempre visible) o presiona Ctrl+K.
        Sylvie YA SABE:
          - Estás en Matemática 5°, Lección 12: "Suma de fracciones con diferente denominador"
          - Llevas 8 min en el ejercicio 3 (promedio de clase: 3 min)
          - Tus últimos 2 intentos fallaron en "encontrar mcm"
          - Tu perfil cognitivo dice que eres visual

        Sylvie: "Veo que el mínimo común múltiplo te está costando. 
                ¿Te muestro un diagrama de barras para visualizarlo?"

        [Estudiante acepta]

        Sylvie genera diagrama interactivo + explicación paso a paso.
        Luego: ejercicio isomórfico (mismo concepto, números diferentes) para validar.
        Si acierta: "¡Perfecto! Ahora intentemos el original."
        Si falla: "No te preocupes. Vamos a un nivel más básico. ¿Sabes qué es el mcm?"
```

**Diferenciador clave:** Sylvie no espera a que el estudiante pregunte. **Interviene proactivamente** basado en datos de comportamiento.

### 3.2. Flujo "Practicar para prueba" (/prep) — NO EXISTE EN WITED

```
Estudiante: "Tengo prueba de Biología el viernes"
Sylvie:
  1. Genera assessment diagnóstico de 10 preguntas (IRT adaptativo).
  2. Identifica brechas: "Dominas 80% de Coordinación y Regulación, 
     pero te falta Termorregulación (60%)."
  3. Crea plan de 3 días:
     - Martes: Micro-lección de Termorregulación (8 min) + 5 ejercicios
     - Miércoles: Quiz de toda la unidad (15 min)
     - Jueves: Revisión de errores + ejercicios de refuerzo
  4. Agrega al calendario del estudiante (visible en su canvas).
  5. Notifica al padre: "María tiene prueba viernes. Plan de estudio creado. 
     ¿Quieres que reserve 30 min de sesión con Sylvie mañana?"
```

### 3.3. Flujo "Aprender algo nuevo" (/explore) — NO EXISTE EN WITED

```
Estudiante: "¿Por qué el cielo es azul?" (curiosidad libre)
Sylvie:
  1. Mapea a competencias del currículo: "Dispersión de la luz" → Física 6° → Óptica
  2. Genera ruta de descubrimiento:
     - Video corto (2 min): "¿Qué es la luz blanca?"
     - Experimento virtual: Separar luz con prisma
     - Conexión: "Esto conecta con tu lección de Ciencias de la semana pasada: 
                ¿recuerdas los colores del arcoíris?"
  3. Si el estudiante domina: desbloquea badge "Curioso Científico" + 
     sugiere lección formal del currículo.
  4. Registra en el perfil: "Interés demostrado en óptica → 
     priorizar lecciones relacionadas en próximas semanas."
```

### 3.4. Flujo "Revisar lo que sé" (/review) — MEJORADO vs Wited

```
Wited: Lista lineal de temas con checkmarks. El estudiante debe recordar qué repasar.

Midsea: Spaced repetition adaptativo basado en:
  - Errores históricos (cuánto tiempo hace, cuántas veces falló)
  - Próximas evaluaciones formales
  - Patrones de olvido del estudiante (algunos olvidan en 3 días, otros en 7)

Sylvie: "Hoy toca repasar: fracciones equivalentes (última vez: hace 5 días, 
        1 error). 10 minutos. ¿Empezamos?"

[Si el estudiante acierta todo rápido]
Sylvie: "¡Dominado! Próxima revisión en 10 días."

[Si falla]
Sylvie: "Parece que necesitamos reforzar. Te sugiero una micro-sesión 
        de 5 min ahora o mañana por la mañana (tu horario óptimo)."
```

---

## 4. ARQUITECTURA DEL TUTOR AI

### 4.1. Componentes del Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SYLVIE — AI TUTOR ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │   Student    │    │  Curriculum  │    │   Session    │                   │
│  │   Context    │    │   Context    │    │   Context    │                   │
│  │   Engine     │    │   Engine     │    │   Engine     │                   │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                   │
│         │                   │                   │                            │
│         └───────────────────┼───────────────────┘                            │
│                             ▼                                                │
│                    ┌─────────────────┐                                       │
│                    │  Context Fusion │  ← Combina los 3 contextos en prompt   │
│                    │     Layer       │                                       │
│                    └────────┬────────┘                                       │
│                             ▼                                                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │   Emotion    │    │  Cognitive   │    │   Response   │                   │
│  │  Detection   │───▶│   Adapter    │───▶│  Generator   │                   │
│  │   (Text+Time)│    │ (Format/Ritmo│    │  (OpenAI/    │                   │
│  │              │    │  /Dificultad)│    │   Claude)    │                   │
│  └──────────────┘    └──────────────┘    └──────┬───────┘                   │
│                                                  │                           │
│                             ┌────────────────────┘                           │
│                             ▼                                                │
│                    ┌─────────────────┐                                       │
│                    │  Streaming      │  ← Palabra por palabra (no bloques)   │
│                    │  Response       │                                       │
│                    └────────┬────────┘                                       │
│                             ▼                                                │
│                    ┌─────────────────┐                                       │
│                    │  Action Parser  │  ← Detecta: explicar, ejercicio,      │
│                    │  (JSON mode)    │    imagen, alerta_padre, etc.         │
│                    └────────┬────────┘                                       │
│                             ▼                                                │
│                    ┌─────────────────┐                                       │
│                    │  UI Orchestrator│  ← Actualiza avatar, muestra          │
│                    │  (React/Zustand)│    diagramas, lanza ejercicios        │
│                    └─────────────────┘                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2. Student Context Engine

Datos persistentes por estudiante (PostgreSQL + Redis cache):

```typescript
interface StudentContext {
  id: string;
  cognitiveProfile: {
    learningStyle: ('visual' | 'auditory' | 'kinesthetic' | 'reading')[];
    attentionSpan: 'short' | 'medium' | 'long'; // afecta longitud de explicaciones
    pace: 'slow' | 'medium' | 'fast'; // afecta dificultad de ejercicios
    preferredExplanationFormat: 'analogy' | 'procedural' | 'conceptual' | 'story';
  };
  errorPatterns: Array<{
    conceptId: string;
    errorType: 'conceptual' | 'procedural' | 'careless' | 'transfer';
    frequency: number;
    lastOccurred: Date;
  }>;
  masteryMap: Record<string, { // conceptId → nivel de dominio
    level: 0 | 1 | 2 | 3 | 4; // 0=desconocido, 4=maestro
    lastAssessed: Date;
    confidence: number; // 0-1, para IRT
  }>;
  emotionalBaseline: {
    avgResponseTime: number; // segundos por pregunta
    frustrationThreshold: number; // errores seguidos antes de frustrarse
    engagementPattern: 'morning' | 'afternoon' | 'evening';
  };
  conversationHistory: Array<{
    timestamp: Date;
    role: 'student' | 'sylvie';
    content: string;
    intent: string; // clasificado por NLP
  }>; // últimas 20 interacciones (sliding window)
}
```

### 4.3. Curriculum Context Engine

```typescript
interface CurriculumContext {
  currentLesson: {
    id: string;
    subject: string;
    grade: string;
    unit: string;
    topic: string;
    learningObjectives: string[];
    prerequisites: string[]; // conceptIds requeridos
    nextLessons: string[];
  };
  progressInLesson: {
    currentExercise: number;
    totalExercises: number;
    timeSpent: number; // segundos
    attempts: Array<{
      exerciseId: string;
      correct: boolean;
      timeTaken: number;
      errorType?: string;
    }>;
  };
  // Sylvie SIEMPRE sabe dónde está el estudiante
}
```

### 4.4. Session Context Engine

Datos en tiempo real de la sesión actual (Redis):

```typescript
interface SessionContext {
  sessionId: string;
  startedAt: Date;
  currentState: 'learning' | 'stuck' | 'reviewing' | 'exploring' | 'idle';
  lastInteraction: Date;
  consecutiveErrors: number;
  currentStreak: number;
  sylvieState: 'active' | 'suggesting' | 'explaining' | 'celebrating' | 'alert' | 'resting';
}
```

### 4.5. Prompt Engineering para Sylvie

**System Prompt (español nativo, adaptable a inglés):**

```
Eres Sylvie, el tutor AI personal de {studentName}, un estudiante de {grade} grado.

CONTEXTO ACTUAL:
- Está en la lección: {lessonTitle} ({subject})
- Objetivo de aprendizaje: {learningObjective}
- Ejercicio actual: {currentExercise}/{totalExercises}
- Tiempo en este ejercicio: {timeSpent}s (promedio de clase: {avgTime}s)
- Errores consecutivos: {consecutiveErrors}
- Dominio previo: {masterySummary}

PERFIL COGNITIVO:
- Estilo de aprendizaje: {learningStyle}
- Formato preferido: {explanationFormat}
- Ritmo: {pace}
- Atención: {attentionSpan}

PATRONES DE ERROR RECIENTES:
{errorPatterns}

REGLAS DE COMPORTAMIENTO:
1. SIEMPRE usa el contexto actual. Nunca expliques algo que ya domina.
2. SI {consecutiveErrors} >= 2, ofrece una pista antes de que pregunte.
3. SI {timeSpent} > 2x promedio, pregunta si necesita ayuda.
4. Adapta el formato a su perfil cognitivo:
   - visual: usa analogías espaciales, sugiere diagramas
   - kinestésico: sugiere actividades físicas, manipulativos
   - auditivo: usa rima, ritmo, sugiere escuchar explicación
5. Sé animadora pero no infantil. Celebra esfuerzo, no solo resultado.
6. Cuando expliques, hazlo en pasos. Verifica comprensión antes de continuar.
7. Si detectas frustración (errores seguidos + tiempo largo), sugiere un descanso o cambio de actividad.
8. Usa español neutro. Puedes code-switch si el estudiante usa inglés.
9. NUNCA des la respuesta directamente. Guía al descubrimiento.
10. Al final de cada interacción, actualiza el estado emocional estimado.

FORMATO DE RESPUESTA:
- Texto explicativo (streaming, palabra por palabra)
- Opcional: sugerencia de visualización [VISUAL: diagrama de barras]
- Opcional: sugerencia de ejercicio [EXERCISE: tipo, dificultad]
- Opcional: alerta al padre [ALERT: razón]
- Opcional: cambio de estado Sylvie [STATE: celebrating|suggesting|...]
```

---

## 5. MÁQUINA DE ESTADOS DE SYLVIE (TutorStateMachine)

```typescript
// src/lib/tutor/TutorStateMachine.ts

type SylvieState = 
  | 'idle'           // Inactiva, animación de fondo
  | 'active'         // Presente, disponible
  | 'suggesting'     // Detectó dificultad, ofrece ayuda
  | 'explaining'     // Está explicando algo
  | 'celebrating'    // Celebrando logro
  | 'alert'          // Frustración detectada
  | 'resting';       // Estudiante inactivo

type SylvieTrigger =
  | 'student_starts_lesson'
  | 'student_answers_correct'
  | 'student_answers_incorrect'
  | 'student_asks_help'
  | 'student_idle_15s'
  | 'student_idle_5min'
  | 'consecutive_errors_2'
  | 'consecutive_errors_3'
  | 'time_exceeded_2x'
  | 'lesson_completed'
  | 'streak_5';

const transitions: Record<SylvieState, Partial<Record<SylvieTrigger, SylvieState>>> = {
  idle: {
    student_starts_lesson: 'active',
  },
  active: {
    student_answers_correct: 'active',
    student_answers_incorrect: 'active',
    consecutive_errors_2: 'suggesting',
    time_exceeded_2x: 'suggesting',
    student_asks_help: 'explaining',
    lesson_completed: 'celebrating',
    student_idle_5min: 'resting',
  },
  suggesting: {
    student_asks_help: 'explaining',
    student_answers_correct: 'active',
    consecutive_errors_3: 'alert',
  },
  explaining: {
    student_answers_correct: 'celebrating',
    student_answers_incorrect: 'suggesting',
  },
  celebrating: {
    student_starts_lesson: 'active',
    student_idle_15s: 'active',
  },
  alert: {
    student_answers_correct: 'celebrating',
    student_asks_help: 'explaining',
  },
  resting: {
    student_starts_lesson: 'active',
    student_asks_help: 'explaining',
  },
};

// Cada transición dispara:
// 1. Cambio de animación del avatar (Lottie/Rive)
// 2. Posible sonido (opcional, configurable)
// 3. Notificación al padre (si trigger = alert)
// 4. Log en analytics
```

---

## 6. COMPONENTES UI DEL TUTOR

### 6.1. SylvieAvatar (React Component)

```typescript
// src/components/tutoring/SylvieAvatar.tsx

interface SylvieAvatarProps {
  state: SylvieState;
  size: 'sm' | 'md' | 'lg';
  onClick: () => void;
  isSpeaking: boolean;
  emotion?: 'happy' | 'thinking' | 'concerned' | 'excited' | 'sleepy';
}

// Renderiza avatar animado según estado
// - idle: animación de respiración, parpadeo ocasional
// - active: postura atenta, ojos siguen cursor
// - suggesting: se inclina, gesto de "¿necesitas algo?"
// - explaining: gestos de manos (si 3D), movimiento de boca sincronizado con texto
// - celebrating: baile, confeti, sonido
// - alert: expresión de preocupación, gesto de calma
// - resting: "duerme", Zzz flotando

// Tecnología: Rive (recomendado) o Lottie
// Assets: /public/assets/sylvie/ (idle.riv, active.riv, etc.)
```

### 6.2. SylvieChat (React Component)

```typescript
// src/components/tutoring/SylvieChat.tsx

interface SylvieChatProps {
  isOpen: boolean;
  messages: Array<{
    id: string;
    role: 'student' | 'sylvie';
    content: string;
    timestamp: Date;
    actions?: Array<{
      type: 'exercise' | 'visual' | 'hint' | 'break';
      label: string;
      payload: unknown;
    }>;
  }>;
  onSendMessage: (text: string) => void;
  onActionClick: (action: Action) => void;
  sylvieState: SylvieState;
  isStreaming: boolean;
}

// Features:
// - Streaming de texto palabra por palabra (no bloques)
// - Botones de acción inline ("Muéstrame un diagrama", "Dame un ejercicio similar")
// - Input con voice-to-text (para niños pequeños)
// - Attach: foto de ejercicio (OCR para /stuck)
// - Historial persistente (últimas 50 interacciones)
// - Modo "focus": chat se expande a pantalla completa durante explicaciones
```

### 6.3. SylvieWidget (Floating Widget)

```typescript
// src/components/tutoring/SylvieWidget.tsx

// Widget flotante siempre visible (esquina inferior derecha en desktop, 
// barra inferior en mobile)

// Estados visuales:
// - Minimizado: solo avatar (SylvieAvatar sm)
// - Expandido: avatar + input rápido
// - Chat abierto: SylvieChat completo
// - Focus mode: chat pantalla completa

// Comportamiento:
// - Drag & drop para reposicionar (desktop)
// - Swipe up para expandir (mobile)
// - Badge de notificación cuando Sylvie tiene algo que decir
// - Pulse animation cuando sugiere ayuda
```

### 6.4. ProactiveHint (Toast/Inline)

```typescript
// src/components/tutoring/ProactiveHint.tsx

// Cuando Sylvie detecta dificultad, muestra hint no-intrusivo:
// - Desktop: toast flotante cerca del ejercicio
// - Mobile: bottom sheet de 1 línea

// Ejemplo:
// "¿Te cuesta el mcm? Toca aquí para una pista visual 🎯"
// [Toca] → expande explicación sin abrir chat completo
```

---

## 7. INTEGRACIÓN CON EL SISTEMA DE GAMIFICACIÓN

### 7.1. Sylvie como narrador de progreso

```
Wited: "Ganaste 10 MaxPoints" (genérico, sin contexto)

Midsea: 
- "¡Dominaste 'Suma de fracciones'! +100 Nexos 🌟"
- "Nuevo logro: 'Matemático Persistente' — superaste 3 errores seguidos sin rendirte"
- "¡Desbloqueaste el 'Laboratorio Químico'! Ahora puedes explorar reacciones ácidas"
- "Tu clan 'Los Exploradores' completó el proyecto 'Ecosistema Local'. +500 Nexos para todos"
```

### 7.2. Economía de atención

Sylvie gestiona la "moneda de atención" del estudiante:
- Si attentionSpan = 'short', Sylvie sugiere breaks cada 10 min.
- Si engagement baja, Sylvie propone un "desafío rápido" (2 min) para reactivar.
- Los Nexos se ganan por **mastery** (80%+), no por tiempo. Sylvie lo recuerda.

---

## 8. INTEGRACIÓN CON PARENT DASHBOARD

### 8.1. Sylvie reporta al Parent Copilot

Eventos que generan notificación al padre (configurable):

| Evento | Notificación al padre | Acción sugerida |
|--------|----------------------|-----------------|
| 3 errores seguidos en mismo concepto | "María está atascada en fracciones. Sylvie intervino." | "Ver detalle" / "Ayudar ahora" |
| Lección completada con <50% | "María no dominó 'Termorregulación'. Plan de refuerzo creado." | "Aprobar plan" / "Ajustar" |
| Tiempo excesivo en lección (>2x promedio) | "María lleva 45 min en una lección que toma 20 min." | "Ver qué pasa" / "Sugerir break" |
| Racha de 5 lecciones completadas | "¡María está en racha! 5 lecciones seguidas." | "Celebrar" / "Ver progreso" |
| Curiosidad explorada (/explore) | "María preguntó '¿por qué el cielo es azul?'. Sylvie creó ruta de descubrimiento." | "Ver ruta" / "Agregar al plan" |
| Frustración crónica detectada | "María muestra signos de frustración recurrente en matemáticas." | "Hablar con ella" / "Ajustar dificultad" |

### 8.2. Transparencia algorítmica

El padre puede preguntarle a Sylvie (vía Parent Copilot):
- "¿Por qué sugeriste esta lección?" → Sylvie explica el razonamiento.
- "¿Qué patrones de error tiene María?" → Visualización de taxonomía de errores.
- "¿Cómo puedo ayudar en casa?" → Actividades offline conectadas.

---

## 9. API DEL TUTOR AI

### 9.1. Endpoints

```typescript
// POST /api/tutor/chat
// Body: { studentId, message, lessonId?, exerciseId?, imageUrl? }
// Response: Streaming SSE con tokens + acciones detectadas

// POST /api/tutor/proactive
// Body: { studentId, trigger: 'consecutive_errors' | 'time_exceeded' | 'idle' }
// Response: { hint: string, action?: Action, sylvieState: SylvieState }

// GET /api/tutor/context/:studentId
// Response: StudentContext completo (para debugging)

// POST /api/tutor/assessment
// Body: { studentId, subject, topic, numQuestions? }
// Response: { questions: IRTQuestion[], adaptive: true }

// POST /api/tutor/plan
// Body: { studentId, goal: 'prep_for_test' | 'catch_up' | 'explore', params }
// Response: { plan: LearningPlan, sylvieMessage: string }
```

### 9.2. Streaming Protocol

```
SSE Events:
- token: "Hola" → "Hola María" → "Hola María, veo"...
- action: { type: 'visual', payload: { diagramType: 'bar', data: [...] } }
- state: { sylvieState: 'explaining', emotion: 'thinking' }
- complete: { messageId, tokensUsed, latencyMs }
```

---

## 10. ROADMAP DE IMPLEMENTACIÓN

### Fase 1: Sylvie Básica (Semanas 1-3)
- [ ] Avatar con 3 estados (idle, active, explaining) usando Lottie
- [ ] Chat básico con streaming (OpenAI GPT-4o-mini)
- [ ] Contexto de lección actual (manual, no automático)
- [ ] Respuestas en español nativo
- [ ] Integración con ejercicios: Sylvie puede "ver" si acertaste/fallaste

### Fase 2: Sylvie Inteligente (Semanas 4-6)
- [ ] Student Context Engine (perfil cognitivo básico)
- [ ] Detección proactiva (consecutive errors, time exceeded)
- [ ] ProactiveHint component
- [ ] 5 estados de avatar (idle, active, suggesting, explaining, celebrating)
- [ ] Voice input para niños pequeños

### Fase 3: Sylvie Adaptativa (Semanas 7-10)
- [ ] Cognitive Adapter (ajusta formato según perfil)
- [ ] Emotion Detection por texto
- [ ] Assessment adaptativo (IRT)
- [ ] Flujos /prep y /explore
- [ ] Integración con Parent Copilot (notificaciones)

### Fase 4: Sylvie Avanzada (Semanas 11+)
- [ ] Avatar con 7 estados completos (Rive)
- [ ] Generación de diagramas/imágenes (DALL-E/SD)
- [ ] Code-switching español/inglés
- [ ] Study Pods: Sylvie como moderadora de grupo
- [ ] Sylvie puede generar worksheets personalizados (PDF)

---

## 11. PATRONES PROHIBIDOS

❌ **NO** crear un chatbot flotante genérico como Max AI de Wited.
❌ **NO** usar respuestas en bloques (esperar JSON completo antes de mostrar).
❌ **NO** hardcodear strings en español (usar next-intl siempre).
❌ **NO** modelar el dominio como Materia > Grado > Unidad > Tema (eso es CMS, no Midsea).
❌ **NO** dar la respuesta directamente (Sylvie guía al descubrimiento).
❌ **NO** usar gamificación sin propósito pedagógico (puntos por tiempo = malo).
❌ **NO** ignorar el contexto curricular (Sylvie SIEMPRE sabe dónde está el estudiante).
❌ **NO** crear un "modo Profe Express" como parche (Sylvie resuelve 90% en tiempo real).

---

## 12. GLOSARIO

| Término | Definición |
|---------|-----------|
| **Sylvie** | El tutor AI de Midsea. Nombre del agente y del componente UI. |
| **SylvieState** | Estado emocional/funcional del avatar (idle, active, suggesting, explaining, celebrating, alert, resting). |
| **StudentContext** | Perfil persistente del estudiante: estilo de aprendizaje, patrones de error, mastery map. |
| **CurriculumContext** | Contexto en tiempo real de la lección actual: objetivos, prerequisitos, progreso. |
| **SessionContext** | Datos volátiles de la sesión actual: errores consecutivos, tiempo, estado. |
| **ProactiveHint** | Sugerencia no-intrusiva de Sylvie cuando detecta dificultad sin que el estudiante pregunte. |
| **IRT** | Item Response Theory. Algoritmo para assessments adaptativos. |
| **Nexos** | Moneda virtual de Midsea. Se gana por mastery (80%+), no por tiempo. |
| **MasteryMap** | Mapa de competencias del estudiante. Nivel 0-4 por concepto. |
| **CognitiveAdapter** | Capa que ajusta formato, ritmo y dificultad según el perfil cognitivo. |

---

*Documento técnico para implementación en Midsea.*
*Basado en análisis de Wited (app.wited.com) + PRD.md v2.0.*
*Fecha: 2026-05-17*

# Plantilla de Análisis Competitivo — Midsea vs. Plataforma X

> **Uso:** Copiar este prompt en Claude, ChatGPT o Claude Code, adjuntar el video/descripción de la competencia, y solicitar el análisis.
> **Propósito:** Identificar gaps de UX, flujo de lección, integración del tutor AI y experiencia del estudiante, sin copiar a la competencia.

---

## ROL

Eres un analista senior de UX educativa y diseñador de producto. Tu trabajo es analizar un video de una sesión de estudiante en la plataforma **Wited** y compararlo con la arquitectura actual de **Midsea**, una plataforma de homeschooling cristiana bilingüe (español LATAM neutro / inglés) con tutor AI llamado **Angela**.

---

## CONTEXTO DE MIDSEA (ESTADO ACTUAL)

### Arquitectura de la lección hoy
- Página de lección con: header (título, materia, tiempo estimado, reward Coin, barra de mastery), cuerpo en markdown (lectura), actividades interactivas, tarjeta de reflexión cristiana opcional, botón "Pedir ayuda a Angela", y Quiz al final (MC, fill-in-blank, short_answer).
- Scoring server-side del quiz. Muestra resultado con Coin si mastery ≥80%. Botón "Reintentar".
- Progreso de lección persistido en DB (`LessonProgress`).

### Angela AI hoy
- Widget flotante con 3 modos: collapsed (botón avatar), expanded (popover / side panel según viewport), focus (pantalla completa).
- Se **oculta automáticamente** en `/student/lessons/*` y `/student/stuck`. Solo accesible vía botón "Pedir ayuda a Angela" que redirige a `/stuck?lessonSlug=X`.
- Chat con streaming SSE, memoria persistente entre sesiones (DB), action buttons inline (pista, ejemplo, explicar otra forma), chain-of-thought visible para Math (pasos como tarjetas).
- Mensajes proactivos (`angela-proactive`) con styling distinto.
- System prompt: Angela es cálida pero **NO infantil**, nunca da respuesta directa, valida frustración, termina cada turno con pregunta concreta. Cosmovisión cristiana respetuosa, no proselitista.
- Rate limit: 50 mensajes/24h.

### AskAngelaButton
- Botón inline al final de la lección (**NO durante el quiz**). Redirige a `/stuck` con `lessonSlug` como query param.

---

## VIDEO A ANALIZAR

[Voy a adjuntar un video de una sesión de estudiante en Wited]

---

## INSTRUCCIONES DE ANÁLISIS

### 1. Observar y documentar (sección por sección)

Para cada momento clave del video, describe:
- **Qué hace Wited** (flujo, UI, transiciones, copy/textos)
- **Cómo se siente el estudiante** (carga cognitiva, claridad, motivación)
- **Qué hace Midsea hoy** en ese mismo punto (si existe equivalente)
- **Gap identificado**

Secciones obligatorias a analizar:
- **A. Estructura de la lección**: ¿Cómo divide Wited la lección? (video / lectura / quiz / otra cosa). ¿Es lineal o modular? ¿Hay checkpoints visuales?
- **B. Transiciones entre secciones**: ¿Cómo se mueve el estudiante de video→lectura→quiz? ¿Hay animaciones, progreso visual, confirmaciones?
- **C. El Quiz**:
  - ¿Cómo se presenta? ¿Onboarding previo?
  - ¿Guarda progreso parcial si el estudiante sale?
  - ¿Qué pasa al terminar? (feedback inmediato, recompensas, siguiente paso)
- **D. El tutor AI (Max AI vs Angela)**:
  - ¿Cuándo aparece Max AI? ¿En popups, sidebar, chat flotante?
  - ¿Qué mensajes muestra al entrar al quiz? ¿Al salir del quiz?
  - ¿Es intrusivo o útil?
  - ¿Mantiene contexto de la lección actual?
- **E. Gamificación y recompensas**: ¿Monedas, puntos, badges, celebraciones? ¿Cuándo y cómo?
- **F. Mobile / Responsive**: ¿El flujo funciona bien en tablet/mobile?

### 2. Identificar patrones anti-Midsea (DMP-HS-addendum §8)

Si ves alguno de estos patrones en Wited, **márcalo como "Anti-patrón a evitar"**:
- Paquete cerrado por grado (el padre no puede elegir cursos libremente)
- Gamificación cosmética sin poder pedagógico real
- Asistencia humana asíncrona como principal soporte
- UI escolar densa (calendarios, horarios, asistencia)
- Tono infantilizado para adolescentes
- Proselitismo religioso explícito

### 3. Recomendaciones para Midsea (SIN código, solo concepto)

Para cada gap identificado, proponé **una mejora concreta** para Midsea que:
- Sea **simple** (no complicada ni aburrida)
- Funcione para **primary, middle school y secundaria**
- Sea **propia de Midsea** (no una copia de Wited)
- Respete la **cosmovisión cristiana** y el **tono académico-respetuoso** de Angela

**Formato de cada recomendación:**
```
**Área:** [Lección / Quiz / Angela / Transiciones / Gamificación / Mobile]
**Gap:** [Descripción del gap]
**Inspirado en Wited:** [Qué hace la competencia]
**Propuesta Midsea:** [Qué debería hacer Midsea, diferente y mejor]
**Prioridad:** [Alta / Media / Baja]
**Es anti-patrón:** [Sí / No]
```

### 4. Preguntas para el equipo de producto

Listá 3-5 preguntas que el equipo debería discutir antes de implementar cualquier cambio.

---

## FORMATO DE SALIDA ESPERADO

Respondé en español (LATAM neutro), estructurado así:

1. **Resumen ejecutivo** (3-4 bullets)
2. **Análisis sección por sección** (A-F)
3. **Tabla de gaps y recomendaciones**
4. **Preguntas para el equipo**
5. **Conclusión: 3 acciones prioritarias**

---

## NOTAS ADICIONALES

- **No copies a Wited.** La simpleza es buena; los patrones anti-Midsea son malos.
- **Midsea NO es un clon.** Las referencias demuestran el problema; Midsea resuelve mejor.
- **Tono Angela:** académico-respetuoso, español LATAM neutro (es-419), sin infantilismo.
- **Coin:** moneda interna con poder pedagógico real (se gana por mastery ≥80%, se gasta en productos premium). NO cosmética.

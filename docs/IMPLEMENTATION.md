# IMPLEMENTATION.md — Rediseño Página de Lección v3
> Instrucciones precisas para Claude Code, basadas en exploración del codebase y mockup aprobado.  
> Stack: Next.js 14 App Router · TypeScript · Tailwind CSS · Zustand · next-intl  
> Actualizado: 2026-05-26

---

## Referencia visual aprobada

El mockup aprobado muestra:

1. **Topbar de una línea:** breadcrumb `Historia y Geografía > Periodo entreguerras` | `⏱ 18 min` | badge amber `+20 coins si completás con 80%`
2. **Stepper horizontal numerado:** `[✓ Video] [●2 Lectura] [○3 Quiz]` — pill con fondo teal para activo, checkmark teal para done, número en círculo gris para pending
3. **Layout dos columnas:** contenido principal (`flex-1`) + sidebar fijo (`w-64`, solo desktop)
4. **Contenido principal:** título serif, meta (grado + tipo), label de sección en caps, cuerpo sans, pull quote con borde teal izquierdo en cursiva serif, reflexión amber, botones `← Volver` / `Ir al Quiz →`
5. **Sidebar — 3 cards:**
   - "Tu progreso": lista vertical de las mismas 3 etapas con iconos e indicadores
   - "Dominio": porcentaje mastery + texto de incentivo
   - "Angela": círculo inicial `A` teal + mensaje en cursiva (sin botón adicional)

---

## Paso previo obligatorio: tipografía serif

### Problema

`tailwind.config.ts` no tiene `fontFamily.serif`. Las fuentes `sans` y `display` apuntan ambas a `var(--font-inter)`. El mockup usa serif para el título de la lección, el cuerpo de lectura, el pull quote y la reflexión.

### Archivos a modificar

| Archivo | Sección | Cambio |
|---------|---------|--------|
| `src/app/[locale]/layout.tsx` (root layout) | imports de fuentes | Agregar `import { Lora } from 'next/font/google'`. Instanciar con `subsets: ['latin', 'latin-ext'], variable: '--font-lora'`. Agregar `lora.variable` al `className` del `<html>`. |
| `tailwind.config.ts` | `theme.extend.fontFamily` | Agregar `serif: ['var(--font-lora)', 'Georgia', 'serif']` |

### Criterios de aceptación

- [ ] La clase `font-serif` renderiza Lora en el browser.
- [ ] La clase `font-sans` sigue renderizando Inter sin cambios.

---

## Mejora 1: LessonPageLayout — rediseño completo de la página de lección

Esta mejora reemplaza el layout actual de columna única de `page.tsx` por el layout dos columnas del mockup, incluyendo el topbar, el stepper, el contenido principal refactorizado y el sidebar con sus 3 cards.

### Contexto encontrado en el codebase

- **Archivo central:** `src/app/[locale]/student/lessons/[slug]/page.tsx` — Server Component async. Renderiza en columna única: `<Link>` (back), `<header>`, `<LessonContextRegister>`, `<Card><LessonMarkdown>`, `<ActivityList>`, reflexión en `<Card>`, `<AskAngelaButton>`, `<Quiz>`.
- **Datos ya disponibles en `page.tsx`:** `data.estMinutes`, `data.rewardCoin`, `data.subject`, `data.gradeLevel`, `data.titleEs/En`, `data.summaryEs/En`, `data.bodyMd`, `data.activities`, `data.quizQuestions`, `data.reflectionEs/En`, `lessonProgress.masteryPct`, `lessonProgress.status`, `lessonProgress.attempts`.
- **Tailwind relevante:** `midsea-lagoon` (#0D9488) para teal activo/done; `coin.DEFAULT` (#F9B21C) y `coin-dark` (#C88500) para amber; `midsea-ink` (#000000) para texto; `midsea-foam` (#EEF1FF) para fondos suaves.
- **No hay layout dos columnas actualmente** — toda la página es una columna. El layout de dos columnas se implementa directamente en `page.tsx`.

### Archivos a crear

| Ruta | Descripción |
|------|-------------|
| `src/components/learning/LessonStepper.tsx` | Server Component. Barra horizontal de etapas numeradas con estados done/active/pending. Renderiza tanto en la topbar como replica en el sidebar. |
| `src/components/learning/LessonSidebarProgress.tsx` | Server Component. Sidebar card "Tu progreso": lista vertical de las etapas con iconos e indicadores de estado. |
| `src/components/learning/LessonSidebarDomain.tsx` | Server Component. Sidebar card "Dominio": porcentaje de mastery + texto incentivo. |
| `src/components/learning/AngelaSidebarCard.tsx` | Client Component. Sidebar card "Angela": círculo inicial + mensaje contextual en cursiva. Abre el widget de Angela al hacer clic. |
| `src/components/learning/LessonPullQuote.tsx` | Server Component. Pull quote con borde izquierdo teal, texto serif itálico. Extrae el primer bloque `>` del markdown o usa el `summaryEs/En` de la lección. |

### Archivos a modificar

| Archivo | Sección | Cambio |
|---------|---------|--------|
| `src/app/[locale]/student/lessons/[slug]/page.tsx` | Bloque completo `hasRealContent === true` | Reemplazar el layout de columna única por el layout dos columnas descrito abajo. Los componentes existentes (`LessonMarkdown`, `ActivityList`, `Quiz`, `AskAngelaButton`, `LessonContextRegister`) se reutilizan sin modificación. |
| `src/components/tutoring/AngelaWidget.tsx` | Regex de ocultado `/\/student\/(stuck\|lessons)(\/|$)/` | Cambiar a `/\/student\/stuck(\/|$)/`. Agregar condición separada para ocultar solo el collapsed FAB en lecciones (ver Mejora 2). |
| `messages/es.json` | Bajo `student.lesson` | Agregar keys de stepper, sidebar y topbar |
| `messages/en.json` | Mismo | Mismas keys en inglés |

**Keys a agregar en `messages/es.json`:**
```json
"stepper": {
  "ariaLabel": "Etapas de la lección",
  "video": "Video",
  "reading": "Lectura",
  "quiz": "Quiz"
},
"sidebar": {
  "progressTitle": "Tu progreso",
  "domainTitle": "Dominio",
  "domainIncomplete": "Completá el quiz para ganar tus coins",
  "domainComplete": "¡Lección dominada!"
},
"topbar": {
  "minutesLabel": "{minutes} min",
  "coinLabel": "+{coin} coins si completás con 80%"
}
```

### Tipos y props nuevos

```typescript
// Tipos compartidos entre LessonStepper y LessonSidebarProgress

export type StepId = 'video' | 'reading' | 'quiz'
export type StepStatus = 'done' | 'active' | 'pending'

export interface StepInfo {
  id: StepId
  number: number       // 1, 2, 3 — el número que se muestra en el chip
  status: StepStatus
}

// Props de LessonStepper
export interface LessonStepperProps {
  steps: StepInfo[]
}

// Props de LessonSidebarProgress
export interface LessonSidebarProgressProps {
  steps: StepInfo[]
}

// Props de LessonSidebarDomain
export interface LessonSidebarDomainProps {
  masteryPct: number    // 0–100; si 0 y sin intentos: mostrar incentivo
  rewardCoin: number    // para mostrar cuánto se puede ganar
  hasAttempts: boolean  // si ya intentó el quiz al menos una vez
}

// Props de AngelaSidebarCard
export interface AngelaSidebarCardProps {
  locale: string        // 'es' | 'en' — para determinar el título de la lección
}
```

### Paleta de colores usada (tokens del mockup → tailwind.config.ts)

> Todos los tokens de abajo corresponden a valores reales en `tailwind.config.ts` v2.
> Hex de referencia para verificar visualmente contra el mockup.

| Token Tailwind | Hex | Uso en el mockup |
|----------------|-----|-----------------|
| `midsea-lagoon` | `#3D9E7A` | Teal activo: chips, checkmarks, borde pull quote, avatar Angela |
| `midsea-lagoon-light` | `#E8F5F0` | Fondo suave chip activo, fondo badge sutil |
| `coin-light` / `midsea-sun` | `#FEF3E2` | Fondo badge coins, fondo card reflexión |
| `coin` / `midsea-coral` | `#E8921A` | Texto e ícono coins |
| `coin-dark` | `#C47A1A` | Texto reflexión, label amber oscuro |
| `midsea-ink` | `#1A1A1A` | Texto principal |
| `midsea-muted` | `#6B7280` | Texto secundario, metadata |
| `midsea-border` | `#E5E7EB` | Bordes de cards |
| `midsea-surface` | `#FAFAFA` | Fondo de página |
| `midsea-foam` | `#FFFFFF` | Fondo de cards (blanco puro) |
| `midsea-deep` | `#1800AA` | Solo botones primary (legado, sin cambio) |

### Tokens de diseño a usar

#### Topbar
| Elemento | Clase Tailwind | Hex efectivo |
|----------|---------------|-------------|
| Container | `flex items-center gap-3 text-sm text-midsea-muted mb-1` | `#6B7280` |
| Separador breadcrumb `>` | `text-midsea-border` | `#E5E7EB` |
| Segmento activo del breadcrumb | `text-midsea-ink font-medium` | `#1A1A1A` |
| Ícono reloj | Lucide `Clock` size 14, `text-midsea-muted` | `#6B7280` |
| Badge coin — fondo | `bg-coin-light` | `#FEF3E2` |
| Badge coin — texto e ícono | `text-coin-dark` | `#C47A1A` |
| Badge coin — container | `inline-flex items-center gap-1 rounded-full bg-coin-light px-2.5 py-0.5 text-xs font-medium text-coin-dark` | — |
| Ícono coin en badge | Lucide `Coins` size 12 | — |

#### LessonStepper (barra horizontal)
| Elemento | Clase Tailwind | Hex efectivo |
|----------|---------------|-------------|
| Container nav | `flex items-center gap-0 border-b border-midsea-border` | `#E5E7EB` |
| Chip **done** | `flex items-center gap-1.5 px-4 py-2.5 text-sm text-midsea-lagoon` | `#3D9E7A` |
| Círculo checkmark done | `w-5 h-5 rounded-full bg-midsea-lagoon flex items-center justify-center` | `#3D9E7A` fill |
| SVG check dentro del círculo | `stroke-white` width 10 | blanco |
| Chip **active** — container | `flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-midsea-lagoon bg-midsea-lagoon-light border-b-2 border-midsea-lagoon -mb-px` | teal sobre verde muy claro |
| Número chip active | `w-5 h-5 rounded-full bg-midsea-lagoon text-white text-xs flex items-center justify-center font-semibold` | `#3D9E7A` fill, texto blanco |
| Chip **pending** — container | `flex items-center gap-1.5 px-4 py-2.5 text-sm text-midsea-muted` | `#6B7280` |
| Número chip pending | `w-5 h-5 rounded-full border border-midsea-border text-xs flex items-center justify-center text-midsea-muted` | borde `#E5E7EB` |
| Ícono por step | Lucide `Play` (video), `BookOpen` (reading), `ClipboardList` (quiz) — size 14 | hereda color del chip |
| Label en mobile | `hidden sm:inline` | — |

#### Contenido principal
| Elemento | Clase Tailwind | Hex efectivo |
|----------|---------------|-------------|
| Título h1 | `font-serif text-2xl font-normal text-midsea-ink leading-snug mb-3` | `#1A1A1A` |
| Meta (grado + tipo de contenido) | `flex items-center gap-3 text-xs text-midsea-muted mb-4` | `#6B7280` |
| Label de sección (`2 — SOCIEDAD Y CULTURA…`) | `text-[10px] font-semibold tracking-widest text-midsea-muted uppercase mb-3` | `#6B7280` |
| Cuerpo de lectura (párrafos) | `font-sans text-[15px] text-midsea-ink leading-relaxed` | `#1A1A1A` |
| Pull quote — container | `border-l-[3px] border-midsea-lagoon pl-4 my-6` | borde `#3D9E7A` |
| Pull quote — texto | `font-serif italic text-midsea-ink/75 leading-relaxed text-[15px]` | `#1A1A1A` al 75% |
| Reflexión — container | `rounded-xl bg-coin-light border border-coin/20 px-4 py-3 mt-6` | fondo `#FEF3E2` |
| Reflexión — label (`✦ Reflexión`) | `text-[10px] font-semibold tracking-wider text-coin-dark uppercase mb-1 flex items-center gap-1` | `#C47A1A` |
| Reflexión — texto | `font-serif italic text-sm text-coin-dark leading-relaxed` | `#C47A1A` |
| Botones footer — container | `flex items-center justify-between mt-8 pt-5 border-t border-midsea-border` | `#E5E7EB` |
| Botón "← Volver" | `<Button variant="ghost">` existente | blanco + ring |
| Botón "Ir al Quiz →" | `<Button variant="primary">` existente | `#1800AA` (legado, sin cambio) |

#### Sidebar — cards
| Elemento | Clase Tailwind | Hex efectivo |
|----------|---------------|-------------|
| Sidebar container | `hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 gap-3` | — |
| Card base (todos los cards) | `rounded-xl border border-midsea-border bg-midsea-foam p-4` | borde `#E5E7EB`, fondo `#FFFFFF` |
| Card title (label superior) | `text-[10px] font-semibold tracking-widest text-midsea-muted uppercase mb-3` | `#6B7280` |

#### LessonSidebarProgress (lista vertical de etapas)
| Elemento | Clase Tailwind | Hex efectivo |
|----------|---------------|-------------|
| Item **done** | `flex items-center gap-2 text-sm text-midsea-lagoon font-medium py-1` | `#3D9E7A` |
| Item **active** | `flex items-center gap-2 text-sm text-midsea-lagoon font-medium py-1` | `#3D9E7A` |
| Item **pending** | `flex items-center gap-2 text-sm text-midsea-muted py-1` | `#6B7280` |
| Indicador **done** | `w-5 h-5 rounded-full bg-midsea-lagoon-light flex items-center justify-center` + SVG check `stroke-midsea-lagoon` | fondo `#E8F5F0` |
| Indicador **active** | `w-5 h-5 rounded-full border-2 border-midsea-lagoon flex items-center justify-center text-xs text-midsea-lagoon font-semibold` | borde `#3D9E7A` |
| Indicador **pending** | `w-5 h-5 rounded-full border border-midsea-border flex items-center justify-center text-xs text-midsea-muted` | borde `#E5E7EB` |
| Ícono por step | Lucide `Play`, `BookOpen`, `ClipboardList` — size 13, `shrink-0` | hereda color del item |

#### LessonSidebarDomain (mastery %)
| Elemento | Clase Tailwind | Hex efectivo |
|----------|---------------|-------------|
| Porcentaje | `text-3xl font-semibold text-midsea-ink` | `#1A1A1A` |
| Subtexto incentivo | `text-xs text-midsea-muted leading-snug mt-1` | `#6B7280` |

#### AngelaSidebarCard
| Elemento | Clase Tailwind | Hex efectivo |
|----------|---------------|-------------|
| Card container (clickable) | `rounded-xl border border-midsea-border bg-midsea-foam p-4 cursor-pointer hover:border-midsea-lagoon/40 transition-colors` | hover teal sutil |
| Avatar círculo `A` | `w-8 h-8 rounded-full bg-midsea-lagoon flex items-center justify-center text-white text-sm font-semibold shrink-0` | `#3D9E7A` fill |
| Header (avatar + nombre) | `flex items-center gap-2 mb-2` | — |
| Nombre "Angela" | `text-sm font-medium text-midsea-ink` | `#1A1A1A` |
| Mensaje en cursiva | `font-serif italic text-sm text-midsea-muted leading-relaxed` | `#6B7280` |

#### QuizIntroScreen
| Elemento | Clase Tailwind | Hex efectivo |
|----------|---------------|-------------|
| Container | `flex flex-col items-center gap-6 py-10 px-6 text-center` | — |
| Título | `font-serif text-xl font-normal text-midsea-ink` | `#1A1A1A` |
| Meta (preguntas + tiempo) | `flex items-center gap-4 text-sm text-midsea-muted` | `#6B7280` |
| Badge coin — fondo | `bg-coin-light` | `#FEF3E2` |
| Badge coin — texto | `text-coin-dark` | `#C47A1A` |
| Badge coin — container | `inline-flex items-center gap-1 rounded-full bg-coin-light px-3 py-1 text-sm font-medium text-coin-dark` | — |
| Burbuja Angela | `max-w-sm w-full rounded-2xl bg-midsea-surface border border-midsea-border px-5 py-4 font-serif italic text-sm text-midsea-muted leading-relaxed text-left` | fondo `#FAFAFA` |
| Botón CTA | `<Button variant="primary">` existente + `ArrowRight` size 14 | `#1800AA` (legado) |

### Estructura JSX del layout dos columnas

Reemplazar el contenido del bloque `hasRealContent === true` en `page.tsx` con esta estructura:

```
<div class="px-4 py-6 md:px-8">
  {/* Topbar */}
  <div class="...breadcrumb + tiempo + badge coin...">
    <span>subject</span> > <span class="active">lessonTitle</span>
    <span>⏱ estMinutes min</span>
    <span class="coin-badge">+rewardCoin coins si completás con 80%</span>
  </div>

  {/* LessonStepper — stepper horizontal */}
  <LessonStepper steps={computedSteps} />

  {/* Layout dos columnas */}
  <div class="flex gap-8 mt-6">

    {/* Columna principal */}
    <div class="flex-1 min-w-0">
      <LessonContextRegister lesson={lessonCtx} studentFirstName={...} />

      {/* Título y meta */}
      <h1 class="font-serif ...">data.titleEs/En</h1>
      <div class="meta...">gradeLabel | sectionLabel</div>
      <div class="section-label...">sectionNumber — SUBJECT EN CAPS</div>

      {/* Cuerpo: LessonMarkdown, pull quote y actividades intercaladas */}
      <LessonMarkdown markdown={body} />

      {/* Actividades si existen */}
      {data.activities && <ActivityList ... />}

      {/* Reflexión cristiana si existe */}
      {data.reflectionEs && (
        <div class="reflexion amber...">
          <Sparkles /> Reflexión
          <p class="font-serif italic...">"reflectionText"</p>
        </div>
      )}

      {/* Footer de navegación */}
      <div class="footer-nav flex justify-between...">
        <Button variant="ghost" as={Link} href="...">← Volver</Button>
        {data.quizQuestions.length > 0 && (
          <Button variant="primary" onClick={scrollToQuiz}>Ir al Quiz →</Button>
        )}
      </div>

      {/* AskAngelaButton (mantener, no eliminar) */}
      <AskAngelaButton ... />

      {/* Quiz */}
      {data.quizQuestions.length > 0 && <Quiz ... rewardCoin={data.rewardCoin} />}
    </div>

    {/* Sidebar — solo desktop */}
    <aside class="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 gap-3">
      <LessonSidebarProgress steps={computedSteps} />
      <LessonSidebarDomain masteryPct={lessonProgress?.masteryPct ?? 0} rewardCoin={data.rewardCoin} hasAttempts={(lessonProgress?.attempts ?? 0) > 0} />
      <AngelaSidebarCard locale={locale} />
    </aside>

  </div>
</div>
```

### Lógica clave

1. **Calcular `computedSteps` en `page.tsx`** — array de `StepInfo[]` derivado de los datos del Prisma fetch. En v1 no hay videos, por lo que los steps son siempre `['reading', 'quiz']` más `'video'` si `data.videoUrl` existe (campo futuro). La lógica:
   - Sin `LessonProgress` o `attempts === 0` → `reading` es `active`, resto `pending`.
   - `attempts > 0` y `masteryPct < 80` → `reading` es `done`, `quiz` es `active`.
   - `masteryPct >= 80` → todos `done`.

2. **Pull quote** — el `summaryEs/En` de la lección se usa como pull quote si existe. Es un campo string corto ya disponible en `LessonRender`. No requiere parsear markdown.

3. **Botón "Ir al Quiz"** — en la columna principal este botón es un anchor scroll (`href="#lesson-quiz"`) para bajar al componente `<Quiz>` que está al final de la misma página. Agregar `id="lesson-quiz"` al wrapper del `<Quiz>`.

4. **Breadcrumb** — `subject` se traduce con `tSubjects(data.subject)` (ya disponible en `page.tsx`). El separador `>` es decorativo (`aria-hidden`).

5. **Label de sección** — el mockup muestra `"2 — SOCIEDAD Y CULTURA EN EL PERIODO ENTREGUERRAS"`. Este formato es `"{sectionNumber} — {summaryEs en caps}"`. Si `summaryEs` es largo, truncar a 60 chars con `…`.

### Criterios de aceptación

- [ ] El layout muestra dos columnas en `lg:` y una columna apilada en mobile.
- [ ] El topbar muestra breadcrumb con subject + título, tiempo estimado y badge amber con coins.
- [ ] El stepper muestra los steps con estados done (checkmark teal), active (número en círculo teal + underline), pending (número en círculo gris).
- [ ] El título de la lección renderiza en `font-serif`.
- [ ] El pull quote tiene borde izquierdo `border-midsea-lagoon` y texto en `font-serif italic`.
- [ ] La reflexión tiene fondo `bg-coin/10`, borde `border-coin/20`, texto amber.
- [ ] El sidebar muestra los 3 cards en desktop (`lg:`) y se oculta en mobile.
- [ ] El card "Tu progreso" replica el estado de los steps en formato vertical.
- [ ] El card "Dominio" muestra el % de mastery actual.
- [ ] El card "Angela" muestra el círculo inicial `A` en teal y el mensaje contextual en cursiva serif.
- [ ] Los botones "Volver" y "Ir al Quiz →" están en el footer de la columna principal.
- [ ] `LessonContextRegister`, `AskAngelaButton` y `Quiz` se mantienen sin modificación de lógica.

---

## Mejora 2: AngelaSidebarCard — apertura inline del panel

### Contexto encontrado en el codebase

- **Problema:** `AngelaWidget.tsx` usa regex `/\/student\/(stuck|lessons)(\/|$)/` para retornar `null` en páginas de lección. Si el card del sidebar llama `openWidget()`, el widget no está en el DOM — el panel nunca se abre.
- **Solución:** Modificar la regex para que solo excluya `/stuck`. En lecciones, el collapsed FAB se oculta condicionalmente, pero el widget se monta para que el panel pueda activarse.
- **`lessonContext` ya disponible:** `LessonContextRegister` se monta en `page.tsx` antes del sidebar, por lo que cuando el card hace clic el store ya tiene `lessonContext` con el título de la lección.

### Archivos a modificar

| Archivo | Sección | Cambio |
|---------|---------|--------|
| `src/components/tutoring/AngelaWidget.tsx` | Línea con `if (/\/student\/(stuck\|lessons)(\/|$)/.test(pathname)) return null` | **Paso 1:** cambiar regex a `/\/student\/stuck(\/|$)/`. **Paso 2:** en el branch de render del modo `collapsed` (el FAB circular fijo, bottom-right), agregar condición `if (pathname.includes('/student/lessons/') && !widgetOpen) return null` solo alrededor del return del collapsed — NO alrededor de los modos expanded/focus. |

### Lógica de `AngelaSidebarCard.tsx`

1. `'use client'` — necesita acceder al store Zustand.
2. Leer `lessonContext` y `openWidget` del store: `useTutorStore(s => ({ lessonContext: s.lessonContext, openWidget: s.openWidget }))`.
3. Calcular el título con `lessonTitleForLocale(lessonContext, locale as Locale)` — función ya exportada de `@/lib/tutor/LessonContext`.
4. Si `lessonContext` es null (raro, pero posible en edge cases): mostrar mensaje genérico `"¿Hay algo que quieras entender mejor antes del quiz?"` sin el título.
5. El card completo es clickable (`onClick={() => openWidget('expanded')}`). No hay un botón separado — el card en sí es el trigger.
6. El mensaje se muestra en cursiva serif: `"¿Hay algo de «{title}» que quieras entender mejor antes del quiz?"`.

### Criterios de aceptación

- [ ] Hacer clic en el card "Angela" del sidebar abre el panel de Angela (modo expanded) sin navegar a `/stuck`.
- [ ] El panel de Angela tiene el contexto de la lección activa ya cargado (título y subject).
- [ ] El FAB circular de Angela (bottom-right) **no aparece** en `/student/lessons/*`.
- [ ] En `/student/stuck`, el comportamiento de `AngelaWidget` no cambia — sigue retornando null.
- [ ] `AskAngelaButton` al final de la lección sigue funcionando y redirige a `/stuck`.

---

## Mejora 3: QuizIntroScreen

_(Sin cambios respecto a la versión anterior del IMPLEMENTATION.md — esta mejora no está reflejada en el mockup de la sección de lectura, pero sigue siendo válida para cuando el usuario hace clic en "Ir al Quiz".)_

### Archivos a modificar

| Archivo | Sección | Cambio |
|---------|---------|--------|
| `src/components/learning/Quiz.tsx` | `useState` inicial | Agregar `const [step, setStep] = useState<'intro' \| 'active' \| 'result'>('intro')` |
| `src/components/learning/Quiz.tsx` | JSX return | Renderizar `<QuizIntroScreen>` cuando `step === 'intro'`, el formulario actual cuando `step === 'active'` |
| `messages/es.json` | Bajo `student.lesson.quiz` | Agregar objeto `intro` |
| `messages/en.json` | Mismo | En inglés |

**Keys a agregar:**
```json
"intro": {
  "title": "¿Lista para la evaluación?",
  "questionCount": "{count, plural, one {# pregunta} other {# preguntas}}",
  "estimatedTime": "~{minutes} min",
  "angelaMessage": "Este quiz no es para calificarte — es para ayudarte a aprender mejor. Tomá tu tiempo.",
  "coinBadge": "+{coin} Coin si llegás al 80%",
  "startButton": "Comenzar evaluación"
}
```

### Tipos y props nuevos

```typescript
// Dentro de Quiz.tsx

type QuizStep = 'intro' | 'active' | 'result'

// Agregar prop rewardCoin al componente Quiz:
// { lessonSlug: string; questions: QuizQuestion[]; isEs: boolean; rewardCoin: number }

// Sub-componente interno QuizIntroScreen:
interface QuizIntroProps {
  questionCount: number          // questions.length
  estimatedMinutes: number       // Math.max(2, Math.ceil(questions.length * 1.5))
  coinReward: number             // rewardCoin prop
  onStart: () => void            // () => setStep('active')
  isEs: boolean
}
```

### Tokens de diseño

_(Definidos en la tabla de "QuizIntroScreen" dentro de la sección de tokens de Mejora 1 — todos usan la paleta del mockup aprobado.)_

### Lógica clave

1. Estado inicial `'intro'` — el formulario del quiz no se monta, ningún fetch se realiza.
2. `estimatedMinutes = Math.max(2, Math.ceil(questions.length * 1.5))` — calculado localmente.
3. La frase de Angela es el string i18n `student.lesson.quiz.intro.angelaMessage` — no es una llamada a `/api/tutor`.
4. El intento no se registra hasta el `submit()` (que solo es accesible en `step === 'active'`).
5. Actualizar `page.tsx`: pasar `rewardCoin={data.rewardCoin}` al `<Quiz>`.

### Criterios de aceptación

- [ ] Al hacer clic en "Ir al Quiz →" y hacer scroll, se ve la pantalla intro antes que las preguntas.
- [ ] La intro muestra número de preguntas, tiempo estimado, badge de coins y frase de Angela.
- [ ] "Comenzar evaluación" es el único CTA — no hay skip.
- [ ] Navegar hacia atrás desde la intro no registra ningún intento en DB.
- [ ] El flujo post-submit (resultado, Coin, retry) funciona igual que antes.

---

## Orden de implementación recomendado

### Paso 1 — Configurar Lora (5 min, pre-requisito)
Modificar root layout y `tailwind.config.ts`. Verificar con `npm run type-check`.

### Paso 2 — Agregar keys i18n en `es.json` y `en.json`
Un solo commit con todas las keys de stepper, sidebar, topbar y quiz intro. Permite que los componentes compilen sin errores de `t()`.

### Paso 3 — Mejora 3: QuizIntroScreen (sin dependencias)
Solo modifica `Quiz.tsx` internamente. Sin riesgo de regresión en el layout.

### Paso 4 — Mejora 1: LessonPageLayout (el cambio más grande)
Crear los 5 componentes nuevos, luego refactorizar `page.tsx`. Orden interno:
1. Crear `LessonStepper.tsx`
2. Crear `LessonSidebarProgress.tsx`
3. Crear `LessonSidebarDomain.tsx`
4. Crear `LessonPullQuote.tsx`
5. Crear `AngelaSidebarCard.tsx` (stub sin lógica Angela — solo muestra el card estático)
6. Refactorizar `page.tsx` con el layout dos columnas usando todos los componentes creados
7. Verificar en mobile que la columna única funciona y el sidebar se oculta
8. `npm run type-check`

### Paso 5 — Mejora 2: AngelaSidebarCard — activar apertura inline
Solo después de que el layout esté funcionando:
1. Modificar la regex en `AngelaWidget.tsx`
2. Activar la lógica de clic en `AngelaSidebarCard.tsx` (quitar el stub, agregar `useTutorStore`)
3. Verificar que `/student/stuck` sigue sin mostrar el widget
4. Verificar que el FAB no aparece en lecciones
5. `npm run type-check && npm run lint`

---

## Riesgos y bloqueadores

### Bloqueador 1: No hay tipografía serif → Paso 1 obligatorio

El tailwind config actual no tiene `fontFamily.serif`. Sin esto las clases `font-serif` en título, pull quote y reflexión fallan silenciosamente (renderiza en serif del sistema, no Lora).

### Bloqueador 2: `AngelaWidget` retorna `null` en `/student/lessons/*`

La regex actual oculta el widget completo en lecciones. Si se llama `openWidget()` desde `AngelaSidebarCard` sin modificar la regex, el panel nunca se abre porque el componente no está en el DOM. Modificar la regex en el Paso 5 antes de activar la lógica de apertura.

### Bloqueador 3: No existe `Badge` genérico en `src/components/ui/`

El codebase solo tiene `CoinBadge` en `src/components/gamification/`. Las mejoras usan clases Tailwind inline en lugar de un componente Badge — esto es correcto para este sprint.

### Bloqueador 4: `AskAngelaButton` puede quedar visualmente redundante

Con `AngelaSidebarCard` disponible en el sidebar, el `AskAngelaButton` al final de la lección puede parecer duplicado. **No eliminar `AskAngelaButton`** — cumple una función distinta (redirige a `/stuck` para ayuda profunda). Considerar en una iteración futura cambiar su label a "Necesito más ayuda →" para diferenciarlo semánticamente del card del sidebar.

---

*Basado en exploración directa del codebase y análisis del mockup aprobado.*  
*Rutas verificadas en el filesystem real. Actualizar si el codebase cambia antes de implementar.*

---

## FIXES POST-IMPLEMENTACIÓN — Diferencias detectadas en los screenshots

> Estos fixes corrigen lo que se ve en los screenshots comparado con el mockup aprobado.
> Implementar todos antes de considerar la tarea completa.

---

### FIX 1 — Fondo de página: azul grisáceo → neutro cálido

**Problema:** El fondo de toda la sección de estudiante aparece en un azul grisáceo claro (~`#F0F2FF`). En el mockup aprobado es blanco roto cálido (`#FAFAFA`).

**Causa probable:** El layout del estudiante (`src/app/[locale]/student/layout.tsx`) o el `globals.css` tiene un `background` o `bg-*` que apunta al antiguo `midsea-foam` (`#EEF1FF` azul claro). El nuevo `midsea-foam` es `#FFFFFF` y `midsea-surface` es `#FAFAFA`.

**Archivos a revisar y corregir:**

| Archivo | Qué buscar | Corrección |
|---------|-----------|-----------|
| `src/app/[locale]/student/layout.tsx` | Cualquier clase `bg-midsea-foam`, `bg-blue-*`, `bg-indigo-*`, o color de fondo en el wrapper raíz | Reemplazar por `bg-midsea-surface` (`#FAFAFA`) |
| `src/app/globals.css` | Selector `body`, `.student-layout`, o variable `--background` con valor azulado | Cambiar a `#FAFAFA` o `background: var(--color-surface)` |
| `src/app/[locale]/student/lessons/[slug]/page.tsx` | Wrapper raíz del bloque `hasRealContent` — si tiene `bg-*` azulado | Reemplazar por `bg-midsea-surface` o sin background (hereda del layout) |

---

### FIX 2 — Títulos de sección del contenido: azul `#1800AA` → casi negro

**Problema:** Los headings `##` y `###` dentro del cuerpo de la lección (`LessonMarkdown`) renderizan en azul `#1800AA` (`midsea-deep`). En el mockup son `#1A1A1A` (`midsea-ink`).

**Causa:** `LessonMarkdown.tsx` probablemente aplica clases Tailwind con `text-midsea-deep` o usa la clase `prose` de Tailwind Typography que hereda el color de link/heading del color primario.

**Archivo a corregir:** `src/components/learning/LessonMarkdown.tsx`

**Corrección:** En el tokenizador/renderer de headings (`h2`, `h3`, `h4`), reemplazar `text-midsea-deep` por `text-midsea-ink`. Si usa `prose`, agregar override:
```
prose-headings:text-midsea-ink prose-headings:font-semibold
```

---

### FIX 3 — Labels y preguntas de Actividades: azul `#1800AA` → casi negro

**Problema:** En las cards de actividad intercalada, el label "ACTIVIDAD 1" y el texto de la pregunta aparecen en azul `#1800AA`. En el mockup son `midsea-ink` (`#1A1A1A`) para la pregunta y `midsea-muted` (`#6B7280`) para el label.

**Archivo a corregir:** `src/components/learning/Activity.tsx`

**Corrección:**

| Elemento | Clase actual (probable) | Clase correcta |
|----------|------------------------|----------------|
| Label "ACTIVIDAD N" | `text-midsea-deep` o `text-blue-*` | `text-midsea-muted` |
| Texto de la pregunta (prompt) | `text-midsea-deep` o heredado | `text-midsea-ink font-medium` |
| Botón "Comprobar" | `bg-midsea-lagoon` | mantener — teal correcto ✓ |
| Letras A/B/C/D | círculo gris | mantener ✓ |

---

### FIX 4 — Opción seleccionada en Quiz: morado/lavanda → teal claro

**Problema:** Cuando el estudiante selecciona una opción en el Quiz, el fondo seleccionado es morado/lavanda (~`#E8E6FF`). En el mockup debería ser teal claro (`midsea-lagoon-light` = `#E8F5F0`).

**Causa:** `Quiz.tsx` en el componente `MCInput` usa clases que apuntaban al antiguo color primario azul/morado. Con el cambio de paleta, ese estado seleccionado no se actualizó.

**Archivo a corregir:** `src/components/learning/Quiz.tsx` — sub-componente `MCInput`

**Corrección de clases en la opción seleccionada (`isPicked === true`):**

| Elemento | Clase actual | Clase correcta |
|----------|-------------|----------------|
| Fondo opción seleccionada | `bg-midsea-deep/10` o `bg-indigo-50` o similar | `bg-midsea-lagoon-light` (`#E8F5F0`) |
| Borde opción seleccionada | `ring-midsea-deep` o `border-midsea-deep` | `border-midsea-lagoon` |
| Texto opción seleccionada | `text-midsea-deep` | `text-midsea-lagoon` |
| Círculo letra (A/B/C/D) seleccionado | `bg-midsea-deep text-white` | `bg-midsea-lagoon text-white` |

---

### FIX 5 — Número de pregunta en Quiz: azul `#1800AA` → casi negro

**Problema:** Los números "1.", "2.", "3." de cada pregunta del quiz y el texto de la pregunta aparecen en azul `#1800AA`. En el mockup son `midsea-ink` (`#1A1A1A`).

**Archivo a corregir:** `src/components/learning/Quiz.tsx` — en la lista `<ol>` de preguntas.

**Corrección:**

| Elemento | Clase actual (probable) | Clase correcta |
|----------|------------------------|----------------|
| Número de pregunta | `text-midsea-deep` o heredado del `<ol>` | `text-midsea-ink` |
| Texto de la pregunta | `text-midsea-deep` o `font-semibold text-midsea-deep` | `text-midsea-ink font-medium` |
| Título "Evaluación de la lección" | `text-midsea-deep` | `text-midsea-ink` |
| Subtítulo debajo del título | color heredado | `text-midsea-muted` |

---

### FIX 6 — Botón "Enviar respuestas": verificar color correcto

**Estado actual:** El botón "Enviar respuestas" aparece en teal (`#3D9E7A`) — **esto es correcto** según el mockup.

**Sin cambio necesario.** ✓ Documentado para confirmar que este comportamiento es intencional y no debe revertirse.

---

### FIX 7 — Fondo de cards de Actividad: verificar

**Estado actual:** Las cards de actividad tienen fondo blanco con bordes sutiles — **esto es correcto** según el mockup. ✓

---

### Resumen de archivos a tocar en los fixes

| Archivo | Fixes |
|---------|-------|
| `src/app/[locale]/student/layout.tsx` | FIX 1 — fondo de página |
| `src/app/globals.css` | FIX 1 — variable de fondo |
| `src/components/learning/LessonMarkdown.tsx` | FIX 2 — headings azules → ink |
| `src/components/learning/Activity.tsx` | FIX 3 — labels y preguntas azules → ink/muted |
| `src/components/learning/Quiz.tsx` | FIX 4 + FIX 5 — selección morada → teal, números azules → ink |

### Prompt para Claude Code (fixes):

```
Aplicá los siguientes fixes en el codebase de Midsea. Cada uno está documentado en la sección 
"FIXES POST-IMPLEMENTACIÓN" del docs/IMPLEMENTATION.md.

FIX 1 — Fondo de página:
Buscar en src/app/[locale]/student/layout.tsx y src/app/globals.css cualquier background 
azulado (bg-midsea-foam, EEF1FF, o cualquier bg-blue/indigo). Reemplazar por bg-midsea-surface 
(#FAFAFA) o sin color de fondo explícito si lo hereda del body.

FIX 2 — Headings en LessonMarkdown:
En src/components/learning/LessonMarkdown.tsx, todos los h2, h3, h4 que tengan text-midsea-deep 
o cualquier color azul: cambiar a text-midsea-ink (#1A1A1A).

FIX 3 — Labels y preguntas en Activity.tsx:
En src/components/learning/Activity.tsx:
- Label "ACTIVIDAD N": cambiar a text-midsea-muted (#6B7280)
- Texto del prompt/pregunta: cambiar a text-midsea-ink (#1A1A1A)

FIX 4 — Opción seleccionada en Quiz (MCInput):
En src/components/learning/Quiz.tsx, en el sub-componente MCInput, 
cuando isPicked === true:
- Fondo: bg-midsea-lagoon-light (#E8F5F0)
- Borde: border-midsea-lagoon (#3D9E7A)
- Texto: text-midsea-lagoon (#3D9E7A)
- Círculo de letra: bg-midsea-lagoon text-white

FIX 5 — Números y textos de preguntas en Quiz:
En src/components/learning/Quiz.tsx, en el render de la lista de preguntas:
- Título "Evaluación de la lección": text-midsea-ink
- Números de pregunta (1., 2., 3.): text-midsea-ink
- Texto de cada pregunta: text-midsea-ink font-medium
- Subtítulo debajo del título: text-midsea-muted

Después de cada fix: npm run type-check. No continuar si hay errores.
```

---

## Mejora 4: LessonPlayerShell — Navegación por etapas (tabs) sin cambio de URL

> Esta mejora **reemplaza la arquitectura de scroll único** documentada en Mejora 1.  
> En lugar de renderizar todo el contenido apilado verticalmente, el estudiante ve **una sola etapa a la vez** y navega entre ellas haciendo clic en el stepper. La URL no cambia. La transición es un fade suave de 150ms.

---

### Motivación

La página de lección actual (post-Mejora 1) presenta todo el contenido en columna: lectura + actividades + reflexión + quiz. El estudiante debe hacer scroll para llegar al quiz. Esto crea carga cognitiva innecesaria y dificulta saber "en qué parte de la lección estoy".

Con esta mejora, el stepper se convierte en el controlador de navegación: cada chip activa una **vista exclusiva** con fade, igual que la UX de Wited pero con la identidad visual y el tono de Midsea.

---

### Arquitectura: Server Component → Client Shell

El problema central es que `page.tsx` es un **Server Component** y no puede manejar estado interactivo (`useState`). La solución es extraer toda la lógica de "qué etapa estoy viendo" a un nuevo Client Component: `LessonPlayerShell`.

**Flujo de datos:**
```
page.tsx (Server Component)
  └─ fetches data from Prisma (lesson, progress, user)
  └─ serializa todo a props
  └─ renderiza <LessonPlayerShell {...props} />

LessonPlayerShell.tsx (Client Component — 'use client')
  └─ recibe todos los datos serializados como props
  └─ maneja activeStep: 'reading' | 'quiz'
  └─ renderiza: topbar + LessonStepper (ahora clickable) + layout 2 cols
      ├─ Columna principal: solo la vista del activeStep actual
      └─ Sidebar: siempre visible (no cambia con el paso activo)
```

---

### Archivos a crear

| Ruta | Tipo | Descripción |
|------|------|-------------|
| `src/components/learning/LessonPlayerShell.tsx` | Client Component (`'use client'`) | Orquestador central. Recibe todos los datos de la lección como props. Gestiona `activeStep`. Renderiza el layout completo. |

---

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/app/[locale]/student/lessons/[slug]/page.tsx` | En lugar de renderizar el layout dos columnas directamente, pasar todos los datos como props a `<LessonPlayerShell>`. El Server Component solo fetchea data y delega el render. |
| `src/components/learning/LessonStepper.tsx` | Convertir de Server Component a Client Component. Agregar `onStepClick?: (step: StepId) => void` como prop. Los chips clickeables invocan este callback. Solo los steps `done` y `active` son clickeables; `pending` tiene `disabled` con cursor-not-allowed. |
| `src/components/learning/Quiz.tsx` | Agregar prop opcional `onComplete?: (r: { masteryPct: number }) => void`. Invocarla en el handler post-submit cuando llega el resultado. No romper usos existentes sin esta prop. |
| `messages/es.json` | Agregar `student.lesson.nav.goToQuiz`, `backToReading`, `nextLesson` |
| `messages/en.json` | Ídem en inglés |

**Keys a agregar:**
```json
"nav": {
  "goToQuiz": "Ir al Quiz",
  "backToReading": "Volver a la Lectura",
  "nextLesson": "Siguiente lección"
}
```

---

### Props de `LessonPlayerShell`

```typescript
'use client'

import type { StepInfo, StepId } from './LessonStepper'

export interface LessonPlayerShellProps {
  // Datos de la lección
  lessonSlug: string
  titleEs: string
  titleEn: string
  subject: string
  gradeLevel: string
  estMinutes: number
  rewardCoin: number
  bodyMd: string | null
  summaryEs: string | null
  summaryEn: string | null
  reflectionEs: string | null
  reflectionEn: string | null
  activities: ActivityData[]       // tipo ya existente en el codebase
  quizQuestions: QuizQuestion[]    // tipo ya existente en el codebase

  // Progreso
  masteryPct: number               // 0 si no hay progreso
  attempts: number                 // 0 si no hay progreso
  initialSteps: StepInfo[]         // computado en page.tsx (misma lógica que Mejora 1)

  // Contexto
  locale: string                   // 'es' | 'en'
  studentFirstName: string
  backHref: string                 // href del botón "← Volver" (a la lista de lecciones)

  // Lección siguiente (opcional — para el botón al completar el quiz)
  nextLessonSlug?: string
  nextLessonTitle?: string
}
```

---

### Estado interno de `LessonPlayerShell`

```typescript
// Dentro del componente
const [activeStep, setActiveStep] = useState<'reading' | 'quiz'>('reading')
const [steps, setSteps] = useState<StepInfo[]>(props.initialSteps)
const [visible, setVisible] = useState(true)

// activeStep siempre arranca en 'reading'. No hay persistencia entre recargas.
```

---

### Lógica del stepper clickeable

En `LessonStepper.tsx` (ahora Client Component):

```typescript
// Regla de clickeabilidad:
// - 'done'    → siempre clickeable (el estudiante puede volver a leer)
// - 'active'  → clickeable pero sin efecto visible (ya está ahí)
// - 'pending' → NO clickeable; cursor-not-allowed opacity-60

const isClickable = (status: StepStatus) => status === 'done' || status === 'active'
```

Para indicar el tab activo, el stepper necesita saber qué step está viendo el usuario actualmente. Agregar prop `activeStep: 'reading' | 'quiz'` al `LessonStepper`. El chip cuyo `id` coincide con `activeStep` muestra el estilo "active" (borde inferior teal + fondo `midsea-lagoon-light`), independientemente del campo `status`.

---

### Transición fade entre vistas

No usar Framer Motion — una transición CSS pura es suficiente y más performante:

```typescript
const [visible, setVisible] = useState(true)

const handleStepChange = (newStep: 'reading' | 'quiz') => {
  if (newStep === activeStep) return
  setVisible(false)
  setTimeout(() => {
    setActiveStep(newStep)
    setVisible(true)
  }, 150) // fade out 150ms → swap → fade in 150ms
}
```

```tsx
<div className={`transition-opacity duration-150 ${visible ? 'opacity-100' : 'opacity-0'}`}>
  {activeStep === 'reading' && <ReadingView ... />}
  {activeStep === 'quiz'    && <QuizView ... />}
</div>
```

> `transition-opacity` y `duration-150` son clases estándar de Tailwind — sin configuración adicional.

---

### Sub-componentes internos del shell

Definir estos dos como funciones internas **dentro de `LessonPlayerShell.tsx`** — no crear archivos separados:

#### `ReadingView`

Contenido en orden:
1. Título `h1` → `font-serif text-2xl text-midsea-ink`
2. Meta (grado, tipo) → `text-xs text-midsea-muted`
3. Label de sección → `text-[10px] font-semibold tracking-widest text-midsea-muted uppercase`
4. `<LessonMarkdown markdown={bodyMd} />`
5. `<ActivityList activities={activities} />` (si existen)
6. Pull quote con `summaryEs/En` → `border-l-[3px] border-midsea-lagoon pl-4 font-serif italic`
7. Reflexión amber (si `reflectionEs/En` existe) → `bg-coin-light border border-coin/20`
8. Footer:
   - `← Volver` → `<Link href={backHref}>`
   - `Ir al Quiz →` → `onClick={() => handleStepChange('quiz')}` — **NO anchor scroll**

#### `QuizView`

Contenido:
1. `<Quiz lessonSlug={...} questions={quizQuestions} isEs={isEs} rewardCoin={rewardCoin} onComplete={handleQuizComplete} />`
2. Footer:
   - `← Volver a la Lectura` → `onClick={() => handleStepChange('reading')}`

> **`LessonContextRegister` va en el nivel del shell**, no dentro de `ReadingView` ni `QuizView`. Así Angela mantiene el contexto de la lección durante toda la sesión, incluso al cambiar de tab.

---

### Actualización del stepper al completar el quiz

```typescript
const handleQuizComplete = (result: { masteryPct: number }) => {
  if (result.masteryPct >= 80) {
    // Maestría alcanzada: todos los steps en done
    setSteps(prev => prev.map(s => ({ ...s, status: 'done' as const })))
  } else {
    // Completado sin maestría: lectura done, quiz activo (puede reintentar)
    setSteps(prev => prev.map(s =>
      s.id === 'reading'
        ? { ...s, status: 'done' as const }
        : { ...s, status: 'active' as const }
    ))
  }
}
```

---

### Estructura JSX de `LessonPlayerShell`

```tsx
'use client'

export default function LessonPlayerShell(props: LessonPlayerShellProps) {
  const [activeStep, setActiveStep] = useState<'reading' | 'quiz'>('reading')
  const [steps, setSteps] = useState<StepInfo[]>(props.initialSteps)
  const [visible, setVisible] = useState(true)
  const isEs = props.locale === 'es'

  const handleStepChange = (newStep: 'reading' | 'quiz') => {
    if (newStep === activeStep) return
    setVisible(false)
    setTimeout(() => { setActiveStep(newStep); setVisible(true) }, 150)
  }

  return (
    <div className="px-4 py-6 md:px-8">
      {/* Angela context — siempre montado, nunca dentro de las vistas */}
      <LessonContextRegister lesson={lessonCtx} studentFirstName={props.studentFirstName} />

      {/* Topbar */}
      {/* breadcrumb + tiempo + badge coin — mismo que Mejora 1 */}

      {/* Stepper clickeable */}
      <LessonStepper
        steps={steps}
        activeStep={activeStep}
        onStepClick={handleStepChange}
      />

      {/* Layout 2 columnas */}
      <div className="flex gap-8 mt-6">

        {/* Columna principal con fade */}
        <div className="flex-1 min-w-0">
          <div className={`transition-opacity duration-150 ${visible ? 'opacity-100' : 'opacity-0'}`}>
            {activeStep === 'reading' && (
              <ReadingView {...props} isEs={isEs} onGoToQuiz={() => handleStepChange('quiz')} />
            )}
            {activeStep === 'quiz' && (
              <QuizView
                {...props}
                isEs={isEs}
                onBackToReading={() => handleStepChange('reading')}
                onComplete={handleQuizComplete}
              />
            )}
          </div>
        </div>

        {/* Sidebar — no participa en el fade */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 gap-3">
          <LessonSidebarProgress steps={steps} />
          <LessonSidebarDomain
            masteryPct={props.masteryPct}
            rewardCoin={props.rewardCoin}
            hasAttempts={props.attempts > 0}
          />
          <AngelaSidebarCard locale={props.locale} />
        </aside>

      </div>
    </div>
  )
}
```

---

### Cambios en `page.tsx` (Server Component)

`page.tsx` queda reducido a fetch + delegar al shell:

```tsx
// Extraer como helper dentro de page.tsx:
function computeSteps(progress: LessonProgress | null): StepInfo[] {
  if (!progress || progress.attempts === 0) {
    return [
      { id: 'reading', number: 1, status: 'active' },
      { id: 'quiz',    number: 2, status: 'pending' },
    ]
  }
  if (progress.masteryPct >= 80) {
    return [
      { id: 'reading', number: 1, status: 'done' },
      { id: 'quiz',    number: 2, status: 'done' },
    ]
  }
  return [
    { id: 'reading', number: 1, status: 'done' },
    { id: 'quiz',    number: 2, status: 'active' },
  ]
}

// En el return del Server Component:
return (
  <LessonPlayerShell
    lessonSlug={data.slug}
    titleEs={data.titleEs}
    titleEn={data.titleEn}
    subject={data.subject}
    gradeLevel={data.gradeLevel}
    estMinutes={data.estMinutes}
    rewardCoin={data.rewardCoin}
    bodyMd={data.bodyMd}
    summaryEs={data.summaryEs}
    summaryEn={data.summaryEn}
    reflectionEs={data.reflectionEs}
    reflectionEn={data.reflectionEn}
    activities={data.activities}
    quizQuestions={data.quizQuestions}
    masteryPct={lessonProgress?.masteryPct ?? 0}
    attempts={lessonProgress?.attempts ?? 0}
    initialSteps={computeSteps(lessonProgress)}
    locale={locale}
    studentFirstName={student.firstName}
    backHref={`/${locale}/student/dashboard`}
  />
)
```

> `AskAngelaButton` **no se incluye** en `LessonPlayerShell` — el card Angela del sidebar lo reemplaza. No eliminar el componente del codebase, solo no usarlo aquí.

---

### Tokens de diseño del stepper clickeable

| Estado chip | Cursor | Hover |
|-------------|--------|-------|
| `done` | `cursor-pointer` | `hover:bg-midsea-lagoon-light/50` |
| `active` (tab abierto) | `cursor-default` | sin hover |
| `pending` | `cursor-not-allowed` | sin hover, `opacity-60` |

---

### Criterios de aceptación

- [ ] Cargar la lección siempre muestra la vista "Lectura" primero.
- [ ] Hacer clic en el chip "Quiz" en el stepper muestra **únicamente** el contenido del quiz, sin el cuerpo markdown de la lectura.
- [ ] Hacer clic en el chip "Lectura" desde el quiz vuelve a la vista de lectura con fade.
- [ ] La transición entre vistas es un fade de ~150ms — sin salto brusco ni parpadeo.
- [ ] El chip "Quiz" comienza en estado `pending` y no es clickeable al primer cargado.
- [ ] El botón "Ir al Quiz →" en `ReadingView` cambia el tab a quiz (y lo marca como `active`) sin cambiar la URL.
- [ ] El sidebar permanece visible e inmutable durante toda la transición.
- [ ] Al completar el quiz con ≥80%, el stepper muestra ambos chips en `done`.
- [ ] Al completar el quiz con <80%, el stepper muestra Lectura `done` y Quiz `active`.
- [ ] La URL **no cambia** al navegar entre etapas.
- [ ] `npm run type-check` pasa sin errores.
- [ ] En mobile (columna única, sin sidebar), el stepper y el fade funcionan igual.

---

### Riesgos específicos de esta mejora

**Riesgo 1 — `Quiz.tsx` sin prop `onComplete`:** Agregar como opcional (`onComplete?: ...`). Sin esto el shell no puede actualizar el stepper al terminar el quiz.

**Riesgo 2 — `LessonContextRegister` desmontándose:** Si queda dentro de `ReadingView`, se desmonta al cambiar a `QuizView` y Angela pierde el contexto. **Solución:** montarlo al nivel del shell, siempre.

**Riesgo 3 — `LessonStepper` importa algo server-only:** Verificar antes de convertirlo a Client Component. Si usa `next/headers` o acceso directo a Prisma, extraer esa lógica a `page.tsx`.

**Riesgo 4 — Hydration mismatch:** `initialSteps` viene del Server Component como prop serializada. No hay `localStorage` ni estado del cliente para inicializar. Esto es correcto y evita errores de hydration.

---

### Prompt para Claude Code (navegación por tabs):

```
Implementá la Mejora 4 del docs/IMPLEMENTATION.md: LessonPlayerShell — navegación por etapas (tabs).

OBJETIVO: Convertir la página de lección de scroll único a vistas por tab sin cambio de URL.
El estudiante hace clic en el chip del stepper y ve solo esa sección, con fade de 150ms.

PASOS EN ORDEN:

1. Agregar keys i18n en messages/es.json y messages/en.json:
   Bajo student.lesson, agregar objeto "nav" con:
   goToQuiz: "Ir al Quiz" / backToReading: "Volver a la Lectura" / nextLesson: "Siguiente lección"

2. Convertir LessonStepper.tsx a Client Component ('use client').
   Agregar props: activeStep: 'reading' | 'quiz' y onStepClick: (step: StepId) => void.
   El chip cuyo id coincide con activeStep muestra estilo activo (border-b-2 border-midsea-lagoon).
   Chips done/active son clickeables; pending: cursor-not-allowed opacity-60, no onClick.

3. Agregar prop opcional a Quiz.tsx:
   onComplete?: (result: { masteryPct: number }) => void
   Invocarla en el handler post-submit cuando llega el resultado del servidor.
   No modificar nada más de Quiz.tsx ni romper usos sin esta prop.

4. Crear src/components/learning/LessonPlayerShell.tsx (Client Component).
   Ver LessonPlayerShellProps completo en IMPLEMENTATION.md Mejora 4.
   
   Estado: activeStep (inicia 'reading'), steps (de initialSteps), visible (para fade).
   
   handleStepChange: setVisible(false) → setTimeout 150ms → setActiveStep → setVisible(true).
   handleQuizComplete: actualiza steps según masteryPct (≥80 → todos done; <80 → reading done + quiz active).
   
   Render:
   - LessonContextRegister al nivel del shell (nunca dentro de las vistas).
   - Topbar: breadcrumb + tiempo + badge coin (igual que Mejora 1).
   - LessonStepper con activeStep y onStepClick={handleStepChange}.
   - div 2 columnas:
     · Columna principal: div con transition-opacity duration-150. Renderiza ReadingView o QuizView.
     · Aside sidebar: siempre visible, fuera del div con fade.
   
   ReadingView (función interna): título serif, meta, LessonMarkdown, actividades, pull quote,
   reflexión, footer con "← Volver" (Link a backHref) y "Ir al Quiz →" (onClick handleStepChange('quiz')).
   
   QuizView (función interna): <Quiz> con onComplete, footer con "← Volver a la Lectura"
   (onClick handleStepChange('reading')).

5. Actualizar page.tsx:
   Extraer función helper computeSteps(progress) — ver lógica en IMPLEMENTATION.md Mejora 4.
   Reemplazar todo el bloque de render del layout por <LessonPlayerShell {...allProps} />.
   NO incluir AskAngelaButton en el shell (lo reemplaza el card Angela del sidebar).

6. npm run type-check. Corregir todos los errores antes de continuar.
7. npm run lint.

RESTRICCIONES IMPORTANTES:
- La URL NO debe cambiar al navegar entre tabs (sin router.push al hacer clic en el stepper).
- Fade: solo Tailwind transition-opacity duration-150. Sin Framer Motion.
- LessonContextRegister: montarlo UNA SOLA VEZ en el nivel del shell.
- El sidebar (LessonSidebarProgress, LessonSidebarDomain, AngelaSidebarCard) NO participa en el fade.
- Quiz.tsx: onComplete es OPCIONAL — no romper usos existentes sin esa prop.
- AskAngelaButton: no incluirlo en LessonPlayerShell, pero NO eliminarlo del codebase.

Referencia completa: docs/IMPLEMENTATION.md → "Mejora 4: LessonPlayerShell".
```

---

## Mejora 5: PDF Expandido — Notebook descargable por lección

> Paso 5 del Flujo Curricular. Permite al estudiante descargar un PDF con explicación profunda, vocabulario, gráficos y resumen visual de la lección. Crítico para autonomía académica en HS secundaria.

---

### Contexto

El modelo `Lesson` en Prisma no tiene campo para el PDF. La mejora requiere una migración de DB mínima (un campo nullable), un botón de descarga en la vista Lectura, y nada más. El contenido del PDF lo produce el equipo editorial externamente y se sube a un CDN (puede ser Supabase Storage, S3, o simplemente una URL pública). Esta mejora **no toca la lógica de Angela ni el quiz**.

---

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `prisma/schema.prisma` | Agregar campo `notebookUrl String?` al modelo `Lesson` |
| `src/app/[locale]/student/lessons/[slug]/page.tsx` | Pasar `notebookUrl: data.notebookUrl` como prop a `LessonPlayerShell` |
| `src/components/learning/LessonPlayerShell.tsx` | Agregar `notebookUrl?: string` a `LessonPlayerShellProps`. En `ReadingView`, renderizar el botón de descarga si existe. |
| `messages/es.json` | Agregar `student.lesson.notebook.download` y `student.lesson.notebook.label` |
| `messages/en.json` | Ídem en inglés |

**Keys a agregar:**
```json
"notebook": {
  "label": "Notebook de la lección",
  "download": "Descargar PDF",
  "hint": "Explicación ampliada, vocabulario y resumen visual"
}
```

---

### Migración de Prisma

```prisma
model Lesson {
  // ... campos existentes ...
  notebookUrl   String?   // URL pública del PDF expandido (Supabase / S3 / CDN)
}
```

Después de editar el schema:
```bash
npx prisma migrate dev --name add_lesson_notebook_url
npx prisma generate
```

---

### Botón de descarga en `ReadingView`

El botón va **al final del cuerpo de lectura**, antes de la reflexión amber y antes del footer de navegación. Solo se renderiza si `notebookUrl` tiene valor.

```tsx
{notebookUrl && (
  <a
    href={notebookUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-2 rounded-lg border border-midsea-border bg-midsea-foam px-4 py-2.5 text-sm font-medium text-midsea-ink hover:border-midsea-lagoon/40 hover:text-midsea-lagoon transition-colors mt-6"
  >
    <FileDown size={15} className="shrink-0" />
    <span>
      <span className="font-semibold">{t('student.lesson.notebook.download')}</span>
      <span className="ml-1.5 text-midsea-muted font-normal">
        — {t('student.lesson.notebook.hint')}
      </span>
    </span>
  </a>
)}
```

> Usar `<a>` nativo con `target="_blank"` — no `<Button>`. El PDF abre en pestaña nueva o dispara descarga según el Content-Type del servidor. Agregar el ícono `FileDown` de `lucide-react`.

---

### Tokens de diseño del botón

| Elemento | Clase Tailwind | Hex efectivo |
|----------|---------------|-------------|
| Container | `inline-flex items-center gap-2 rounded-lg border border-midsea-border bg-midsea-foam px-4 py-2.5` | borde `#E5E7EB`, fondo `#FFFFFF` |
| Texto principal | `text-sm font-semibold text-midsea-ink` | `#1A1A1A` |
| Texto hint | `text-midsea-muted font-normal` | `#6B7280` |
| Hover | `hover:border-midsea-lagoon/40 hover:text-midsea-lagoon` | teal sutil |
| Ícono | `FileDown` size 15, hereda color del texto | — |

---

### Criterios de aceptación

- [ ] `npx prisma migrate dev` corre sin errores.
- [ ] Si `notebookUrl` es `null`, el botón de descarga **no aparece** (sin espacio vacío).
- [ ] Si `notebookUrl` tiene valor, el botón aparece entre el cuerpo y la reflexión.
- [ ] El PDF abre en pestaña nueva.
- [ ] `npm run type-check` pasa sin errores.
- [ ] En mobile, el botón se ve correctamente (no se corta el texto).

---

### Prompt para Claude Code (PDF Expandido):

```
Implementá la Mejora 5 del docs/IMPLEMENTATION.md: PDF Expandido — Notebook descargable.

PASOS EN ORDEN:

1. Editar prisma/schema.prisma:
   En el modelo Lesson, agregar campo: notebookUrl  String?
   Luego ejecutar: npx prisma migrate dev --name add_lesson_notebook_url
   Luego: npx prisma generate

2. Actualizar page.tsx:
   En el fetch de la lección, ya llega data.notebookUrl (Prisma lo incluye automáticamente).
   Pasar notebookUrl={data.notebookUrl ?? undefined} como prop a <LessonPlayerShell>.

3. Actualizar LessonPlayerShell.tsx:
   Agregar notebookUrl?: string a LessonPlayerShellProps.
   En ReadingView, después de <ActivityList> y antes de la reflexión amber, agregar el botón:
   - Solo si notebookUrl tiene valor (condicional).
   - Es un <a> nativo con target="_blank" rel="noopener noreferrer".
   - Ícono: FileDown de lucide-react, size 15.
   - Clases: ver tokens en IMPLEMENTATION.md Mejora 5.
   - Texto: t('student.lesson.notebook.download') + hint en muted.

4. Agregar keys i18n en messages/es.json y messages/en.json:
   Bajo student.lesson, agregar objeto "notebook" con:
   - label: "Notebook de la lección" / "Lesson Notebook"
   - download: "Descargar PDF" / "Download PDF"
   - hint: "Explicación ampliada, vocabulario y resumen visual" / "Extended explanation, vocabulary and visual summary"

5. npm run type-check. Corregir errores antes de continuar.
6. npm run lint.

RESTRICCIONES:
- No usar componente <Button> para la descarga — usar <a> nativo.
- No modificar Quiz.tsx, AngelaWidget.tsx ni ningún componente fuera de los listados.
- Si notebookUrl es null o undefined, el botón NO debe renderizarse (sin espacio vacío).

Referencia completa: docs/IMPLEMENTATION.md → "Mejora 5: PDF Expandido".
```

---

## Mejora 6: Cierre Emocional — Pantalla de celebración post-quiz

> Paso 10 del Flujo Curricular. Reemplaza el `ResultBanner` actual (que solo muestra el puntaje y el Coin) por una pantalla de celebración completa: felicitación, resumen de lo que aprendió, barra de progreso animada y siguiente paso claro. Sin cambio de DB.

---

### Contexto

El `ResultBanner` actual en `Quiz.tsx` muestra el resultado del quiz de forma funcional pero fría. El documento de flujo curricular dice: **"Nunca termines simplemente con 'submit'."** Esta mejora reemplaza ese componente por `LessonCompletionScreen` — una pantalla de celebración que transforma el cierre en un momento emocional positivo.

No requiere migración de DB. Toda la información necesaria ya está disponible en el componente: `masteryPct`, `rewardCoin`, `questions.length`, el título de la lección.

---

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/learning/Quiz.tsx` | Reemplazar el `ResultBanner` existente por `<LessonCompletionScreen>` cuando `step === 'result'` |
| `messages/es.json` | Agregar `student.lesson.completion.*` |
| `messages/en.json` | Ídem en inglés |

### Archivos a crear

| Ruta | Tipo | Descripción |
|------|------|-------------|
| `src/components/learning/LessonCompletionScreen.tsx` | Client Component | Pantalla de celebración post-quiz. Recibe el resultado e invoca `onComplete` del shell para actualizar el stepper. |

---

### Props de `LessonCompletionScreen`

```typescript
interface LessonCompletionScreenProps {
  masteryPct: number          // 0–100
  rewardCoin: number          // coins ganados (solo si masteryPct >= 80)
  questionCount: number       // total de preguntas respondidas
  lessonTitle: string         // para el bloque "Hoy aprendiste..."
  onRetry: () => void         // volver al quiz (si masteryPct < 80)
  onContinue: () => void      // siguiente lección o volver al dashboard
  isEs: boolean
}
```

---

### Keys i18n a agregar

```json
"completion": {
  "masteredTitle": "¡Lección dominada!",
  "masteredSubtitle": "Completaste la lección con {pct}% de dominio.",
  "partialTitle": "¡Buen intento!",
  "partialSubtitle": "Llegaste a {pct}%. Necesitás 80% para ganar tus coins.",
  "coinEarned": "+{coin} Coin ganados",
  "learnedLabel": "Hoy aprendiste:",
  "learnedItems": [
    "Respondiste {count} preguntas de evaluación",
    "Completaste la lección completa",
    "Avanzaste en tu progreso del curso"
  ],
  "retryButton": "Reintentar quiz",
  "continueButton": "Continuar"
}
```

```json
"completion": {
  "masteredTitle": "Lesson Mastered!",
  "masteredSubtitle": "You completed the lesson with {pct}% mastery.",
  "partialTitle": "Good effort!",
  "partialSubtitle": "You reached {pct}%. You need 80% to earn your coins.",
  "coinEarned": "+{coin} Coins earned",
  "learnedLabel": "Today you learned:",
  "learnedItems": [
    "Answered {count} assessment questions",
    "Completed the full lesson",
    "Advanced your course progress"
  ],
  "retryButton": "Retry quiz",
  "continueButton": "Continue"
}
```

---

### Estructura visual de `LessonCompletionScreen`

```
┌─────────────────────────────────────────────┐
│                                             │
│   🎉  ¡Lección dominada!   (o ¡Buen intento!)
│                                             │
│   ████████████████░░░░  87%                 │  ← barra animada
│                                             │
│   [badge amber]  +20 Coin ganados           │  ← solo si ≥80%
│                                             │
│   Hoy aprendiste:                           │
│   ✓ Respondiste 8 preguntas de evaluación   │
│   ✓ Completaste la lección completa         │
│   ✓ Avanzaste en tu progreso del curso      │
│                                             │
│   [Reintentar quiz]    [Continuar →]        │
│                                             │
└─────────────────────────────────────────────┘
```

---

### Tokens de diseño

#### Cuando `masteryPct >= 80` (maestría alcanzada)

| Elemento | Clase Tailwind | Hex efectivo |
|----------|---------------|-------------|
| Container | `flex flex-col items-center gap-6 py-10 px-6 text-center` | — |
| Ícono celebración | `text-4xl` (emoji 🎉 o ícono Trophy de lucide) | — |
| Título | `font-serif text-2xl font-normal text-midsea-ink` | `#1A1A1A` |
| Subtítulo | `text-sm text-midsea-muted` | `#6B7280` |
| Barra de progreso — fondo | `w-full max-w-xs h-2 rounded-full bg-midsea-lagoon-light` | `#E8F5F0` |
| Barra de progreso — fill | `h-2 rounded-full bg-midsea-lagoon transition-all duration-700` | `#3D9E7A` |
| Badge Coin | `inline-flex items-center gap-1.5 rounded-full bg-coin-light px-3 py-1 text-sm font-semibold text-coin-dark` | fondo `#FEF3E2`, texto `#C47A1A` |
| Bloque "Hoy aprendiste" | `w-full max-w-xs text-left` | — |
| Label "Hoy aprendiste:" | `text-xs font-semibold tracking-widest text-midsea-muted uppercase mb-2` | `#6B7280` |
| Ítem de lista | `flex items-center gap-2 text-sm text-midsea-ink py-1` | `#1A1A1A` |
| Checkmark ítem | `w-4 h-4 rounded-full bg-midsea-lagoon-light flex items-center justify-center shrink-0` + SVG check `stroke-midsea-lagoon` | fondo `#E8F5F0` |
| Botón "Continuar" | `<Button variant="primary">` existente + `ArrowRight` size 14 | `#1800AA` |

#### Cuando `masteryPct < 80` (sin maestría)

Igual que arriba pero:
- Sin badge Coin
- Botón secundario "Reintentar quiz" a la izquierda (`variant="ghost"`)
- Botón "Continuar" igual a la derecha
- Barra de progreso fill en `bg-midsea-muted` en lugar de `bg-midsea-lagoon`

---

### Lógica de la barra de progreso animada

```tsx
// Animar la barra al montar: arrancar en 0, llegar a masteryPct en 700ms
const [barWidth, setBarWidth] = useState(0)

useEffect(() => {
  const timer = setTimeout(() => setBarWidth(masteryPct), 50)
  return () => clearTimeout(timer)
}, [masteryPct])

// JSX:
<div className="w-full max-w-xs h-2 rounded-full bg-midsea-lagoon-light">
  <div
    className="h-2 rounded-full bg-midsea-lagoon transition-all duration-700"
    style={{ width: `${barWidth}%` }}
  />
</div>
```

---

### Integración con `Quiz.tsx` y el shell

1. En `Quiz.tsx`, cuando `step === 'result'`, en lugar de `<ResultBanner>` renderizar `<LessonCompletionScreen>`.
2. `onRetry` → `setStep('active')` + reset de answers (lógica ya existente en el retry del `ResultBanner`).
3. `onContinue` → invocar `props.onComplete?.({ masteryPct: result.score })` para que el shell actualice el stepper, luego navegar al dashboard con `router.push(backHref)` — pero `backHref` no está en `Quiz.tsx`. Solución: pasar `onContinue` como prop desde `LessonPlayerShell` → `QuizView` → `<Quiz>`.

```typescript
// En LessonPlayerShell, en QuizView:
<Quiz
  ...
  onComplete={handleQuizComplete}
  onContinue={() => router.push(backHref)}
/>

// Agregar prop opcional a Quiz.tsx:
// onContinue?: () => void
```

---

### Criterios de aceptación

- [ ] Al terminar el quiz con ≥80%, se muestra la pantalla de celebración con título "¡Lección dominada!", badge de Coin y lista "Hoy aprendiste".
- [ ] Al terminar con <80%, se muestra "¡Buen intento!" sin badge Coin, con botón "Reintentar quiz".
- [ ] La barra de progreso se anima de 0% al `masteryPct` en ~700ms al montar la pantalla.
- [ ] "Reintentar quiz" vuelve al formulario del quiz y resetea las respuestas.
- [ ] "Continuar" navega de vuelta al dashboard.
- [ ] El stepper se actualiza correctamente (via `onComplete` del shell).
- [ ] `ResultBanner` queda en el codebase pero sin uso — no eliminar.
- [ ] `npm run type-check` pasa sin errores.

---

### Prompt para Claude Code (Cierre Emocional):

```
Implementá la Mejora 6 del docs/IMPLEMENTATION.md: LessonCompletionScreen — Cierre Emocional.

OBJETIVO: Reemplazar el ResultBanner actual en Quiz.tsx por una pantalla de celebración completa
con barra de progreso animada, bloque "Hoy aprendiste" y CTA claro.

PASOS EN ORDEN:

1. Agregar keys i18n en messages/es.json y messages/en.json:
   Bajo student.lesson, agregar objeto "completion" con todas las keys del IMPLEMENTATION.md Mejora 6.

2. Agregar props opcionales a Quiz.tsx (NO romper usos existentes):
   onContinue?: () => void

3. Crear src/components/learning/LessonCompletionScreen.tsx (Client Component).
   Props: masteryPct, rewardCoin, questionCount, lessonTitle, onRetry, onContinue, isEs.
   
   Barra de progreso animada: useState(0) → useEffect con setTimeout 50ms → setBarWidth(masteryPct).
   Clase de la barra: transition-all duration-700, width por style (no clase Tailwind dinámica).
   
   Cuando masteryPct >= 80:
   - Título: t('student.lesson.completion.masteredTitle') en font-serif text-2xl
   - Barra: bg-midsea-lagoon
   - Badge Coin: bg-coin-light text-coin-dark con ícono Coins de lucide-react
   - Lista "Hoy aprendiste" con 3 ítems (checkmarks teal)
   - Botón único: "Continuar →" variant primary, onClick={onContinue}
   
   Cuando masteryPct < 80:
   - Título: t('student.lesson.completion.partialTitle') en font-serif text-2xl
   - Barra: bg-midsea-muted (sin color teal)
   - Sin badge Coin
   - Lista "Hoy aprendiste" igual
   - Dos botones: "Reintentar quiz" (variant ghost, onClick={onRetry}) + "Continuar →" (variant primary)
   
   Íconos a usar de lucide-react: Trophy o PartyPopper para la celebración, Coins para el badge,
   Check size 10 dentro del círculo de cada ítem de la lista.

4. Actualizar Quiz.tsx:
   Cuando step === 'result', renderizar <LessonCompletionScreen> en lugar de <ResultBanner>.
   Pasar: masteryPct={result.score}, rewardCoin={rewardCoin}, questionCount={questions.length},
   lessonTitle (agregar como prop a Quiz si no existe, opcional con default ''),
   onRetry={() => { setStep('active'); setAnswers({}) }},
   onContinue={props.onContinue ?? (() => {})},
   isEs={isEs}.
   ResultBanner: dejar en el archivo pero sin uso (no eliminar).

5. Actualizar LessonPlayerShell.tsx en QuizView:
   Pasar onContinue={() => router.push(backHref)} al <Quiz>.
   Importar useRouter de 'next/navigation'.

6. npm run type-check. Corregir todos los errores.
7. npm run lint.

RESTRICCIONES:
- La barra de progreso usa style={{ width: `${barWidth}%` }} — NO clases Tailwind dinámicas
  (Tailwind purga clases generadas dinámicamente).
- ResultBanner: NO eliminar del codebase, solo dejar sin uso.
- onContinue y onComplete en Quiz.tsx son OPCIONALES — no romper usos sin esas props.
- No tocar prisma/schema.prisma en esta mejora (sin migración de DB).

Referencia completa: docs/IMPLEMENTATION.md → "Mejora 6: Cierre Emocional".
```

---

## Mejora 7: Versículo del Día + Bienvenida Bíblica

> Paso 1 del Flujo Curricular. Cada lección abre con un momento espiritual breve: versículo del día, reflexión corta de 1–2 líneas y pregunta de conexión "¿Cómo aplicamos esto hoy?". Es lo primero que ve el estudiante al entrar a la vista Lectura — antes del título, antes del contenido.

---

### Contexto

Hoy la reflexión cristiana existe (`reflectionEs`/`reflectionEn`) pero aparece **al final** de la lección, después de todo el contenido. El flujo curricular pide lo contrario: **abrir** con el momento espiritual para enmarcar el aprendizaje desde la cosmovisión cristiana. Además, no existe ningún sistema de versículo del día.

Esta mejora tiene **dos partes**:

- **Parte A — Versículo del Día en el dashboard del estudiante:** un bloque fijo visible al abrir el dashboard, con un versículo diferente cada día (rotación por fecha, sin llamada a API externa).
- **Parte B — Bienvenida Bíblica al inicio de cada lección:** la `ReadingView` abre con una card de bienvenida que muestra el versículo del día + la reflexión específica de la lección (si existe) + la pregunta de conexión.

---

### Parte A — Versículo del Día en el Dashboard

#### Arquitectura

No requiere DB ni API externa. Los versículos se almacenan en un array estático en el código y se seleccionan por `dayOfYear % verses.length`. Esto garantiza que todos los estudiantes vean el mismo versículo el mismo día, sin costo de infraestructura.

#### Archivos a crear

| Ruta | Tipo | Descripción |
|------|------|-------------|
| `src/lib/verses.ts` | Módulo estático | Array de 60+ versículos en español e inglés con referencia bíblica. Función `getDailyVerse(date: Date): Verse`. |
| `src/components/student/DailyVerseCard.tsx` | Server Component | Card del versículo del día. Se renderiza en el dashboard. |

#### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/app/[locale]/student/page.tsx` (dashboard) | Importar `getDailyVerse` y renderizar `<DailyVerseCard>` como primer elemento visible, antes de la lista de lecciones/cursos activos. |
| `messages/es.json` | Agregar `student.dashboard.verse.*` |
| `messages/en.json` | Ídem en inglés |

#### Estructura de `src/lib/verses.ts`

```typescript
export interface Verse {
  textEs: string
  textEn: string
  referenceEs: string  // ej: "Proverbios 3:5"
  referenceEn: string  // ej: "Proverbs 3:5"
}

// Mínimo 60 versículos — cubre 2 meses sin repetir.
// Criterio de selección: versículos conocidos, denominacionalmente neutros,
// relevantes para jóvenes de 13–17 años, tono de sabiduría y fe activa.
// Ejemplos base (ampliar hasta 60+):
const verses: Verse[] = [
  {
    textEs: "Confía en el Señor con todo tu corazón, y no te apoyes en tu propio entendimiento.",
    textEn: "Trust in the Lord with all your heart and lean not on your own understanding.",
    referenceEs: "Proverbios 3:5",
    referenceEn: "Proverbs 3:5"
  },
  {
    textEs: "Todo lo puedo en Cristo que me fortalece.",
    textEn: "I can do all things through Christ who strengthens me.",
    referenceEs: "Filipenses 4:13",
    referenceEn: "Philippians 4:13"
  },
  // ... más versículos ...
]

export function getDailyVerse(date: Date = new Date()): Verse {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))
  return verses[dayOfYear % verses.length]
}
```

> Incluir al menos 60 versículos en el array. Seleccionar versículos variados: Salmos, Proverbios, Nuevo Testamento — todos denominacionalmente abiertos (ADR-007). Sin doctrinas específicas de denominación.

#### Keys i18n del dashboard

```json
"verse": {
  "label": "Versículo del día",
  "connectionQuestion": "¿Cómo aplicamos esto hoy?"
}
```

#### Tokens de diseño de `DailyVerseCard`

| Elemento | Clase Tailwind | Hex efectivo |
|----------|---------------|-------------|
| Card container | `rounded-xl border border-midsea-lagoon/20 bg-midsea-lagoon-light px-5 py-4 mb-6` | fondo `#E8F5F0`, borde teal suave |
| Label "Versículo del día" | `text-[10px] font-semibold tracking-widest text-midsea-lagoon uppercase mb-2 flex items-center gap-1.5` | `#3D9E7A` |
| Ícono label | Lucide `BookOpen` size 12 | hereda teal |
| Texto del versículo | `font-serif italic text-[15px] text-midsea-ink leading-relaxed` | `#1A1A1A` |
| Referencia bíblica | `text-xs font-medium text-midsea-lagoon mt-1.5` | `#3D9E7A` |
| Separador | `border-t border-midsea-lagoon/20 mt-3 pt-3` | teal suave |
| Pregunta de conexión | `text-sm text-midsea-muted italic` | `#6B7280` |

---

### Parte B — Bienvenida Bíblica al inicio de cada lección

#### Arquitectura

Al entrar a la lección, la `ReadingView` en `LessonPlayerShell.tsx` comienza con un bloque de bienvenida que combina:
1. El versículo del día (mismo que el dashboard, calculado client-side con la fecha actual)
2. La reflexión específica de la lección (`reflectionEs/En`) — si existe, se mueve aquí desde el final
3. La pregunta de conexión fija: "¿Cómo aplicamos esto hoy?"

> **Decisión de diseño importante:** La reflexión se mueve del final al inicio. Esto cambia el orden en `ReadingView`. El campo `reflectionEs/En` en Prisma no cambia — solo cambia dónde se renderiza.

#### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/learning/LessonPlayerShell.tsx` | En `ReadingView`, agregar `<LessonWelcomeCard>` como **primer elemento**, antes del `<h1>` del título. Eliminar el bloque de reflexión del final. |
| `messages/es.json` | Agregar `student.lesson.welcome.*` |
| `messages/en.json` | Ídem en inglés |

#### Archivos a crear

| Ruta | Tipo | Descripción |
|------|------|-------------|
| `src/components/learning/LessonWelcomeCard.tsx` | Client Component (`'use client'`) | Card de bienvenida al inicio de la lección. Calcula el versículo del día client-side. Muestra versículo + reflexión de la lección (si existe) + pregunta de conexión. |

#### Props de `LessonWelcomeCard`

```typescript
interface LessonWelcomeCardProps {
  reflectionEs?: string   // campo reflectionEs de la lección (puede ser null)
  reflectionEn?: string   // campo reflectionEn de la lección
  locale: string          // 'es' | 'en'
}
```

#### Keys i18n de la lección

```json
"welcome": {
  "verseLabel": "Versículo del día",
  "reflectionLabel": "Reflexión",
  "connectionQuestion": "¿Cómo aplicamos esto hoy?"
}
```

#### Tokens de diseño de `LessonWelcomeCard`

| Elemento | Clase Tailwind | Hex efectivo |
|----------|---------------|-------------|
| Card container | `rounded-xl border border-midsea-lagoon/20 bg-midsea-lagoon-light px-5 py-4 mb-6` | fondo `#E8F5F0` |
| Label versículo | `text-[10px] font-semibold tracking-widest text-midsea-lagoon uppercase mb-2 flex items-center gap-1.5` | `#3D9E7A` |
| Texto versículo | `font-serif italic text-[15px] text-midsea-ink leading-relaxed` | `#1A1A1A` |
| Referencia | `text-xs font-medium text-midsea-lagoon mt-1` | `#3D9E7A` |
| Separador (si hay reflexión) | `border-t border-midsea-lagoon/20 mt-3 pt-3` | — |
| Label reflexión | `text-[10px] font-semibold tracking-widest text-coin-dark uppercase mb-1 flex items-center gap-1` | `#C47A1A` |
| Ícono reflexión | Lucide `Sparkles` size 11 | hereda amber |
| Texto reflexión | `font-serif italic text-sm text-coin-dark leading-relaxed` | `#C47A1A` |
| Separador final | `border-t border-midsea-lagoon/20 mt-3 pt-3` | — |
| Pregunta conexión | `text-sm text-midsea-muted italic` | `#6B7280` |

#### Estructura visual de `LessonWelcomeCard`

```
┌───────────────────────────────────────────────────┐  fondo #E8F5F0
│  📖 VERSÍCULO DEL DÍA                             │  teal caps
│                                                   │
│  "Confía en el Señor con todo tu corazón,         │  serif italic ink
│   y no te apoyes en tu propio entendimiento."     │
│  Proverbios 3:5                                   │  teal pequeño
│ ─────────────────────────────────────────────     │
│  ✦ REFLEXIÓN                                      │  amber caps (solo si existe)
│  "El conocimiento histórico nos recuerda          │  serif italic amber
│   que Dios actúa en la historia humana."          │
│ ─────────────────────────────────────────────     │
│  ¿Cómo aplicamos esto hoy?                        │  muted italic
└───────────────────────────────────────────────────┘
```

Si `reflectionEs/En` no existe, la card muestra solo versículo + pregunta de conexión (sin el bloque amber).

---

### Criterios de aceptación

- [ ] El dashboard muestra `DailyVerseCard` como primer elemento visible al entrar.
- [ ] El versículo cambia automáticamente cada día (diferente al del día anterior).
- [ ] Todos los estudiantes ven el mismo versículo el mismo día.
- [ ] La lección abre con `LessonWelcomeCard` antes del título `h1`.
- [ ] Si la lección tiene `reflectionEs`, aparece en la card de bienvenida (no al final).
- [ ] Si la lección no tiene `reflectionEs`, la card muestra solo versículo + pregunta.
- [ ] La reflexión amber **ya no aparece al final** de `ReadingView`.
- [ ] `npm run type-check` pasa sin errores.
- [ ] En mobile, la card se ve correctamente sin overflow.

---

### Prompt para Claude Code (Versículo del Día + Bienvenida Bíblica):

```
Implementá la Mejora 7 del docs/IMPLEMENTATION.md: Versículo del Día + Bienvenida Bíblica.
Son dos partes: (A) versículo en el dashboard, (B) card de bienvenida al inicio de cada lección.

PASOS EN ORDEN:

1. Crear src/lib/verses.ts:
   - Interface Verse con textEs, textEn, referenceEs, referenceEn.
   - Array de mínimo 60 versículos. Ejemplos variados (Salmos, Proverbios, Nuevo Testamento).
     Todos denominacionalmente neutros — sin doctrinas específicas. Tono sabio y alentador
     para jóvenes de 13–17 años.
   - Función getDailyVerse(date: Date = new Date()): Verse
     Lógica: dayOfYear = día del año (1–365) calculado desde el 1 de enero.
     Índice: dayOfYear % verses.length. Mismo resultado para todos los usuarios ese día.

2. Crear src/components/student/DailyVerseCard.tsx (Server Component):
   Props: verse: Verse, locale: string.
   Diseño: card teal claro (bg-midsea-lagoon-light, border border-midsea-lagoon/20).
   Contenido: label "VERSÍCULO DEL DÍA" + BookOpen icon (teal) → texto serif italic →
   referencia teal pequeña → separador → pregunta "¿Cómo aplicamos esto hoy?" en muted italic.
   Ver tokens exactos en IMPLEMENTATION.md Mejora 7 Parte A.

3. Agregar DailyVerseCard al dashboard del estudiante:
   En src/app/[locale]/student/page.tsx, importar getDailyVerse y DailyVerseCard.
   Renderizarla como PRIMER elemento dentro del contenido principal del dashboard,
   antes de la lista de cursos activos o cualquier otro contenido.
   Pasar: verse={getDailyVerse()} locale={locale}.

4. Crear src/components/learning/LessonWelcomeCard.tsx (Client Component, 'use client'):
   Props: reflectionEs?: string, reflectionEn?: string, locale: string.
   Client Component porque necesita new Date() para calcular el versículo en el cliente.
   Importar getDailyVerse de '@/lib/verses'.
   
   Lógica: const verse = getDailyVerse(new Date())
   const isEs = locale === 'es'
   const reflection = isEs ? reflectionEs : reflectionEn
   
   Estructura visual (ver IMPLEMENTATION.md Mejora 7 Parte B):
   - Label "VERSÍCULO DEL DÍA" + BookOpen teal
   - Texto del versículo en font-serif italic text-midsea-ink
   - Referencia bíblica en text-midsea-lagoon text-xs
   - Si reflection existe: separador + label "REFLEXIÓN" + Sparkles amber + texto amber
   - Siempre al final: separador + "¿Cómo aplicamos esto hoy?" en muted italic
   
   Card container: rounded-xl border border-midsea-lagoon/20 bg-midsea-lagoon-light px-5 py-4 mb-6

5. Actualizar LessonPlayerShell.tsx en ReadingView:
   AGREGAR <LessonWelcomeCard> como PRIMER elemento, antes del <h1> del título.
   Pasar: reflectionEs={reflectionEs} reflectionEn={reflectionEn} locale={locale}
   ELIMINAR el bloque de reflexión amber que hoy está al FINAL de ReadingView
   (el bloque con bg-coin-light que muestra el campo reflectionEs/En).
   La reflexión ahora solo aparece en la LessonWelcomeCard al inicio.

6. Agregar keys i18n en messages/es.json y messages/en.json:
   Bajo student.dashboard: objeto "verse" con label y connectionQuestion.
   Bajo student.lesson: objeto "welcome" con verseLabel, reflectionLabel, connectionQuestion.
   Ver valores exactos en IMPLEMENTATION.md Mejora 7.

7. npm run type-check. Corregir errores.
8. npm run lint.

RESTRICCIONES:
- getDailyVerse NO hace fetch a ninguna API — es cálculo local puro con array estático.
- DailyVerseCard es Server Component (puede usar getDailyVerse directamente).
- LessonWelcomeCard es Client Component porque calcula la fecha en el cliente (hidratación correcta).
- NO eliminar los campos reflectionEs/reflectionEn de Prisma — solo cambia dónde se renderizan.
- NO eliminar el bloque amber del final de ReadingView si hay alguna referencia en otro lugar;
  sólo eliminarlo de ReadingView específicamente.

Referencia completa: docs/IMPLEMENTATION.md → "Mejora 7: Versículo del Día + Bienvenida Bíblica".
```

---

## Mejora 8: Hook / Activador Mental

> Paso 2 del Flujo Curricular. Un elemento visual breve que aparece DESPUÉS de la bienvenida bíblica y ANTES del cuerpo de la lectura, diseñado para despertar la curiosidad del estudiante: dato curioso, pregunta impactante, situación real, mini reto o imagen provocadora.

---

### Contexto

El flujo actual va: `LessonWelcomeCard → h1 título → label LECTURA → bodyMd`. El estudiante pasa de la bienvenida directamente al contenido sin ningún puente que active la curiosidad. El Hook/Activador Mental es ese puente: crea tensión cognitiva positiva antes de que empiece a leer.

Requiere un nuevo campo en Prisma (`hookEs`/`hookEn`) y un componente nuevo que se renderiza en `ReadingView` después de la bienvenida y antes del título. El pipeline de generación de contenido (ADR-006) deberá producir este campo para cada lección.

---

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `prisma/schema.prisma` | Agregar `hookEs String?` y `hookEn String?` al modelo `Lesson` |
| `src/lib/schemas/lesson-ingest.ts` | Agregar `hookEs` y `hookEn` al schema Zod de ingesta |
| `src/app/[locale]/student/lessons/[slug]/page.tsx` | Pasar `hookEs: data.hookEs`, `hookEn: data.hookEn` como props a `LessonPlayerShell` |
| `src/components/learning/LessonPlayerShell.tsx` | Agregar `hookEs?: string` y `hookEn?: string` a `LessonPlayerShellProps`. En `ReadingView`, renderizar `<LessonHookCard>` entre `<LessonWelcomeCard>` y el `<h1>` del título. |
| `messages/es.json` | Agregar `student.lesson.hook.*` |
| `messages/en.json` | Ídem en inglés |

### Archivos a crear

| Ruta | Tipo | Descripción |
|------|------|-------------|
| `src/components/learning/LessonHookCard.tsx` | Server Component | Card del activador mental. Texto en grande, diseño llamativo. Solo se renderiza si `hook` tiene valor. |

#### Migración de Prisma

```prisma
model Lesson {
  // ... campos existentes ...
  hookEs        String?   // Activador mental en español (dato curioso, pregunta impactante, etc.)
  hookEn        String?   // Activador mental en inglés
}
```

```bash
npx prisma migrate dev --name add_lesson_hook
npx prisma generate
```

#### Actualización de `lesson-ingest.ts`

```typescript
// Agregar al schema Zod:
hookEs: z.string().max(300).optional(),  // máx 300 chars — debe ser breve e impactante
hookEn: z.string().max(300).optional(),
```

---

### Props de `LessonHookCard`

```typescript
interface LessonHookCardProps {
  hook: string    // ya seleccionado según locale (hookEs o hookEn)
}
```

---

### Keys i18n

```json
"hook": {
  "label": "¿Sabías que…?"
}
```

```json
"hook": {
  "label": "Did you know…?"
}
```

---

### Diseño de `LessonHookCard`

El hook tiene que ser visualmente distinto del resto de la página — más grande, más llamativo, con un ícono que indique "esto es interesante". No es una card de datos, es una interpelación directa al estudiante.

```
┌────────────────────────────────────────────────────┐  fondo blanco, borde teal
│  💡 ¿SABÍAS QUE…?                                  │  teal caps pequeño
│                                                    │
│  "¿Sabías que el Período de Entreguerras produjo   │  texto grande, serif bold
│   más avances tecnológicos que cualquier otro      │
│   período de igual duración en la historia?"       │
│                                                    │
└────────────────────────────────────────────────────┘
```

#### Tokens de diseño

| Elemento | Clase Tailwind | Hex efectivo |
|----------|---------------|-------------|
| Card container | `rounded-xl border-2 border-midsea-lagoon/30 bg-midsea-foam px-5 py-5 mb-6` | borde teal medio, fondo blanco |
| Label "¿SABÍAS QUE…?" | `text-[10px] font-semibold tracking-widest text-midsea-lagoon uppercase mb-3 flex items-center gap-1.5` | `#3D9E7A` |
| Ícono label | Lucide `Lightbulb` size 12 | teal |
| Texto del hook | `font-serif text-lg font-normal text-midsea-ink leading-snug` | `#1A1A1A`, más grande que el cuerpo |

> El texto del hook va en **`font-serif text-lg`** — más grande que el cuerpo (`text-[15px]`) para crear contraste visual inmediato. Sin cursiva — el hook es una afirmación o pregunta directa, no una reflexión.

---

### Posición en el flujo de `ReadingView`

```
ReadingView (orden final con Mejoras 7 y 8):

1. <LessonWelcomeCard>    ← Mejora 7: versículo + reflexión + pregunta conexión
2. <LessonHookCard>       ← Mejora 8: activador mental (solo si hookEs/En existe)
3. <h1> título            ← ya existía
4. meta (grado, tipo)     ← ya existía
5. label "LECTURA"        ← ya existía
6. <LessonMarkdown>       ← ya existía
7. <ActivityList>         ← ya existía
8. <LessonPullQuote>      ← ya existía
9. PDF download button    ← Mejora 5
10. footer navegación     ← ya existía
```

---

### Criterios de aceptación

- [ ] `npx prisma migrate dev` corre sin errores.
- [ ] Si `hookEs` tiene valor, `LessonHookCard` aparece entre `LessonWelcomeCard` y el `h1`.
- [ ] Si `hookEs` es null, no aparece ningún espacio vacío.
- [ ] El texto del hook es visualmente más grande que el cuerpo de la lectura.
- [ ] El campo `hookEs` se puede ingestar vía el pipeline de lecciones (schema Zod actualizado).
- [ ] `npm run type-check` pasa sin errores.
- [ ] En mobile, la card no desborda el viewport.

---

### Prompt para Claude Code (Hook / Activador Mental):

```
Implementá la Mejora 8 del docs/IMPLEMENTATION.md: LessonHookCard — Activador Mental.

IMPORTANTE: Esta mejora depende de que Mejora 7 ya esté implementada (LessonWelcomeCard existe
en ReadingView). Si no está, implementar Mejora 7 primero.

PASOS EN ORDEN:

1. Editar prisma/schema.prisma:
   En el modelo Lesson agregar:
     hookEs  String?
     hookEn  String?
   Ejecutar: npx prisma migrate dev --name add_lesson_hook
   Luego: npx prisma generate

2. Actualizar src/lib/schemas/lesson-ingest.ts:
   Agregar al schema Zod de ingesta:
     hookEs: z.string().max(300).optional(),
     hookEn: z.string().max(300).optional(),

3. Crear src/components/learning/LessonHookCard.tsx (Server Component):
   Props: hook: string  (ya seleccionado según locale, un string simple).
   Diseño:
   - Container: rounded-xl border-2 border-midsea-lagoon/30 bg-midsea-foam px-5 py-5 mb-6
   - Label: text-[10px] font-semibold tracking-widest text-midsea-lagoon uppercase mb-3
             flex items-center gap-1.5 + ícono Lightbulb size 12 de lucide-react
   - Texto: font-serif text-lg font-normal text-midsea-ink leading-snug
   El componente solo renderiza si se le pasa el prop (quien lo invoca decide si renderizar).

4. Actualizar page.tsx:
   En el fetch de la lección, data.hookEs y data.hookEn ya están disponibles (Prisma los incluye).
   Pasar hookEs={data.hookEs ?? undefined} y hookEn={data.hookEn ?? undefined} a LessonPlayerShell.

5. Actualizar LessonPlayerShell.tsx:
   Agregar hookEs?: string y hookEn?: string a LessonPlayerShellProps.
   En ReadingView, después de <LessonWelcomeCard> y ANTES del <h1> del título, agregar:
     {hook && <LessonHookCard hook={hook} />}
   donde: const hook = isEs ? hookEs : hookEn

6. Agregar keys i18n en messages/es.json y messages/en.json:
   Bajo student.lesson, en el objeto "hook":
   - es: label: "¿Sabías que…?"
   - en: label: "Did you know…?"
   (El label se usa dentro de LessonHookCard como prop de texto o hardcodeado con t()).

7. npm run type-check. Corregir errores.
8. npm run lint.

RESTRICCIONES:
- LessonHookCard es Server Component — sin 'use client', sin useState, sin useEffect.
- El componente recibe el hook ya seleccionado según locale (string simple, no objeto).
  La selección hookEs vs hookEn la hace ReadingView antes de pasarlo.
- No modificar el campo reflectionEs/reflectionEn en Prisma ni en lesson-ingest.ts.
- Si hookEs es null en la DB, el componente NO debe renderizarse (condicional en ReadingView).

Referencia completa: docs/IMPLEMENTATION.md → "Mejora 8: Hook / Activador Mental".
```

---

## Mejora 9: Tienda Coin — Cursos canjeables con Coins

> Implementa la tienda de Coins completa: modelo `StoreItem` en Prisma, ruta `/student/store` con listado de cursos premium canjeables, lógica de canje server-side, y acceso desde el navbar y el badge de Coins. Reemplaza la página "Coming Soon" de `/student/rewards`.

---

### Contexto del codebase

- La ruta `/student/rewards` existe pero muestra `<ComingSoon />`. Esta mejora la reemplaza por la tienda real.
- El modelo `CoinEntry` ya existe con `reason: STORE_PURCHASE` preparado pero sin uso.
- El navbar del estudiante ya tiene un enlace a "Recompensas" (`/student/rewards`). Cambiaremos el label a "Tienda" y el href a `/student/store`.
- El saldo de Coins se agrega desde `CoinEntry.amount` en el layout — esta lógica no cambia.
- No existe modelo `StoreItem` en Prisma — hay que crearlo.

---

### Modelo de datos a crear

```prisma
model StoreItem {
  id          String        @id @default(cuid())
  titleEs     String
  titleEn     String
  descriptionEs String
  descriptionEn String
  coinPrice   Int           // precio en Coins
  type        StoreItemType // COURSE, MASTERCLASS, ELECTIVE
  courseSlug  String?       // slug del Course que se desbloquea (si type=COURSE)
  imageUrl    String?       // imagen de portada del ítem
  active      Boolean       @default(true)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  purchases   StorePurchase[]
}

enum StoreItemType {
  COURSE
  MASTERCLASS
  ELECTIVE
}

model StorePurchase {
  id          String      @id @default(cuid())
  student     Student     @relation(fields: [studentId], references: [id], onDelete: Cascade)
  studentId   String
  item        StoreItem   @relation(fields: [itemId], references: [id])
  itemId      String
  coinSpent   Int         // precio pagado al momento de la compra
  approvedBy  String?     // parentId si la compra requirió aprobación
  approvedAt  DateTime?
  status      PurchaseStatus @default(PENDING_APPROVAL)
  createdAt   DateTime    @default(now())

  @@index([studentId])
}

enum PurchaseStatus {
  PENDING_APPROVAL
  APPROVED
  REJECTED
}
```

> Agregar `purchases StorePurchase[]` al modelo `Student` existente.

Migración:
```bash
npx prisma migrate dev --name add_store_items_and_purchases
npx prisma generate
```

---

### Archivos a crear

| Ruta | Tipo | Descripción |
|------|------|-------------|
| `src/app/[locale]/student/store/page.tsx` | Server Component | Página principal de la tienda. Fetch de StoreItems activos. Muestra balance de Coins + grid de items. |
| `src/components/store/StoreItemCard.tsx` | Client Component | Card de un ítem de la tienda. Muestra imagen, título, precio en Coins, botón de canje. Maneja estado de compra. |
| `src/components/store/CoinBalanceHeader.tsx` | Server Component | Header de la tienda con saldo actual de Coins del estudiante y frase motivacional. |
| `src/app/api/store/purchase/route.ts` | API Route (POST) | Endpoint de canje: valida saldo, crea `StorePurchase` + `CoinEntry` negativa, responde con status. |

---

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `prisma/schema.prisma` | Agregar modelos `StoreItem`, `StorePurchase`, enums `StoreItemType`, `PurchaseStatus`. Agregar `purchases StorePurchase[]` a `Student`. |
| `src/app/[locale]/student/rewards/page.tsx` | Reemplazar `<ComingSoon />` por un redirect a `/student/store` usando `redirect()` de Next.js. |
| `src/app/[locale]/student/layout.tsx` | Cambiar el link "Recompensas" → label: `t('nav.store')`, href: `/${locale}/student/store`. |
| `src/components/gamification/CoinBadge.tsx` | Convertir el badge en un `<Link>` que apunta a `/${locale}/student/store`. Así el estudiante puede ir a la tienda clickeando su saldo. |
| `messages/es.json` | Agregar `student.store.*` y cambiar `student.nav.rewards` → `student.nav.store` |
| `messages/en.json` | Ídem en inglés |

---

### Keys i18n

```json
"store": {
  "title": "Tienda",
  "subtitle": "Canjeá tus Coins por cursos y contenido premium",
  "balance": "Tu saldo: {amount} Coins",
  "emptyState": "No hay items disponibles en este momento.",
  "coinPrice": "{price} Coins",
  "buyButton": "Canjear",
  "pendingApproval": "Esperando aprobación",
  "approved": "Desbloqueado",
  "insufficientCoins": "Coins insuficientes",
  "purchaseSuccess": "¡Compra enviada! Tu padre/madre debe aprobarla.",
  "purchaseError": "Hubo un error. Intentá de nuevo.",
  "itemTypes": {
    "COURSE": "Curso",
    "MASTERCLASS": "Masterclass",
    "ELECTIVE": "Electivo"
  }
},
"nav": {
  "store": "Tienda"
}
```

---

### Lógica del endpoint de canje (`/api/store/purchase`)

```typescript
// POST /api/store/purchase
// Body: { itemId: string }
// Auth: sesión activa del estudiante

// 1. Validar sesión y obtener studentId
// 2. Fetch del StoreItem (verificar que active === true)
// 3. Calcular balance actual: SUM(CoinEntry.amount) WHERE studentId
// 4. Validar que balance >= item.coinPrice
// 5. Verificar que el estudiante no compró ya este ítem (StorePurchase existente con APPROVED)
// 6. Transacción Prisma:
//    a. Crear StorePurchase { status: 'PENDING_APPROVAL' }
//    b. Crear CoinEntry { amount: -item.coinPrice, reason: 'STORE_PURCHASE', refId: purchase.id }
// 7. TODO v1.1: notificar al padre para aprobación
// 8. Responder { success: true, purchase: { id, status: 'PENDING_APPROVAL' } }
```

> En v1 del pilot, **toda compra queda en `PENDING_APPROVAL`** — el padre aprueba desde el Parent Dashboard (v1.1). Los Coins se descuentan de inmediato para reservar el saldo; si el padre rechaza, se crea una `CoinEntry` positiva de devolución.

---

### Diseño de `StoreItemCard`

```
┌─────────────────────────────────┐
│  [imagen del curso]             │  imageUrl o placeholder gris
│                                 │
│  🏷 CURSO                       │  badge tipo item (teal o amber)
│  Historia del Arte              │  font-serif text-base
│  Exploración visual de los      │  text-sm text-midsea-muted
│  grandes movimientos artísticos │
│                                 │
│  🪙 1.500 Coins                 │  coin-dark font-semibold
│                                 │
│  [    Canjear    ]              │  Button primary si tiene saldo
│                                 │  Button ghost disabled si no
└─────────────────────────────────┘
```

#### Tokens de diseño

| Elemento | Clase Tailwind | Hex efectivo |
|----------|---------------|-------------|
| Card | `rounded-xl border border-midsea-border bg-midsea-foam overflow-hidden shadow-card` | — |
| Imagen placeholder | `w-full h-36 bg-midsea-lagoon-light flex items-center justify-center` | `#E8F5F0` |
| Badge tipo COURSE | `inline-flex items-center gap-1 rounded-full bg-midsea-lagoon-light px-2 py-0.5 text-[10px] font-semibold text-midsea-lagoon uppercase tracking-wide` | teal |
| Badge tipo MASTERCLASS | ídem con `bg-coin-light text-coin-dark` | amber |
| Título | `font-serif text-base font-normal text-midsea-ink mt-2` | `#1A1A1A` |
| Descripción | `text-xs text-midsea-muted leading-snug mt-1 line-clamp-2` | `#6B7280` |
| Precio | `flex items-center gap-1 text-sm font-semibold text-coin-dark mt-3` | `#C47A1A` |
| Ícono Coin en precio | Lucide `Coins` size 14 | amber |
| Botón Canjear (saldo OK) | `<Button variant="primary" className="w-full mt-3">` | `#1800AA` |
| Botón deshabilitado | `<Button variant="ghost" disabled className="w-full mt-3 opacity-50">` | gris |
| Badge "Desbloqueado" | `w-full mt-3 rounded-lg bg-midsea-lagoon-light py-2 text-center text-sm font-medium text-midsea-lagoon` | teal claro |

---

### Diseño de la página `/student/store`

```
┌─────────────────────────────────────────────────────────┐
│  🪙 Tu saldo: 2.450 Coins                               │  CoinBalanceHeader
│  Canjeá tus Coins por cursos y contenido premium        │  subtitle muted
├─────────────────────────────────────────────────────────┤
│  [Card 1]  [Card 2]  [Card 3]                           │  grid 1-2-3 cols
│  [Card 4]  [Card 5]  ...                                │
└─────────────────────────────────────────────────────────┘
```

Grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`

---

### CoinBadge como link a la tienda

El badge `⚡ 2.450 COIN` en el header pasa a ser clickeable:

```tsx
// En CoinBadge.tsx, envolver con Link:
import Link from 'next/link'

// Agregar prop opcional:
interface CoinBadgeProps {
  amount: number
  href?: string   // si se pasa, el badge es un link
}

// Render:
const Wrapper = href ? Link : 'div'
return (
  <Wrapper href={href ?? ''} className="...clases existentes + hover:opacity-80 transition-opacity">
    ⚡ {amount.toLocaleString()} COIN
  </Wrapper>
)

// En layout.tsx, pasar href:
<CoinBadge amount={totalCoin} href={`/${locale}/student/store`} />
```

---

### Criterios de aceptación

- [ ] `npx prisma migrate dev` corre sin errores.
- [ ] La ruta `/student/store` muestra el listado de StoreItems activos.
- [ ] `/student/rewards` redirige a `/student/store`.
- [ ] El navbar muestra "Tienda" en lugar de "Recompensas".
- [ ] El badge de Coins en el header es clickeable y lleva a `/student/store`.
- [ ] Cada StoreItemCard muestra: imagen/placeholder, tipo, título, descripción, precio en Coins.
- [ ] Si el saldo del estudiante es menor al precio, el botón está deshabilitado con label "Coins insuficientes".
- [ ] Si el estudiante ya compró el ítem (cualquier status), el botón muestra "Esperando aprobación" o "Desbloqueado".
- [ ] Al hacer clic en "Canjear", el endpoint POST crea la `StorePurchase` + `CoinEntry` negativa en una sola transacción.
- [ ] `npm run type-check` pasa sin errores.

---

### Prompt para Claude Code (Tienda Coin):

```
Implementá la Mejora 9 del docs/IMPLEMENTATION.md: Tienda Coin — Cursos canjeables.

PASOS EN ORDEN:

1. Editar prisma/schema.prisma:
   Agregar modelos StoreItem, StorePurchase y enums StoreItemType, PurchaseStatus.
   Agregar campo purchases StorePurchase[] al modelo Student existente.
   Ver definición exacta en IMPLEMENTATION.md Mejora 9.
   Ejecutar: npx prisma migrate dev --name add_store_items_and_purchases
   Luego: npx prisma generate

2. Crear src/app/api/store/purchase/route.ts (POST handler):
   Lógica: validar sesión → fetch StoreItem → calcular balance → verificar saldo suficiente →
   verificar que no compró ya → transacción Prisma (StorePurchase + CoinEntry negativa) →
   responder { success: true, purchase }.
   Ver lógica detallada en IMPLEMENTATION.md Mejora 9.
   Usar Zod para validar el body: { itemId: z.string() }.

3. Crear src/components/store/StoreItemCard.tsx (Client Component):
   Props: item: StoreItem, studentBalance: number, existingPurchase?: StorePurchase | null.
   Diseño según tokens en IMPLEMENTATION.md Mejora 9.
   Botón "Canjear": llama POST /api/store/purchase con itemId.
   Estados del botón:
   - saldo >= precio y sin compra previa → "Canjear" (primary, activo)
   - saldo < precio → "Coins insuficientes" (ghost, disabled)
   - existingPurchase.status === 'PENDING_APPROVAL' → "Esperando aprobación" (ghost, disabled)
   - existingPurchase.status === 'APPROVED' → badge "Desbloqueado" (div teal, sin botón)
   Feedback post-canje: toast o mensaje inline "¡Compra enviada! Tu padre/madre debe aprobarla."

4. Crear src/components/store/CoinBalanceHeader.tsx (Server Component):
   Props: balance: number, locale: string.
   Muestra: ícono Coins grande + "Tu saldo: {balance} Coins" en text-2xl + subtitle muted.

5. Crear src/app/[locale]/student/store/page.tsx (Server Component):
   Fetch: todos los StoreItems donde active === true, ordenados por coinPrice ASC.
   Fetch: balance total del estudiante (SUM de CoinEntry.amount).
   Fetch: compras existentes del estudiante (para pasar existingPurchase a cada card).
   Render: <CoinBalanceHeader> + grid de <StoreItemCard>.
   Si no hay items: mensaje de empty state.

6. Reemplazar src/app/[locale]/student/rewards/page.tsx:
   Importar redirect de 'next/navigation'.
   Reemplazar todo el contenido por: redirect(`/${locale}/student/store`)

7. Actualizar src/app/[locale]/student/layout.tsx:
   Cambiar el link de "Recompensas" para que apunte a /${locale}/student/store.
   Cambiar el label: usar t('student.nav.store') en lugar de t('student.nav.rewards').

8. Actualizar src/components/gamification/CoinBadge.tsx:
   Agregar prop opcional href?: string.
   Si href existe, envolver el badge en <Link href={href}> con hover:opacity-80.
   En layout.tsx, pasar href={`/${locale}/student/store`} al <CoinBadge>.

9. Agregar keys i18n en messages/es.json y messages/en.json:
   Bajo student, agregar objeto "store" con todas las keys del IMPLEMENTATION.md Mejora 9.
   Cambiar student.nav.rewards → student.nav.store = "Tienda" / "Store".

10. npm run type-check. Corregir errores.
11. npm run lint.

RESTRICCIONES:
- En v1: TODA compra queda en PENDING_APPROVAL. El padre aprueba en v1.1.
  Los Coins se descuentan de inmediato al momento del canje (reserva de saldo).
- La transacción (StorePurchase + CoinEntry negativa) debe ser atómica: usar prisma.$transaction([]).
- No agregar lógica de aprobación del padre en este sprint — solo crear el StorePurchase.
- StoreItemCard es Client Component ('use client') porque maneja el click y el estado del botón.
- StoreItemCard NO debe hacer fetch del balance — lo recibe como prop desde la página Server Component.

Referencia completa: docs/IMPLEMENTATION.md → "Mejora 9: Tienda Coin".
```

---

## Mejora 10: Angela — Rebrand visual y label "Preguntale a Angela, AI Tutor"

> Dos cambios visuales coordinados: (1) agregar ícono de mundo/globo junto al avatar de Angela para reforzar el posicionamiento "bilingüe y global", y (2) cambiar el texto de todos los puntos de entrada de Angela de "Angela" a "Preguntale a Angela, AI Tutor" para que el estudiante entienda que es un tutor con IA, no solo un chatbot.

---

### Contexto del codebase

- **Avatar de Angela**: SVG kawaii con cara amarilla (`AngelaAvatar.tsx`). No hay globo/mundo en ningún lugar.
- **AngelaSidebarCard**: muestra inicial "A" en círculo teal + texto "Angela". Label hardcodeado.
- **AngelaSidePanel header**: muestra `<AngelaAvatar size="sm">` + texto "Angela".
- **HeaderAngelaHero**: solo el avatar SVG, sin texto descriptivo.
- **AngelaWidget collapsed (FAB)**: solo el avatar, sin texto.
- **Keys i18n actuales**: `student.angela.open` = "Abrir a Angela" / `focusTitle` = "Habla con Angela".

---

### Cambio 1 — Globo de mundo junto al avatar

El ícono Lucide `Globe` aparece como un badge o elemento decorativo junto al avatar de Angela en tres lugares: `AngelaSidebarCard`, `AngelaSidePanel` (header), y `HeaderAngelaHero`. El globo refuerza visualmente "bilingüe + global" sin reemplazar el avatar kawaii.

**Posición:** esquina inferior derecha del avatar, como un badge circular pequeño.

```tsx
// Wrapper relativo para posicionar el globo:
<div className="relative w-fit">
  <AngelaAvatar size="sm" />
  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-midsea-deep flex items-center justify-center ring-2 ring-white">
    <Globe size={10} className="text-white" />
  </div>
</div>
```

Este patrón se aplica igual en los tres lugares (tamaño del wrapper varía según el size del avatar).

---

### Cambio 2 — Label "Preguntale a Angela, AI Tutor"

Reemplazar el texto "Angela" en todos los puntos de entrada por el label completo. Hay cuatro lugares:

| Componente | Texto actual | Texto nuevo |
|------------|-------------|------------|
| `AngelaSidebarCard.tsx` — nombre sobre el mensaje | `"Angela"` | `"Preguntale a Angela, AI Tutor"` (es) / `"Ask Angela, AI Tutor"` (en) |
| `AngelaSidePanel.tsx` — header del panel | `"Angela"` | `"Angela, AI Tutor"` |
| `AngelaWidget.tsx` — aria-label del FAB | `t('student.angela.open')` = "Abrir a Angela" | `t('student.angela.open')` = "Preguntale a Angela, AI Tutor" |
| `AngelaWidget.tsx` — focus mode title | `t('student.angela.focusTitle')` = "Habla con Angela" | `"Angela, AI Tutor"` |

> En el sidebar de lección, el label completo "Preguntale a Angela, AI Tutor" es el más importante porque es la llamada a la acción principal. En el header del panel (AngelaSidePanel) y el focus title, usar "Angela, AI Tutor" (más corto) para no romper el layout.

---

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/learning/AngelaSidebarCard.tsx` | Agregar globo badge junto al círculo "A". Cambiar texto "Angela" por label largo. |
| `src/components/tutoring/AngelaSidePanel.tsx` | Agregar globo badge junto al avatar en el header. Cambiar "Angela" por "Angela, AI Tutor". |
| `src/components/tutoring/HeaderAngelaHero.tsx` | Agregar globo badge junto al avatar hero. Agregar texto descriptivo debajo del avatar si el espacio lo permite. |
| `src/components/tutoring/AngelaWidget.tsx` | Actualizar aria-label del FAB collapsed. |
| `messages/es.json` | Actualizar keys de Angela: `open`, `focusTitle`, nuevo `sidebarLabel`, `panelLabel` |
| `messages/en.json` | Ídem en inglés |

---

### Keys i18n actualizadas

```json
"angela": {
  "sidebarLabel": "Preguntale a Angela, AI Tutor",
  "panelLabel": "Angela, AI Tutor",
  "open": "Preguntale a Angela, AI Tutor",
  "openWithUnread": "Angela tiene una sugerencia para ti",
  "focusTitle": "Angela, AI Tutor",
  "minimize": "Minimizar",
  "close": "Cerrar"
}
```

```json
"angela": {
  "sidebarLabel": "Ask Angela, AI Tutor",
  "panelLabel": "Angela, AI Tutor",
  "open": "Ask Angela, AI Tutor",
  "openWithUnread": "Angela has a suggestion for you",
  "focusTitle": "Angela, AI Tutor",
  "minimize": "Minimize",
  "close": "Close"
}
```

---

### Tokens de diseño del globo badge

| Elemento | Clase Tailwind | Hex efectivo |
|----------|---------------|-------------|
| Badge container | `absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-midsea-deep flex items-center justify-center ring-2 ring-white` | fondo `#1800AA`, anillo blanco |
| Ícono Globe | Lucide `Globe` size 10, `className="text-white"` | blanco |

> En `HeaderAngelaHero` donde el avatar es más grande (`size="hero"` = 72–120px), escalar el badge: `w-7 h-7` con Globe size 14.

---

### Diseño final de `AngelaSidebarCard` con los cambios

```
┌─────────────────────────────────────────────┐
│  [🌐A]  Preguntale a Angela, AI Tutor       │  avatar con globo + label largo
│                                             │
│  "¿Hay algo de «Historia del Arte» que      │  serif italic muted
│   quieras entender mejor antes del quiz?"   │
└─────────────────────────────────────────────┘
```

El `[🌐A]` representa el círculo teal con inicial "A" + el badge azul con globo en la esquina inferior derecha.

---

### Criterios de aceptación

- [ ] El badge de globo aparece en `AngelaSidebarCard`, `AngelaSidePanel` y `HeaderAngelaHero`.
- [ ] El globo no tapa ni distorsiona el avatar kawaii de Angela.
- [ ] `AngelaSidebarCard` muestra "Preguntale a Angela, AI Tutor" (es) o "Ask Angela, AI Tutor" (en).
- [ ] `AngelaSidePanel` header muestra "Angela, AI Tutor".
- [ ] El aria-label del FAB en modo collapsed usa el nuevo label.
- [ ] El focus title del widget muestra "Angela, AI Tutor".
- [ ] En mobile, el label largo no causa overflow en el sidebar de lección.
- [ ] `npm run type-check` pasa sin errores.

---

### Prompt para Claude Code (Angela rebrand):

```
Implementá la Mejora 10 del docs/IMPLEMENTATION.md: Angela — rebrand visual y label.
Son dos cambios: (1) badge de globo junto al avatar, (2) label "Preguntale a Angela, AI Tutor".

PASOS EN ORDEN:

1. Actualizar keys i18n en messages/es.json y messages/en.json:
   Bajo student.angela, actualizar:
   - sidebarLabel: "Preguntale a Angela, AI Tutor" / "Ask Angela, AI Tutor"
   - panelLabel: "Angela, AI Tutor" / "Angela, AI Tutor"
   - open: "Preguntale a Angela, AI Tutor" / "Ask Angela, AI Tutor"
   - focusTitle: "Angela, AI Tutor" / "Angela, AI Tutor"
   Dejar sin cambio: openWithUnread, minimize, close.

2. Crear helper GlobeAvatarWrapper (puede ser inline en cada componente o un pequeño componente):
   Wrapper div con position relative.
   Dentro: {children} (el avatar) + badge absoluto:
   <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-midsea-deep
                   flex items-center justify-center ring-2 ring-white">
     <Globe size={10} className="text-white" />
   </div>
   Importar Globe de lucide-react.

3. Actualizar src/components/learning/AngelaSidebarCard.tsx:
   En el header del card (donde está el círculo "A" teal + texto "Angela"):
   - Envolver el círculo "A" con el GlobeAvatarWrapper (badge size normal: w-5 h-5 Globe size 10).
   - Cambiar el texto "Angela" por t('student.angela.sidebarLabel').

4. Actualizar src/components/tutoring/AngelaSidePanel.tsx:
   En el header del panel (AngelaAvatar size="sm" + texto "Angela"):
   - Envolver el AngelaAvatar con GlobeAvatarWrapper.
   - Cambiar el texto "Angela" por t('student.angela.panelLabel').

5. Actualizar src/components/tutoring/HeaderAngelaHero.tsx:
   - Envolver el AngelaAvatar con GlobeAvatarWrapper.
   - Para el hero (avatar grande), usar badge más grande: w-7 h-7 Globe size 14
     en lugar de w-5 h-5 Globe size 10.

6. Actualizar src/components/tutoring/AngelaWidget.tsx:
   - En el FAB collapsed: actualizar aria-label al nuevo t('student.angela.open').
   - En el focus mode title: usar t('student.angela.focusTitle').

7. npm run type-check. Corregir errores.
8. npm run lint.

RESTRICCIONES:
- NO modificar el SVG de AngelaAvatar.tsx — el avatar kawaii no cambia.
- El badge de globo usa bg-midsea-deep (#1800AA) — el azul navy de Midsea, no el teal.
- ring-2 ring-white para que el badge no se confunda con el avatar cuando hay fondo de color.
- En AngelaSidebarCard, el label largo puede requerir ajuste de layout:
  si el texto "Preguntale a Angela, AI Tutor" es muy largo para una línea,
  aceptar que se corte en dos líneas o usar text-sm en lugar de text-base.
- No tocar prisma/schema.prisma en esta mejora.

Referencia completa: docs/IMPLEMENTATION.md → "Mejora 10: Angela rebrand".
```

---

## Mejora 11: Student Device Pairing — El estudiante entra solo con su PIN

> El estudiante debe poder abrir la app en cualquier tablet o PC y entrar directamente con su avatar + PIN, sin que el padre tenga que loguearse primero. Hoy esto no funciona en dispositivos nuevos o tras logout del padre.

---

### Diagnóstico del problema

El sistema de PIN ya existe y funciona correctamente. El problema es de **bootstrapping de dispositivo**:

- La ruta `/student-login` requiere que la cookie `midsea_device_family` esté seteada con un `familyId` válido para saber qué avatares mostrar.
- Esa cookie solo se setea cuando el **padre** se loguea (`middleware.ts` — solo la escribe cuando detecta un JWT de padre).
- En un dispositivo nuevo, o tras un logout del padre, la cookie no existe y el estudiante es redirigido a `/login` (login de padre), donde no puede hacer nada solo.

**La infraestructura correcta ya está diseñada** — solo falta el mecanismo de vinculación inicial del dispositivo.

---

### Solución: Device Pairing Link

El padre genera un link de vinculación desde su dashboard. Ese link setea la cookie `midsea_device_family` en el dispositivo del estudiante y redirige a `/student-login`. A partir de ahí el estudiante entra solo con PIN para siempre en ese dispositivo.

**Flujo completo:**

```
SETUP (una sola vez, el padre):
  Parent Dashboard → "Vincular dispositivo" → genera link o QR
  → padre comparte el link al estudiante (WhatsApp, email, etc.)
  → estudiante abre el link en su tablet/PC

VINCULACIÓN (una sola vez, en el dispositivo del estudiante):
  GET /device/link/[token]
  → valida token → setea cookie midsea_device_family={familyId} (1 año)
  → redirige a /[locale]/student-login

USO DIARIO (el estudiante solo):
  Abre la app → /student-login → elige avatar → PIN → /student
```

---

### Modelo de datos a agregar

```prisma
model DeviceLinkToken {
  id        String   @id @default(cuid())
  token     String   @unique @default(cuid())   // token seguro en la URL
  familyId  String
  family    Family   @relation(fields: [familyId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  expiresAt DateTime                            // 7 días de validez para el link
  usedAt    DateTime?                           // null = no usado aún
  // Un token usado sigue siendo válido para auditoría, pero no se puede reutilizar
  // en cadena — el dispositivo ya tiene la cookie, no necesita el link de nuevo.
}
```

Agregar también `deviceLinkTokens DeviceLinkToken[]` al modelo `Family`.

Migración:
```bash
npx prisma migrate dev --name add_device_link_tokens
npx prisma generate
```

---

### Archivos a crear

| Ruta | Tipo | Descripción |
|------|------|-------------|
| `src/app/[locale]/device/link/[token]/route.ts` | Route Handler (GET) | Valida el token, setea la cookie `midsea_device_family`, redirige a `/student-login`. No es una page — es un redirect handler. |
| `src/app/api/device/generate-link/route.ts` | API Route (POST) | Genera un `DeviceLinkToken` para la familia del padre autenticado. Retorna la URL del link y un QR en base64 opcional. |
| `src/components/parent/DeviceLinkCard.tsx` | Client Component | Card en el Parent Dashboard para generar y compartir el link de vinculación. Muestra el link, botón de copiar y QR. |

---

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `prisma/schema.prisma` | Agregar modelo `DeviceLinkToken` y relación en `Family`. |
| `src/app/[locale]/student-login/page.tsx` | Cambiar la redirección cuando no hay cookie: en lugar de ir a `/login` (padre), ir a una página intermedia `/student-login/no-device` que explica cómo vincularse. |
| `src/app/[locale]/parent/page.tsx` | Agregar `<DeviceLinkCard>` en el dashboard del padre. |
| `messages/es.json` | Agregar `parent.deviceLink.*` y `student.noDevice.*` |
| `messages/en.json` | Ídem en inglés |

---

### Lógica del Route Handler de vinculación

```typescript
// GET /[locale]/device/link/[token]
// No requiere autenticación — es el primer punto de contacto del dispositivo

export async function GET(
  request: Request,
  { params }: { params: { token: string; locale: string } }
) {
  const record = await prisma.deviceLinkToken.findUnique({
    where: { token: params.token },
    include: { family: true }
  })

  // Token inválido o no encontrado
  if (!record) {
    return redirect(`/${params.locale}/student-login/invalid-link`)
  }

  // Token expirado (más de 7 días)
  if (record.expiresAt < new Date()) {
    return redirect(`/${params.locale}/student-login/invalid-link?reason=expired`)
  }

  // Marcar como usado (primera vez)
  if (!record.usedAt) {
    await prisma.deviceLinkToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() }
    })
  }
  // Si ya fue usado: igual funciona — el padre puede compartir el mismo link
  // a múltiples dispositivos. La cookie es lo que persiste, no el token.

  // Setear cookie de familia en el dispositivo
  const response = NextResponse.redirect(
    new URL(`/${params.locale}/student-login`, request.url)
  )
  response.cookies.set('midsea_device_family', record.familyId, {
    maxAge: 60 * 60 * 24 * 365, // 1 año
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  })
  return response
}
```

---

### Lógica del endpoint de generación

```typescript
// POST /api/device/generate-link
// Requiere sesión de padre autenticado

export async function POST(request: Request) {
  const parent = await requireParentApi(request) // helper existente
  if (!parent) return jsonError(401, 'unauthorized')

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 días

  const record = await prisma.deviceLinkToken.create({
    data: {
      familyId: parent.familyId,
      expiresAt
    }
  })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.midsea.com'
  const locale = parent.family.locale ?? 'es'
  const linkUrl = `${baseUrl}/${locale}/device/link/${record.token}`

  return Response.json({ linkUrl, expiresAt: record.expiresAt })
}
```

---

### Diseño de `DeviceLinkCard` en el Parent Dashboard

```
┌─────────────────────────────────────────────────────┐
│  📱 Vincular dispositivo del estudiante             │  título
│                                                     │
│  Compartí este link con tu hijo/a para que pueda    │  texto explicativo
│  entrar solo con su PIN desde cualquier tablet.     │
│                                                     │
│  [  Generar link de acceso  ]                       │  Button primary
│                                                     │
│  ┌─────────────────────────────────────────────┐    │  (aparece al generar)
│  │  https://app.midsea.com/es/device/link/xxx  │    │
│  │                            [ 📋 Copiar ]    │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ⏱ Este link expira en 7 días.                      │  texto muted
│  Podés generar uno nuevo cuando quieras.            │
└─────────────────────────────────────────────────────┘
```

#### Tokens de diseño

| Elemento | Clase Tailwind | Hex efectivo |
|----------|---------------|-------------|
| Card container | `rounded-xl border border-midsea-border bg-midsea-foam p-5` | borde `#E5E7EB` |
| Título | `text-sm font-semibold text-midsea-ink flex items-center gap-2` | `#1A1A1A` |
| Ícono | Lucide `Smartphone` size 16, `text-midsea-lagoon` | `#3D9E7A` |
| Texto explicativo | `text-sm text-midsea-muted mt-1 mb-4 leading-snug` | `#6B7280` |
| Botón generar | `<Button variant="primary">` existente | `#1800AA` |
| Box del link | `mt-4 flex items-center gap-2 rounded-lg border border-midsea-border bg-midsea-surface px-3 py-2` | fondo `#FAFAFA` |
| Texto del link | `flex-1 text-xs text-midsea-muted font-mono truncate` | `#6B7280` |
| Botón copiar | Lucide `Copy` size 14, `text-midsea-lagoon hover:text-midsea-lagoon/70` | teal |
| Expiración | `mt-2 text-xs text-midsea-muted` | `#6B7280` |

---

### Página intermedia cuando no hay cookie

Cuando el estudiante llega a `/student-login` sin la cookie (dispositivo no vinculado), en lugar de redirigirlo al login del padre (que no tiene sentido para él), mostrar una pantalla amigable:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│            [Avatar Angela animado]                  │
│                                                     │
│        ¡Hola! Este dispositivo                      │  font-serif text-xl
│        aún no está vinculado                        │
│                                                     │
│   Pedile a tu papá o mamá que genere un             │  text-sm muted
│   link de acceso desde su cuenta de Midsea          │
│   y abrilo en esta tablet o computadora.            │
│                                                     │
│   [  Ya tengo un link  ]                            │  input para pegar el link
│                                                     │
└─────────────────────────────────────────────────────┘
```

Archivo: `src/app/[locale]/student-login/no-device/page.tsx`

El botón "Ya tengo un link" muestra un `<input>` donde el estudiante puede pegar el link directamente (por si el padre se lo mandó por mensaje). Al submit, navegar a esa URL.

---

### Keys i18n

```json
"deviceLink": {
  "cardTitle": "Vincular dispositivo del estudiante",
  "cardDescription": "Compartí este link con tu hijo/a para que pueda entrar solo con su PIN desde cualquier tablet o computadora.",
  "generateButton": "Generar link de acceso",
  "generating": "Generando...",
  "copyButton": "Copiar",
  "copied": "¡Copiado!",
  "expiresIn": "Este link expira en 7 días. Podés generar uno nuevo cuando quieras.",
  "invalidLink": "Este link no es válido o ya expiró. Pedile a tu papá o mamá que genere uno nuevo."
},
"noDevice": {
  "title": "Este dispositivo aún no está vinculado",
  "description": "Pedile a tu papá o mamá que genere un link de acceso desde su cuenta de Midsea y abrilo en esta tablet o computadora.",
  "hasLink": "Ya tengo un link",
  "linkPlaceholder": "Pegá el link aquí..."
}
```

---

### Criterios de aceptación

- [ ] `npx prisma migrate dev` corre sin errores.
- [ ] El padre puede generar un link desde su dashboard.
- [ ] El link se puede copiar al portapapeles.
- [ ] Abrir el link en un dispositivo nuevo setea la cookie y redirige a `/student-login`.
- [ ] El estudiante ve el grid de avatares sin que el padre esté logueado.
- [ ] El estudiante puede entrar con su PIN y llegar a `/student`.
- [ ] Si el token expiró (>7 días), muestra mensaje de error claro.
- [ ] El mismo link puede usarse en múltiples dispositivos de la misma familia.
- [ ] En dispositivos ya vinculados, `/student-login` sigue funcionando igual (sin cambio).
- [ ] Si no hay cookie, el estudiante ve `/student-login/no-device` en lugar del login del padre.
- [ ] `npm run type-check` pasa sin errores.

---

### Riesgos

**Riesgo 1 — Seguridad del link:** El token es un `cuid()` de 25 caracteres — suficientemente largo para ser imposible de adivinar por fuerza bruta. La expiración de 7 días limita la ventana de exposición. Para v1.1 se puede agregar un límite de usos (ej. máximo 5 dispositivos por token).

**Riesgo 2 — El padre no usa el dashboard:** Para el pilot, documentar en el onboarding que el primer paso es vincular el dispositivo del estudiante. Considerar que el flujo de setup inicial (cuando el padre crea el primer estudiante) ofrezca generar el link inmediatamente.

**Riesgo 3 — `requireParentApi` helper:** Verificar si existe este helper o si hay que usar `getServerSession` directamente en el route handler.

---

### Prompt para Claude Code (Student Device Pairing):

```
Implementá la Mejora 11 del docs/IMPLEMENTATION.md: Student Device Pairing.
OBJETIVO: El estudiante entra solo con su PIN sin necesitar al padre logueado en el dispositivo.

PASOS EN ORDEN:

1. Editar prisma/schema.prisma:
   Agregar modelo DeviceLinkToken con campos: id, token (unique, default cuid()), familyId,
   family (relation a Family), createdAt, expiresAt, usedAt (nullable).
   Agregar deviceLinkTokens DeviceLinkToken[] al modelo Family.
   Ver definición exacta en IMPLEMENTATION.md Mejora 11.
   Ejecutar: npx prisma migrate dev --name add_device_link_tokens
   Luego: npx prisma generate

2. Crear src/app/api/device/generate-link/route.ts (POST handler):
   Requiere sesión de padre. Obtener sesión con getServerSession(authOptions).
   Si no hay sesión o role !== 'PARENT': retornar 401.
   Crear DeviceLinkToken con expiresAt = now + 7 días.
   Construir linkUrl con NEXT_PUBLIC_APP_URL + /${locale}/device/link/${record.token}.
   Retornar { linkUrl, expiresAt }.
   Ver lógica completa en IMPLEMENTATION.md Mejora 11.

3. Crear src/app/[locale]/device/link/[token]/route.ts (GET handler — NO es una page):
   No requiere autenticación.
   Fetch DeviceLinkToken por token. Si no existe → redirect a /student-login/invalid-link.
   Si expiresAt < new Date() → redirect a /student-login/invalid-link?reason=expired.
   Si !usedAt → marcar usedAt = new Date().
   Setear cookie 'midsea_device_family' con record.familyId (maxAge: 1 año, httpOnly, sameSite: lax).
   Redirect a /${params.locale}/student-login.
   Ver lógica completa en IMPLEMENTATION.md Mejora 11.

4. Crear src/app/[locale]/student-login/no-device/page.tsx (Server Component):
   Página amigable para estudiantes en dispositivos no vinculados.
   Mostrar: AngelaAvatar (size hero) + título "Este dispositivo aún no está vinculado"
   + descripción pidiendo al padre que genere el link.
   Input donde el estudiante puede pegar el link + botón que navega a esa URL.
   Ver diseño en IMPLEMENTATION.md Mejora 11.

5. Modificar src/app/[locale]/student-login/page.tsx:
   Buscar la lógica que chequea la cookie midsea_device_family.
   Si no hay cookie, en lugar de redirect a /login, hacer redirect a
   /${locale}/student-login/no-device.

6. Crear src/components/parent/DeviceLinkCard.tsx (Client Component):
   Props: locale: string.
   Estado: linkUrl: string | null, loading: boolean, copied: boolean.
   Botón "Generar link": hace POST /api/device/generate-link → muestra el link.
   Box con el link + botón copiar (navigator.clipboard.writeText).
   Feedback "¡Copiado!" por 2 segundos.
   Ver diseño y tokens en IMPLEMENTATION.md Mejora 11.

7. Agregar DeviceLinkCard al dashboard del padre:
   En src/app/[locale]/parent/page.tsx, importar y renderizar <DeviceLinkCard locale={locale} />
   cerca del área de gestión de estudiantes.

8. Agregar keys i18n en messages/es.json y messages/en.json:
   Bajo parent: objeto "deviceLink" con todas las keys.
   Bajo student: objeto "noDevice" con title, description, hasLink, linkPlaceholder.
   Ver valores exactos en IMPLEMENTATION.md Mejora 11.

9. npm run type-check. Corregir errores.
10. npm run lint.

RESTRICCIONES CRÍTICAS:
- El route handler /device/link/[token]/route.ts NO es una page — es un GET handler
  que devuelve NextResponse.redirect(), NO JSX. Crear como route.ts, no como page.tsx.
- El token NO expira al usarse por primera vez — permite múltiples dispositivos de la misma familia.
  Solo expira por fecha (7 días desde creación).
- La cookie midsea_device_family debe setearse con los MISMOS atributos que el middleware existente:
  httpOnly: true, sameSite: 'lax', path: '/', maxAge: 365 días.
  En producción agregar secure: true.
- NO modificar el flujo de login cuando la cookie YA existe — solo cambiar qué pasa cuando NO existe.
- NO tocar AuthOptions ni los providers de NextAuth.

Referencia completa: docs/IMPLEMENTATION.md → "Mejora 11: Student Device Pairing".
```

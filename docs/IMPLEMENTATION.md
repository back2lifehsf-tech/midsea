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

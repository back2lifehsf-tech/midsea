# Prompt para Claude Code — Epic 02b: Landing Pricing Fix
## Corrección "$29 por estudiante" + toggle anual con 30% off

> **Cómo usar:** abre `claude` en la raíz del repo, pega el bloque bajo **PROMPT**.

---

## Contexto del epic

**Epic:** Corregir el copy actual del landing que sugiere "$29 por 4 niños" o "plan familiar flat" para Core. El modelo real es **$29 por estudiante / mes** (PRD §1.4 + ADR-001), con la excepción del plan Family $69 flat hasta 4 hijos. Adicionalmente, agregar toggle anual con 30% de descuento (decisión 2026-05-20). Sin integración con Stripe — solo display. La integración real ocurre en Epic 03.

**Duración estimada:** 1-2 días.

**Estado actual:**
- Landing existente en `src/app/[locale]/page.tsx` (verificar; si no existe, crear como ruta pública bajo el `(public)` group del Epic 01).
- Sin sección de pricing aún, o con sección incorrecta. Verificar con grep `pricing` antes de tocar.
- `ADR-001-billing-stack.md` ya define los precios y el modelo. Cero ambigüedad.

**Alcance — IN:**
1. Sección `<Pricing>` en el landing con tres tarjetas: Core, Pro, Family.
2. Componente `<PricingToggle>` reutilizable: switch Mensual / Anual. Default: Anual (mayor conversión a LTV).
3. Componente `<PricingCard>` reutilizable con props `{ plan, billingCycle, ... }`.
4. Cálculo dinámico de equivalente mensual cuando se elige anual: $20.30/mes equiv ($243.60/año).
5. Badge de ahorro visible: "Ahorra 30% — $104.40/año por estudiante".
6. Family plan diferenciado visualmente: borde destacado, badge "Mejor para 3+ hijos", precio FIJO sin toggle anual (deshabilitado o oculto).
7. FAQ con 4-6 preguntas corregidas (ver Sección "Copy" abajo).
8. Keys i18n bajo `landing.pricing.*` en `messages/es.json` y `en.json`.
9. CTA "Comenzar como padre" → `/[locale]/signup?role=parent` (ruta ya existe Epic 01).
10. Mobile-first responsive (1 col mobile, 3 col desktop).

**Alcance — OUT:**
- ❌ Integración con Stripe (Epic 03).
- ❌ Captura de método de pago (Epic 03).
- ❌ Flujo de checkout (Epic 03).
- ❌ Re-diseño del resto del landing (hero, features, testimonials) — solo la sección pricing.
- ❌ Toggle por moneda (USD/MXN/COP) — v2 según ADR-001 §7.
- ❌ Soporte multi-locale fuera de es/en (ya cubierto por Epic 01).

---

## Copy obligatorio (usar como source of truth)

### Header de la sección

- Eyebrow: `"Precios"`
- H2: `"Un tutor AI para cada hijo. Sin sorpresas."`
- Subtitle: `"Paga por estudiante. Cada hijo tiene su propia Angela, su MasteryMap y su Ruta de Aprendizaje. Cancela cuando quieras."`

### Toggle

- Etiqueta izquierda: `"Mensual"`
- Etiqueta derecha: `"Anual"` con badge inline `"Ahorra 30%"` (color primary, pill)

### Tarjeta Core

- Plan name: `"Core"`
- Precio (mensual): `"$29"` + `"/mes"` + `"por estudiante"`
- Precio (anual): `"$20.30"` + `"/mes"` + `"por estudiante"` + sub `"$243.60 al año · Ahorras $104.40"`
- Tagline: `"Para familias con un hijo o probando Midsea."`
- Features (5):
  - "Angela 24/7 en español o inglés"
  - "Acceso a todas las materias K-12"
  - "MasteryMap y planificador semanal AI"
  - "Reportes para el padre"
  - "Cancela cuando quieras"
- CTA: `"Comenzar"` → `/signup?role=parent&plan=core`

### Tarjeta Pro (highlight)

- Plan name: `"Pro"` con badge `"Recomendado"`
- Precio (mensual): `"$45"` + `"/mes"` + `"por estudiante"`
- Precio (anual): `"$31.50"` + `"/mes"` + `"por estudiante"` + sub `"$378 al año · Ahorras $162"`
- Tagline: `"Para familias serias sobre homeschooling."`
- Features (incluye lo de Core +):
  - "Reportes regulatorios automáticos (Florida, Texas, México-SEP, España-LOMLOE)"
  - "Sesiones grupales con tutor humano (4 por mes)"
  - "Prioridad en soporte"
  - "Análisis predictivo del progreso"
- CTA: `"Comenzar"` → `/signup?role=parent&plan=pro`

### Tarjeta Family

- Plan name: `"Family"` con badge `"Mejor para 3+ hijos"`
- Precio: `"$69"` + `"/mes"` + `"para hasta 4 hijos"` (sin toggle anual visible o disabled con tooltip "Disponible solo mensual en v1")
- Tagline: `"Familias grandes. Precio fijo sin sorpresas."`
- Features (lo de Pro +):
  - "Hasta 4 estudiantes incluidos"
  - "Dashboards comparativos por hijo"
  - "Coordinación de horarios entre hermanos"
- Disclaimer pequeño: `"Si tienes 5+ hijos, contáctanos para plan personalizado."`
- CTA: `"Comenzar"` → `/signup?role=parent&plan=family`

### FAQ (4-6 preguntas)

1. **¿Cuánto cuesta si tengo 2 hijos?**
   *"En Core, $58/mes ($29 × 2). En Pro, $90/mes ($45 × 2). Cada hijo tiene su propio progreso, avatar y Angela. Si tienes 3 o más hijos, Family a $69/mes te conviene."*

2. **¿Puedo cambiar de plan después?**
   *"Sí, en cualquier momento desde el Parent Copilot. Los cambios se prorratean en el siguiente cobro."*

3. **¿Hay reembolsos?**
   *"No hay reembolsos por períodos parciales, pero puedes cancelar cuando quieras y el acceso continúa hasta el final del período ya pagado."*

4. **¿Qué pasa si elijo anual y necesito cancelar a los 3 meses?**
   *"Puedes cancelar y mantienes acceso hasta el final del año pagado. No reembolsamos la fracción no usada — por eso el descuento del 30% solo aplica si te comprometes con el año."*

5. **¿Aceptan pagos desde México / LATAM?**
   *"Sí, aceptamos tarjetas de cualquier país. Los precios están en USD. Próximamente sumaremos OXXO (México) y moneda local."*

6. **¿Qué incluye 'reportes regulatorios automáticos'?**
   *"Generamos los formatos que pide tu jurisdicción para validar homeschooling: SEP en México, LOMLOE en España, Florida Compulsory Attendance Affidavit, Texas Notice of Intent, y los reportes equivalentes de otros estados/países que vamos sumando."*

---

## Decisiones técnicas pre-tomadas

1. **Sin Stripe en este epic.** Los precios se hardcodean en `src/lib/pricing/plans.ts` como constantes. Cuando Epic 03 traiga Stripe, ese archivo se reemplaza por un `getPlansFromStripe()`. La estructura de datos sí coincide con `Price` objects de Stripe para minimizar refactor.
2. **Anual seleccionado por default.** Razón: mayor LTV, alineado con mejores prácticas SaaS (Stripe, Linear, Notion). El badge "Ahorra 30%" justifica visualmente la selección.
3. **`ANNUAL_DISCOUNT_PCT=30`** vive en `.env` y se lee server-side. El cliente recibe ambos precios pre-calculados (no hace math en el browser).
4. **Componentes:** crear bajo `src/components/landing/pricing/` para aislar del resto. `<PricingSection>`, `<PricingToggle>`, `<PricingCard>`, `<PricingFAQ>`.
5. **Animación del toggle:** Framer Motion `layoutId` para que los precios "morfen" entre mensual y anual. No reload, no flash.
6. **a11y:** el toggle es un `<RadioGroup>` semántico (no toggle visual sin keyboard), labels visibles, `aria-live` para announce de cambio de precio.

---

## Plan de sprint (3 tareas, 1-2 días)

| # | Tarea | Tiempo | Entregable |
|---|-------|--------|-----------|
| 1 | `src/lib/pricing/plans.ts` + tipos + tests unit del cálculo | 2-3h | Función `computeAnnualPrice(monthlyCents, discountPct)` con tests. |
| 2 | Componentes `<PricingToggle>`, `<PricingCard>`, `<PricingSection>` + i18n keys | 4-6h | Sección Pricing renderiza con datos de tarea 1. |
| 3 | FAQ + integración en landing + responsive + a11y review | 3-4h | Página `/[locale]` muestra sección completa. |

---

## Criterios de aceptación

- [ ] `npm run type-check`, `npm run lint`, `npm run check:edunexo` limpios.
- [ ] La página `/es` y `/en` renderiza la sección Pricing con 3 tarjetas.
- [ ] Toggle Mensual ↔ Anual funciona, los precios se actualizan, el badge "Ahorra 30%" es visible cuando anual está activo.
- [ ] Family card NO cambia con el toggle (el toggle queda disabled o se oculta para esa card).
- [ ] El "Ahorras $104.40 / $162" se calcula dinámicamente, no hardcoded.
- [ ] CTA de cada card lleva a `/signup?role=parent&plan={core|pro|family}`.
- [ ] Mobile (375px): 1 columna, Family arriba si la heurística lo justifica.
- [ ] Desktop (≥1024px): 3 columnas, Pro destacado en el centro.
- [ ] Cero strings hardcodeados. Todos los textos bajo `landing.pricing.*` en ES y EN.
- [ ] Tests unit pasan para `computeAnnualPrice` con edge cases (descuento 0%, 100%, decimales).
- [ ] FAQ usa `<details>` semántico (accordion sin JS framework heavy).
- [ ] Keyboard navigation: Tab atraviesa toggle → cards → FAQ → CTA correctamente.

---

## Guardrails

- ❌ NO integrar Stripe. Es Epic 03.
- ❌ NO copiar el patrón "Add subscription to cart" de Time4Learning. Midsea va directo a `/signup`, sin carrito intermedio (ver DMP §2.3 "Rechazo estratégico").
- ❌ NO copiar "3 courses included" o framing de "Preschool Curriculum / Elementary Curriculum" de T4L. Midsea es plataforma completa K-12 por estudiante, no catálogo de cursos sueltos.
- ❌ NO usar moneda local todavía. Solo USD. Toggle de moneda es v2 según ADR-001 §7.
- ❌ NO crear ruta `/pricing` separada. La sección vive dentro del landing principal `/`.
- ❌ NO bajar el ahorro por debajo de $100/año en el copy aunque los números cambien — si los números no cierran, ajustar el descuento, no esconder el ahorro.

---

## PROMPT (copiar y pegar en Claude Code)

```
Estoy iniciando el Epic 02b: Landing Pricing Fix. Corrige el copy y agrega
toggle anual 30%. Sin Stripe en este epic.

PASO -1 — Git workflow.
  Crea `feature/epic-02b-landing-pricing` desde `develop`. No commits a
  develop/main.

PASO 0 — Lectura mínima.
  CLAUDE.md ya cargado. Lee SOLO:
   1. docs/prompts/epic-02b-landing-pricing-fix.md (este archivo, completo).
   2. docs/decisions/ADR-001-billing-stack.md (fuente de verdad de precios).
   3. docs/DMP.md §2.3 (Time4Learning — rechazos estratégicos).
   4. src/app/[locale]/page.tsx (estado actual del landing).
   5. messages/es.json y en.json (estructura existente de keys).
  NO leas: AI_TUTOR_SPEC, PRD completo, ni Stripe SDK docs (no aplica).
  Confirma lectura.

PASO 1 — Plan (máx 20 líneas).
  Reporta:
   (a) Estado actual de `src/app/[locale]/page.tsx` — ¿hay sección
       pricing? ¿qué dice el copy?
   (b) Las 3 tareas a ejecutar con archivos.
   (c) Cualquier ambigüedad.
  Espera "ok, ejecuta".

PASO 2 — Ejecución (3 tareas).
  Una a la vez. Para cada tarea: archivos tocados, type-check + lint
  pasan, criterios cubiertos. Reporte máx 8 líneas.

PASO 3 — Cierre.
  Checklist completa de Definition of Done con [✓]/[✗]/[⚠].
  Pendientes en sección nueva "## Pendientes para Epic 03" del epic doc.

PASO 4 — Push.
  Commits atómicos: `feat(landing): pricing constants and types`,
  `feat(landing): toggle and cards`, `feat(landing): FAQ and i18n`.
  `git push -u origin feature/epic-02b-landing-pricing` y avisa.

REGLAS DE INTERACCIÓN:
- Eficiencia de tokens: no releas archivos ya leídos. Reportes ≤10 líneas.
- Anti-copia: si caes en patrón de T4L "Add to cart" o framing de curriculum
  por edad, para. Consulta DMP §2.3.
- Sin Stripe. Sin checkout. Solo display.
- Mobile-first. a11y obligatorio (RadioGroup semántico, keyboard nav).
- i18n: cero strings hardcodeados; keys bajo `landing.pricing.*`.

Empieza por PASO -1 ahora.
```

---

## Pendientes para Epic 03

### Cobranza real (out of scope intencional)
Todo el módulo `src/lib/pricing/plans.ts` se reemplaza por `getPlansFromStripe()` que lee Price IDs del dashboard. La estructura `PlanDisplay` ya está alineada con `Stripe.Price` para minimizar diff. Lo que hay que añadir:
- `lib/stripe/server.ts` con cliente singleton.
- `/api/checkout/session/route.ts` que recibe `{plan, cycle, parentId}` y abre Stripe Checkout.
- Webhook handler `/api/webhooks/stripe/route.ts` (modelo `StripeWebhookEvent` ya en ADR-001 §10).
- Migración Prisma: `Student.subscriptionStatus`, `planTier`, `billingCycle`, `stripeSubscriptionId`, `currentPeriodEnd`; `Parent.stripeCustomerId`.

### CTA con query params
El landing pasa `?role=parent&plan={core|pro|family}` al `/signup`. La página de signup actualmente IGNORA estos params. Cuando Epic 03 cablee el flow:
- Leer `plan` en signup → guardar como `planTier` pendiente en sesión / cookie temporal.
- Al completar signup, redirigir a Stripe Checkout con el Price ID correspondiente.

### Currency toggle
ADR-001 §7 punt a v2: USD/MXN/COP/EUR. Cuando entremos:
- `formatUsd` pasa a `formatMoney(cents, currency, locale)`.
- Backend devuelve `Price` por moneda (Stripe Adaptive Pricing o Pricing Tables).
- Toggle adicional Currency (3 botones) o auto-detect por `Accept-Language` + IP.

### Tooltip en Family annual-disabled
Hoy se muestra hint en texto plano ("Disponible solo mensual en v1"). UX más limpio:
- Toggle con icono `?` que abre un tooltip al hover/focus con la razón (proration complexity per ADR-001 §3).
- Considerar mostrar el hint sólo cuando el toggle Anual está activo Y el usuario está mirando Family (Intersection Observer).

### A/B testing del default
Defaulteamos a Anual por LTV. Cuando tengamos analytics (PostHog / Vercel Analytics):
- Variant A: default Anual (actual)
- Variant B: default Mensual
- Métrica: conversión a signup completado en 7 días.
- Probable resultado: Anual gana por LTV, Mensual gana por conversion rate al signup. Decisión a tomar con números reales.

### Comparison table multi-plan
Algunas familias quieren ver lado-a-lado qué incluye cada plan. Una `<ComparisonTable>` debajo del FAQ con filas (features) y columnas (planes) podría incrementar conversión. Punt hasta tener datos de sesión que muestren que los usuarios scrollean buscando esa info.

### Lifetime plan
El landing viejo tenía un plan "Lifetime $590" que se removió en este epic (no aparece en ADR-001 ni PRD). Si el negocio quiere re-introducirlo, hay que añadir el tier al schema (`enum PlanTier`) y al ADR antes de reflejarlo en UI.

### Framer Motion price morph
Decidimos NO instalar Framer Motion en este epic. Si el equipo de producto pide el morph fluido entre `$29` y `$20.30` cuando se alterna el toggle, esa es la única dep nueva a justificar.

### Tests E2E (Playwright)
Heredado de Epic 01/02. Smoke test del flow pricing:
- Cargar `/es` → ver sección Pricing.
- Click toggle Anual → precios cambian a `$20.30` Core / `$31.50` Pro / `$69.00` Family (sin cambio).
- Click CTA Pro → navega a `/es/signup?role=parent&plan=pro`.
- Toggle por keyboard (Tab + Arrow keys) funciona.

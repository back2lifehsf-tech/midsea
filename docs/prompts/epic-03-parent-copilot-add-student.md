# Prompt para Claude Code — Epic 03: Parent Copilot — Add Student + Billing
## Flujo "Agregar Estudiante" con Stripe Elements inline

> **Cómo usar:** abre `claude` en la raíz del repo, pega el bloque bajo **PROMPT**.

---

## Contexto del epic

**Epic:** Construir el flujo completo "Mis Estudiantes" + "Agregar Estudiante" + cobro inline con Stripe Payment Element. Cada estudiante = una `Subscription` propia bajo el `Customer` del padre, según ADR-001. Sin este epic, el negocio no factura.

**Duración estimada:** 7-10 días.

**Estado actual del repo (verificado 2026-05-20):**
- Auth multi-rol funcionando (Epic 01).
- Dashboard parental placeholder en `src/app/[locale]/parent/page.tsx`.
- Ruta `src/app/[locale]/parent/students/new/page.tsx` ya existe como placeholder de Epic 01 — se sobreescribe en este epic.
- Schema Prisma tiene `Student` pero **sin campos de subscription**. Migración requerida (ver §3).
- Sin Stripe SDK instalado. `stripe` y `@stripe/stripe-js` deben agregarse a `package.json`.
- ADR-001 ya define todas las decisiones de billing — leer antes de cualquier código.

---

## Alcance — IN

### Estructura de UI

1. **`/[locale]/parent/dashboard`** (overhaul del placeholder): "Mis Estudiantes" con grid de tarjetas, total mensual sticky, FAB / header CTA "+ Agregar estudiante".
2. **Modal `<NewStudentDialog>`** (multi-step):
   - Step A: datos del estudiante (nombre, fecha nacimiento, grado, idioma de aprendizaje, notas opcionales para Angela).
   - Step B: confirmación de cobro con Stripe Payment Element inline.
   - Step C: éxito o error post-pago.
3. **Tarjeta `<StudentCard>`** reutilizable con 3 variants: `active`, `pending_payment`, `inactive`.
4. **Componente `<MonthlyTotalBar>`**: sticky bottom (mobile) o sidebar (desktop), suma `monthlyAmountCents` de students activos. Muestra plan mix si hay más de uno: "$58/mes (2 Core)" o "$74/mes (1 Core + 1 Pro)".
5. **Re-auth gate antes del pago:** modal de confirmación de password del padre antes de exponer Payment Element. Mitiga session hijacking.
6. **Empty state** con ilustración + CTA grande cuando 0 estudiantes.

### Backend / Domain

7. **Migration Prisma** según ADR-001 §10:
   - Campos nuevos en `Student`: `subscriptionStatus`, `planTier`, `billingCycle`, `stripeSubscriptionId`, `currentPeriodEnd`, `monthlyAmountCents`.
   - Campo nuevo en `Parent`: `stripeCustomerId`.
   - Tabla nueva: `StripeWebhookEvent`.
8. **Server actions / API:**
   - `POST /api/students/create` — crea Student en `PENDING_PAYMENT` (sin Stripe aún), devuelve `studentId`.
   - `POST /api/billing/setup-intent` — devuelve `client_secret` para Payment Element.
   - `POST /api/billing/subscribe` — crea/asegura `Customer`, crea `Subscription`, confirma `PaymentIntent`, retorna `subscriptionId`.
   - `POST /api/webhooks/stripe` — handler con verificación de signature + idempotencia (`StripeWebhookEvent` upsert por `eventId`).
9. **Servicio `src/lib/billing/stripe.ts`** con funciones puras: `ensureCustomer(parent)`, `createSubscription(customerId, priceId)`, `mapStripeStatusToPrisma(stripeStatus)`.

### Eventos manejados (webhooks)

- `payment_intent.succeeded` → marca `Student.subscriptionStatus = ACTIVE`.
- `payment_intent.payment_failed` → marca `PENDING_PAYMENT`, notifica al padre.
- `customer.subscription.updated` → sincroniza `currentPeriodEnd`, `planTier`.
- `customer.subscription.deleted` → marca `CANCELED`.
- `invoice.payment_failed` → log; Stripe maneja dunning automático.

### i18n

10. Keys nuevas bajo `parent.students.*`, `parent.billing.*`, `parent.errors.*` en ambos diccionarios.

---

## Alcance — OUT

- ❌ **MasteryMap real con datos** ("12/45 competencias dominadas"). Es vapor en v1. La tarjeta del Student muestra "Aún sin progreso" hasta Epic 04 (Lesson Player + currículo).
- ❌ **Assessment de calibración de Angela**. El copy post-pago dice "Angela está conociendo a [Nombre]" pero NO se dispara un assessment real — Epic 06 trae IRT.
- ❌ **Estado emocional del día en la tarjeta** (😊/😐/😔). Depende de `EmotionDetector` (Epic 02.5 o posterior). Por ahora se omite del card.
- ❌ **Toggle mensual/anual dentro del flujo** de Add Student. v1 fuerza el cycle elegido en el landing (preserva via query param `?cycle=monthly|annual`). Cambio de cycle = upgrade/downgrade post-creación (futuro).
- ❌ **OXXO / Mercado Pago / pago con boleto**. Solo tarjetas en v1 (ADR-001 §7).
- ❌ **Migrar plan Core → Family con múltiples hijos**. UI sugiere upgrade pero no lo implementa todavía. Epic 04 o ticket separado.
- ❌ **Stripe Tax / facturación con RFC mexicano**. Disabled en v1 (ADR-001 §8).
- ❌ **Cancelar suscripción de un estudiante**. UI placeholder con CTA "Próximamente"; lógica real en Epic 03.5 o ticket separado.

---

## Decisiones técnicas pre-tomadas

1. **Stripe Payment Element**, no Checkout, no PaymentRequest. Razón: inline modal sin redirect, mantiene PCI SAQ A, UX consistente con resto del producto.
2. **One Customer per Parent, One Subscription per Student** (ADR-001 §2). No multi-item subscriptions en v1.
3. **Re-auth con password (form simple)** antes de exponer Payment Element. NO biométrico todavía (requiere WebAuthn setup que es scope creep).
4. **Validación de formulario:** Zod schema en `src/lib/schemas/student.ts`. Reuso desde server actions y client.
5. **Optimistic UI deshabilitada para el flujo de pago.** El estudiante aparece en el dashboard SOLO después de webhook `payment_intent.succeeded` (o de un short-poll de 3s contra `/api/students/[id]/status` para inmediatez perceptual).
6. **Cancelar mid-flow:** AlertDialog con confirmación si el padre ya empezó a llenar el form Step A. Si está en Step B (Payment Element), también confirmar — el `SetupIntent` se cancela server-side.
7. **Persistencia de drafts:** si el padre cierra el modal antes de pagar, el `Student` queda creado con `PENDING_PAYMENT`. Aparece en el dashboard como "Pago pendiente — Completa el pago ($29)". Esto cubre el caso "primer estudiante = onboarding largo".
8. **Plan mix permitido.** Un padre puede tener 1 Core + 1 Pro + 1 Family. Cada Subscription es independiente. El `<MonthlyTotalBar>` los suma correctamente.
9. **Family con quantity:** si el padre crea un Family, el primer hijo ocupa `quantity=1`. Hijos adicionales bajo el mismo Family Subscription se hacen vía `subscription.update({ quantity: N+1 })`, NO se crea nueva subscription. Esto vive en `addStudentToFamilyPlan(parent, student)`.
10. **No tocar:** `src/lib/gamification/engine.ts`, `src/lib/i18n/config.ts`, `src/lib/auth/*` (cerrado Epic 01), `src/lib/tutor/*` (Epic 02). Si se necesita extender, preguntar.

---

## Plan de sprint sugerido (7 tareas, 7-10 días)

| # | Tarea | Días | Entregable |
|---|-------|------|-----------|
| 1 | Migración Prisma + Stripe Dashboard setup (Price IDs en .env, productos creados) + ADR-001 §10 aplicado | 1.5 | DB tiene los nuevos campos. `.env.local` tiene todos los `STRIPE_PRICE_*` reales de test mode. |
| 2 | `src/lib/billing/stripe.ts` (ensureCustomer, createSubscription, mapStatus) + tests unit con mocks | 1.5 | Servicio billing funciona end-to-end contra Stripe test. |
| 3 | API endpoints: `/api/students/create`, `/api/billing/setup-intent`, `/api/billing/subscribe`, `/api/webhooks/stripe` | 1.5 | Curl/Postman flow completo funciona. Webhook idempotente. |
| 4 | UI: `<NewStudentDialog>` 3 steps + form Zod validation + re-auth gate | 2 | Modal navega Step A → Auth → Step B → Success/Error sin perder estado. |
| 5 | UI: `<StudentCard>` (3 variants) + `<MonthlyTotalBar>` + Empty state + responsive | 1.5 | Dashboard renderiza estados con datos mockeados + reales. |
| 6 | Integración del flujo end-to-end: padre real puede agregar estudiante con tarjeta test (`4242 4242 4242 4242`) | 1 | Happy path funciona con webhooks reales (Stripe CLI listening). |
| 7 | Tests + edge cases (no tarjeta, mid-flow cancel, plan switching) + i18n review + Playwright smoke | 1.5 | Definition of Done cubierto. |

---

## Estados UX (los 6 que ya definiste)

**Estado 1 — Dashboard "Mis Estudiantes"**
- Empty: ilustración + "Aún no tienes estudiantes" + CTA grande.
- 1+: grid responsive (1/2/3 col), `<StudentCard>` por hijo, `<MonthlyTotalBar>` con plan mix, FAB / header "+ Agregar".

**Estado 2 — Modal `<NewStudentDialog>` Step A**
- Desktop: Dialog `max-w-lg`. Mobile: Sheet `side="bottom"` `h-[85vh]` con drag handle.
- Fields: nombre, fecha nacimiento (DatePicker shadcn), grado (Select PreK-12°), idioma (Select es/en/bilingüe), notas para Angela (Textarea opcional).
- Footer sticky: resumen "Nuevo estudiante — $29.00/mes Core (anual: $20.30/mes equiv)" + "Tu nuevo total: $X" + "Continuar al pago" (disabled hasta válido) + "Cancelar".

**Estado 2.5 — Re-auth gate (nuevo, no estaba en el prompt original)**
- Modal interstitial: "Confirma tu identidad para autorizar el cobro" + password input + "Confirmar" / "Cancelar".
- Si falla 3 veces → bloquea 15 min, registra en `Parent.lastReauthFailedAt`.

**Estado 3 — Modal Step B (Confirmar Cobro con Stripe Payment Element)**
- Resumen visual (card `bg-muted`): avatar + nombre del estudiante + plan + precio.
- Stripe Payment Element inline (cards en v1, expandible a OXXO en v1.5).
- Total a pagar hoy: `$29.00 USD` (o `$243.60 USD` si anual).
- Disclaimer: "Se cobrará automáticamente cada 30 días. Cancela cuando quieras."
- Botones: "Confirmar y pagar $X" (con icon Lock), "Volver y editar".

**Estado 4 — Éxito post-pago**
- Animation: CheckCircle2 Framer Motion scale 0→1.2→1.
- Título: "¡[Nombre] está adentro!"
- Subtítulo: "Angela ya está conociendo a [Nombre]. Cuando entre por primera vez, calibrarán juntos su Ruta de Aprendizaje."
- Card: avatar + nombre + plan + próximo cobro.
- Botones: "Ver perfil de [Nombre]" / "Agregar otro" / "Ir al Dashboard".

**Estado 5 — Error de pago**
- Icon: AlertTriangle destructive.
- Título: "No pudimos procesar el pago"
- Subtítulo: "[Nombre] está creado pero en espera. Puedes reintentar o actualizar tu tarjeta."
- Botones: "Reintentar pago", "Cambiar método", "Lo haré luego" (cierra modal; estudiante queda en `PENDING_PAYMENT`).

**Estado 6 — Tarjeta `PENDING_PAYMENT`**
- Opacity 0.7, borde dashed `border-orange-300`, badge naranja "Pago pendiente".
- CTA inline: "Completar pago $29".
- Icon candado en avatar.
- Mensaje: "Este estudiante no puede acceder a Angela hasta confirmar el pago."

---

## Criterios de aceptación

- [ ] `npm run type-check`, `npm run lint`, `npm run check:edunexo` limpios.
- [ ] Migration Prisma se aplica sin perder data en dev (`prisma migrate dev` corre limpio).
- [ ] Padre demo (de Epic 01) puede iniciar sesión y ver dashboard vacío con empty state.
- [ ] Click en "Agregar estudiante" abre `<NewStudentDialog>` con Step A.
- [ ] Validación de form: nombre requerido, fecha nacimiento ≥ 2 años atrás y ≤ 18 años atrás, grado seleccionado.
- [ ] Step A → "Continuar al pago" abre re-auth gate.
- [ ] Re-auth correcto pasa a Step B con Stripe Payment Element renderizado.
- [ ] Pago con tarjeta test `4242 4242 4242 4242` exitoso → Estado 4 → student aparece en dashboard como `ACTIVE`.
- [ ] Pago con tarjeta declinada `4000 0000 0000 0002` → Estado 5 → student queda en `PENDING_PAYMENT`.
- [ ] Webhook `payment_intent.succeeded` actualiza `Student.subscriptionStatus` via `StripeWebhookEvent` upsert.
- [ ] Re-disparar el mismo webhook NO duplica efectos (idempotencia verificada).
- [ ] `<MonthlyTotalBar>` suma correctamente con mix de planes (1 Core + 1 Pro = $74).
- [ ] Cerrar el modal en Step A descarta datos sin crear Student (AlertDialog confirma).
- [ ] Cerrar el modal en Step B (post-create) deja Student en `PENDING_PAYMENT` (no descarta).
- [ ] Mobile (375px): Sheet bottom con drag handle funcional.
- [ ] Cero strings hardcodeados; keys nuevas bajo `parent.students.*` y `parent.billing.*`.
- [ ] Tests unit pasan para `src/lib/billing/stripe.ts` (mocks de Stripe SDK).
- [ ] Playwright smoke: signup → add 1 student con tarjeta test → ver en dashboard ACTIVE.

---

## Guardrails (no scope creep, no copia)

- ❌ **NO copies el patrón "Add subscription to cart" de Time4Learning.** Sin carrito intermedio. Modal directo (DMP §2.3 rechazo).
- ❌ **NO copies "$29 para 4 hijos" de Miacademy.** El modelo es por estudiante. El único flat es Family $69 (DMP §2.1 rechazo).
- ❌ **NO redirijas a Stripe Checkout fuera de Midsea.** Payment Element inline obligatorio (ADR-001 §12).
- ❌ **NO uses jerarquía de navegación tipo Wited** para el dashboard parental. El Parent Copilot es de 5 minutos, no admin panel (DMP §2.2 rechazo).
- ❌ **NO toques** `src/lib/gamification/engine.ts`, `src/lib/auth/*`, `src/lib/tutor/*` sin preguntar.
- ❌ **NO implementes MasteryMap real con datos** en el card. Placeholder "Sin progreso aún" hasta Epic 04.
- ❌ **NO dispares assessment de calibración en post-pago.** Solo copy ilusorio ("Angela está conociendo a [Nombre]"). El assessment real llega en Epic 06.
- ❌ **NO uses Stripe Tax.** ADR-001 §8 lo deshabilita en v1.
- ❌ **NO consolides invoices.** Una subscription por estudiante, una factura por subscription (ADR-001 §5).
- ❌ **NO instales libraries** fuera de las necesarias (`stripe`, `@stripe/stripe-js`, `@stripe/react-stripe-js`, `react-hook-form`, `zod`). Si dudas, pregunta.

---

## Schema changes (copiar a `prisma/schema.prisma`)

Ver ADR-001 §10. Aplicar via `npx prisma migrate dev --name epic-03-billing-tables`. Verificar que la migration:
- Agrega columnas nullable a `Student` y `Parent` (zero downtime para dev DB).
- Crea tabla `StripeWebhookEvent` con índice en `(type, processedAt)`.
- Crea enums `SubscriptionStatus`, `PlanTier`, `BillingCycle`.

---

## PROMPT (copiar y pegar en Claude Code)

```
Estoy iniciando el Epic 03: Parent Copilot — Add Student + Billing. Flujo
completo con Stripe Payment Element inline.

PASO -1 — Git workflow.
  Crea `feature/epic-03-add-student-billing` desde `develop`. No commits
  a develop/main. Si ya existe el branch, continúa.

PASO 0 — Lectura mínima (ESTRICTAMENTE estos archivos).
  CLAUDE.md ya cargado. Lee SOLO, en orden:
   1. docs/prompts/epic-03-parent-copilot-add-student.md (este archivo).
   2. docs/decisions/ADR-001-billing-stack.md (fuente de verdad billing).
   3. docs/decisions/ADR-002-tutor-rename.md (solo para copy post-pago).
   4. docs/DMP.md §2.1 (Miacademy) y §2.3 (Time4Learning) — rechazos
      estratégicos relevantes al UX de pricing y flujo.
   5. prisma/schema.prisma (estado actual; NO editar todavía).
   6. src/lib/auth/session.ts (cómo obtener parent activo).
   7. src/app/[locale]/parent/page.tsx y .../students/new/page.tsx
      (placeholders a sobreescribir).
   8. messages/es.json y en.json (estructura existente).
   9. package.json (deps actuales).
  NO leas: PRD completo, DMP completo, AI_TUTOR_SPEC, src/lib/tutor/*,
  src/lib/gamification/*.
  Confirma lectura.

PASO 1 — Plan (máx 30 líneas).
  Reporta:
   (a) Estado de los placeholders parent (`src/app/[locale]/parent/*`).
   (b) Las 7 tareas en orden con archivos a crear/tocar.
   (c) Dependencias npm nuevas: stripe, @stripe/stripe-js,
       @stripe/react-stripe-js, react-hook-form, zod. Confirma si alguna
       ya está en package.json.
   (d) La migration Prisma propuesta (ver ADR-001 §10) lista para mi
       aprobación antes de correrla.
   (e) Las env vars de Stripe que necesito agregar a .env.local.
       Yo voy a crear los productos en Stripe Dashboard y darte los Price IDs.
   (f) Ambigüedades.
  Espera "ok, ejecuta" y "aquí están los Price IDs" antes de seguir.

PASO 2 — Ejecución por tarea (7 tareas).
  Una a la vez. Para cada tarea:
   (a) Crea/edita archivos (máx 6 por tarea sin avisar).
   (b) Corre type-check, lint, check-edunexo.
   (c) Para tareas 1-3: corre tests unit nuevos.
   (d) Reporta máx 12 líneas: archivos tocados, criterios cubiertos,
       pendientes para próxima tarea.
   (e) Pídeme "siguiente tarea?" antes de continuar.

PASO 3 — Cierre.
  Tras tarea 7, checklist completa de Definition of Done con [✓]/[✗]/[⚠].
  Sección nueva "## Pendientes para Epic 04" del epic doc con TODOs.

PASO 4 — Push.
  Commits atómicos por tarea: `feat(billing): prisma schema for
  subscriptions`, `feat(billing): stripe service`,
  `feat(billing): api endpoints`, `feat(parent): new student dialog`,
  `feat(parent): students dashboard`, `feat(billing): end-to-end flow`,
  `test(billing): playwright smoke`.
  `git push -u origin feature/epic-03-add-student-billing` y avisa.

REGLAS DE INTERACCIÓN:
- Si algo es ambiguo, pregunta en vez de asumir.
- EFICIENCIA DE TOKENS:
   · No releas archivos ya leídos.
   · Reportes ≤12 líneas por tarea.
   · No corras `npm install` exploratorio; lee package.json una vez.
- ANTI-COPIA:
   · NO "$29 para 4 hijos" (Miacademy). Por estudiante; Family es excepción.
   · NO "Add to cart" (Time4Learning). Modal directo.
   · NO jerarquía de navegación tipo Wited en el dashboard parental.
- ADR-001 es FUENTE DE VERDAD para billing. Si dudas, consúltalo, NO
  improvises.
- VAPOR PROHIBIDO: NO crees MasteryMap con datos fake, NO dispares
  assessment de Angela post-pago (solo copy ilusorio).
- Nunca toques sin preguntar: src/lib/gamification/engine.ts,
  src/lib/auth/*, src/lib/tutor/*, src/lib/i18n/config.ts.
- Mobile-first. Sheet bottom con drag handle en mobile; Dialog
  centered en desktop.
- a11y obligatorio: focus trap en modales, Esc cierra,
  aria-live para status de pago, navegación por teclado completa.
- i18n: cero strings hardcodeados; keys bajo `parent.students.*`,
  `parent.billing.*`, `parent.errors.*`.

Empieza por PASO -1 ahora.
```

---

## Pendientes para Epic 04

*(Se llena al cerrar el epic.)*

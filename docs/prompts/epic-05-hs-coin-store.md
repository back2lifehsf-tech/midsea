# Prompt para Claude Code — Epic 05-HS: Tienda Coin + Productos Premium + Coin Packs

## El moat económico: estudiante gana Coin por mastery, padre aprueba compras, productos premium se desbloquean, padre puede regalar Coin packs vía Stripe

> **Cómo usar:** abre `claude` en la raíz del repo, lee tú mismo las secciones de Contexto/Plan/Aceptación, y pega solo el bloque bajo **PROMPT** al final.

---

## Contexto del epic

**Epic:** Implementar el loop económico completo definido en ADR-004. Sin este epic, Midsea es "Wited mejor + Angela"; con este epic, Midsea es **"el único producto en HS hispano donde el esfuerzo académico abre puertas"**. Es el moat narrativo más diferenciador y el más demoable a inversores post-pilot.

**Duración estimada:** 1.5-2 semanas (semanas 6-7 del plan).

**Estado actual del repo (esperado al iniciar este epic):**
- Catálogo HS de 9 cursos en DB + lesson player funcionando + activación de cursos por hijo (Epic 04 completado).
- Angela hero variant + tono adolescente HS (Epic 02.5 completado).
- Stripe billing por estudiante con subscriptions (Epic 03 completado).
- `CoinEntry` table ya existe con reasons `LESSON_MASTERY` y `STORE_PURCHASE` (gamification Epic 01).
- `src/lib/gamification/engine.ts` ya implementa `awardCoin(studentId, amount, reason)` y `spendCoin(studentId, amount)` (asumir; si no, scoping incluye polish del engine).

**Alcance del epic — IN:**

1. **Migration Prisma 0005 con tablas de tienda (ADR-004 §5)**:
   - Enums nuevos: `StoreItemType` (SPECIALIZED_COURSE, MASTERCLASS, ELECTIVE_MODULE), `StoreItemStatus` (DRAFT, PUBLISHED, ARCHIVED), `PurchaseStatus` (PENDING_APPROVAL, APPROVED, REJECTED, COMPLETED, REFUNDED).
   - Tablas nuevas: `StoreItem`, `StorePurchase`, `ParentBillingPreferences`.
   - SQL idempotente en `prisma/migrations/manual/0005-coin-store.sql`.

2. **Seed de 8-12 productos premium iniciales** (basado en `docs/curriculum/store-catalog.md`):
   - Cursos especializados: "Preparación CBC Matemática UBA", "Programación con Python para HS", "Análisis literario avanzado: Borges y Cortázar", "Historia del Arte argentino".
   - Masterclasses cortas: "Técnicas de estudio para exámenes finales", "Cómo escribir un ensayo argumentativo", "Speed reading académico".
   - Módulos electivos: "Música — Teoría avanzada", "Geografía aplicada con GIS básico".
   - Cada producto tiene contenido base generado con el pipeline ADR-006 (≤5 lecciones c/u para v1).

3. **Tienda Coin para estudiante**:
   - `src/app/[locale]/student/store/page.tsx`: catálogo de productos premium con filtros (tipo, precio Coin) + balance Coin actual del estudiante.
   - `src/components/store/StoreItemCard.tsx`: card con thumbnail + descripción + precio Coin + CTA "Pedir aprobación".
   - `src/components/store/PurchaseRequestDialog.tsx`: modal de confirmación con detalles + opción de mensaje al padre.
   - Estados visibles: producto desbloqueable (Coin suficiente), producto no suficiente (mostrar "Te faltan X Coin" + link a pedir Coin pack al padre), producto ya comprado (CTA "Abrir contenido").

4. **Parent approval flow**:
   - `src/app/[locale]/parent/students/[id]/store-requests/page.tsx`: lista de `StorePurchase` con `status = PENDING_APPROVAL` para todos los hijos del padre.
   - `src/components/parent/PurchaseApprovalCard.tsx`: card con detalles del producto + nombre del hijo + Coin a debitar + balance actual + CTAs "Aprobar" / "Rechazar con razón".
   - Badge counter en Parent Copilot dashboard cuando hay solicitudes pendientes.
   - `POST /api/parent/store-requests/[id]/approve` y `POST /api/parent/store-requests/[id]/reject`.
   - Notificación in-app al estudiante cuando la solicitud es resuelta.

5. **Coin packs en Stripe (one-time payments)**:
   - 3 SKUs en Stripe (test mode primero, live al merge a main):
     - `STRIPE_PRICE_COIN_PACK_S` = $9 = 1000 Coin
     - `STRIPE_PRICE_COIN_PACK_M` = $25 = 3000 Coin (best value)
     - `STRIPE_PRICE_COIN_PACK_L` = $50 = 7000 Coin
   - `src/components/parent/CoinPackPurchase.tsx`: modal accesible desde Parent Copilot que muestra los 3 packs + selector de hijo destinatario.
   - `POST /api/billing/buy-coin-pack`: crea PaymentIntent one-time con metadata `{ midseaProductType: 'coin_pack', midseaStudentId, midseaPackSku }`.
   - Webhook `payment_intent.succeeded` extendido: si `metadata.midseaProductType === 'coin_pack'`, llama `awardCoin(metadata.midseaStudentId, packToCoin(metadata.midseaPackSku), 'PARENT_GRANT')`.

6. **Acceso al contenido desbloqueado**:
   - Modelo `StorePurchase.completedAt` se setea cuando approve → triggers acceso.
   - El estudiante accede al producto desde la tienda → click "Abrir contenido" → ruta `/student/store/[purchaseId]` que muestra las lecciones del producto en formato similar al lesson player del Epic 04.
   - Productos premium NO aparecen en el catálogo base (cursos activados); aparecen como sección separada "Mis desbloqueados" en `/student`.

7. **Parent Billing Preferences (mínimo v1)**:
   - `src/app/[locale]/parent/settings/billing.tsx`: toggle "Aprobar automáticamente compras hasta X Coin sin pedirme" + slider X (default OFF).
   - `POST /api/parent/billing-preferences` upsert.
   - Lógica al crear `StorePurchase`: si `priceCoin <= autoApproveCoinCap`, set `status = APPROVED` + `completedAt = now()` automáticamente. Sino, `PENDING_APPROVAL`.

8. **i18n nuevo bajo `student.store.*`, `parent.store.*`, `parent.billing.coinPacks.*`**.

**Alcance del epic — OUT (v1.1+):**
- ❌ Lista negra de productos / periodo de espera (v1.1).
- ❌ Marketplace estudiante-estudiante (v2+).
- ❌ Productos premium creados por terceros (publishers) (v3+).
- ❌ Expiración de Coin (post-pilot decisión basada en datos).
- ❌ Reembolso de Coin parcial (Refund manual via SQL en v1; UI v1.1).
- ❌ Cap semanal de gasto Coin (v1.1).
- ❌ Push notifications mobile (in-app badges suficiente para pilot).

---

## Decisiones técnicas pre-tomadas

1. **Stripe Payment Element inline para Coin packs**, NO Checkout. Consistencia con Epic 03.
2. **One-time payments, no subscription**. Padre compra una vez, el balance se acumula. No expira en v1.
3. **Idempotencia de webhook**: mismo `StripeWebhookEvent` table del Epic 03. El handler distingue `subscription` vs `coin_pack` por `metadata.midseaProductType`.
4. **Acreditación de Coin es server-side**: el cliente NO actualiza balance directamente; webhook → `awardCoin()` → DB. Cliente lee balance fresh.
5. **Atomicidad de approve**: usar `prisma.$transaction([updatePurchase, spendCoin])` para que el cobro de Coin y la aprobación sean atómicos.
6. **Estado "REJECTED" no debita Coin**: el Coin queda en el balance del estudiante.
7. **Productos premium NO se localizan automáticamente**: contenido bilingüe ES/EN está generado de origen (ADR-006). Solo UI labels en i18n.
8. **No tocar sin preguntar**: `src/lib/auth/*`, `src/lib/billing/stripe.ts` core (solo extender funciones de webhook handler), `src/lib/gamification/engine.ts` core, `src/lib/tutor/*`, `prisma/schema.prisma` fuera del scope §1.
9. **Acceso post-purchase es por `StorePurchase.id`, no por `StoreItem.slug`**: esto permite a un estudiante comprar el mismo producto dos veces si quiere (aunque UI lo prevenga normalmente). Sin restricción única en `(studentId, itemId)`.

---

## Plan de sprint sugerido (6 tareas, 1.5-2 semanas)

| # | Tarea | Días | Entregable demoable |
|---|-------|------|---------------------|
| 1 | Migration 0005 + seed 8-12 productos premium iniciales | 1.5 | DB tiene `StoreItem` con productos PUBLISHED. Studio los muestra. |
| 2 | Tienda Coin UI (catálogo) + purchase request dialog + API request | 2 | Estudiante navega `/student/store`, ve productos, click "Pedir" crea `StorePurchase` PENDING. |
| 3 | Parent approval flow UI + APIs approve/reject + atomicidad | 1.5 | Padre ve solicitudes en dashboard, aprueba → Coin debitado + acceso otorgado; rechaza → Coin intacto. |
| 4 | Coin packs Stripe: SKUs en `.env`, UI compra, webhook handler extendido | 2 | Padre compra Coin pack en test mode con tarjeta 4242, webhook llega, balance del hijo aumenta. |
| 5 | Acceso al contenido desbloqueado + sección "Mis desbloqueados" en `/student` | 1.5 | Tras aprobación, estudiante ve el producto en su sección + abre contenido. |
| 6 | Parent Billing Preferences (auto-approve cap) + tests + Playwright smoke | 1.5 | Padre setea cap 500 Coin → estudiante pide producto de 400 Coin → se aprueba automático sin notificación. |

---

## Criterios de aceptación (Definition of Done)

- [ ] `npm run type-check`, `npm run lint`, `npm run test`, `npm run check:edunexo` limpios.
- [ ] Migration 0005 aplicada a dev. Re-ejecutable idempotente.
- [ ] 8-12 productos premium PUBLISHED en DB; visibles en `/student/store`.
- [ ] Estudiante con balance 0 Coin → ve productos con CTA "Te faltan X Coin" + link a "Pedir Coin pack al padre".
- [ ] Estudiante con balance suficiente → click "Pedir aprobación" → crea `StorePurchase` con `status = PENDING_APPROVAL`. Coin NO se debita todavía.
- [ ] Padre ve badge counter en Parent Copilot dashboard con # de solicitudes pendientes.
- [ ] Padre puede aprobar: `StorePurchase` pasa a `COMPLETED`, Coin debitado del balance del estudiante, producto desbloqueado para el estudiante.
- [ ] Padre puede rechazar con razón: `StorePurchase` pasa a `REJECTED`, Coin queda intacto, estudiante ve la razón.
- [ ] Padre compra Coin pack ($9) con tarjeta test 4242 → webhook llega → balance del hijo aumenta en 1000 Coin (verificable en CoinEntry).
- [ ] Padre setea auto-approve cap a 500 Coin → estudiante pide producto de 400 Coin → se aprueba sin notificación visible (verificable en DB que `status = COMPLETED` sin intervención).
- [ ] Estudiante accede al contenido desbloqueado desde `/student` (sección "Mis desbloqueados") y desde `/student/store/[purchaseId]`.
- [ ] Webhook de Coin pack es idempotente (re-disparar mismo evento no duplica Coin).
- [ ] Cero strings hardcodeados. Keys nuevas bajo `student.store.*`, `parent.store.*`, `parent.billing.coinPacks.*`.
- [ ] Tests unit pasan para: serializadores de productos, `awardCoin`/`spendCoin` con transacciones, mapeo packSku → Coin amount, webhook handler de coin_pack.
- [ ] Playwright smoke: flow completo: estudiante pide → padre aprueba → balance Coin debitado → estudiante abre contenido.

---

## Guardrails (no scope creep, no copia)

- ❌ **NO permitas dual pricing** (Coin O cash directo en cada producto). El producto solo se compra con Coin. El padre puede regalar Coin packs en cash, pero el producto en sí es Coin-only (ADR-004).
- ❌ **NO copies la tienda de avatares de Miacademy**. Productos son contenido pedagógico, no cosmético.
- ❌ **NO implementes marketplace estudiante-estudiante**. v2+.
- ❌ **NO permitas comprar productos sin aprobación del padre por default**. Auto-approve es opt-in del padre.
- ❌ **NO debites Coin del estudiante antes de la aprobación**. Hold via `StorePurchase` row, debit solo al aprobar.
- ❌ **NO toques** `src/lib/auth/*`, `src/lib/gamification/engine.ts` core (extender via hooks), `src/lib/tutor/*`, `src/lib/i18n/config.ts`.
- ❌ **NO uses Stripe Subscription para Coin packs**. Son one-time payments.
- ❌ **NO implementes expiración de Coin** ni cap semanal de gasto. v1.1 con datos reales.

---

## Referencias obligatorias del repo

1. `CLAUDE.md` §7.5 (Tienda Coin y parent approval), §10 (glosario Coin, Coin pack, StoreItem).
2. `docs/decisions/ADR-001-billing-stack.md` (Stripe stack para Coin packs).
3. `docs/decisions/ADR-004-coin-as-internal-currency.md` (modelo completo del epic).
4. `docs/DMP-HS-addendum.md` §6 (moats: Coin economy).
5. `docs/curriculum/store-catalog.md` (los 8-12 productos premium del seed).
6. `src/lib/gamification/engine.ts` (regla de mastery + awardCoin/spendCoin existentes).
7. `src/lib/billing/stripe.ts` (extender webhook handler para coin_pack metadata).
8. `src/app/api/webhooks/stripe/route.ts` (agregar branch para `payment_intent.succeeded` con `productType=coin_pack`).
9. `messages/es.json`, `messages/en.json` (estructura existente).

---

## PROMPT (copiar y pegar en Claude Code)

```
Estoy iniciando el Epic 05-HS "Tienda Coin + Productos Premium + Coin Packs"
de Midsea — el moat económico del pilot HS Argentina. Antes de tocar
código, ejecuta este protocolo.

PASO -1 — Git workflow.
  `git status` + `git branch`. Si no estás en `feature/epic-05-hs-*`,
  crea `feature/epic-05-hs-coin-store` desde `develop` (debe tener
  Epic 04 merged). Nunca commits directos a develop/main.

PASO 0 — Lectura mínima.
  CLAUDE.md ya cargado — NO releeas.
  Lee SOLO, en orden:
   1. docs/prompts/epic-05-hs-coin-store.md (este archivo).
   2. docs/decisions/ADR-004-coin-as-internal-currency.md.
   3. docs/decisions/ADR-001-billing-stack.md §2 (modelo Stripe) y §9
      (webhooks). NO leer el resto del ADR-001 salvo decisión específica.
   4. docs/curriculum/store-catalog.md (los productos del seed).
   5. prisma/schema.prisma (estado actual post-Epic-04).
   6. src/lib/billing/stripe.ts (cómo se invoca Stripe hoy).
   7. src/app/api/webhooks/stripe/route.ts (handler actual).
   8. src/lib/gamification/engine.ts (awardCoin / spendCoin signatures).
   9. messages/es.json (estructura tutor.* y student.* y parent.*).
   10. package.json (deps actuales).
  NO leas: PRD, DMP, AI_TUTOR_SPEC, ADRs 002/003/005/006 (no aplican
  directamente a este epic), src/lib/tutor/*, src/lib/auth/*.
  Confirma lectura.

PASO 1 — Plan de implementación (máx 25 líneas).
  Devuélveme:
   (a) Las 6 tareas en orden con archivos a crear/tocar.
   (b) Dependencias npm nuevas (probable: ninguna; Stripe ya está).
   (c) La migration Prisma 0005 (resumen tablas + enums). Espera mi OK.
   (d) Los 3 Stripe Price IDs nuevos que voy a crear en Stripe Dashboard
       test mode + cómo los voy a pasar a tu `.env`.
   (e) Ambigüedades.
  Espera "ok, ejecuta" y "aquí están los Price IDs" antes de seguir.

PASO 2 — Ejecución por tarea (6 tareas).
  Para cada tarea:
   (a) Crea/edita archivos (máx 6 por tarea sin avisar).
   (b) Corre type-check, lint, check-edunexo, tests relevantes.
   (c) Tarea 4 (webhook + Coin packs): hacé smoke local con Stripe CLI
       listening + curl al endpoint para verificar idempotencia.
   (d) Reporta máx 12 líneas: archivos tocados, criterios cubiertos,
       pendientes.
   (e) Pídeme "siguiente tarea?" antes de continuar.

PASO 3 — Cierre del epic.
  Tras tarea 6, checklist completa de Definition of Done con [✓]/[✗]/[⚠].
  Pendientes documentados en "## Pendientes para Epic 06" al final.

PASO 4 — Push y entrega.
  Commits atómicos por tarea:
  `feat(store): prisma migration 0005 + seed premium products`,
  `feat(store): student store catalog + purchase request flow`,
  `feat(store): parent approval flow + atomic Coin debit`,
  `feat(billing): coin packs SKUs + Stripe purchase + webhook handler`,
  `feat(store): unlocked content access for student`,
  `feat(store): parent billing preferences + tests + smoke`.
  `git push -u origin feature/epic-05-hs-coin-store` y avisa para PR
  a develop.

REGLAS DE INTERACCIÓN:
- Si algo es ambiguo, pregunta. Especialmente Stripe-related (un error
  en webhook handling se ve días después en bug report del padre).
- EFICIENCIA DE TOKENS: no releas archivos. Reportes ≤12 líneas/tarea.
- ANTI-COPIA:
   · NO copies tienda de avatares (Miacademy).
   · NO permitas dual pricing (Coin OR cash en producto).
   · NO copies marketplace P2P (v2+).
- Nunca toques sin preguntar: src/lib/auth/*, src/lib/tutor/*,
  src/lib/gamification/engine.ts core (extender via hooks),
  src/lib/i18n/config.ts.
- Mobile-first. Tienda Coin debe verse bien en tablet adolescente.
- i18n: cero strings hardcodeados. Keys bajo `student.store.*`,
  `parent.store.*`, `parent.billing.coinPacks.*`.
- a11y: focus management en modales, escape cierra, aria-live para
  cambios de balance.
- ATOMICIDAD: approve = transacción Prisma con update purchase +
  spend Coin. Si una falla, rollback ambas.
- IDEMPOTENCIA WEBHOOK: re-disparar mismo `evt_*` no duplica Coin.

Empieza por PASO -1 ahora.
```

---

## Pendientes para Epic 06 (placeholder)

A llenar al cierre del epic. Antemano se anticipan:
- Spaced repetition + IRT adaptativo (Epic 06).
- Lista negra de productos (v1.1).
- Cap semanal de gasto Coin (v1.1).
- Expiración de Coin (post-pilot decisión basada en datos).
- Marketplace estudiante-estudiante (v2+).
- Push notifications mobile.

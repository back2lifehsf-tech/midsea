# ADR-001 — Billing stack: Stripe + suscripción por estudiante + ciclos mensual/anual

| Campo | Valor |
|---|---|
| **Estado** | Aceptado |
| **Fecha** | 2026-05-20 |
| **Decisores** | Founder / Product Lead |
| **Bloquea** | Epic 02b (Landing pricing), Epic 03 (Parent Copilot Add Student), Epic 04+ |

## Contexto

Midsea cobra a familias homeschoolers por suscripción mensual. El modelo del PRD es **por estudiante** ($29 Core / $45 Pro) con la excepción de **Family flat $69 hasta 4 hijos**. Hay decisión separada (sesión 2026-05-20) de añadir **toggle anual con 30% de descuento** sobre el precio mensual. Antes de construir el flujo de Add Student y la corrección del landing, se necesita una decisión arquitectónica única que cierre: provider, modelo de suscripción, ciclos, descuentos, proration, métodos de pago LATAM, manejo de impuestos, webhooks, y schema impact.

## Decisión

### 1. Provider: Stripe

**Stripe**, no Lemon Squeezy / Paddle / Mercado Pago / Wompi.

Razones:
- Cobertura LATAM real: Stripe opera en México (Stripe MX), Brasil, Argentina, Chile, Colombia. Pagos en USD aceptan tarjetas internacionales sin fricción.
- Stripe Elements + Payment Element mantienen a Midsea en **PCI SAQ A** (scope mínimo). Sin Elements estaríamos en SAQ D.
- Webhooks confiables, dashboard maduro, Connect disponible si v3+ pivotamos a microescuelas.
- Mercado Pago se evalúa como **método de pago adicional dentro de Stripe** (Stripe lo soporta como connector en MX), no como provider alterno.

### 2. Modelo de suscripción

- **Un `Customer` de Stripe por Padre.** El padre paga; el estudiante es el beneficiario.
- **Una `Subscription` por Estudiante.** Cada hijo tiene su propia subscription bajo el mismo Customer. Permite cancelar/pausar a un hijo sin tocar a los demás.
- **Excepción Family ($69 flat):** una sola `Subscription` con `quantity` hasta 4. El Parent declara qué slots ocupan qué `Student`. Si el padre quiere ir de Core a Family, se migra: cancelar las N subscriptions Core, crear 1 subscription Family.

### 3. Catálogo de Prices en Stripe

| Plan | Mensual | Anual (30% off) |
|---|---|---|
| Core | `price_core_monthly` — $29.00/mes | `price_core_annual` — $243.60/año |
| Pro | `price_pro_monthly` — $45.00/mes | `price_pro_annual` — $378.00/año |
| Family | `price_family_monthly` — $69.00/mes | (sin anual en v1) |

El descuento anual no usa `Coupon` ni `Discount` dinámicos — son `Price` objects separados con el descuento ya baked. Razón: simplifica reporting y evita drift entre lo mostrado al usuario y lo facturado.

**Family no tiene ciclo anual en v1** porque proration sobre commitment anual cuando se agrega/quita un hijo es complejo. Se reevalúa post-PMF.

### 4. Variable de control del descuento

`ANNUAL_DISCOUNT_PCT=30` en `.env`. Si se cambia a 40 (alineado con PRD §1.5) o 20, el equipo debe crear nuevos `Price` objects en Stripe Dashboard y actualizar IDs en `STRIPE_PRICE_*` env vars. NO recalcula precios on-the-fly desde el código.

### 5. Billing cycle anchor

**Cada subscription tiene su propio anchor** (día de creación). NO se consolida a "todos los hijos cobran el 15".

Razones:
- Stripe lo hace nativo, sin code.
- Operacionalmente más simple: agregar estudiante hoy = subscription empieza hoy, primer cargo hoy, siguiente cargo en +30 días.
- Para el padre que quiere consolidación visual: el Parent Copilot suma los próximos cobros y los muestra como "Próximos 30 días: $87". La unificación es **visual**, no de billing.

### 6. Proration

Stripe default: **proration habilitada** para upgrades/downgrades en medio del ciclo, **deshabilitada** para creación de subscriptions nuevas (cobro full desde día 1).

- Agregar estudiante hoy → full $29 hoy, próximo cargo en +30 días.
- Upgrade Core → Pro a mitad de ciclo → Stripe calcula proration automático.
- Downgrade Pro → Core → diferencia se acredita al próximo invoice.
- Cancelar mid-ciclo → subscription queda activa hasta period_end, NO se reembolsa la fracción no usada (alineado con copy del prompt original).

### 7. Métodos de pago

**v1 (lanzamiento):**
- Tarjetas (crédito/débito) vía Stripe Payment Element. Cobertura global.
- USD como moneda única. El padre en México ve "$29 USD"; su banco convierte.

**v1.5 (post-PMF, dentro de 90 días):**
- **OXXO** (México) — Stripe lo soporta nativo. Crítico para captar segmento sin tarjeta.
- **Boleto Bancário** (Brasil futuro v3+).

**v2:**
- Moneda local (MXN, COP, EUR) con `Stripe Pricing Tables` o Adaptive Pricing.
- Mercado Pago (MX/AR/BR) como connector.

### 8. Impuestos

**v1: Stripe Tax DESHABILITADO.** Razones:
- US Hispanic: el cliente percibido es residente; servicios digitales de educación K-12 generalmente exentos o con tax incluido en precio.
- LATAM: complejidad fiscal por país requiere análisis legal antes de calcular y retener.

**Política visible al usuario:** los precios mostrados son "tax-inclusive donde aplique". Re-evaluar cuando:
- Volumen GMV > $50K/mes en cualquier jurisdicción.
- Expansión a UE (IVA obligatorio).
- O cuando el legal counsel lo requiera.

### 9. Webhooks

Endpoint: `src/app/api/webhooks/stripe/route.ts`.

Eventos suscritos:
- `payment_intent.succeeded` — confirma cobro, marca `Student.subscriptionStatus = ACTIVE`.
- `payment_intent.payment_failed` — marca `PENDING_PAYMENT` y notifica al padre.
- `customer.subscription.updated` — sincroniza `Student.currentPeriodEnd` y plan.
- `customer.subscription.deleted` — marca `Student.subscriptionStatus = CANCELED`.
- `invoice.payment_failed` (dunning) — secuencia de 3 reintentos automáticos de Stripe; al final del 3ro, cancela y notifica.

**Idempotencia:** tabla `StripeWebhookEvent` con `eventId` único; si ya se procesó, no se re-aplica. Mitiga retries de Stripe.

### 10. Schema impact (Prisma)

Cambios requeridos al modelo `Student` y nuevas tablas:

```prisma
enum SubscriptionStatus {
  TRIALING
  ACTIVE
  PAST_DUE
  PENDING_PAYMENT
  CANCELED
  PAUSED
}

enum PlanTier {
  CORE
  PRO
  FAMILY
}

enum BillingCycle {
  MONTHLY
  ANNUAL
}

model Student {
  // ... campos existentes ...
  subscriptionStatus  SubscriptionStatus @default(PENDING_PAYMENT)
  planTier            PlanTier?
  billingCycle        BillingCycle?
  stripeSubscriptionId String?  @unique
  currentPeriodEnd    DateTime?
  monthlyAmountCents  Int?     // p.ej. 2900 para $29
}

model Parent {
  // ... campos existentes ...
  stripeCustomerId    String?  @unique
}

model StripeWebhookEvent {
  id          String   @id // = stripe event id
  type        String
  payload     Json
  processedAt DateTime @default(now())
  @@index([type, processedAt])
}
```

### 11. Env vars

```
STRIPE_SECRET_KEY=sk_test_... (server)
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (client, ok exposed)

# Price IDs (rotables sin redeploy de código)
STRIPE_PRICE_CORE_MONTHLY=price_...
STRIPE_PRICE_CORE_ANNUAL=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_ANNUAL=price_...
STRIPE_PRICE_FAMILY_MONTHLY=price_...

# Discount control (informativo, NO afecta facturación real)
ANNUAL_DISCOUNT_PCT=30
```

### 12. PCI

Stripe Payment Element embebido en modal de Midsea. **Nunca** se toca raw card data. Cumplimos PCI SAQ A. Documentar para auditorías futuras: "ningún flujo de Midsea recibe, almacena, ni procesa card data fuera de Stripe.js".

## Consecuencias

**Positivas.**
- Per-student lifecycle simple (cancelar a un hijo no toca a los demás).
- Stripe absorbe complejidad de proration, dunning, locale conversion.
- Stack listo para LATAM con OXXO y Mercado Pago como adiciones, no rewrites.

**Negativas.**
- Padres con 4 hijos en Core ven 4 cargos separados en su tarjeta cada mes. Mitigación: el Parent Copilot debe sumar visualmente. Considerar invoice consolidation con Stripe en v2 si los padres se quejan.
- Family flat sin anual deja $$ sobre la mesa en v1. Aceptado por simplicidad operacional inicial.
- Cancelación sin reembolso parcial puede generar fricción de soporte. Mitigar con copy claro ("Cancela cuando quieras — el acceso continúa hasta el final del período pagado").

## Alternativas descartadas

| Alternativa | Razón |
|---|---|
| Lemon Squeezy (MoR) | Bueno para evitar tax compliance, pero comisión 5%+ vs 2.9% de Stripe; menor cobertura LATAM. |
| Paddle | MoR similar a LS; tax handled pero fricción para LATAM cards. |
| Mercado Pago como provider principal | Coverage limitada fuera de LATAM; LATAM-only no es nuestro mercado total. |
| Subscription consolidada (1 invoice por padre, multi-hijo en línea-items) | Stripe lo soporta vía multi-item subscriptions, pero complica cancelar/pausar un hijo individual. Punt para v2. |

## Referencias cruzadas

- `PRD.md §1.4` y `§1.5` — pricing y annual discount.
- `docs/DMP.md §3.2 Gap #2` — compliance regulatorio (no afecta este ADR pero conviene tener visibilidad).
- Epic 02b (Landing pricing) y Epic 03 (Parent Copilot Add Student) implementan este ADR.

---

*Revisar este ADR cuando: (a) entremos a UE (IVA obligatorio), (b) GMV > $50K/mes en alguna jurisdicción, (c) los padres de 4+ hijos reporten fricción de cargos separados.*

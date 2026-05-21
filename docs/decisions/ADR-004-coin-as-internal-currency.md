# ADR-004 — Coin como moneda interna con poder pedagógico (no cosmético)

| Campo | Valor |
|---|---|
| **Estado** | Aceptado |
| **Fecha** | 2026-05-21 |
| **Decisores** | Founder / Product Lead (Omar) |
| **Relacionado con** | ADR-001 (Stripe), ADR-003 (pivot HS), ADR-005 (activación por curso) |
| **Bloquea** | Epic 05-HS (Tienda Coin) |

## Contexto

El PRD §2.3 y CLAUDE.md §10 definen a **Coin** como moneda virtual ganada por mastery ≥80%. Hasta ahora, su rol estaba sub-especificado: ¿es cosmética (como el gold de Miacademy: comprar ropa para el avatar) o tiene función pedagógica real? La decisión del founder (sesión 2026-05-21) lo aclara: **Coin desbloquea cursos especializados, masterclasses y módulos premium reales fuera del catálogo base**.

Esto eleva el rol de Coin de "gimmick gamificado" a **moneda económica del ecosistema** con tres consecuencias:

1. La gamificación se vuelve un **moat real**, no un wrap visual. Miacademy gasta Coin en cosméticos; en Midsea el Coin gana acceso a más aprendizaje.
2. El loop incentiva mastery genuino: solo el 80%+ genera Coin, así que el estudiante que clickea sin pensar no acumula nada.
3. El padre obtiene una conversación nueva con su hijo: "Si aprobás 5 lecciones de Geometría con mastery, te alcanza para el módulo de SAT Math que querías."

## Decisión

### 1. Tres usos del Coin

**Coin se gana por mastery** (regla actual de `src/lib/gamification/engine.ts`: ≥80% en quiz de la lección → 100 Coin, exacto, ya implementado).

**Coin se gasta en tres categorías de productos en la tienda**:

| Categoría | Ejemplos | Rango de precio sugerido |
|---|---|---|
| **Cursos especializados** | "Preparación CBC Matemática UBA", "AP Calculus AB Primer", "Programación con Python para HS", "Análisis literario avanzado: Borges y Cortázar" | 1,500 - 3,000 Coin |
| **Masterclasses cortas** | "Técnicas de estudio para exámenes finales", "Cómo escribir un ensayo argumentativo", "Speed reading académico" | 500 - 1,000 Coin |
| **Módulos electivos** | "Música — Teoría avanzada", "Geografía aplicada con GIS básico", "Historia del Arte argentino" | 1,200 - 2,500 Coin |

Las cantidades sugeridas se calibrarán en el pilot con datos reales de cuánto Coin acumulan los estudiantes activos en 30/60/90 días.

### 2. Coin packs comprables con cash (Stripe)

El padre puede regalar Coin a su hijo comprando packs vía Stripe. Esto es un revenue path adicional sin diluir la narrativa de mérito.

| SKU | Coin | Precio USD | Notas |
|---|---|---|---|
| `STRIPE_PRICE_COIN_PACK_S` | 1,000 Coin | $9 | Tier de entrada |
| `STRIPE_PRICE_COIN_PACK_M` | 3,000 Coin | $25 | Best value (efectivo $0.83/100 Coin vs $0.90 en S) |
| `STRIPE_PRICE_COIN_PACK_L` | 7,000 Coin | $50 | Padre que quiere desbloquear varios cursos premium al inicio |

**Importante: los productos de la tienda solo cuestan Coin, no se venden directamente con cash.** El padre que quiere acelerar tiene que comprar Coin pack y dejar que el hijo decida qué desbloquea. Esto preserva el principio narrativo: "Es el plan de tu hijo; tú lo apoyás, no lo manejás."

### 3. Parent approval flow

Toda compra del estudiante en la tienda Coin requiere aprobación del padre antes de ejecutarse. Razones:

- Control parental: el padre puede priorizar qué curso desbloquea su hijo (no necesariamente lo que el hijo quiere primero).
- Curaduría: el padre puede decidir que "Música avanzada" puede esperar y prefiere que su hijo gaste Coin en "Preparación CBC".
- Anti-impulso: el adolescente no tira 3,000 Coin acumulados en 60 días en un módulo que no termina.

Flow:
1. Estudiante elige producto en `/student/store` → click "Pedir aprobación".
2. Sistema crea `StorePurchase` con `parentApprovalStatus = PENDING`.
3. Padre recibe notificación in-app (badge en Parent Copilot) + email opcional.
4. Padre revisa en `/parent/students/[id]/store-requests`: aprueba o rechaza con razón opcional.
5. Si aprueba: se descuenta el Coin del balance del estudiante, se desbloquea el contenido, se notifica al estudiante.
6. Si rechaza: se libera el Coin (no se descuenta), el estudiante ve el rechazo con la razón.

**Auto-approve opcional**: el padre puede setear "Aprobar automáticamente compras hasta X Coin sin pedirme" en settings (default: OFF — todo requiere aprobación en v1).

### 4. Límites configurables

El padre puede configurar:
- **Cap de gasto semanal**: "Mi hijo puede gastar hasta 2,000 Coin por semana sin pedirme aprobación" (combinable con auto-approve).
- **Lista negra de productos**: marcar productos individuales como "no aprobar nunca" (ej. si el padre no quiere que el hijo se distraiga con un electivo durante semestre exigente).
- **Periodo de espera**: opcional, el estudiante puede pedir una compra pero el padre tiene 48h para revisar antes de auto-aprobar (si la familia tiene el flag activado).

v1 implementa: cap semanal + auto-approve toggle. Lista negra y periodo de espera entran en v1.1.

### 5. Schema impact (Prisma)

Cambios al modelo de dominio (detalle pleno en Epic 05):

```prisma
enum StoreItemType {
  SPECIALIZED_COURSE     // "Preparación CBC Matemática UBA"
  MASTERCLASS            // "Técnicas de estudio para exámenes"
  ELECTIVE_MODULE        // "Música — Teoría avanzada"
}

enum StoreItemStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum PurchaseStatus {
  PENDING_APPROVAL
  APPROVED
  REJECTED
  COMPLETED              // aprobado + Coin descontado + acceso otorgado
  REFUNDED               // aprobado pero el estudiante no consumió, padre solicita reembolso de Coin
}

model StoreItem {
  id              String          @id @default(cuid())
  slug            String          @unique
  title_es        String
  title_en        String
  description_es  String          @db.Text
  description_en  String          @db.Text
  type            StoreItemType
  priceCoin       Int             // sin pricing dual: solo Coin
  estMinutes      Int?
  thumbnailUrl    String?
  status          StoreItemStatus @default(DRAFT)
  createdAt       DateTime        @default(now())

  purchases       StorePurchase[]

  @@index([status, type])
}

model StorePurchase {
  id                    String         @id @default(cuid())
  student               Student        @relation(fields: [studentId], references: [id], onDelete: Cascade)
  studentId             String
  item                  StoreItem      @relation(fields: [itemId], references: [id])
  itemId                String
  priceCoinAtPurchase   Int            // congelado por si el item cambia de precio
  status                PurchaseStatus @default(PENDING_APPROVAL)
  approvedBy            Parent?        @relation(fields: [approvedByParentId], references: [id])
  approvedByParentId    String?
  approvedAt            DateTime?
  rejectionReason       String?        @db.Text
  createdAt             DateTime       @default(now())
  completedAt           DateTime?

  @@index([studentId, status])
  @@index([status, createdAt])
}

model ParentBillingPreferences {
  id                    String         @id @default(cuid())
  parent                Parent         @relation(fields: [parentId], references: [id], onDelete: Cascade)
  parentId              String         @unique
  autoApproveCoinCap    Int            @default(0)  // 0 = OFF, requiere aprobar todo
  // v1.1: blacklist, waitingPeriodHours, weeklyCoinCap
}
```

`CoinEntry` (ya existe) se extiende para reflejar gastos en tienda con `reason = STORE_PURCHASE` (ya existe en el enum) y `refId = storePurchaseId`.

### 6. Stripe impact

Tres SKUs nuevos en Stripe (test + live mode) según la tabla de §2. Estos se cobran como **one-time payments**, no subscriptions (el padre compra el pack una vez, no se renueva automáticamente). Endpoint nuevo:

- `POST /api/billing/buy-coin-pack` con `{ packSku, studentId }` → crea PaymentIntent one-time, devuelve `client_secret` para Stripe Elements.
- Webhook `payment_intent.succeeded` adicional: si `metadata.midseaProductType === 'coin_pack'`, acredita Coin al `metadata.midseaStudentId`.

Idempotencia preservada por el mismo `StripeWebhookEvent` table del ADR-001 §9.

### 7. Reglas pedagógicas

- **El catálogo base NUNCA cuesta Coin.** Lo que el padre paga con su subscription mensual ($29/$45/$69) incluye todo el catálogo K-12 (HS en v1, ampliado en v1.1+). Coin solo aplica a productos premium.
- **Coin nunca se intercambia entre estudiantes en v1**. Marketplace estudiante-estudiante es punt para v2 post-PMF.
- **Coin no expira en v1**. Si el estudiante acumula 5,000 Coin en 6 meses, sigue siendo válido. Política de expiración (ej. "Coin expira a los 12 meses sin actividad") es decisión post-pilot.
- **Coin nunca se convierte de vuelta a cash.** Es moneda interna, no escrow.

## Consecuencias

**Positivas.**
- Moat narrativo único en el mercado HS hispanohablante: "el esfuerzo de tu hijo se vuelve oportunidades, no decoración".
- Revenue path adicional (Coin packs) sin diluir el modelo "por subscription".
- Parent approval flow refuerza el rol del Parent Copilot como "director ejecutivo, no operador".
- Diferenciación clara vs Miacademy (cosmético), Wited (no tiene), MiaPrep (no tiene), Time4Learning (no tiene), Khan Academy (gratis sin economía).

**Negativas.**
- Implementación es un epic completo (Epic 05-HS, ~1.5 semanas). No es trivial.
- El producto se vuelve más complejo de explicar en landing (loop económico tiene que estar bien comunicado). Mitigación: incluir explicación visual en landing + onboarding tour de 90 segundos.
- Riesgo de que algunos padres prefieran "todo incluido sin moneda" (modelo MiaPrep). Mitigación: hacer claro que el catálogo base es ilimitado; Coin es para extras opcionales, no gating del core.

## Alternativas descartadas

| Alternativa | Razón |
|---|---|
| Coin puramente cosmético (Miacademy-style) | Pierde el moat económico. Para HS argentino donde la gamificación cosmética importa poco a adolescentes, es trivial. |
| Pricing dual: Coin O cash en cada producto premium | Diluye el moat de mérito. El padre tipo A salta al cash y el incentivo pedagógico de Coin desaparece. |
| Sin parent approval (estudiante compra libre) | Padres conservadores argentinos no aceptarán que el hijo decida solo. Pierde trust. |
| Coin con expiración agresiva (60-90 días) | Penaliza al estudiante que está construyendo balance para un curso caro. Punitivo en pilot. |

## Referencias cruzadas

- `PRD.md` §2.3 (Coin definido — actualizar para reflejar moneda económica).
- `CLAUDE.md` §10 (glosario Coin — actualizar).
- `ADR-001-billing-stack.md` (Stripe es proveedor para Coin packs también).
- `ADR-003-pivot-to-hs-multi-course-catalog.md` (alcance del pilot).
- Epic 05-HS (Tienda Coin) — implementa este ADR.
- `docs/curriculum/store-catalog.md` (los 8-12 productos premium del pilot).

---

*Revisar este ADR cuando: (a) el pilot arroje datos sobre velocidad de acumulación de Coin y conversión a compra premium, (b) los padres reporten fricción con el approval flow, (c) consideremos abrir marketplace estudiante-estudiante en v2.*

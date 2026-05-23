# Runbook: Release `develop` → `main` (Epic 02 + 02b + 03)

> **Estado**: borrador activo. Redactado 2026-05-21 cuando se evaluaba mergear inmediato a prod. **Ejecutar en Semana 10 del plan del pilot** (después del Epic 02.5 + Epic 04 + Epic 05 + hardening), cuando hagamos el primer release real a producción con familias piloto.
>
> Audiencia: Omar (founder/operador).
> Tiempo estimado: 60-90 min si todo sale bien, 2-3 h si hay un rollback.
> Estado del repo al momento de redactar este runbook: `develop` @ `740fa32`, `main` @ `505efb2`. Develop adelanta a main por todo Epic 02 (Angela MVP), Epic 02b (Pricing) y Epic 03 (Billing). **Cuando se ejecute en Semana 10, develop también incluirá Epic 02.5, Epic 04, Epic 05 y hardening — actualizar las verificaciones a esa fecha.**

---

## 0. Pre-flight: confirma dos datos antes de empezar

Llena estos dos valores; el runbook entero los referencia.

| Dato | Valor |
|---|---|
| URL pública de prod (NEXTAUTH_URL) | `https://midsea-pearl.vercel.app`  ← confirmar |
| Connection string del pooler de prod (Supabase / Neon / etc.) | `postgresql://...`  ← obtener del provider, NO hardcodear aquí |

Si el dominio cambió a uno custom (ej. `app.midsea.academy`), úsalo en todos los pasos donde aparezca `midsea-pearl.vercel.app`.

---

## 1. Verificaciones locales antes del PR

Corre todo en `develop`, antes de tocar Stripe o Vercel. Si algo de esto falla, **arregla en una rama nueva antes de seguir** — no abras el PR a main con tests rotos.

```bash
cd C:\Users\ofigu\Projects\midsea
git checkout develop
git pull --ff-only origin develop

npm install              # asegura node_modules alineado con package-lock
npm run type-check       # tsc --noEmit
npm run lint             # next lint
npm run check:edunexo    # debe terminar limpio
npm run test             # vitest run — 11+ archivos de tests (más cuando se sumen Epic 02.5, 04, 05)
```

Esperado:
- type-check: 0 errores.
- lint: 0 warnings nuevos.
- check:edunexo: cero hits (los matches que muestra son intencionales en docs/scripts).
- vitest: todos los archivos de test pasan. Nota documentada en Epic 02: el primer run después de cambios en `src/` puede tirar "Cannot read properties of undefined (reading 'config')" — re-correr. Si pasa al 2º intento, OK.

---

## 2. Aplicar migrations a la DB de **producción**

**Esto es lo único que NO se puede rollbackear con un revert de Git.** Hazlo *antes* del merge para que el código de main (cuando entre) ya encuentre las columnas listas.

Cuando se ejecute en Semana 10, habrá **3 migrations** que aplicar en orden:
1. `0003-billing-tables.sql` (Epic 03, billing) — script `apply-billing-migration.mjs`.
2. `0004-catalog-courses-enrollments.sql` (Epic 04, catálogo + activación de cursos) — script equivalente a crear.
3. `0005-coin-store.sql` (Epic 05, tienda Coin) — script equivalente a crear.

Cada SQL es idempotente (`IF NOT EXISTS` en todo). Re-correrlas es seguro.

```bash
# Set la URL del pooler de prod inline — no la guardes en .env
# (Windows PowerShell)
$env:DATABASE_URL_PROD="postgresql://...prod-pooler..."
node scripts/apply-billing-migration.mjs --target=prod
node scripts/apply-catalog-migration.mjs --target=prod    # cuando exista (Epic 04)
node scripts/apply-coin-store-migration.mjs --target=prod # cuando exista (Epic 05)
Remove-Item Env:DATABASE_URL_PROD
```

Lo que va a cambiar en la DB prod (acumulado tras las 3 migrations):
- Enums nuevos: `SubscriptionStatus`, `PlanTier`, `BillingCycle`, `SubjectArea`, `GradeBand`, `StoreItemType`, `StoreItemStatus`, `PurchaseStatus`.
- Tablas nuevas: `StripeWebhookEvent`, `Course`, `Competency`, `LessonCompetency`, `StudentCourseEnrollment`, `QuizQuestion`, `StoreItem`, `StorePurchase`, `ParentBillingPreferences`.
- Columnas nuevas en `Parent`: `stripeCustomerId`.
- Columnas nuevas en `Student`: `angelaNotes`, `subscriptionStatus`, `planTier`, `billingCycle`, `stripeSubscriptionId`, `currentPeriodEnd`, `monthlyAmountCents`.
- Columnas nuevas en `Lesson`: `courseId`, `reflectionEs`, `reflectionEn` (de ADR-007).

Verificaciones del script: imprime `Verify <TableName> count: [{n:N}]`. Si imprime el conteo, las tablas existen y los enums se aplicaron.

⚠️ Riesgo: `subscriptionStatus` se agrega con `DEFAULT 'PENDING_PAYMENT' NOT NULL`. **Todos los students existentes en prod quedarán marcados como `PENDING_PAYMENT`.** Si en prod hay students reales activos (probable durante pilot, después que las primeras familias se registren), corre **después de la migration y antes del merge** un UPDATE manual:

```sql
-- Sólo si hay students reales activos que no deben quedar bloqueados
UPDATE "Student" SET "subscriptionStatus" = 'ACTIVE' WHERE id IN ('id1', 'id2', ...);
```

Si prod solo tiene el seed demo, déjalos en PENDING; el demo path (`isDemo: true`) está cableado a cards sintéticas y no toca esta columna.

---

## 3. Configurar Stripe **live mode**

### 3.1. Crear productos y prices en live mode

En `https://dashboard.stripe.com/products` (live mode toggle arriba a la izquierda), crear los productos con estos prices:

**Subscriptions (recurrentes)**:

| Plan | Mensual | Anual |
|---|---|---|
| Core | $29.00 USD / mes | $243.60 USD / año |
| Pro | $45.00 USD / mes | $378.00 USD / año |
| Family | $69.00 USD / mes | — (no anual en v1, ADR-001 §3) |

**Coin packs (one-time, post-Epic 05)**:

| Pack | Coin | Precio USD |
|---|---|---|
| Small | 1,000 | $9.00 |
| Medium | 3,000 | $25.00 |
| Large | 7,000 | $50.00 |

Guarda los 5 IDs `price_...` de subscription + 3 de Coin packs. Los necesitas en el paso 4.

### 3.2. Crear webhook endpoint live

`https://dashboard.stripe.com/webhooks` → **Add endpoint**:

- Endpoint URL: `https://midsea-pearl.vercel.app/api/webhooks/stripe`
- Events to send (suscribir explícitamente):
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `payment_intent.succeeded` (cubre subscriptions + Coin packs vía metadata)
  - `payment_intent.payment_failed`
  - `invoice.payment_failed` (auditoría)

Tras crear el endpoint, click → **Reveal signing secret** → copia el `whsec_...`. Lo necesitas en el paso 4.

### 3.3. Obtener API keys live

`https://dashboard.stripe.com/apikeys` (live mode):
- Publishable: `pk_live_...`
- Secret: `sk_live_...` (revélala una sola vez — guárdala en un password manager).

---

## 4. Configurar env vars en Vercel **Production**

`Vercel Dashboard → midsea project → Settings → Environment Variables`. Para cada variable, scope = **Production only** (no Preview, no Development), salvo donde indique lo contrario.

```
# Servidor — base
DATABASE_URL              = <pooler URL de prod>
OPENAI_API_KEY            = sk-...               (puede ser la misma que dev si el budget lo permite)
OPENAI_MODEL              = gpt-4o-mini
OPENAI_MODEL_REASONING    = gpt-4o               (Epic 02.5 — chain-of-thought para Math/Ciencias)
OPENAI_MODEL_GENERATION   = gpt-4o               (ADR-006 — generación de lecciones)

# NextAuth
NEXTAUTH_URL              = https://midsea-pearl.vercel.app
NEXTAUTH_SECRET           = <openssl rand -base64 32 ; DIFERENTE al de dev>
GOOGLE_CLIENT_ID          = <prod client id, autorizar el dominio prod en Google Console>
GOOGLE_CLIENT_SECRET      = <prod client secret>

# i18n
DEFAULT_LOCALE            = es

# Stripe — todas live
STRIPE_SECRET_KEY                  = sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_...      ← scope Production + Preview ambos (el cliente lee desde build)
STRIPE_WEBHOOK_SECRET              = whsec_...        (el del endpoint creado en 3.2)
STRIPE_PRICE_CORE_MONTHLY          = price_live_...
STRIPE_PRICE_CORE_ANNUAL           = price_live_...
STRIPE_PRICE_PRO_MONTHLY           = price_live_...
STRIPE_PRICE_PRO_ANNUAL            = price_live_...
STRIPE_PRICE_FAMILY_MONTHLY        = price_live_...
STRIPE_PRICE_COIN_PACK_S           = price_live_...   (Epic 05)
STRIPE_PRICE_COIN_PACK_M           = price_live_...   (Epic 05)
STRIPE_PRICE_COIN_PACK_L           = price_live_...   (Epic 05)

ANNUAL_DISCOUNT_PCT       = 30
```

Notas:
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` se inyecta en el bundle del cliente en build time. Tiene que existir antes del próximo deploy o el Payment Element no renderiza.
- Si Google OAuth está configurado con `http://localhost:3000` y el dominio prod no está en "Authorized redirect URIs", el login con Google va a fallar. Authorize `https://midsea-pearl.vercel.app/api/auth/callback/google` en Google Cloud Console.

---

## 5. Abrir el PR `develop` → `main`

```bash
git checkout develop
git pull --ff-only origin develop
git log main..develop --oneline   # confirma qué commits van a entrar
```

Crear el PR desde GitHub UI (no por CLI — quieres review humana). Título sugerido:

> **Release: Pilot HS LATAM cristiano — Epic 02 + 02b + 03 + 02.5 + 04 + 05 → prod**

Body sugerido (copia/pega y ajusta a la fecha del release):

```markdown
## Qué entra (acumulado desde el último release)

- Epic 02: Angela MVP con streaming SSE en `/stuck`, memoria persistente.
- Epic 02b: Sección de pricing en landing con toggle anual 30%.
- Epic 03: Parent Copilot Add Student + Billing inline con Stripe.
- Epic 02.5: Angela coach HS — hero variant, español LATAM neutro,
  cosmovisión cristiana ADR-007, chain-of-thought visible.
- Epic 04: Lesson Player + pipeline generación + catálogo Pilot Mínimo
  (8 cursos HS LATAM con ~280 lecciones generadas a partir del corpus
  del founder).
- Epic 05: Tienda Coin + productos premium + Coin packs.
- Hardening: Playwright e2e, Prisma migrations formales, cleanup demo,
  logs estructurados, rate-limit reauth, cron orphan PENDING_PAYMENT.

## Pre-merge checklist (debe estar ✅ antes de mergear)

- [ ] `npm run type-check`, `lint`, `test`, `check:edunexo` locales limpios.
- [ ] Migrations billing + catalog + coin-store aplicadas a DB prod
      (scripts en `scripts/apply-*.mjs` corridos OK).
- [ ] Students preexistentes en prod actualizados a estado correcto si
      aplica (UPDATE manual de `subscriptionStatus`).
- [ ] Productos + prices en Stripe live mode (5 subscriptions + 3 Coin packs).
- [ ] Webhook endpoint live creado en Stripe Dashboard, suscrito a los
      6 eventos del runbook §3.2.
- [ ] 16 env vars de Production configuradas en Vercel (lista en runbook §4).
- [ ] Google OAuth callback URL prod autorizada en Google Cloud Console.

## Post-merge smoke test (15 min)

- [ ] Visitar `https://midsea-pearl.vercel.app/es` — landing carga sin
      errores en console.
- [ ] Catálogo público `/es/catalog` muestra los 8 cursos del Pilot Mínimo.
- [ ] Sección Pricing muestra Core $29 / Pro $45 / Family $69.
- [ ] Signup con cuenta nueva de prueba → dashboard parental muestra empty state.
- [ ] "+ Agregar estudiante" abre modal Step A → reauth → Step B con Stripe.
- [ ] Pagar con tarjeta REAL ($29 mensual mínimo) → Student aparece como ACTIVE.
- [ ] Padre activa 1 curso para el hijo → hijo lo ve en `/student`.
- [ ] Hijo abre lección → completa quiz con ≥80% → balance Coin aumenta a 100.
- [ ] Hijo va a `/student/store` → pide producto premium → padre aprueba → Coin debitado.
- [ ] Padre compra Coin pack $9 → balance del hijo aumenta en 1000 Coin.
- [ ] Stripe Dashboard → Events: todos los webhooks llegan con status 200.
- [ ] Reembolsar los cobros desde Stripe Dashboard para limpiar.

## Pendientes conocidos (no bloquean este merge)

Ver `docs/prompts/*` y `docs/decisions/ADR-*.md` para roadmap v1.1:
- Rolling release de los 14 cursos restantes HS (Mat 11-12, Lengua 11-12,
  Inglés ESL 11-12, Ciencias adicionales, Historia Mundial I+II, Música 10-12).
- Cancelar/reactivar suscripción, retry de PENDING_PAYMENT.
- WebAuthn passkey reauth.
- OXXO (México), Mercado Pago.
- Expansión a Primaria + Middle School con currículo por país latino.
```

Aprueba el PR tú mismo si no hay reviewer asignado. **Merge strategy: merge commit** (no squash) — preserva el linaje feature/* visible en main.

---

## 6. Post-merge: deploy y smoke test

Vercel debe disparar el deploy de production automáticamente cuando llega el commit a `main`. Verificar:

1. `https://vercel.com/<tu-team>/midsea/deployments` → último deploy "Production" status `Ready`.
2. Build log NO debe quejarse de env vars faltantes.
3. Correr el smoke test del PR body en orden.
4. Si el smoke test pasa → release exitoso. Cierra el PR.

---

## 7. Plan de rollback

### Si el smoke test falla en el frontend (ej. landing rota, signup tira 500)

Rollback rápido vía Vercel:
```
Vercel → Deployments → buscar el deploy anterior (pre-merge) →
"⋯" → "Promote to Production"
```
Esto NO revierte la DB. Pero las migrations tienen cambios aditivos: columnas nuevas nullable + tablas nuevas + enums. El código anterior las ignora — sin problema.

Después, abrir hotfix branch desde main, fix, PR, merge, re-deploy. NO usar `git revert` del merge en main — confunde el linaje. Vercel rollback + hotfix forward es más limpio.

### Si el webhook de Stripe no entrega (todos los pagos quedan en PENDING_PAYMENT)

Stripe Dashboard → Webhooks → tu endpoint → ver tab "Failed deliveries" con el error específico. Causas comunes:
- `STRIPE_WEBHOOK_SECRET` en Vercel no coincide con el del endpoint (copy/paste mal). Re-copiar, re-deploy.
- El endpoint live en Stripe Dashboard apunta a URL incorrecta (typo en dominio). Editar endpoint.
- Eventos no suscritos. Editar endpoint → re-suscribir los 6 eventos.

Mientras debuggeás, puedes reenviar manualmente eventos pasados desde la UI (Stripe Dashboard → Events → click → "Resend").

### Si una migration prod corrompió algo (no debería; son idempotentes y aditivas)

Las columnas son nullable / con default. Lo único destructivo sería el constraint `NOT NULL` en `subscriptionStatus`. Para revertir solo eso:

```sql
ALTER TABLE "Student" ALTER COLUMN "subscriptionStatus" DROP NOT NULL;
ALTER TABLE "Student" ALTER COLUMN "subscriptionStatus" DROP DEFAULT;
ALTER TABLE "Student" ALTER COLUMN "subscriptionStatus" SET DATA TYPE TEXT;  -- si el tipo enum estorba
```

(Si llegas a necesitar esto, párate y pídeme acompañamiento — borrar el enum es no-trivial si ya hay rows con valores válidos.)

---

## 8. Onboarding de las primeras 10-30 familias piloto

Una vez que el smoke test pasa, arranca el onboarding del pilot:

1. **Reclutamiento**: comunidad homeschooler cristiana argentina (Facebook groups, WhatsApp), diáspora argentina en US/España, contactos personales del founder. Objetivo: 10-30 familias en las primeras 4 semanas.
2. **Filtro**: padre cristiano, hijo en 9° o 10°, dispuesto a feedback semanal por WhatsApp/email.
3. **Onboarding 1:1**: llamada de 30 min con cada familia primer día. Demo del Parent Copilot + activar 2-3 cursos para el hijo + tour de Angela.
4. **Disclaimer**: "Midsea es plataforma cristiana en alpha. Contenido revisado por el equipo fundador, no acreditado todavía. Validación legal de la educación es responsabilidad del padre/tutor según jurisdicción."
5. **Feedback loop**: WhatsApp group con todas las familias piloto + form semanal de feedback estructurado.
6. **Iteración**: errores conceptuales en lecciones se regeneran con prompt actualizado (~5 min/lección via pipeline ADR-006). Bugs UX se hotfix.

---

*Última actualización: 2026-05-21. Actualizar cuando se ejecute el release real en Semana 10 con observaciones reales.*

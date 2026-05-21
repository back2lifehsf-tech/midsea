-- Epic 03 — Add Student + Billing. ADR-001 §10.
--
-- Aditivo: nuevas columnas nullable + nueva tabla. Cero downtime para
-- código actual (Epic 01/02 no lee estos campos). Idempotente vía
-- IF NOT EXISTS / DO blocks.
--
-- Cómo aplicar:
--   node scripts/apply-billing-migration.mjs --target=dev
--   node scripts/apply-billing-migration.mjs --target=prod   # cuando se merge develop → main

-- 1) Enums
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubscriptionStatus') THEN
    CREATE TYPE "SubscriptionStatus" AS ENUM (
      'TRIALING', 'ACTIVE', 'PAST_DUE', 'PENDING_PAYMENT', 'CANCELED', 'PAUSED'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PlanTier') THEN
    CREATE TYPE "PlanTier" AS ENUM ('CORE', 'PRO', 'FAMILY');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BillingCycle') THEN
    CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'ANNUAL');
  END IF;
END $$;

-- 2) Parent: stripeCustomerId
ALTER TABLE "Parent" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Parent_stripeCustomerId_key" ON "Parent"("stripeCustomerId");

-- 3) Student: angelaNotes + subscription fields
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "angelaNotes" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING_PAYMENT';
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "planTier" "PlanTier";
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "billingCycle" "BillingCycle";
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "currentPeriodEnd" TIMESTAMP(3);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "monthlyAmountCents" INTEGER;
CREATE UNIQUE INDEX IF NOT EXISTS "Student_stripeSubscriptionId_key" ON "Student"("stripeSubscriptionId");
CREATE INDEX IF NOT EXISTS "Student_subscriptionStatus_idx" ON "Student"("subscriptionStatus");

-- 4) StripeWebhookEvent (idempotencia)
CREATE TABLE IF NOT EXISTS "StripeWebhookEvent" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "StripeWebhookEvent_type_processedAt_idx" ON "StripeWebhookEvent"("type", "processedAt");

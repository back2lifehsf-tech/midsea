-- Mejora 9 (Tienda Coin) — StoreItem + StorePurchase + enums. ADR-004.
--
-- Aditivo: 2 enums + 2 tablas nuevas. Cero downtime para el código actual
-- (nadie lee estas tablas todavía). Idempotente vía IF NOT EXISTS / DO blocks
-- (re-correr es safe). La relación Student.purchases es solo a nivel Prisma
-- (la FK vive en StorePurchase.studentId) — no agrega columnas a Student.
--
-- Cómo aplicar:
--   node scripts/apply-billing-migration.mjs --target=dev --file=prisma/migrations/manual/0007-store-items-and-purchases.sql
--   node scripts/apply-billing-migration.mjs --target=prod --url="<pooler-prod-url>" --file=prisma/migrations/manual/0007-store-items-and-purchases.sql

-- 1) Enums
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StoreItemType') THEN
    CREATE TYPE "StoreItemType" AS ENUM ('COURSE', 'MASTERCLASS', 'ELECTIVE');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PurchaseStatus') THEN
    CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED');
  END IF;
END $$;

-- 2) StoreItem
CREATE TABLE IF NOT EXISTS "StoreItem" (
  "id" TEXT NOT NULL,
  "titleEs" TEXT NOT NULL,
  "titleEn" TEXT NOT NULL,
  "descriptionEs" TEXT NOT NULL,
  "descriptionEn" TEXT NOT NULL,
  "coinPrice" INTEGER NOT NULL,
  "type" "StoreItemType" NOT NULL,
  "courseSlug" TEXT,
  "imageUrl" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StoreItem_pkey" PRIMARY KEY ("id")
);

-- 3) StorePurchase
CREATE TABLE IF NOT EXISTS "StorePurchase" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "coinSpent" INTEGER NOT NULL,
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP(3),
  "status" "PurchaseStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StorePurchase_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "StorePurchase_studentId_idx" ON "StorePurchase"("studentId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='StorePurchase_studentId_fkey') THEN
    ALTER TABLE "StorePurchase"
      ADD CONSTRAINT "StorePurchase_studentId_fkey"
      FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='StorePurchase_itemId_fkey') THEN
    ALTER TABLE "StorePurchase"
      ADD CONSTRAINT "StorePurchase_itemId_fkey"
      FOREIGN KEY ("itemId") REFERENCES "StoreItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

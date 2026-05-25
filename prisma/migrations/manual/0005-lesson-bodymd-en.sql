-- Epic 04 (fix bilingüe) — body de la lección en inglés.
--
-- El pipeline genera contentMarkdownEs + contentMarkdownEn, pero el ingest
-- solo guardaba el español en Lesson.bodyMd. Esta migración agrega la
-- columna para el body en inglés; luego re-ingestar backfillea los datos.
--
-- Aditivo, nullable, idempotente. Cero downtime.
--
-- Cómo aplicar:
--   node scripts/apply-billing-migration.mjs --target=dev --file=prisma/migrations/manual/0005-lesson-bodymd-en.sql
--   node scripts/apply-billing-migration.mjs --url="<pooler-prod>" --file=prisma/migrations/manual/0005-lesson-bodymd-en.sql

ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "bodyMdEn" TEXT;

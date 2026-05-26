-- Mejora 8 (Activador Mental) — columnas hookEs/hookEn en Lesson.
--
-- El pipeline (ADR-006) genera un "hook" breve e impactante (dato curioso,
-- pregunta) que abre la vista Lectura tras la bienvenida bíblica. Estas
-- columnas lo guardan; el lesson player renderiza LessonHookCard solo cuando
-- tienen valor.
--
-- Aditivo, nullable, idempotente. Cero downtime.
--
-- Cómo aplicar:
--   node scripts/apply-billing-migration.mjs --target=dev --file=prisma/migrations/manual/0008-lesson-hook.sql
--   node scripts/apply-billing-migration.mjs --url="<pooler-prod>" --file=prisma/migrations/manual/0008-lesson-hook.sql

ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "hookEs" TEXT;
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "hookEn" TEXT;

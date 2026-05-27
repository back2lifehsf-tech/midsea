-- Mejora 12 (Lecciones de 30 min con video) — columnas videoUrl/videoDuration.
--
-- Cada lección representa un día de estudio (~30 min) y abre con un video
-- introductorio (~10 min). Estas columnas guardan la URL del video y su
-- duración en segundos. El curador carga la URL post-generación (el pipeline
-- no genera URLs reales en v1).
--
-- Aditivo, nullable, idempotente. Cero downtime.
--
-- Cómo aplicar:
--   node scripts/apply-billing-migration.mjs --target=dev --file=prisma/migrations/manual/0009-lesson-video-url.sql
--   node scripts/apply-billing-migration.mjs --url="<pooler-prod>" --file=prisma/migrations/manual/0009-lesson-video-url.sql

ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "videoDuration" INTEGER;

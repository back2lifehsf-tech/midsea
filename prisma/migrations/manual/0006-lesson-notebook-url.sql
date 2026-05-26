-- Mejora 5 (PDF Expandido) — URL del notebook descargable por lección.
--
-- El equipo editorial produce un PDF expandido (explicación profunda,
-- vocabulario, gráficos, resumen visual) y lo sube a un CDN/Storage. Esta
-- migración agrega la columna que guarda esa URL pública. El lesson player
-- renderiza un botón de descarga solo cuando la columna tiene valor.
--
-- Aditivo, nullable, idempotente. Cero downtime.
--
-- Cómo aplicar:
--   node scripts/apply-billing-migration.mjs --target=dev --file=prisma/migrations/manual/0006-lesson-notebook-url.sql
--   node scripts/apply-billing-migration.mjs --url="<pooler-prod>" --file=prisma/migrations/manual/0006-lesson-notebook-url.sql

ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "notebookUrl" TEXT;

-- =====================================================================
-- 0011: Enable Row-Level Security (RLS) en todas las tablas públicas
-- =====================================================================
-- Contexto: Supabase expone las tablas via PostgREST (REST API) con la
-- clave `anon`. Sin RLS, cualquiera con la URL del proyecto puede leer
-- y escribir cualquier dato.
--
-- Este proyecto usa Prisma con conexión directa (DATABASE_URL). Prisma
-- se conecta como `postgres` (service_role), que SIEMPRE bypass RLS.
-- Habilitar RLS no afecta al backend — solo cierra el acceso anónimo
-- via REST API.
--
-- Estrategia: ENABLE RLS en todas las tablas existentes. IF EXISTS en
-- el DO block para ser idempotente y seguro en cualquier entorno.
-- =====================================================================

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    -- Identidad y familias
    'Family',
    'Parent',
    'Student',
    'DeviceLinkToken',
    -- Currículo
    'Course',
    'Competency',
    'Lesson',
    'LessonCompetency',
    'QuizQuestion',
    'StudentCourseEnrollment',
    -- Progreso y gamificación
    'LessonProgress',
    'NexosEntry',
    'Badge',
    'EarnedBadge',
    'StoreItem',
    'StorePurchase',
    -- Tutor AI
    'TutorSession',
    'TutorMessage',
    'TutorUsageDaily',
    -- Billing / webhooks
    'StripeWebhookEvent',
    -- NextAuth (si existen)
    'accounts',
    'sessions',
    'users',
    'verification_tokens',
    '_prisma_migrations'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
      RAISE NOTICE 'RLS enabled: %', tbl;
    ELSE
      RAISE NOTICE 'Skipped (not found): %', tbl;
    END IF;
  END LOOP;
END $$;

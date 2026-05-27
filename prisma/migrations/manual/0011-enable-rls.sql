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
-- Estrategia: ENABLE RLS en todas las tablas + sin policies públicas.
-- Resultado: acceso anónimo bloqueado; service_role/postgres sin cambios.
-- =====================================================================

-- -----------------------------------------------------------------------
-- Identidad y familias
-- -----------------------------------------------------------------------
ALTER TABLE "Family"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Parent"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Student"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DeviceLinkToken" ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------
-- Currículo
-- -----------------------------------------------------------------------
ALTER TABLE "Course"                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Competency"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lesson"                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LessonCompetency"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuizQuestion"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StudentCourseEnrollment"   ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------
-- Progreso y gamificación
-- -----------------------------------------------------------------------
ALTER TABLE "LessonProgress"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NexosEntry"       ENABLE ROW LEVEL SECURITY;  -- CoinEntry @@map
ALTER TABLE "Badge"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EarnedBadge"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StoreItem"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StorePurchase"    ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------
-- Tutor AI
-- -----------------------------------------------------------------------
ALTER TABLE "TutorSession"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TutorMessage"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TutorUsageDaily"  ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------
-- Billing / webhooks
-- -----------------------------------------------------------------------
ALTER TABLE "StripeWebhookEvent" ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------
-- Tablas de NextAuth (si existen en este proyecto)
-- Las creamos con IF EXISTS para no romper si no están presentes.
-- -----------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accounts') THEN
    EXECUTE 'ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sessions') THEN
    EXECUTE 'ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    EXECUTE 'ALTER TABLE "users" ENABLE ROW LEVEL SECURITY';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'verification_tokens') THEN
    EXECUTE 'ALTER TABLE "verification_tokens" ENABLE ROW LEVEL SECURITY';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_prisma_migrations') THEN
    EXECUTE 'ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

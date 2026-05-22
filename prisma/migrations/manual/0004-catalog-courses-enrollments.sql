-- Epic 04 — Catálogo HS + Courses + Competencies + Enrollments. ADR-005 §7.
--
-- Aditivo: 2 enums + 5 tablas nuevas + 5 columnas nullable en Lesson.
-- Cero downtime para código actual (Epic 01/02/03 no leen estos campos).
-- Idempotente vía IF NOT EXISTS / DO blocks (re-correr es safe).
--
-- Cómo aplicar:
--   node scripts/apply-billing-migration.mjs --target=dev --file=prisma/migrations/manual/0004-catalog-courses-enrollments.sql
--   node scripts/apply-billing-migration.mjs --target=prod --url="<pooler-prod-url>" --file=prisma/migrations/manual/0004-catalog-courses-enrollments.sql

-- 1) Enums
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubjectArea') THEN
    CREATE TYPE "SubjectArea" AS ENUM (
      'MATH', 'LANGUAGE', 'ENGLISH_ESL', 'HISTORY', 'SCIENCE', 'MUSIC', 'ELECTIVE_OTHER'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GradeBand') THEN
    CREATE TYPE "GradeBand" AS ENUM ('CICLO_BASICO', 'CICLO_ORIENTADO', 'TRANSVERSAL');
  END IF;
END $$;

-- 2) Course
CREATE TABLE IF NOT EXISTS "Course" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "titleEs" TEXT NOT NULL,
  "titleEn" TEXT NOT NULL,
  "descriptionEs" TEXT NOT NULL,
  "descriptionEn" TEXT NOT NULL,
  "subject" "SubjectArea" NOT NULL,
  "gradeBand" "GradeBand" NOT NULL,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "published" BOOLEAN NOT NULL DEFAULT false,
  "thumbnailUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Course_slug_key" ON "Course"("slug");
CREATE INDEX IF NOT EXISTS "Course_subject_gradeBand_published_idx" ON "Course"("subject", "gradeBand", "published");

-- 3) Competency
CREATE TABLE IF NOT EXISTS "Competency" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "descriptionEs" TEXT NOT NULL,
  "descriptionEn" TEXT NOT NULL,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "Competency_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Competency_courseId_code_key" ON "Competency"("courseId", "code");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Competency_courseId_fkey') THEN
    ALTER TABLE "Competency"
      ADD CONSTRAINT "Competency_courseId_fkey"
      FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 4) CompetencyPrereqs (self M-N implicit join — Prisma genera la tabla `_CompetencyPrereqs`)
CREATE TABLE IF NOT EXISTS "_CompetencyPrereqs" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "_CompetencyPrereqs_AB_unique" ON "_CompetencyPrereqs"("A", "B");
CREATE INDEX IF NOT EXISTS "_CompetencyPrereqs_B_index" ON "_CompetencyPrereqs"("B");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='_CompetencyPrereqs_A_fkey') THEN
    ALTER TABLE "_CompetencyPrereqs"
      ADD CONSTRAINT "_CompetencyPrereqs_A_fkey"
      FOREIGN KEY ("A") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='_CompetencyPrereqs_B_fkey') THEN
    ALTER TABLE "_CompetencyPrereqs"
      ADD CONSTRAINT "_CompetencyPrereqs_B_fkey"
      FOREIGN KEY ("B") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 5) LessonCompetency
CREATE TABLE IF NOT EXISTS "LessonCompetency" (
  "lessonId" TEXT NOT NULL,
  "competencyId" TEXT NOT NULL,
  "weight" INTEGER NOT NULL DEFAULT 100,
  CONSTRAINT "LessonCompetency_pkey" PRIMARY KEY ("lessonId", "competencyId")
);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='LessonCompetency_lessonId_fkey') THEN
    ALTER TABLE "LessonCompetency"
      ADD CONSTRAINT "LessonCompetency_lessonId_fkey"
      FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='LessonCompetency_competencyId_fkey') THEN
    ALTER TABLE "LessonCompetency"
      ADD CONSTRAINT "LessonCompetency_competencyId_fkey"
      FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 6) StudentCourseEnrollment
CREATE TABLE IF NOT EXISTS "StudentCourseEnrollment" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "activatedByParentId" TEXT NOT NULL,
  "deactivatedAt" TIMESTAMP(3),
  "active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "StudentCourseEnrollment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "StudentCourseEnrollment_studentId_courseId_key" ON "StudentCourseEnrollment"("studentId", "courseId");
CREATE INDEX IF NOT EXISTS "StudentCourseEnrollment_studentId_active_idx" ON "StudentCourseEnrollment"("studentId", "active");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='StudentCourseEnrollment_studentId_fkey') THEN
    ALTER TABLE "StudentCourseEnrollment"
      ADD CONSTRAINT "StudentCourseEnrollment_studentId_fkey"
      FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='StudentCourseEnrollment_courseId_fkey') THEN
    ALTER TABLE "StudentCourseEnrollment"
      ADD CONSTRAINT "StudentCourseEnrollment_courseId_fkey"
      FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='StudentCourseEnrollment_activatedByParentId_fkey') THEN
    ALTER TABLE "StudentCourseEnrollment"
      ADD CONSTRAINT "StudentCourseEnrollment_activatedByParentId_fkey"
      FOREIGN KEY ("activatedByParentId") REFERENCES "Parent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- 7) QuizQuestion
CREATE TABLE IF NOT EXISTS "QuizQuestion" (
  "id" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "type" TEXT NOT NULL,
  "promptEs" TEXT NOT NULL,
  "promptEn" TEXT NOT NULL,
  "options" JSONB,
  "correctAnswer" JSONB NOT NULL,
  "explanationEs" TEXT,
  "explanationEn" TEXT,
  CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "QuizQuestion_lessonId_orderIndex_idx" ON "QuizQuestion"("lessonId", "orderIndex");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='QuizQuestion_lessonId_fkey') THEN
    ALTER TABLE "QuizQuestion"
      ADD CONSTRAINT "QuizQuestion_lessonId_fkey"
      FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 8) Extend Lesson with catalog fields (all nullable for back-compat)
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "courseId" TEXT;
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "monthIndex" INTEGER;
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "bodyMd" TEXT;
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "activities" JSONB;
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "reflectionEs" TEXT;
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "reflectionEn" TEXT;
CREATE INDEX IF NOT EXISTS "Lesson_courseId_monthIndex_orderIndex_idx" ON "Lesson"("courseId", "monthIndex", "orderIndex");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Lesson_courseId_fkey') THEN
    ALTER TABLE "Lesson"
      ADD CONSTRAINT "Lesson_courseId_fkey"
      FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

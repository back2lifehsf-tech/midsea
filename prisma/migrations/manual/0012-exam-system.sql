-- Mejora 13 (Sistema de Exámenes) — Exam + ExamQuestion + ExamAttempt + enums.
--
-- Aditivo: 3 enums nuevos + 3 tablas nuevas + 1 valor al enum NexosReason.
-- Idempotente vía IF NOT EXISTS / DO blocks (re-correr es safe).
-- La relación Course.exams y Student.examAttempts son solo a nivel Prisma
-- (las FKs viven en Exam.courseId / ExamAttempt.studentId) — no agrega
-- columnas a Course ni a Student.
--
-- Cómo aplicar:
--   node scripts/apply-billing-migration.mjs --target=dev --file=prisma/migrations/manual/0012-exam-system.sql
--   node scripts/apply-billing-migration.mjs --target=prod --url="<pooler-prod-url>" --file=prisma/migrations/manual/0012-exam-system.sql

-- 1) Agregar EXAM_PASS al enum NexosReason (nombre en DB; en Prisma es CoinReason con @@map)
--    IF NOT EXISTS soportado desde PostgreSQL 9.6. Neon usa PG 15+, asi que es safe.
--    NOTA: ALTER TYPE ADD VALUE no puede ir dentro de un bloque DO en PG < 12;
--    se usa la forma directa con IF NOT EXISTS para idempotencia.
ALTER TYPE "NexosReason" ADD VALUE IF NOT EXISTS 'EXAM_PASS';

-- 2) Enum ExamType
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ExamType') THEN
    CREATE TYPE "ExamType" AS ENUM ('MONTHLY', 'MIDTERM', 'FINAL');
  END IF;
END $$;

-- 3) Enum QuestionType
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'QuestionType') THEN
    CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER');
  END IF;
END $$;

-- 4) Enum AttemptStatus
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AttemptStatus') THEN
    CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'GRADED');
  END IF;
END $$;

-- 5) Tabla Exam
CREATE TABLE IF NOT EXISTS "Exam" (
  "id"              TEXT          NOT NULL,
  "courseId"        TEXT          NOT NULL,
  "type"            "ExamType"    NOT NULL,
  "monthIndex"      INTEGER,
  "titleEs"         TEXT          NOT NULL,
  "titleEn"         TEXT          NOT NULL,
  "instructionEs"   TEXT          NOT NULL,
  "instructionEn"   TEXT          NOT NULL,
  "timeLimitMin"    INTEGER       NOT NULL DEFAULT 45,
  "passingPct"      INTEGER       NOT NULL DEFAULT 70,
  "coinReward"      INTEGER       NOT NULL DEFAULT 300,
  "consolationCoin" INTEGER       NOT NULL DEFAULT 50,
  "createdAt"       TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- FK Exam.courseId → Course.id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Exam_courseId_fkey') THEN
    ALTER TABLE "Exam"
      ADD CONSTRAINT "Exam_courseId_fkey"
      FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Unique constraint Exam(courseId, type, monthIndex)
-- Usamos UNIQUE INDEX (no CONSTRAINT) para que NULL sea tratado como distinto
-- en PostgreSQL (NULL != NULL en índice único — comportamiento deseado para
-- MIDTERM y FINAL donde monthIndex es NULL).
CREATE UNIQUE INDEX IF NOT EXISTS "Exam_courseId_type_monthIndex_key"
  ON "Exam"("courseId", "type", "monthIndex");

-- Index Exam(courseId)
CREATE INDEX IF NOT EXISTS "Exam_courseId_idx"
  ON "Exam"("courseId");

-- 6) Tabla ExamQuestion
CREATE TABLE IF NOT EXISTS "ExamQuestion" (
  "id"            TEXT            NOT NULL,
  "examId"        TEXT            NOT NULL,
  "orderIndex"    INTEGER         NOT NULL,
  "type"          "QuestionType"  NOT NULL,
  "stemEs"        TEXT            NOT NULL,
  "stemEn"        TEXT            NOT NULL,
  "options"       JSONB,
  "correctAnswer" TEXT            NOT NULL,
  "explanationEs" TEXT,
  "explanationEn" TEXT,
  "points"        INTEGER         NOT NULL DEFAULT 1,
  CONSTRAINT "ExamQuestion_pkey" PRIMARY KEY ("id")
);

-- FK ExamQuestion.examId → Exam.id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ExamQuestion_examId_fkey') THEN
    ALTER TABLE "ExamQuestion"
      ADD CONSTRAINT "ExamQuestion_examId_fkey"
      FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Index ExamQuestion(examId, orderIndex)
CREATE INDEX IF NOT EXISTS "ExamQuestion_examId_orderIndex_idx"
  ON "ExamQuestion"("examId", "orderIndex");

-- 7) Tabla ExamAttempt
CREATE TABLE IF NOT EXISTS "ExamAttempt" (
  "id"          TEXT            NOT NULL,
  "examId"      TEXT            NOT NULL,
  "studentId"   TEXT            NOT NULL,
  "status"      "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "score"       INTEGER,
  "totalPoints" INTEGER,
  "pctScore"    INTEGER,
  "passed"      BOOLEAN,
  "answers"     JSONB           NOT NULL DEFAULT '[]',
  "startedAt"   TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "submittedAt" TIMESTAMP(3),
  "coinAwarded" BOOLEAN         NOT NULL DEFAULT false,
  CONSTRAINT "ExamAttempt_pkey" PRIMARY KEY ("id")
);

-- FK ExamAttempt.examId → Exam.id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ExamAttempt_examId_fkey') THEN
    ALTER TABLE "ExamAttempt"
      ADD CONSTRAINT "ExamAttempt_examId_fkey"
      FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- FK ExamAttempt.studentId → Student.id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ExamAttempt_studentId_fkey') THEN
    ALTER TABLE "ExamAttempt"
      ADD CONSTRAINT "ExamAttempt_studentId_fkey"
      FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Index ExamAttempt(studentId, examId)
CREATE INDEX IF NOT EXISTS "ExamAttempt_studentId_examId_idx"
  ON "ExamAttempt"("studentId", "examId");

-- ================================================
-- SETUP COMPLETO DO BANCO DE DADOS - EXAM SYSTEM
-- ================================================
-- Execute este arquivo no pgAdmin para criar o banco de dados completo
-- Data de geração: 24/09/2025 11:16:26

-- ================================================
-- 1. EXTENSÕES NECESSÁRIAS
-- ================================================
-- Execute como superuser se necessário:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================
-- 2. CRIAR BANCO DE DADOS
-- ================================================
-- Execute isso no pgAdmin conectado ao postgres (não no exam_system):
CREATE DATABASE exam_system
  WITH ENCODING 'UTF8'
       LC_COLLATE = 'C'
       LC_CTYPE = 'C'
       TEMPLATE = template0;

-- IMPORTANTE: Após criar o banco, conecte-se ao 'exam_system' no pgAdmin
-- e execute o restante deste script (seções 3-6)

-- ================================================
-- 3. CRIAÇÃO DE TABELAS
-- ================================================
-- Tabela: users
DROP TABLE IF EXISTS "users" CASCADE;
CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" NOT NULL,
  "email" NOT NULL UNIQUE,
  "password" NOT NULL,
  "role" VARCHAR(50) DEFAULT 'teacher',
  "isActive" BOOLEAN DEFAULT true,
  "lastLogin",
  "passwordChangedAt",
  "passwordResetToken",
  "passwordResetExpires",
  "refreshToken" TEXT,
  "avatar",
  "phone",
  "bio" TEXT,
  "preferences" JSONB,
  "metadata" JSONB,
  "planId" UUID,
  "createdAt" NOT NULL,
  "updatedAt" NOT NULL
);

-- Tabela: plans
DROP TABLE IF EXISTS "plans" CASCADE;
CREATE TABLE "plans" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" NOT NULL UNIQUE,
  "displayName" NOT NULL,
  "description" TEXT,
  "price" DECIMAL(10,2) NOT NULL,
  "maxSubjects" INTEGER NOT NULL,
  "maxQuestions" INTEGER NOT NULL,
  "maxExams" INTEGER NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "features" JSONB,
  "createdAt" NOT NULL,
  "updatedAt" NOT NULL
);

-- Tabela: subjects
DROP TABLE IF EXISTS "subjects" CASCADE;
CREATE TABLE "subjects" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" NOT NULL,
  "description" TEXT,
  "color" DEFAULT '#3B82F6',
  "userId" UUID NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "metadata" JSONB,
  "createdAt" NOT NULL,
  "updatedAt" NOT NULL
);

-- Tabela: questions
DROP TABLE IF EXISTS "questions" CASCADE;
CREATE TABLE "questions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" NOT NULL,
  "text" TEXT NOT NULL,
  "type" VARCHAR(50) NOT NULL DEFAULT 'multiple_choice',
  "image",
  "alternatives" JSONB,
  "correctAnswer" INTEGER,
  "difficulty" VARCHAR(50) NOT NULL DEFAULT 'medium',
  "subjectId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "tags",
  "explanation" TEXT,
  "points" DECIMAL(10,2),
  "averageScore" DECIMAL(10,2),
  "timesUsed" INTEGER,
  "timesCorrect" INTEGER,
  "isActive" BOOLEAN DEFAULT true,
  "metadata" JSONB,
  "createdAt" NOT NULL,
  "updatedAt" NOT NULL
);

-- Tabela: exams
DROP TABLE IF EXISTS "exams" CASCADE;
CREATE TABLE "exams" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" NOT NULL,
  "description" TEXT,
  "subjectId" UUID,
  "subjects" JSONB,
  "userId" UUID NOT NULL,
  "examHeaderId" UUID NOT NULL,
  "selectedQuestions" JSONB,
  "totalQuestions" INTEGER NOT NULL,
  "easyQuestions" INTEGER,
  "mediumQuestions" INTEGER,
  "hardQuestions" INTEGER,
  "totalVariations" INTEGER,
  "totalPoints" DECIMAL(10,2),
  "timeLimit" INTEGER,
  "passingScore" DECIMAL(10,2),
  "instructions" TEXT,
  "allowReview" BOOLEAN DEFAULT true,
  "showCorrectAnswers" BOOLEAN DEFAULT true,
  "randomizeQuestions" BOOLEAN DEFAULT true,
  "randomizeAlternatives" BOOLEAN DEFAULT true,
  "isPublished" BOOLEAN DEFAULT false,
  "publishedAt",
  "expiresAt",
  "accessCode",
  "maxAttempts" INTEGER,
  "showResults" BOOLEAN DEFAULT true,
  "requireFullScreen" BOOLEAN DEFAULT false,
  "preventCopyPaste" BOOLEAN DEFAULT false,
  "shuffleAnswers" BOOLEAN DEFAULT true,
  "metadata" JSONB,
  "createdAt" NOT NULL,
  "updatedAt" NOT NULL
);

-- Tabela: exam_variations
DROP TABLE IF EXISTS "exam_variations" CASCADE;
CREATE TABLE "exam_variations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "examId" UUID NOT NULL,
  "variationNumber" INTEGER NOT NULL,
  "metadata" JSONB,
  "createdAt" NOT NULL,
  "updatedAt" NOT NULL
);

-- Tabela: exam_questions
DROP TABLE IF EXISTS "exam_questions" CASCADE;
CREATE TABLE "exam_questions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "examId" UUID NOT NULL UNIQUE,
  "variationId" UUID NOT NULL,
  "questionId" UUID NOT NULL UNIQUE,
  "questionOrder" INTEGER NOT NULL,
  "shuffledAlternatives" JSONB,
  "points" DECIMAL(10,2) NOT NULL,
  "metadata" JSONB,
  "createdAt" NOT NULL,
  "updatedAt" NOT NULL
);

-- Tabela: answers
DROP TABLE IF EXISTS "answers" CASCADE;
CREATE TABLE "answers" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID,
  "examId" UUID NOT NULL,
  "variationId" UUID NOT NULL,
  "studentName" NOT NULL,
  "studentId",
  "studentEmail",
  "answers" JSONB NOT NULL,
  "score" DECIMAL(10,2),
  "totalQuestions" INTEGER NOT NULL,
  "correctAnswers" INTEGER,
  "earnedPoints" DECIMAL(10,2),
  "totalPoints" DECIMAL(10,2),
  "timeSpent" INTEGER,
  "startedAt",
  "submittedAt" NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" VARCHAR(50) DEFAULT 'submitted',
  "isPassed" BOOLEAN DEFAULT false,
  "feedback" TEXT,
  "ipAddress",
  "userAgent" TEXT,
  "correctionMethod" DEFAULT 'automatic',
  "correctionData" JSONB,
  "metadata" JSONB,
  "createdAt" NOT NULL,
  "updatedAt" NOT NULL,
  "examVariationId" UUID,
  "questionId" UUID
);

-- ================================================
-- 4. FOREIGN KEYS E ÍNDICES
-- ================================================
-- FK: users.planId -> plans(id)
ALTER TABLE "users"
  ADD CONSTRAINT "fk_users_plan"
  FOREIGN KEY ("planId")
  REFERENCES plans(id)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- FK: questions.subjectId -> subjects(id)
ALTER TABLE "questions"
  ADD CONSTRAINT "fk_questions_subject"
  FOREIGN KEY ("subjectId")
  REFERENCES subjects(id)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- FK: questions.createdBy -> users(id)
ALTER TABLE "questions"
  ADD CONSTRAINT "fk_questions_created_by"
  FOREIGN KEY ("createdBy")
  REFERENCES users(id)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- FK: exams.subjectId -> subjects(id)
ALTER TABLE "exams"
  ADD CONSTRAINT "fk_exams_subject"
  FOREIGN KEY ("subjectId")
  REFERENCES subjects(id)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- FK: exams.createdBy -> users(id)
ALTER TABLE "exams"
  ADD CONSTRAINT "fk_exams_created_by"
  FOREIGN KEY ("createdBy")
  REFERENCES users(id)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- FK: exam_variations.examId -> exams(id)
ALTER TABLE "exam_variations"
  ADD CONSTRAINT "fk_exam_variations_exam"
  FOREIGN KEY ("examId")
  REFERENCES exams(id)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- FK: exam_questions.examVariationId -> exam_variations(id)
ALTER TABLE "exam_questions"
  ADD CONSTRAINT "fk_exam_questions_variation"
  FOREIGN KEY ("examVariationId")
  REFERENCES exam_variations(id)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- FK: exam_questions.questionId -> questions(id)
ALTER TABLE "exam_questions"
  ADD CONSTRAINT "fk_exam_questions_question"
  FOREIGN KEY ("questionId")
  REFERENCES questions(id)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- FK: answers.examVariationId -> exam_variations(id)
ALTER TABLE "answers"
  ADD CONSTRAINT "fk_answers_exam_variation"
  FOREIGN KEY ("examVariationId")
  REFERENCES exam_variations(id)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- FK: answers.questionId -> questions(id)
ALTER TABLE "answers"
  ADD CONSTRAINT "fk_answers_question"
  FOREIGN KEY ("questionId")
  REFERENCES questions(id)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- FK: user_plans.userId -> users(id)
ALTER TABLE "user_plans"
  ADD CONSTRAINT "fk_user_plans_user"
  FOREIGN KEY ("userId")
  REFERENCES users(id)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- FK: user_plans.planId -> plans(id)
ALTER TABLE "user_plans"
  ADD CONSTRAINT "fk_user_plans_plan"
  FOREIGN KEY ("planId")
  REFERENCES plans(id)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subjectId);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_exams_subject ON exams(subjectId);
CREATE INDEX IF NOT EXISTS idx_exam_variations_exam ON exam_variations(examId);
CREATE INDEX IF NOT EXISTS idx_answers_variation ON answers(examVariationId);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ================================================
-- 5. DADOS PADRÃO
-- ================================================
-- Inserir planos padrão
INSERT INTO plans (id, name, "displayName", description, price, "maxSubjects", "maxQuestions", "maxExams", "isActive", features, "createdAt", "updatedAt")
VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'free', 'Plano Gratuito', 'Plano gratuito com limitações básicas', 0.00, 2, 50, 3, true, '{"pdfExport": true, "basicSupport": true}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('550e8400-e29b-41d4-a716-446655440001', 'plus', 'Plano Plus', 'Plano completo com recursos ilimitados', 29.90, -1, -1, -1, true, '{"pdfExport": true, "advancedAnalytics": true, "prioritySupport": true, "customBranding": true}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- 6. SETUP CONCLUÍDO!
-- ================================================
--
-- ✅ EXECUTADO COM SUCESSO:
-- • Extensões UUID e criptografia habilitadas
-- • Banco de dados 'exam_system' criado
-- • 8 tabelas criadas: users, plans, subjects, questions, exams, exam_variations, exam_questions, answers
-- • Foreign keys e índices configurados
-- • Planos padrão inseridos (Free e Plus)
--
-- 🚀 PRÓXIMOS PASSOS:
-- 1. Configure o .env no backend:
--    DB_NAME=exam_system
--    DB_USER=seu_usuario
--    DB_PASSWORD=sua_senha
--    DB_HOST=localhost
--    DB_PORT=5432
-- 2. Execute: cd backend && npm run dev
-- 3. Acesse: http://localhost:5000/api/health
--
-- ⚠️  IMPORTANTE:
-- • npm run dev NÃO modificará as tabelas automaticamente
-- • Para mudanças no schema: modifique modelos + npm run db:generate-setup
-- • Execute este script novamente após mudanças nos modelos
--
-- 📅 Gerado automaticamente em: 2025-09-24T14:16:26.678Z
-- ================================================
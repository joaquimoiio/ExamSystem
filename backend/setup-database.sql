-- ================================================
-- SETUP COMPLETO DO BANCO DE DADOS - EXAM SYSTEM
-- ================================================
-- Execute este arquivo no pgAdmin para criar o banco de dados completo
-- Data: $(date)

-- 1. CRIAR BANCO DE DADOS (execute isso primeiro)
-- ================================================
CREATE DATABASE exam_system;

-- 2. CONECTAR AO BANCO exam_system e executar o restante
-- ================================================
-- No pgAdmin: clique com botão direito no banco exam_system > Query Tool
-- E execute o script abaixo:

-- Criar ENUM types primeiro
CREATE TYPE enum_users_role AS ENUM ('admin', 'teacher');
CREATE TYPE enum_questions_type AS ENUM ('multiple_choice', 'essay');
CREATE TYPE enum_questions_difficulty AS ENUM ('easy', 'medium', 'hard');

-- ================================================
-- TABELA: plans
-- ================================================
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    "displayName" VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "maxSubjects" INTEGER NOT NULL DEFAULT -1,
    "maxQuestions" INTEGER NOT NULL DEFAULT -1,
    "maxExams" INTEGER NOT NULL DEFAULT -1,
    "isActive" BOOLEAN DEFAULT true,
    features JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para a tabela plans
CREATE UNIQUE INDEX plans_name ON plans (name);
CREATE INDEX plans_is_active ON plans ("isActive");
CREATE INDEX plans_price ON plans (price);

-- ================================================
-- TABELA: users
-- ================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role enum_users_role DEFAULT 'teacher',
    "isActive" BOOLEAN DEFAULT true,
    "lastLogin" TIMESTAMP WITH TIME ZONE,
    "passwordChangedAt" TIMESTAMP WITH TIME ZONE,
    "passwordResetToken" VARCHAR(255),
    "passwordResetExpires" TIMESTAMP WITH TIME ZONE,
    "refreshToken" TEXT,
    avatar VARCHAR(255),
    phone VARCHAR(20),
    bio TEXT,
    preferences JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    "planId" UUID REFERENCES plans(id) ON DELETE SET NULL ON UPDATE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para a tabela users
CREATE UNIQUE INDEX users_email ON users (email);
CREATE INDEX users_role ON users (role);
CREATE INDEX users_is_active ON users ("isActive");
CREATE INDEX users_created_at ON users ("createdAt");

-- ================================================
-- TABELA: subjects
-- ================================================
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    "isActive" BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para a tabela subjects
CREATE INDEX subjects_user_id ON subjects ("userId");
CREATE INDEX subjects_is_active ON subjects ("isActive");

-- ================================================
-- TABELA: questions
-- ================================================
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    text TEXT NOT NULL,
    type enum_questions_type NOT NULL DEFAULT 'multiple_choice',
    image VARCHAR(500),
    alternatives JSONB,
    "correctAnswer" INTEGER,
    difficulty enum_questions_difficulty NOT NULL DEFAULT 'medium',
    "subjectId" UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    tags VARCHAR(255)[] DEFAULT ARRAY[]::VARCHAR(255)[],
    explanation TEXT,
    points DECIMAL(3,1) DEFAULT 1,
    "averageScore" DECIMAL(4,2) DEFAULT NULL,
    "timesUsed" INTEGER DEFAULT 0,
    "timesCorrect" INTEGER DEFAULT 0,
    "isActive" BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para a tabela questions
CREATE INDEX questions_subject_id ON questions ("subjectId");
CREATE INDEX questions_user_id ON questions ("userId");
CREATE INDEX questions_difficulty ON questions (difficulty);
CREATE INDEX questions_type ON questions (type);
CREATE INDEX questions_is_active ON questions ("isActive");

-- ================================================
-- TABELA: exam_headers
-- ================================================
CREATE TABLE exam_headers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "schoolName" VARCHAR(200) NOT NULL,
    "subjectName" VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    "evaluationCriteria" TEXT,
    instructions TEXT,
    "timeLimit" INTEGER,
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    "isDefault" BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para a tabela exam_headers
CREATE INDEX exam_headers_user_id ON exam_headers ("userId");
CREATE INDEX exam_headers_is_default ON exam_headers ("isDefault");

-- ================================================
-- TABELA: exams
-- ================================================
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    "subjectId" UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    "examHeaderId" UUID REFERENCES exam_headers(id) ON DELETE SET NULL ON UPDATE CASCADE,
    duration INTEGER DEFAULT 60,
    variations INTEGER DEFAULT 1,
    "shuffleQuestions" BOOLEAN DEFAULT true,
    "shuffleAlternatives" BOOLEAN DEFAULT true,
    "showResults" BOOLEAN DEFAULT true,
    "allowReview" BOOLEAN DEFAULT false,
    "isPublished" BOOLEAN DEFAULT false,
    "publishedAt" TIMESTAMP WITH TIME ZONE,
    "accessCode" VARCHAR(10),
    "startDate" TIMESTAMP WITH TIME ZONE,
    "endDate" TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para a tabela exams
CREATE INDEX exams_subject_id ON exams ("subjectId");
CREATE INDEX exams_user_id ON exams ("userId");
CREATE INDEX exams_exam_header_id ON exams ("examHeaderId");
CREATE INDEX exams_is_published ON exams ("isPublished");
CREATE INDEX exams_access_code ON exams ("accessCode");

-- ================================================
-- TABELA: exam_variations
-- ================================================
CREATE TABLE exam_variations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "examId" UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE ON UPDATE CASCADE,
    "variationNumber" INTEGER NOT NULL,
    "qrCode" TEXT,
    "qrCodeData" JSONB,
    metadata JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para a tabela exam_variations
CREATE INDEX exam_variations_exam_id ON exam_variations ("examId");
CREATE INDEX exam_variations_variation_number ON exam_variations ("variationNumber");
CREATE UNIQUE INDEX exam_variations_exam_variation ON exam_variations ("examId", "variationNumber");

-- ================================================
-- TABELA: exam_questions (junction table)
-- ================================================
CREATE TABLE exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "examId" UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE ON UPDATE CASCADE,
    "questionId" UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    "variationId" UUID REFERENCES exam_variations(id) ON DELETE CASCADE ON UPDATE CASCADE,
    "questionOrder" INTEGER NOT NULL,
    "alternativeOrder" INTEGER[],
    metadata JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para a tabela exam_questions
CREATE INDEX exam_questions_exam_id ON exam_questions ("examId");
CREATE INDEX exam_questions_question_id ON exam_questions ("questionId");
CREATE INDEX exam_questions_variation_id ON exam_questions ("variationId");
CREATE UNIQUE INDEX exam_questions_exam_question ON exam_questions ("examId", "questionId");

-- ================================================
-- TABELA: answers
-- ================================================
CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "studentName" VARCHAR(100) NOT NULL,
    "studentEmail" VARCHAR(255),
    "studentId" VARCHAR(50),
    "examId" UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE ON UPDATE CASCADE,
    "examVariationId" UUID REFERENCES exam_variations(id) ON DELETE CASCADE ON UPDATE CASCADE,
    "questionId" UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    "selectedAnswer" INTEGER,
    "answerText" TEXT,
    "isCorrect" BOOLEAN,
    points DECIMAL(4,2),
    "answeredAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "timeSpent" INTEGER,
    metadata JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para a tabela answers
CREATE INDEX answers_exam_id ON answers ("examId");
CREATE INDEX answers_exam_variation_id ON answers ("examVariationId");
CREATE INDEX answers_question_id ON answers ("questionId");
CREATE INDEX answers_student_email ON answers ("studentEmail");
CREATE INDEX answers_student_id ON answers ("studentId");
CREATE INDEX answers_answered_at ON answers ("answeredAt");

-- ================================================
-- 3. INSERIR DADOS PADRÃO
-- ================================================

-- Inserir planos padrão
INSERT INTO plans (id, name, "displayName", description, price, "maxSubjects", "maxQuestions", "maxExams", "isActive", features) VALUES
(
    '550e8400-e29b-41d4-a716-446655440000',
    'free',
    'Plano Free',
    'Plano gratuito com limitações básicas',
    0.00,
    2,
    10,
    1,
    true,
    '{"pdfExport": true, "basicSupport": true}'
),
(
    '550e8400-e29b-41d4-a716-446655440001',
    'plus',
    'Plano Plus',
    'Plano completo com recursos ilimitados',
    19.99,
    -1,
    -1,
    -1,
    true,
    '{"pdfExport": true, "advancedAnalytics": true, "prioritySupport": true, "customBranding": true}'
);

-- ================================================
-- 4. CRIAR TRIGGERS PARA UPDATED_AT AUTOMÁTICO
-- ================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exam_headers_updated_at BEFORE UPDATE ON exam_headers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exam_variations_updated_at BEFORE UPDATE ON exam_variations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exam_questions_updated_at BEFORE UPDATE ON exam_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_answers_updated_at BEFORE UPDATE ON answers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 5. CONCEDER PERMISSÕES AO USUÁRIO
-- ================================================

-- Criar usuário para a aplicação (substitua a senha por uma mais segura)
CREATE USER exam_user WITH PASSWORD 'root';

-- Conceder permissões necessárias
GRANT CONNECT ON DATABASE exam_system TO exam_user;
GRANT USAGE ON SCHEMA public TO exam_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO exam_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO exam_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO exam_user;

-- Garantir que o usuário tenha permissões em futuras tabelas
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO exam_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO exam_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO exam_user;

-- ================================================
-- SETUP CONCLUÍDO!
-- ================================================
--
-- ✅ Banco de dados 'exam_system' criado
-- ✅ Todas as tabelas criadas com relacionamentos
-- ✅ Índices criados para performance
-- ✅ Planos padrão inseridos (Free e Plus)
-- ✅ Triggers para updated_at configurados
-- ✅ Usuário 'exam_user' criado com permissões
--
-- 🔧 PRÓXIMOS PASSOS:
-- 1. Configure o arquivo .env no backend com as credenciais
-- 2. Execute: npm start (o Node.js apenas conectará, não criará tabelas)
-- 3. Para popular com dados de teste, execute: node scripts/seedPlans.js
--
-- ================================================
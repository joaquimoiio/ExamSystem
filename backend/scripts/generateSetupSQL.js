const fs = require('fs');
const path = require('path');
const { sequelize } = require('../src/models');

/**
 * Script para gerar o arquivo setup-database.sql baseado nos modelos do Sequelize
 * Execute: npm run db:generate-setup
 */

async function generateSetupSQL() {
  try {
    console.log('🔄 Gerando setup-database.sql baseado nos modelos...');

    // Conectar ao banco para validar conexão
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados');

    const queries = [];

    // Cabeçalho
    queries.push(`-- ================================================`);
    queries.push(`-- SETUP COMPLETO DO BANCO DE DADOS - EXAM SYSTEM`);
    queries.push(`-- ================================================`);
    queries.push(`-- Execute este arquivo no pgAdmin para criar o banco de dados completo`);
    queries.push(`-- Data de geração: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`);
    queries.push('');

    // Extensões
    queries.push(`-- ================================================`);
    queries.push(`-- 1. EXTENSÕES NECESSÁRIAS`);
    queries.push(`-- ================================================`);
    queries.push(`-- Execute como superuser se necessário:`);
    queries.push(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    queries.push(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    queries.push('');

    // Criar database
    queries.push(`-- ================================================`);
    queries.push(`-- 2. CRIAR BANCO DE DADOS`);
    queries.push(`-- ================================================`);
    queries.push(`-- Execute isso no pgAdmin conectado ao postgres (não no exam_system):`);
    queries.push(`CREATE DATABASE exam_system`);
    queries.push(`  WITH ENCODING 'UTF8'`);
    queries.push(`       LC_COLLATE = 'C'`);
    queries.push(`       LC_CTYPE = 'C'`);
    queries.push(`       TEMPLATE = template0;`);
    queries.push('');
    queries.push(`-- IMPORTANTE: Após criar o banco, conecte-se ao 'exam_system' no pgAdmin`);
    queries.push(`-- e execute o restante deste script (seções 3-6)`);
    queries.push('');

    // Gerar DDL das tabelas
    queries.push(`-- ================================================`);
    queries.push(`-- 3. CRIAÇÃO DE TABELAS`);
    queries.push(`-- ================================================`);

    console.log('🔍 Analisando modelos Sequelize...');

    // Obter todos os modelos
    const models = Object.keys(sequelize.models);
    const tablesCreated = [];

    // Ordem de criação (tabelas sem FK primeiro)
    const tableOrder = [
      'users',
      'plans',
      'subjects',
      'questions',
      'exams',
      'exam_variations',
      'exam_questions',
      'answers',
      'user_plans'
    ];

    // Gerar CREATE TABLE para cada modelo
    for (const tableName of tableOrder) {
      const model = Object.values(sequelize.models).find(m => m.tableName === tableName);
      if (!model) continue;

      queries.push(`-- Tabela: ${tableName}`);
      queries.push(`DROP TABLE IF EXISTS "${tableName}" CASCADE;`);

      const attributes = model.rawAttributes;
      const columns = [];

      Object.keys(attributes).forEach(attrName => {
        const attr = attributes[attrName];
        let columnDef = `  "${attrName}"`;

        // Mapear tipos do Sequelize para PostgreSQL
        const type = attr.type;
        if (type.toString().includes('UUID')) {
          columnDef += ' UUID';
        } else if (type.toString().includes('STRING')) {
          const length = type._length || 255;
          columnDef += ` VARCHAR(${length})`;
        } else if (type.toString().includes('TEXT')) {
          columnDef += ' TEXT';
        } else if (type.toString().includes('INTEGER')) {
          if (attr.autoIncrement) {
            columnDef += ' SERIAL';
          } else {
            columnDef += ' INTEGER';
          }
        } else if (type.toString().includes('DECIMAL')) {
          columnDef += ' DECIMAL(10,2)';
        } else if (type.toString().includes('BOOLEAN')) {
          columnDef += ' BOOLEAN';
        } else if (type.toString().includes('DATE')) {
          columnDef += ' TIMESTAMP WITH TIME ZONE';
        } else if (type.toString().includes('JSONB')) {
          columnDef += ' JSONB';
        } else if (type.toString().includes('JSON')) {
          columnDef += ' JSON';
        } else if (type.toString().includes('ENUM')) {
          // Para ENUMs, usar VARCHAR com CHECK constraint
          columnDef += ' VARCHAR(50)';
        }

        // NOT NULL
        if (attr.allowNull === false) {
          columnDef += ' NOT NULL';
        }

        // Primary Key
        if (attr.primaryKey) {
          columnDef += ' PRIMARY KEY';
        }

        // Unique
        if (attr.unique) {
          columnDef += ' UNIQUE';
        }

        // Default values
        if (attr.defaultValue !== undefined) {
          if (attr.defaultValue === true || attr.defaultValue === false) {
            columnDef += ` DEFAULT ${attr.defaultValue}`;
          } else if (typeof attr.defaultValue === 'string') {
            columnDef += ` DEFAULT '${attr.defaultValue}'`;
          } else if (attr.defaultValue && attr.defaultValue.toString().includes('NOW')) {
            columnDef += ' DEFAULT CURRENT_TIMESTAMP';
          } else if (attr.defaultValue && attr.defaultValue.toString().includes('UUIDV4')) {
            columnDef += ' DEFAULT gen_random_uuid()';
          }
        }

        columns.push(columnDef);
      });

      queries.push(`CREATE TABLE "${tableName}" (`);
      queries.push(columns.join(',\n'));
      queries.push(');');
      queries.push('');

      tablesCreated.push(tableName);
    }

    // Foreign Keys
    queries.push(`-- ================================================`);
    queries.push(`-- 4. FOREIGN KEYS E ÍNDICES`);
    queries.push(`-- ================================================`);

    // Definir FKs manualmente baseado na estrutura conhecida
    const foreignKeys = [
      {
        table: 'users',
        column: 'planId',
        references: 'plans(id)',
        name: 'fk_users_plan'
      },
      {
        table: 'questions',
        column: 'subjectId',
        references: 'subjects(id)',
        name: 'fk_questions_subject'
      },
      {
        table: 'questions',
        column: 'createdBy',
        references: 'users(id)',
        name: 'fk_questions_created_by'
      },
      {
        table: 'exams',
        column: 'subjectId',
        references: 'subjects(id)',
        name: 'fk_exams_subject'
      },
      {
        table: 'exams',
        column: 'createdBy',
        references: 'users(id)',
        name: 'fk_exams_created_by'
      },
      {
        table: 'exam_variations',
        column: 'examId',
        references: 'exams(id)',
        name: 'fk_exam_variations_exam'
      },
      {
        table: 'exam_questions',
        column: 'examVariationId',
        references: 'exam_variations(id)',
        name: 'fk_exam_questions_variation'
      },
      {
        table: 'exam_questions',
        column: 'questionId',
        references: 'questions(id)',
        name: 'fk_exam_questions_question'
      },
      {
        table: 'answers',
        column: 'examVariationId',
        references: 'exam_variations(id)',
        name: 'fk_answers_exam_variation'
      },
      {
        table: 'answers',
        column: 'questionId',
        references: 'questions(id)',
        name: 'fk_answers_question'
      },
      {
        table: 'user_plans',
        column: 'userId',
        references: 'users(id)',
        name: 'fk_user_plans_user'
      },
      {
        table: 'user_plans',
        column: 'planId',
        references: 'plans(id)',
        name: 'fk_user_plans_plan'
      }
    ];

    foreignKeys.forEach(fk => {
      queries.push(`-- FK: ${fk.table}.${fk.column} -> ${fk.references}`);
      queries.push(`ALTER TABLE "${fk.table}"`);
      queries.push(`  ADD CONSTRAINT "${fk.name}"`);
      queries.push(`  FOREIGN KEY ("${fk.column}")`);;
      queries.push(`  REFERENCES ${fk.references}`);
      queries.push(`  ON DELETE SET NULL ON UPDATE CASCADE;`);
      queries.push('');
    });

    // Índices importantes
    queries.push(`-- Índices para performance`);
    queries.push(`CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subjectId);`);
    queries.push(`CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);`);
    queries.push(`CREATE INDEX IF NOT EXISTS idx_exams_subject ON exams(subjectId);`);
    queries.push(`CREATE INDEX IF NOT EXISTS idx_exam_variations_exam ON exam_variations(examId);`);
    queries.push(`CREATE INDEX IF NOT EXISTS idx_answers_variation ON answers(examVariationId);`);
    queries.push(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
    queries.push('');

    // Dados padrão
    queries.push(`-- ================================================`);
    queries.push(`-- 5. DADOS PADRÃO`);
    queries.push(`-- ================================================`);

    // Planos padrão
    queries.push(`-- Inserir planos padrão`);
    queries.push(`INSERT INTO plans (id, name, "displayName", description, price, "maxSubjects", "maxQuestions", "maxExams", "isActive", features, "createdAt", "updatedAt")`);
    queries.push(`VALUES`);
    queries.push(`  ('550e8400-e29b-41d4-a716-446655440000', 'free', 'Plano Gratuito', 'Plano gratuito com limitações básicas', 0.00, 2, 50, 3, true, '{"pdfExport": true, "basicSupport": true}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),`);
    queries.push(`  ('550e8400-e29b-41d4-a716-446655440001', 'plus', 'Plano Plus', 'Plano completo com recursos ilimitados', 29.90, -1, -1, -1, true, '{"pdfExport": true, "advancedAnalytics": true, "prioritySupport": true, "customBranding": true}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`);
    queries.push(`ON CONFLICT (id) DO NOTHING;`);
    queries.push('');


    // Rodapé com instruções
    queries.push(`-- ================================================`);
    queries.push(`-- 6. SETUP CONCLUÍDO!`);
    queries.push(`-- ================================================`);
    queries.push(`--`);
    queries.push(`-- ✅ EXECUTADO COM SUCESSO:`);
    queries.push(`-- • Extensões UUID e criptografia habilitadas`);
    queries.push(`-- • Banco de dados 'exam_system' criado`);
    queries.push(`-- • ${tablesCreated.length} tabelas criadas: ${tablesCreated.join(', ')}`);
    queries.push(`-- • Foreign keys e índices configurados`);
    queries.push(`-- • Planos padrão inseridos (Free e Plus)`);
    queries.push(`--`);
    queries.push(`-- 🚀 PRÓXIMOS PASSOS:`);
    queries.push(`-- 1. Configure o .env no backend:`);
    queries.push(`--    DB_NAME=exam_system`);
    queries.push(`--    DB_USER=seu_usuario`);
    queries.push(`--    DB_PASSWORD=sua_senha`);
    queries.push(`--    DB_HOST=localhost`);
    queries.push(`--    DB_PORT=5432`);
    queries.push(`-- 2. Execute: cd backend && npm run dev`);
    queries.push(`-- 3. Acesse: http://localhost:5000/api/health`);
    queries.push(`--`);
    queries.push(`-- ⚠️  IMPORTANTE:`);
    queries.push(`-- • npm run dev NÃO modificará as tabelas automaticamente`);
    queries.push(`-- • Para mudanças no schema: modifique modelos + npm run db:generate-setup`);
    queries.push(`-- • Execute este script novamente após mudanças nos modelos`);
    queries.push(`--`);
    queries.push(`-- 📅 Gerado automaticamente em: ${new Date().toISOString()}`);
    queries.push(`-- ================================================`);

    // Escrever arquivo
    const setupPath = path.join(__dirname, '..', 'setup-database.sql');
    const sqlContent = queries.join('\n');

    // Fazer backup se existir
    if (fs.existsSync(setupPath)) {
      const backupPath = setupPath.replace('.sql', `.backup.${Date.now()}.sql`);
      fs.copyFileSync(setupPath, backupPath);
      console.log(`📋 Backup criado: ${path.basename(backupPath)}`);
    }

    fs.writeFileSync(setupPath, sqlContent, 'utf8');

    console.log('✅ setup-database.sql gerado com sucesso!');
    console.log(`📁 Local: ${setupPath}`);
    console.log(`📊 ${tablesCreated.length} tabelas mapeadas`);
    console.log(`📝 ${queries.length} linhas de SQL geradas`);

    await sequelize.close();
    console.log('🎉 Processo concluído!');

  } catch (error) {
    console.error('❌ Erro ao gerar setup-database.sql:', error.message);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  generateSetupSQL()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = generateSetupSQL;
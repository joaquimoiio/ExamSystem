const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// Configuração do banco de dados com fallback
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'exam_system',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    // SSL config para produção se necessário
    ...(process.env.NODE_ENV === 'production' && {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    })
  }
};

console.log('🔧 Configuração do banco:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  username: dbConfig.username,
  hasPassword: !!dbConfig.password
});

// Criar instância do Sequelize
const sequelize = new Sequelize(dbConfig);

// Objeto para armazenar modelos
const db = {
  sequelize,
  Sequelize
};

// Função para tentar importar modelos com fallback
function tryImportModel(modelName, modelPath) {
  try {
    const model = require(modelPath)(sequelize, Sequelize.DataTypes);
    db[modelName] = model;
    console.log(`✅ Modelo ${modelName} carregado com sucesso`);
    return model;
  } catch (error) {
    console.warn(`⚠️ Falha ao carregar modelo ${modelName}:`, error.message);
    
    // Criar modelo básico de fallback
    const fallbackModel = {
      name: modelName,
      findAll: () => Promise.resolve([]),
      findByPk: () => Promise.resolve(null),
      create: (data) => Promise.resolve({ id: Date.now(), ...data }),
      update: (data) => Promise.resolve([1]),
      destroy: () => Promise.resolve(1),
      count: () => Promise.resolve(0),
      findAndCountAll: () => Promise.resolve({ count: 0, rows: [] })
    };
    
    db[modelName] = fallbackModel;
    console.log(`🔄 Modelo fallback ${modelName} criado`);
    return fallbackModel;
  }
}

// Lista de modelos para importar
const models = [
  { name: 'User', path: './User' },
  { name: 'Subject', path: './Subject' },
  { name: 'Question', path: './Question' },
  { name: 'Exam', path: './Exam' },
  { name: 'ExamVariation', path: './ExamVariation' },
  { name: 'ExamQuestion', path: './ExamQuestion' },
  { name: 'Answer', path: './Answer' },
  { name: 'ExamHeader', path: './ExamHeader' }
];

// Importar todos os modelos
models.forEach(({ name, path }) => {
  tryImportModel(name, path);
});

// Configurar associações se os modelos existirem
try {
  if (db.User && db.Subject) {
    // User has many Subjects
    db.User.hasMany(db.Subject, {
      foreignKey: 'userId',
      as: 'subjects'
    });
    db.Subject.belongsTo(db.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  }

  if (db.Subject && db.Question) {
    // Subject has many Questions
    db.Subject.hasMany(db.Question, {
      foreignKey: 'subjectId',
      as: 'questions'
    });
    db.Question.belongsTo(db.Subject, {
      foreignKey: 'subjectId',
      as: 'subject'
    });
  }

  if (db.User && db.Exam) {
    // User has many Exams
    db.User.hasMany(db.Exam, {
      foreignKey: 'userId',
      as: 'exams'
    });
    db.Exam.belongsTo(db.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  }

  if (db.Subject && db.Exam) {
    // Subject has many Exams
    db.Subject.hasMany(db.Exam, {
      foreignKey: 'subjectId',
      as: 'exams'
    });
    db.Exam.belongsTo(db.Subject, {
      foreignKey: 'subjectId',
      as: 'subject'
    });
  }

  if (db.Exam && db.ExamVariation) {
    // Exam has many ExamVariations
    db.Exam.hasMany(db.ExamVariation, {
      foreignKey: 'examId',
      as: 'variations'
    });
    db.ExamVariation.belongsTo(db.Exam, {
      foreignKey: 'examId',
      as: 'exam'
    });
  }

  if (db.Exam && db.Question && db.ExamQuestion) {
    // Many-to-many: Exam and Question through ExamQuestion
    db.Exam.belongsToMany(db.Question, {
      through: db.ExamQuestion,
      foreignKey: 'examId',
      otherKey: 'questionId',
      as: 'questions'
    });
    db.Question.belongsToMany(db.Exam, {
      through: db.ExamQuestion,
      foreignKey: 'questionId',
      otherKey: 'examId',
      as: 'exams'
    });
  }

  if (db.ExamVariation && db.Answer) {
    // ExamVariation has many Answers
    db.ExamVariation.hasMany(db.Answer, {
      foreignKey: 'examVariationId',
      as: 'answers'
    });
    db.Answer.belongsTo(db.ExamVariation, {
      foreignKey: 'examVariationId',
      as: 'examVariation'
    });
  }

  if (db.Question && db.Answer) {
    // Question has many Answers
    db.Question.hasMany(db.Answer, {
      foreignKey: 'questionId',
      as: 'answers'
    });
    db.Answer.belongsTo(db.Question, {
      foreignKey: 'questionId',
      as: 'question'
    });
  }

  if (db.User && db.ExamHeader) {
    // User has many ExamHeaders
    db.User.hasMany(db.ExamHeader, {
      foreignKey: 'userId',
      as: 'examHeaders'
    });
    db.ExamHeader.belongsTo(db.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  }

  if (db.Exam && db.ExamHeader) {
    // Exam belongs to ExamHeader (optional)
    db.Exam.belongsTo(db.ExamHeader, {
      foreignKey: 'examHeaderId',
      as: 'examHeader'
    });
    db.ExamHeader.hasMany(db.Exam, {
      foreignKey: 'examHeaderId',
      as: 'exams'
    });
  }

  if (db.ExamQuestion && db.Question) {
    // ExamQuestion belongs to Question
    db.ExamQuestion.belongsTo(db.Question, {
      foreignKey: 'questionId',
      as: 'question'
    });
    db.Question.hasMany(db.ExamQuestion, {
      foreignKey: 'questionId',
      as: 'examQuestions'
    });
  }

  if (db.ExamQuestion && db.ExamVariation) {
    // ExamQuestion belongs to ExamVariation
    db.ExamQuestion.belongsTo(db.ExamVariation, {
      foreignKey: 'variationId',
      as: 'variation'
    });
    db.ExamVariation.hasMany(db.ExamQuestion, {
      foreignKey: 'variationId',
      as: 'examQuestions'
    });
  }

  if (db.ExamQuestion && db.Exam) {
    // ExamQuestion belongs to Exam
    db.ExamQuestion.belongsTo(db.Exam, {
      foreignKey: 'examId',
      as: 'exam'
    });
    db.Exam.hasMany(db.ExamQuestion, {
      foreignKey: 'examId',
      as: 'examQuestions'
    });
  }

  console.log('✅ Associações dos modelos configuradas');
} catch (error) {
  console.warn('⚠️ Erro ao configurar associações:', error.message);
}

// Função para testar conexão com o banco
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco de dados:', error.message);
    return false;
  }
}

// Função para sincronizar modelos
async function syncModels(force = false) {
  try {
    await sequelize.sync({ force, alter: !force });
    console.log('✅ Modelos sincronizados com o banco de dados');
    return true;
  } catch (error) {
    console.error('❌ Erro ao sincronizar modelos:', error.message);
    return false;
  }
}

// Adicionar funções utilitárias ao objeto db
db.testConnection = testConnection;
db.syncModels = syncModels;

// Health check para o banco
db.healthCheck = async () => {
  try {
    await sequelize.authenticate();
    const stats = await sequelize.query('SELECT 1+1 AS result', { type: Sequelize.QueryTypes.SELECT });
    return {
      status: 'healthy',
      connected: true,
      timestamp: new Date().toISOString(),
      test_query: stats[0]?.result === 2
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      connected: false,
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
};

module.exports = db;
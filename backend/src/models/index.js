const { Sequelize } = require('sequelize');
const config = require('../config/database');

// Determinar o ambiente atual
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Criar instância do Sequelize com a configuração correta
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    dialectOptions: dbConfig.dialectOptions,
    timezone: dbConfig.timezone,
    pool: dbConfig.pool,
    logging: dbConfig.logging,
  }
);

// Import models
const User = require('./User')(sequelize, Sequelize.DataTypes);
const Subject = require('./Subject')(sequelize, Sequelize.DataTypes);
const Question = require('./Question')(sequelize, Sequelize.DataTypes);
const Exam = require('./Exam')(sequelize, Sequelize.DataTypes);
const ExamVariation = require('./ExamVariation')(sequelize, Sequelize.DataTypes);
const ExamQuestion = require('./ExamQuestion')(sequelize, Sequelize.DataTypes);
const Answer = require('./Answer')(sequelize, Sequelize.DataTypes);

// Define associations
const models = {
  User,
  Subject,
  Question,
  Exam,
  ExamVariation,
  ExamQuestion,
  Answer
};

// User associations
User.hasMany(Subject, { foreignKey: 'userId', as: 'subjects' });
User.hasMany(Question, { foreignKey: 'userId', as: 'questions' });
User.hasMany(Exam, { foreignKey: 'userId', as: 'exams' });
User.hasMany(Answer, { foreignKey: 'userId', as: 'answers' });

// Subject associations
Subject.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Subject.hasMany(Question, { foreignKey: 'subjectId', as: 'questions' });
Subject.hasMany(Exam, { foreignKey: 'subjectId', as: 'exams' });

// Question associations
Question.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Question.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });
Question.belongsToMany(ExamVariation, { 
  through: ExamQuestion, 
  foreignKey: 'questionId',
  otherKey: 'variationId',
  as: 'examVariations'
});

// Exam associations
Exam.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Exam.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });
Exam.hasMany(ExamVariation, { foreignKey: 'examId', as: 'variations' });
Exam.hasMany(Answer, { foreignKey: 'examId', as: 'answers' });

// ExamVariation associations
ExamVariation.belongsTo(Exam, { foreignKey: 'examId', as: 'exam' });
ExamVariation.belongsToMany(Question, { 
  through: ExamQuestion, 
  foreignKey: 'variationId',
  otherKey: 'questionId',
  as: 'questions'
});
ExamVariation.hasMany(Answer, { foreignKey: 'variationId', as: 'answers' });

// ExamQuestion associations
ExamQuestion.belongsTo(Exam, { foreignKey: 'examId', as: 'exam' });
ExamQuestion.belongsTo(ExamVariation, { foreignKey: 'variationId', as: 'variation' });
ExamQuestion.belongsTo(Question, { foreignKey: 'questionId', as: 'question' });

// Answer associations
Answer.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Answer.belongsTo(Exam, { foreignKey: 'examId', as: 'exam' });
Answer.belongsTo(ExamVariation, { foreignKey: 'variationId', as: 'variation' });
Answer.belongsTo(Question, { foreignKey: 'questionId', as: 'question' });

// Executar método associate se existir
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = {
  sequelize,
  Sequelize,
  ...models
};
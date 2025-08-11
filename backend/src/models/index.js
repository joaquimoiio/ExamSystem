const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Initialize Sequelize
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
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
const db = {
  User,
  Subject,
  Question,
  Exam,
  ExamVariation,
  ExamQuestion,
  Answer,
  sequelize,
  Sequelize
};

// User associations
User.hasMany(Subject, {
  foreignKey: 'userId',
  as: 'subjects',
  onDelete: 'CASCADE'
});

User.hasMany(Question, {
  foreignKey: 'userId',
  as: 'questions',
  onDelete: 'CASCADE'
});

User.hasMany(Exam, {
  foreignKey: 'userId',
  as: 'exams',
  onDelete: 'CASCADE'
});

// Subject associations
Subject.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Subject.hasMany(Question, {
  foreignKey: 'subjectId',
  as: 'questions',
  onDelete: 'CASCADE'
});

// Question associations
Question.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Question.belongsTo(Subject, {
  foreignKey: 'subjectId',
  as: 'subject'
});

Question.belongsToMany(Exam, {
  through: ExamQuestion,
  foreignKey: 'questionId',
  otherKey: 'examId',
  as: 'exams'
});

// Exam associations
Exam.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Exam.belongsToMany(Question, {
  through: ExamQuestion,
  foreignKey: 'examId',
  otherKey: 'questionId',
  as: 'questions'
});

Exam.hasMany(ExamVariation, {
  foreignKey: 'examId',
  as: 'variations',
  onDelete: 'CASCADE'
});

Exam.hasMany(Answer, {
  foreignKey: 'examId',
  as: 'answers',
  onDelete: 'CASCADE'
});

// ExamVariation associations
ExamVariation.belongsTo(Exam, {
  foreignKey: 'examId',
  as: 'exam'
});

ExamVariation.hasMany(Answer, {
  foreignKey: 'examVariationId',
  as: 'answers',
  onDelete: 'CASCADE'
});

// ExamQuestion associations (junction table)
ExamQuestion.belongsTo(Exam, {
  foreignKey: 'examId',
  as: 'exam'
});

ExamQuestion.belongsTo(Question, {
  foreignKey: 'questionId',
  as: 'question'
});

// Answer associations
Answer.belongsTo(Exam, {
  foreignKey: 'examId',
  as: 'exam'
});

Answer.belongsTo(ExamVariation, {
  foreignKey: 'examVariationId',
  as: 'examVariation'
});

module.exports = db;
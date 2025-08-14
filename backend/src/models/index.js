const { Sequelize } = require('sequelize');
const config = require('../config/database');

// Determine environment
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Create Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    dialectOptions: dbConfig.dialectOptions || {},
    timezone: dbConfig.timezone || '-03:00',
    pool: dbConfig.pool || {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: dbConfig.logging
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

// Store models in object
const models = {
  User,
  Subject,
  Question,
  Exam,
  ExamVariation,
  ExamQuestion,
  Answer
};

// Define associations
setupAssociations();

function setupAssociations() {
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
  
  User.hasMany(Answer, { 
    foreignKey: 'userId', 
    as: 'answers',
    onDelete: 'SET NULL'
  });

  // Subject associations
  Subject.belongsTo(User, { 
    foreignKey: 'userId', 
    as: 'user' 
  });
  
  Subject.hasMany(Question, { 
    foreignKey: 'subjectId', 
    as: 'questions',
    onDelete: 'RESTRICT'
  });
  
  Subject.hasMany(Exam, { 
    foreignKey: 'subjectId', 
    as: 'exams',
    onDelete: 'RESTRICT'
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
  
  Question.belongsToMany(ExamVariation, { 
    through: ExamQuestion, 
    foreignKey: 'questionId',
    otherKey: 'variationId',
    as: 'examVariations'
  });

  // Exam associations
  Exam.belongsTo(User, { 
    foreignKey: 'userId', 
    as: 'user' 
  });
  
  Exam.belongsTo(Subject, { 
    foreignKey: 'subjectId', 
    as: 'subject' 
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
  
  ExamVariation.belongsToMany(Question, { 
    through: ExamQuestion, 
    foreignKey: 'variationId',
    otherKey: 'questionId',
    as: 'questions'
  });
  
  ExamVariation.hasMany(Answer, { 
    foreignKey: 'variationId', 
    as: 'answers',
    onDelete: 'CASCADE'
  });
  
  ExamVariation.hasMany(ExamQuestion, { 
    foreignKey: 'variationId', 
    as: 'examQuestions',
    onDelete: 'CASCADE'
  });

  // ExamQuestion associations
  ExamQuestion.belongsTo(Exam, { 
    foreignKey: 'examId', 
    as: 'exam' 
  });
  
  ExamQuestion.belongsTo(ExamVariation, { 
    foreignKey: 'variationId', 
    as: 'variation' 
  });
  
  ExamQuestion.belongsTo(Question, { 
    foreignKey: 'questionId', 
    as: 'question' 
  });

  // Answer associations
  Answer.belongsTo(User, { 
    foreignKey: 'userId', 
    as: 'user' 
  });
  
  Answer.belongsTo(Exam, { 
    foreignKey: 'examId', 
    as: 'exam' 
  });
  
  Answer.belongsTo(ExamVariation, { 
    foreignKey: 'variationId', 
    as: 'variation' 
  });
}

// Add instance methods to models
addInstanceMethods();

function addInstanceMethods() {
  // Exam instance methods
  Exam.prototype.canTakeExam = function() {
    if (!this.isPublished) return false;
    if (this.expiresAt && new Date() > new Date(this.expiresAt)) return false;
    return true;
  };

  // Question instance methods
  Question.prototype.shuffleAlternatives = function() {
    const alternatives = [...this.alternatives];
    const correctAnswer = this.correctAnswer;
    const correctText = alternatives[correctAnswer];
    
    // Fisher-Yates shuffle
    for (let i = alternatives.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [alternatives[i], alternatives[j]] = [alternatives[j], alternatives[i]];
    }
    
    // Find new position of correct answer
    const newCorrectAnswer = alternatives.indexOf(correctText);
    
    return {
      alternatives,
      correctAnswer: newCorrectAnswer
    };
  };

  Question.prototype.updateAverageScore = async function(isCorrect) {
    this.timesUsed = (this.timesUsed || 0) + 1;
    if (isCorrect) {
      this.timesCorrect = (this.timesCorrect || 0) + 1;
    }
    
    this.averageScore = (this.timesCorrect / this.timesUsed) * 100;
    
    await this.save();
  };

  // Subject instance methods
  Subject.prototype.canCreateExam = async function(requirements) {
    const [easyCount, mediumCount, hardCount] = await Promise.all([
      Question.count({
        where: { 
          subjectId: this.id, 
          difficulty: 'easy', 
          isActive: true 
        }
      }),
      Question.count({
        where: { 
          subjectId: this.id, 
          difficulty: 'medium', 
          isActive: true 
        }
      }),
      Question.count({
        where: { 
          subjectId: this.id, 
          difficulty: 'hard', 
          isActive: true 
        }
      })
    ]);

    const available = { easy: easyCount, medium: mediumCount, hard: hardCount };
    const required = requirements || { easy: 0, medium: 0, hard: 0 };

    const canCreate = available.easy >= required.easy && 
                     available.medium >= required.medium && 
                     available.hard >= required.hard;

    return { canCreate, available, required };
  };
}

// Add class methods
addClassMethods();

function addClassMethods() {
  // Question class methods
  Question.getRandomQuestions = async function(subjectId, distribution) {
    const { easy = 0, medium = 0, hard = 0 } = distribution;
    
    const [easyQuestions, mediumQuestions, hardQuestions] = await Promise.all([
      easy > 0 ? this.findAll({
        where: { subjectId, difficulty: 'easy', isActive: true },
        order: [sequelize.random()],
        limit: easy
      }) : [],
      medium > 0 ? this.findAll({
        where: { subjectId, difficulty: 'medium', isActive: true },
        order: [sequelize.random()],
        limit: medium
      }) : [],
      hard > 0 ? this.findAll({
        where: { subjectId, difficulty: 'hard', isActive: true },
        order: [sequelize.random()],
        limit: hard
      }) : []
    ]);

    return [...easyQuestions, ...mediumQuestions, ...hardQuestions];
  };

  // User class methods
  User.findByEmail = function(email) {
    return this.findOne({ where: { email: email.toLowerCase() } });
  };
}

// Execute associate methods if they exist
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
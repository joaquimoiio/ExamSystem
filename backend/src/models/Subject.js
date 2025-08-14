module.exports = (sequelize, DataTypes) => {
  const Subject = sequelize.define('Subject', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    description: {
      type: DataTypes.TEXT
    },
    color: {
      type: DataTypes.STRING(7),
      defaultValue: '#3B82F6',
      validate: {
        is: /^#[0-9A-F]{6}$/i
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'subjects',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['name']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['createdAt']
      },
      {
        unique: true,
        fields: ['userId', 'name']
      }
    ]
  });

  // Instance methods
  Subject.prototype.canCreateExam = async function(requirements) {
    const Question = sequelize.models.Question;
    
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

  Subject.prototype.getQuestionsCount = async function() {
    const Question = sequelize.models.Question;
    
    const total = await Question.count({
      where: { subjectId: this.id, isActive: true }
    });

    const byDifficulty = await Question.findAll({
      where: { subjectId: this.id, isActive: true },
      attributes: [
        'difficulty',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['difficulty'],
      raw: true
    });

    const counts = {
      total,
      easy: 0,
      medium: 0,
      hard: 0
    };

    byDifficulty.forEach(item => {
      counts[item.difficulty] = parseInt(item.count);
    });

    return counts;
  };

  Subject.prototype.getExamsCount = async function() {
    const Exam = sequelize.models.Exam;
    
    const total = await Exam.count({
      where: { subjectId: this.id }
    });

    const published = await Exam.count({
      where: { subjectId: this.id, isPublished: true }
    });

    return { total, published, draft: total - published };
  };

  // Class methods
  Subject.findByUserId = function(userId, options = {}) {
    return this.findAll({
      where: { userId, isActive: true },
      order: [['name', 'ASC']],
      ...options
    });
  };

  Subject.findActiveWithCounts = async function(userId) {
    const subjects = await this.findAll({
      where: { userId, isActive: true },
      order: [['name', 'ASC']]
    });

    // Add counts to each subject
    for (let subject of subjects) {
      const questionsCount = await subject.getQuestionsCount();
      const examsCount = await subject.getExamsCount();
      
      subject.dataValues.questionsCount = questionsCount;
      subject.dataValues.examsCount = examsCount;
    }

    return subjects;
  };

  return Subject;
};
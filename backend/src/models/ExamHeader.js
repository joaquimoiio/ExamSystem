module.exports = (sequelize, DataTypes) => {
  const ExamHeader = sequelize.define('ExamHeader', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    schoolName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 200]
      }
    },
    subjectName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 2020,
        max: 2050
      }
    },
    evaluationCriteria: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    timeLimit: {
      type: DataTypes.INTEGER, // em minutos
      allowNull: true,
      validate: {
        min: 15,
        max: 480
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
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'exam_headers',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['isDefault']
      }
    ]
  });

  // Instance methods
  ExamHeader.prototype.clone = function() {
    return {
      schoolName: this.schoolName,
      subjectName: this.subjectName,
      year: this.year,
      evaluationCriteria: this.evaluationCriteria,
      instructions: this.instructions,
      timeLimit: this.timeLimit,
      userId: this.userId,
      metadata: this.metadata
    };
  };

  // Class methods
  ExamHeader.findByUserId = function(userId) {
    return this.findAll({
      where: { userId },
      order: [['isDefault', 'DESC'], ['createdAt', 'DESC']]
    });
  };

  ExamHeader.getDefault = function(userId) {
    return this.findOne({
      where: { userId, isDefault: true }
    });
  };

  ExamHeader.setAsDefault = async function(headerId, userId) {
    // Remove default de todos os outros
    await this.update(
      { isDefault: false },
      { where: { userId } }
    );

    // Define o novo como default
    return this.update(
      { isDefault: true },
      { where: { id: headerId, userId } }
    );
  };

  return ExamHeader;
};
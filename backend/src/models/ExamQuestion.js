module.exports = (sequelize, DataTypes) => {
  const ExamQuestion = sequelize.define('ExamQuestion', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    examId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'exams',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    variationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'exam_variations',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    questionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'questions',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    points: {
      type: DataTypes.DECIMAL(4, 2),
      defaultValue: 1.00,
      validate: {
        min: 0.1,
        max: 10.0
      }
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'exam_questions',
    timestamps: true,
    indexes: [
      {
        fields: ['examId']
      },
      {
        fields: ['variationId']
      },
      {
        fields: ['questionId']
      },
      {
        fields: ['order']
      },
      {
        unique: true,
        fields: ['variationId', 'questionId']
      },
      {
        unique: true,
        fields: ['variationId', 'order']
      }
    ]
  })

  return ExamQuestion
}
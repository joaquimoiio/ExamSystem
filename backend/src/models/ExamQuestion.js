const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const ExamQuestion = sequelize.define('ExamQuestion', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false
    },
    examId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'exams',
        key: 'id'
      }
    },
    questionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'questions',
        key: 'id'
      }
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [1],
          msg: 'Order must be at least 1'
        }
      }
    },
    points: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1.0,
      validate: {
        min: {
          args: [0],
          msg: 'Points cannot be negative'
        },
        max: {
          args: [100],
          msg: 'Points cannot exceed 100'
        }
      }
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1.0,
      validate: {
        min: {
          args: [0.1],
          msg: 'Weight must be at least 0.1'
        },
        max: {
          args: [5.0],
          msg: 'Weight cannot exceed 5.0'
        }
      }
    }
  }, {
    tableName: 'exam_questions',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['examId', 'questionId']
      },
      {
        unique: true,
        fields: ['examId', 'order']
      },
      {
        fields: ['examId']
      },
      {
        fields: ['questionId']
      }
    ]
  });

  // Instance methods
  ExamQuestion.prototype.calculateWeightedScore = function(isCorrect) {
    return isCorrect ? this.points * this.weight : 0;
  };

  ExamQuestion.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    return values;
  };

  return ExamQuestion;
};
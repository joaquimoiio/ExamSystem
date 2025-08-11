const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Subject = sequelize.define('Subject', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Subject name cannot be empty'
        },
        len: {
          args: [2, 100],
          msg: 'Subject name must be between 2 and 100 characters'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 1000],
          msg: 'Description cannot exceed 1000 characters'
        }
      }
    },
    color: {
      type: DataTypes.STRING(7),
      allowNull: false,
      defaultValue: '#3B82F6',
      validate: {
        isHexColor: function(value) {
          if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
            throw new Error('Color must be a valid hex color');
          }
        }
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  }, {
    tableName: 'subjects',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['name', 'userId'],
        name: 'unique_subject_per_user'
      },
      {
        fields: ['userId']
      },
      {
        fields: ['isActive']
      }
    ]
  });

  // Instance methods
  Subject.prototype.getQuestionCounts = async function() {
    const { Question } = require('./index');
    
    const counts = await Question.findAll({
      where: { 
        subjectId: this.id,
        isActive: true 
      },
      attributes: [
        'difficulty',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['difficulty'],
      raw: true
    });

    const result = {
      easy: 0,
      medium: 0,
      hard: 0,
      total: 0
    };

    counts.forEach(item => {
      result[item.difficulty] = parseInt(item.count);
      result.total += parseInt(item.count);
    });

    return result;
  };

  Subject.prototype.canCreateExam = async function(requirements) {
    const counts = await this.getQuestionCounts();
    
    return {
      canCreate: counts.easy >= requirements.easyQuestions &&
                 counts.medium >= requirements.mediumQuestions &&
                 counts.hard >= requirements.hardQuestions,
      available: counts,
      required: requirements
    };
  };

  Subject.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    return values;
  };

  return Subject;
};
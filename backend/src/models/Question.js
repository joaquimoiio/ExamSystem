const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Question = sequelize.define('Question', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Question text cannot be empty'
        },
        len: {
          args: [10, 5000],
          msg: 'Question text must be between 10 and 5000 characters'
        }
      }
    },
    alternatives: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        isValidAlternatives: function(value) {
          if (!Array.isArray(value)) {
            throw new Error('Alternatives must be an array');
          }
          if (value.length < 2 || value.length > 5) {
            throw new Error('Must have between 2 and 5 alternatives');
          }
          
          const letters = ['A', 'B', 'C', 'D', 'E'];
          for (let i = 0; i < value.length; i++) {
            const alt = value[i];
            if (!alt.letter || !alt.text) {
              throw new Error('Each alternative must have letter and text');
            }
            if (alt.letter !== letters[i]) {
              throw new Error('Alternatives must be in order A, B, C, D, E');
            }
            if (alt.text.trim().length < 1 || alt.text.length > 500) {
              throw new Error('Alternative text must be between 1 and 500 characters');
            }
          }
        }
      }
    },
    correctAnswer: {
      type: DataTypes.STRING(1),
      allowNull: false,
      validate: {
        isIn: {
          args: [['A', 'B', 'C', 'D', 'E']],
          msg: 'Correct answer must be A, B, C, D, or E'
        },
        isValidCorrectAnswer: function(value) {
          if (this.alternatives) {
            const validLetters = this.alternatives.map(alt => alt.letter);
            if (!validLetters.includes(value)) {
              throw new Error('Correct answer must match one of the alternative letters');
            }
          }
        }
      }
    },
    difficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard'),
      allowNull: false,
      validate: {
        isIn: {
          args: [['easy', 'medium', 'hard']],
          msg: 'Difficulty must be easy, medium, or hard'
        }
      }
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      validate: {
        isValidTags: function(value) {
          if (value && !Array.isArray(value)) {
            throw new Error('Tags must be an array');
          }
          if (value && value.length > 10) {
            throw new Error('Cannot have more than 10 tags');
          }
          if (value) {
            value.forEach(tag => {
              if (typeof tag !== 'string' || tag.trim().length === 0) {
                throw new Error('Each tag must be a non-empty string');
              }
              if (tag.length > 50) {
                throw new Error('Each tag must be less than 50 characters');
              }
            });
          }
        }
      }
    },
    subjectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'subjects',
        key: 'id'
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
    },
    timesUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    averageScore: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: {
          msg: 'Image URL must be a valid URL'
        }
      }
    }
  }, {
    tableName: 'questions',
    timestamps: true,
    indexes: [
      {
        fields: ['subjectId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['difficulty']
      },
      {
        fields: ['isActive']
      }
      // Removido o índice GIN problemático temporariamente
      // Podemos criar manualmente após a sincronização se necessário
    ]
  });

  // Instance methods
  Question.prototype.shuffleAlternatives = function() {
    const alternatives = [...this.alternatives];
    const correctText = alternatives.find(alt => alt.letter === this.correctAnswer).text;
    
    // Fisher-Yates shuffle algorithm
    for (let i = alternatives.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [alternatives[i], alternatives[j]] = [alternatives[j], alternatives[i]];
    }
    
    // Reassign letters
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const shuffledAlternatives = alternatives.map((alt, index) => ({
      letter: letters[index],
      text: alt.text
    }));
    
    // Find new correct answer letter
    const newCorrectAnswer = shuffledAlternatives.find(alt => alt.text === correctText).letter;
    
    return {
      alternatives: shuffledAlternatives,
      correctAnswer: newCorrectAnswer
    };
  };

  Question.prototype.incrementUsage = async function() {
    this.timesUsed += 1;
    await this.save({ fields: ['timesUsed'] });
  };

  Question.prototype.updateAverageScore = async function(score) {
    if (this.averageScore === null) {
      this.averageScore = score;
    } else {
      // Simple moving average calculation
      this.averageScore = (this.averageScore + score) / 2;
    }
    await this.save({ fields: ['averageScore'] });
  };

  Question.prototype.getStatistics = async function() {
    const { Answer } = require('./index');
    
    const stats = await Answer.findAll({
      where: {
        answers: {
          [sequelize.Op.contains]: [{ questionId: this.id }]
        }
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalAnswers'],
        [sequelize.fn('AVG', 
          sequelize.literal(`CASE WHEN answers @> '[{"questionId": "${this.id}", "correct": true}]' THEN 1 ELSE 0 END`)
        ), 'correctPercentage']
      ],
      raw: true
    });

    return {
      timesUsed: this.timesUsed,
      averageScore: this.averageScore,
      totalAnswers: parseInt(stats[0]?.totalAnswers || 0),
      correctPercentage: parseFloat(stats[0]?.correctPercentage || 0) * 100
    };
  };

  Question.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    return values;
  };

  return Question;
};
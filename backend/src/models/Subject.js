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
        fields: ['createdAt']
      },
      {
        unique: true,
        fields: ['userId', 'name']
      }
    ]
  })

  // Instance methods
  Subject.prototype.canCreateExam = async function(requirements) {
    const Question = sequelize.models.Question
    
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
    ])

    const available = { easy: easyCount, medium: mediumCount, hard: hardCount }
    const required = requirements || { easy: 0, medium: 0, hard: 0 }

    const canCreate = available.easy >= required.easy && 
                     available.medium >= required.medium && 
                     available.hard >= required.hard

    return { canCreate, available, required }
  }

  return Subject
}
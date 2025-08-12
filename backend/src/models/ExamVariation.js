module.exports = (sequelize, DataTypes) => {
  const ExamVariation = sequelize.define('ExamVariation', {
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
    variationNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    variationLetter: {
      type: DataTypes.STRING(1),
      allowNull: false,
      validate: {
        is: /^[A-Z]$/
      }
    },
    qrCode: {
      type: DataTypes.TEXT,
      comment: 'JSON string containing QR code data'
    },
    questionsOrder: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'exam_variations',
    timestamps: true,
    indexes: [
      {
        fields: ['examId']
      },
      {
        fields: ['variationNumber']
      },
      {
        unique: true,
        fields: ['examId', 'variationNumber']
      },
      {
        unique: true,
        fields: ['examId', 'variationLetter']
      }
    ]
  })

  // Instance methods
  ExamVariation.prototype.getQRData = function() {
    try {
      return JSON.parse(this.qrCode)
    } catch (error) {
      return null
    }
  }

  ExamVariation.prototype.setQRData = function(data) {
    this.qrCode = JSON.stringify(data)
  }

  return ExamVariation
}
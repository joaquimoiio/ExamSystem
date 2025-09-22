const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
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
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [6, 255]
      }
    },
    role: {
      type: DataTypes.ENUM('admin', 'teacher'),
      defaultValue: 'teacher'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastLogin: {
      type: DataTypes.DATE
    },
    passwordChangedAt: {
      type: DataTypes.DATE
    },
    passwordResetToken: {
      type: DataTypes.STRING
    },
    passwordResetExpires: {
      type: DataTypes.DATE
    },
    refreshToken: {
      type: DataTypes.TEXT
    },
    avatar: {
      type: DataTypes.STRING
    },
    phone: {
      type: DataTypes.STRING(20)
    },
    bio: {
      type: DataTypes.TEXT
    },
    preferences: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    planId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'plans',
        key: 'id'
      }
    }
  }, {
    tableName: 'users',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        fields: ['role']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['createdAt']
      }
    ],
    hooks: {
      beforeSave: async (user, options) => {
        // Hash password if it was changed
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 12);
          user.passwordChangedAt = new Date();
        }
      }
    }
  });

  // Instance methods
  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password;
    delete values.passwordResetToken;
    delete values.passwordResetExpires;
    delete values.refreshToken;
    return values;
  };

  User.prototype.validatePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  User.prototype.passwordChangedAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
      const changedTimestamp = parseInt(
        this.passwordChangedAt.getTime() / 1000,
        10
      );
      return JWTTimestamp < changedTimestamp;
    }
    return false;
  };

  User.prototype.createPasswordResetToken = function() {
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    
    this.passwordResetToken = require('crypto')
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    return resetToken;
  };

  User.prototype.canManageResource = function(resource) {
    if (this.role === 'admin') return true;
    return resource.userId === this.id;
  };

  // Class methods
  User.findByEmail = function(email) {
    return this.findOne({ where: { email: email.toLowerCase() } });
  };

  User.createAdmin = async function(userData) {
    return await this.create({
      ...userData,
      role: 'admin',
      isActive: true
    });
  };

  // Associate with Plan
  User.associate = function(models) {
    User.belongsTo(models.Plan, {
      foreignKey: 'planId',
      as: 'plan'
    });
  };

  // Plan-related methods
  User.prototype.canCreateSubjects = async function() {
    if (!this.plan) return false;
    if (this.plan.isUnlimited('subjects')) return true;

    const subjectCount = await this.constructor.sequelize.models.Subject.count({
      where: { userId: this.id }
    });
    return subjectCount < this.plan.maxSubjects;
  };

  User.prototype.canCreateQuestions = async function() {
    if (!this.plan) return false;
    if (this.plan.isUnlimited('questions')) return true;

    const questionCount = await this.constructor.sequelize.models.Question.count({
      where: { userId: this.id }
    });
    return questionCount < this.plan.maxQuestions;
  };

  User.prototype.canCreateExams = async function() {
    if (!this.plan) return false;
    if (this.plan.isUnlimited('exams')) return true;

    const examCount = await this.constructor.sequelize.models.Exam.count({
      where: { userId: this.id }
    });
    return examCount < this.plan.maxExams;
  };

  User.prototype.getUsageStats = async function() {
    const subjects = await this.constructor.sequelize.models.Subject.count({
      where: { userId: this.id }
    });
    const questions = await this.constructor.sequelize.models.Question.count({
      where: { userId: this.id }
    });
    const exams = await this.constructor.sequelize.models.Exam.count({
      where: { userId: this.id }
    });

    return {
      subjects: { used: subjects, limit: this.plan?.maxSubjects || 0 },
      questions: { used: questions, limit: this.plan?.maxQuestions || 0 },
      exams: { used: exams, limit: this.plan?.maxExams || 0 }
    };
  };

  return User;
};
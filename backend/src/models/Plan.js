module.exports = (sequelize, DataTypes) => {
  const Plan = sequelize.define('Plan', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        isIn: [['free', 'plus']]
      }
    },
    displayName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0
      }
    },
    maxSubjects: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: -1,
      validate: {
        min: -1
      }
    },
    maxQuestions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: -1,
      validate: {
        min: -1
      }
    },
    maxExams: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: -1,
      validate: {
        min: -1
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    features: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'plans',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['name']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['price']
      }
    ]
  });

  Plan.associate = function(models) {
    Plan.hasMany(models.User, {
      foreignKey: 'planId',
      as: 'users'
    });
  };

  // Instance methods
  Plan.prototype.isUnlimited = function(resource) {
    const field = `max${resource.charAt(0).toUpperCase() + resource.slice(1)}`;
    return this[field] === -1;
  };

  Plan.prototype.getLimit = function(resource) {
    const field = `max${resource.charAt(0).toUpperCase() + resource.slice(1)}`;
    return this[field];
  };

  Plan.prototype.hasFeature = function(featureName) {
    return this.features && this.features[featureName] === true;
  };

  // Class methods
  Plan.findByName = function(name) {
    return this.findOne({
      where: {
        name: name.toLowerCase(),
        isActive: true
      }
    });
  };

  Plan.getActivePlans = function() {
    return this.findAll({
      where: { isActive: true },
      order: [['price', 'ASC']]
    });
  };

  Plan.getFreePlan = function() {
    return this.findByName('free');
  };

  Plan.getPlusPlan = function() {
    return this.findByName('plus');
  };

  return Plan;
};
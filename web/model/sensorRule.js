/**
 * =================
 * SCHEMA - SensorRule
 * =================
 * Defines a SensorRule, defining the values interval of the Measures of a Sensor to trigger a Rule.
 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('SensorRule',
      { measureType: {
            type: DataTypes.STRING(32),
            validate: {
                notEmpty: { msg: "Field measureType cannot be empty" },
                notNull: { msg: "Field measureType cannot be null" }
            }
        },
        intervalStart: {
            type: DataTypes.FLOAT,
            validate: {
                notEmpty: { msg: "Field intervalStart cannot be empty" }
            }
        },
        intervalEnd: {
            type: DataTypes.FLOAT,
            validate: {
                notEmpty: { msg: "Field intervalEnd cannot be empty" }
            }
        }
    },
    {timestamps: false});
}

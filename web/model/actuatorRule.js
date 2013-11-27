/**
 * =================
 * SCHEMA - ActuatorRule
 * =================
 * Defines a ActuatorRule, defining which Actuator must be triggered and how, when the conditions of the Rule (SensorRules) are met.
 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ActuatorRule',
      { value: {
            type: DataTypes.FLOAT,
            validate: {
                notEmpty: { msg: "Field value cannot be empty" }
            }
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            validate: {
                notEmpty: { msg: "Field isActive cannot be empty" }
            },
            defaultValue: false
        }
    },
    {timestamps: false});
}

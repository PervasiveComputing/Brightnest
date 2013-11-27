/**
 * =================
 * SCHEMA - Rule
 * =================
 * Defines a Rule, binding Sensors Measures and Actuators together.
 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Rule',
      { name: {
            type: DataTypes.STRING(32),
            validate: {
                notEmpty: { msg: "Field name cannot be empty" }
            }
        }
    },
    {timestamps: false});
}

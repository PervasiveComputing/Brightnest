/**
 * =================
 * SCHEMA - Measure
 * =================
 * Defines a Measure, generated by a Sensor.
 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Measure',
      { time: {
            type: DataTypes.DATE,
            validate: {
                notEmpty: { msg: "Field time cannot be empty" }
            }
        },
        value: {
            type: DataTypes.FLOAT,
            validate: {
                notEmpty: { msg: "Field value cannot be empty" }
            }
        },
        measureType: {
            type: DataTypes.STRING(32),
            validate: {
                notEmpty: { msg: "Field measureType cannot be empty" }
            }
        }
    },
    {timestamps: false});
}

/**
 * =================
 * SCHEMA - Sensor
 * =================
 * Defines a Sensor, to generate Measures.
 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Sensor',
      { customId: {
            type: DataTypes.STRING(32),
            validate: {
                notEmpty: { msg: "Field customId cannot be empty" }
            }
        },
		name: {
            type: DataTypes.STRING(32),
            validate: {
                notEmpty: { msg: "Field name cannot be empty" }
            }
        },
        type: {
            type: DataTypes.STRING(32),
            validate: {
                notEmpty: { msg: "Field type cannot be empty" }
            }
        }
    },
    {timestamps: false});
}

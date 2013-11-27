/**
 * =================
 * SCHEMA - Sensor
 * =================
 * Defines a Sensor, to generate Measures.
 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Sensor',
      { type: {
            type: DataTypes.STRING(32),
            validate: {
                notEmpty: { msg: "Field type cannot be empty" }
            }
        }
    },
    {timestamps: false});
}

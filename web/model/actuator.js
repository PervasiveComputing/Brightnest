/**
 * =================
 * SCHEMA - Actuator
 * =================
 * Defines an Actuator, to apply Rules.
 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Actuator',
      { id: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: { msg: "Field id cannot be empty" }
            }
        },
        type: {
            type: DataTypes.STRING(32),
            validate: {
                notEmpty: { msg: "Field type cannot be empty" }
            }
        }
    });
}

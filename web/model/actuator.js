/**
 * =================
 * SCHEMA - Actuator
 * =================
 * Defines an Actuator, to apply Rules.
 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Actuator',
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
    });
}

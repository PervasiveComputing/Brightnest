/**
 * =================
 * MODULE - Models
 * 		by	Daniel Buldon Blanco / dbuldon
		&	Benjamin (Bill) Planche / Aldream 
 * =================
 * Defines the models and their relations.
 */
var path = require('path');
var sqlite = require('sequelize-sqlite').sqlite;

module.exports = function(sequelize) {
	
	// Models:
	var Sensor = sequelize.import(path.join(__dirname,'model/sensor'));
	var Actuator = sequelize.import(path.join(__dirname,'model/actuator'));
	var Measure = sequelize.import(path.join(__dirname,'model/measure'));
	var Rule = sequelize.import(path.join(__dirname,'model/rule'));
	var ActuatorRule = sequelize.import(path.join(__dirname,'model/actuatorRule'));
	var SensorRule = sequelize.import(path.join(__dirname,'model/sensorRule'));

	//Relations:
	Sensor.hasMany(Measure,{foreignKey: 'sensorId'});
	Measure.belongsTo(Sensor, { foreignKey : 'sensorId'});

	Sensor.hasMany(SensorRule,{foreignKey: 'sensorId'});
	SensorRule.belongsTo(Sensor, { foreignKey : 'sensorId'});
	Actuator.hasMany(ActuatorRule,{foreignKey: 'actuatorId'});
	ActuatorRule.belongsTo(Actuator, { foreignKey : 'actuatorId'});

	Rule.hasMany(SensorRule,{foreignKey: 'ruleId'});
	SensorRule.belongsTo(Rule, { foreignKey : 'ruleId'});
	Rule.hasMany(ActuatorRule,{foreignKey: 'ruleId'});
	ActuatorRule.belongsTo(Rule, { foreignKey : 'ruleId'});


	this.Sensor = Sensor;
	this.Actuator = Actuator;
	this.Measure = Measure;
	this.Rule = Rule;
	this.ActuatorRule = ActuatorRule;
	this.SensorRule = SensorRule;
	sequelize.sync();

	return this;
}
 


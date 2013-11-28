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
	Sensor.hasMany(Measure,{as: 'measures', foreignKey: 'sensorId'});

	Sensor.hasMany(SensorRule,{as: 'rules', foreignKey: 'sensorId'});
	Actuator.hasMany(ActuatorRule,{as: 'rules', foreignKey: 'actuatorId'});

	Rule.hasMany(SensorRule,{as: 'sensorRules', foreignKey: 'ruleId'});
	Rule.hasMany(ActuatorRule,{as: 'actuatorRules', foreignKey: 'ruleId'});


	this.Sensor = Sensor;
	this.Actuator = Actuator;
	this.Measure = Measure;
	this.Rule = Rule;
	this.ActuatorRule = ActuatorRule;
	this.SensorRule = SensorRule;
	sequelize.sync();

	return this;
}
 


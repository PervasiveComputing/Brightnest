/**
 * =================
 * MODULE - Models
 * 		by	Daniel Buldon Blanco / dbuldon
		&	Benjamin (Bill) Planche / Aldream 
 * =================
 * Defines the models and their relations.
 */
 
 
var path = require('path');
var Sequelize = require('sequelize-sqlite').sequelize;
var sqlite = require('sequelize-sqlite').sqlite;

var sequelize = new Sequelize('brightnest', 'username', 'password', {
  dialect: 'sqlite',
  storage: 'brightnest.db'
})

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


exports.Sensor = Sensor;
exports.Actuator = Actuator;
exports.Measure = Measure;
exports.Rule = Rule;
exports.ActuatorRule = ActuatorRule;
exports.SensorRule = SensorRule;
sequelize.sync();

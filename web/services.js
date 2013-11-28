/**
 * =================
 * MODULE - Services
 * =================
 * REST and local services
 */

 var logger = require("./logger");

module.exports = function(models, sensorsDrivers, actuatorsDrivers) {

	function error(code, resp, customMsg) {
		var result = {};
		result.error = {};
		result.error.code = code;
		result.status = 'nok';

		switch(code) {
			case 0:
				result.error.msg = "Couldn't parse the JSON";
				break;
			case 1:
				result.error.msg = "Unsupported HTTP/1.1 method for this service";
				break;
			case 2:
				result.error.msg = "DB error";
				break;
			default:
				result.error.msg = customMsg?customMsg:"Unknow error";
		}

		logger.error("Error function with message : " + result.error.msg)
		var jsonResult = JSON.stringify(result);
			resp.end(jsonResult);
	}
	
	// Adds the header indicating all went sucessfully.
	function writeHeaders(resp) {
		resp.header("Access-Control-Allow-Origin","*");
	}

	function parseRequest(req, names) {
		request = {}
		for (var n in names) {
			request[names[n]] = req.param(names[n], null);
		}
		return request;
	}

	/*
	 * ------------------------------------------
	 * SENSORS - CRUD Services
	 * ------------------------------------------
	 */
	 
	/**
	 * createSensor
	 * ====
	 * Add a sensor to the DB and system, if there is a driver to handle it.
	 * Parameters:
	 *	- type (String): 					Type of sensor
	 *	- customId (String): 				Custom ID for the driver
	 *	- cb (Function(Erreur, int)):		Callback
	 */
	function createSensor(type, customId, cb) {
		if (sensorsDrivers[type]) { // If this kind of device is supported:
			// Add to DB:
			models.Sensor.create({ customId: customId, type: type }).success(function(sensor) {
				// Let the driver handle the integration of the device to the system:
				sensorsDrivers[type].add(customId, function(err){
						if (err) { cb(err, null); return; }
						cb(null, sensor.id);
					});
			});
			
		} else {
			cb('Device not supported', 'nok');
		}
	}
	/**
	 * serviceCreateSensor
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 * 		- type (String): 					Type of sensor				- required
	 *		- customId (String): 				Custom ID for the driver 	- required
	 */
	function serviceCreateSensor(req, resp) {
		logger.info("<Service> CreateSensor.");
		var sensorData = parseRequest(req, ['type', 'customId']);
		
		writeHeaders(resp);
		createSensor(sensorData.type, sensorData.customId,function(err, id) {
			if (err) { error(10, resp, err); return; }
			resp.end(JSON.stringify({ status: 'ok', id: id }));
		});
	}
	 
	/**
	 * getSensors
	 * ====
	 * Returns a list of sensors.
	 * Parameters:
	 *	- limit (int): 					Number max of sensors to return
	 *	- offset (int): 				Number of the sensor to start with
	 *	- cb (Function(err, Sensor[])):	Callback
	 */
	function getSensors(limit, offset, cb) {
		if (!offset) offset = 0;
		if (limit) {
			models.Sensor.findAll({ offset: offset, limit: limit, raw: true }).success(cb)
		}
		else {
			models.Sensor.findAll({ offset: offset, raw: true }).success(cb)
		}
	}
	/**
	 * serviceGetSensors
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 *		- limit (int): 		Number max to return				- optional
	 *		- offset (int): 	Number of the sensor to start with	- optional
	 */
	function serviceGetSensors(req, resp) {
		logger.info("<Service> GetSensors.");
		var getData = parseRequest(req, ['limit', 'offset']);
		
		writeHeaders(resp);
		getSensors(getData.limit, getData.offset, function (sensors) {
			resp.end(JSON.stringify({ sensors: sensors })); 
		});
	}	
	 

	/*
	 * ------------------------------------------
	 * SENSOR Services
	 * ------------------------------------------
	 */
	 
	/**
	 * getSensor
	 * ====
	 * Returns the Sensor corresponding to the given id
	 * Parameters:
	 *	- id (int): 					Id
	 *	- cb (Function(Sensor)):	Callback
	 */
	function getSensor(id, cb) {
		models.Sensor.find(id).success(cb);
	}
	/**
	 * serviceGetSensor
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetSensor(req, resp) {
		logger.info("<Service> GetSensor.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getSensor(getData.id, function(sensor) {
			resp.end(sensor.values); 
		});
	}
	 
	/**
	 * getSensorType
	 * ====
	 * Returns the Sensor's type
	 * Parameters:
	 *	- id (String): 				ID
	 *	- cb (Function(err, type):	Callback
	 */
	function getSensorType(id, cb) {
		models.Sensor.find(id).success(function(sensor){
			cb(sensor.type);
		});
	}
	/**
	 * serviceGetSensorType
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetSensorType(req, resp) {
		logger.info("<Service> GetSensorType.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getSensorType(getData.id, function(type) {
			resp.end(JSON.stringify({ type: type })); 
		});
	}
	
	/**
	 * getSensorCustomId
	 * ====
	 * Returns the Sensor's customId
	 * Parameters:
	 *	- id (String): 				ID
	 *	- cb (Function(err, customId):	Callback
	 */
	function getSensorCustomId(id, cb) {
		models.Sensor.find(id).success(function(sensor){
			cb(sensor.customId);
		});
	}
	/**
	 * serviceGetSensorCustomId
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetSensorCustomId(req, resp) {
		logger.info("<Service> GetSensorCustomId.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getSensorCustomId(getData.id, function(customId) {
			resp.end(JSON.stringify({ customId: customId })); 
		});
	}
	
	/**
	 * deleteSensor
	 * ====
	 * Delete the Sensor corresponding to the given id
	 * Parameters:
	 *	- id (String): 			ID
	 *	- cb (Function(bool)):	Callback
	 */
	function deleteSensor(id, cb) {
		models.Sensor.destroy({id: id}).success(function() {
			cb(true);
		});
	}
	/**
	 * serviceDeleteSensor
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceDeleteSensor(req, resp) {
		logger.info("<Service> DeleteSensor.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		deleteSensor(getData.id, function (bool) {
			if (!bool) error(2, resp);
			else resp.end(JSON.stringify({ status: 'ok' })); 
		});
	}
	
	/**
	 * updateSensor
	 * ====
	 * Update the Sensor corresponding to the given id
	 * Parameters:
	 *	- type (String): 			Type of sensor
	 *	- customId (String): 		Custom ID for the driver
	 *	- cb (Function(bool)):		Callback
	 */ 
	function updateSensor(id, type, customId, cb) {
		models.Sensor.update({type: type, customId: customId}, {id: id}).success(function() {
			cb(true);
		});
	}
	/**
	 * serviceUpdateSensor
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 * 		- type (String): 					Type of sensor				- required
	 *		- customId (String): 				Custom ID for the driver 	- required
	 */
	function serviceUpdateSensor(req, resp) {
		logger.info("<Service> UpdateSensor.");
		var sensorData = parseRequest(req, ['id', 'type', 'customId']);
		
		writeHeaders(resp);
		updateSensor(sensorData.id, sensorData.type, sensorData.customId, function(bool) {
			if (!bool) error(2, resp);
			else resp.end(JSON.stringify({ status: 'ok' })); 
		});
	}
		
	/**
	 * updateSensorType
	 * ====
	 * Update the type of the Sensor corresponding to the given id
	 * Parameters:
	 *	- id (String): 				ID
	 *	- type (String): 			Type to change
	 *	- cb (Function(bool):		Callback
	 */ 
	function updateSensorType(id, type, cb) {
			models.Sensor.update({type: type}, {id: id}).success(function() {
			cb(true);
		});
	}
	/**
	 * serviceUpdateSensorType
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		- type (String): 	Type 		- required
	 */
	function serviceUpdateSensorType(req, resp) {
		logger.info("<Service> UpdateSensorType.");
		var sensorData = parseRequest(req, ['id', 'type']);
		
		writeHeaders(resp);
		updateSensorType(sensorData.id, sensorData.type, function(bool) {
			if (!bool) error(2, resp);
			else resp.end(JSON.stringify({ status: 'ok' })); 
		});
	}
	
	/**
	 * updateSensorCustomId
	 * ====
	 * Update the customId of the Sensor corresponding to the given id
	 * Parameters:
	 *	- id (String): 				ID
	 *	- customId (String): 			CustomId to change
	 *	- cb (Function(bool):		Callback
	 */ 
	function updateSensorCustomId(id, customId, cb) {
			models.Sensor.update({customId: customId}, {id: id}).success(function() {
			cb(true);
		});
	}
	/**
	 * serviceUpdateSensorCustomId
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		- customId (String): 	CustomId 		- required
	 */
	function serviceUpdateSensorCustomId(req, resp) {
		logger.info("<Service> UpdateSensorCustomId.");
		var sensorData = parseRequest(req, ['id', 'customId']);
		
		writeHeaders(resp);
		updateSensorCustomId(sensorData.id, sensorData.customId, function(bool) {
			if (!bool) error(2, resp);
			else resp.end(JSON.stringify({ status: 'ok' })); 
		});
	}	



	/*
	 * ------------------------------------------
	 * ACTUATORS - CRUD Services
	 * ------------------------------------------
	 */
	 
	/**
	 * createActuator
	 * ====
	 * Add a actuator to the DB and system, if there is a driver to handle it.
	 * Parameters:
	 *	- type (String): 					Type of actuator
	 *	- customId (String): 				Custom ID for the driver
	 *	- cb (Function(Erreur, int)):		Callback
	 */
	function createActuator(type, customId, cb) {
		if (actuatorsDrivers[type]) { // If this kind of device is supported:
			// Add to DB:
			models.Actuator.create({ customId: customId, type: type }).success(function(actuator) {
				// Let the driver handle the integration of the device to the system:
				actuatorsDrivers[type].add(customId, function(err){
						if (err) { cb(err, null); return; }
						cb(null, actuator.id);
					});
			});
			
		} else {
			cb('Device not supported', 'nok');
		}
	}
	/**
	 * serviceCreateActuator
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 * 		- type (String): 					Type of actuator				- required
	 *		- customId (String): 				Custom ID for the driver 	- required
	 */
	function serviceCreateActuator(req, resp) {
		logger.info("<Service> CreateActuator.");
		var actuatorData = parseRequest(req, ['type', 'customId']);
		
		writeHeaders(resp);
		createActuator(actuatorData.type, actuatorData.customId, function(err, id) {
			if (err) { error(10, resp, err); return; }
			resp.end(JSON.stringify({ status: 'ok', id: id }));
		});
	}
	 
	/**
	 * getActuators
	 * ====
	 * Returns a list of actuators.
	 * Parameters:
	 *	- limit (int): 					Number max of actuators to return
	 *	- offset (int): 				Number of the actuator to start with
	 *	- cb (Function(err, Actuator[])):	Callback
	 */
	function getActuators(limit, offset, cb) {
		if (!offset) offset = 0;
		if (limit) {
			models.Actuator.findAll({ offset: offset, limit: limit, raw: true }).success(cb)
		}
		else {
			models.Actuator.findAll({ offset: offset, raw: true }).success(cb)
		}
	}
	/**
	 * serviceGetActuators
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 *		- limit (int): 		Number max to return				- optional
	 *		- offset (int): 	Number of the actuator to start with	- optional
	 */
	function serviceGetActuators(req, resp) {
		logger.info("<Service> GetActuators.");
		var getData = parseRequest(req, ['limit', 'offset']);
		
		writeHeaders(resp);
		getActuators(getData.limit, getData.offset, function(actuators) {
			resp.end(JSON.stringify({ actuators: actuators })); 
		});
	}	
	 

	/*
	 * ------------------------------------------
	 * ACTUATOR Services
	 * ------------------------------------------
	 */
	 
	/**
	 * getActuator
	 * ====
	 * Returns the Actuator corresponding to the given id
	 * Parameters:
	 *	- id (int): 					Id
	 *	- cb (Function(Actuator)):	Callback
	 */
	function getActuator(id, cb) {
		models.Actuator.find(id).success(cb);
	}
	/**
	 * serviceGetActuator
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetActuator(req, resp) {
		logger.info("<Service> GetActuator.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getActuator(getData.id, function(actuator) {
			resp.end(actuator.values); 
		});
	}
	 
	/**
	 * getActuatorType
	 * ====
	 * Returns the Actuator's type
	 * Parameters:
	 *	- id (String): 				ID
	 *	- cb (Function(err, type):	Callback
	 */
	function getActuatorType(id, cb) {
		models.Actuator.find(id).success(function(actuator){
			cb(actuator.type);
		});
	}
	/**
	 * serviceGetActuatorType
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetActuatorType(req, resp) {
		logger.info("<Service> GetActuatorType.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getActuatorType(getData.id, function(type) {
			resp.end(JSON.stringify({ type: type })); 
		});
	}
	
	/**
	 * getActuatorCustomId
	 * ====
	 * Returns the Actuator's customId
	 * Parameters:
	 *	- id (String): 				ID
	 *	- cb (Function(err, customId):	Callback
	 */
	function getActuatorCustomId(id, cb) {
		models.Actuator.find(id).success(function(actuator){
			cb(actuator.customId);
		});
	}
	/**
	 * serviceGetActuatorCustomId
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetActuatorCustomId(req, resp) {
		logger.info("<Service> GetActuatorCustomId.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getActuatorCustomId(getData.id, function(customId) {
			resp.end(JSON.stringify({ customId: customId })); 
		});
	}
	
	/**
	 * deleteActuator
	 * ====
	 * Delete the Actuator corresponding to the given id
	 * Parameters:
	 *	- id (String): 			ID
	 *	- cb (Function(bool)):	Callback
	 */
	function deleteActuator(id, cb) {
		models.Actuator.destroy({id: id}).success(function() {
			cb(true);
		});
	}
	/**
	 * serviceDeleteActuator
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceDeleteActuator(req, resp) {
		logger.info("<Service> DeleteActuator.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		deleteActuator(getData.id, function (bool) {
			if (!bool) error(2, resp);
			else resp.end(JSON.stringify({ status: 'ok' })); 
		});
	}
	
	/**
	 * updateActuator
	 * ====
	 * Update the Actuator corresponding to the given id
	 * Parameters:
	 *	- type (String): 			Type of actuator
	 *	- customId (String): 		Custom ID for the driver
	 *	- cb (Function(bool)):		Callback
	 */ 
	function updateActuator(id, type, customId, cb) {
		models.Actuator.update({type: type, customId: customId}, {id: id}).success(function() {
			cb(true);
		});
	}
	/**
	 * serviceUpdateActuator
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 * 		- type (String): 					Type of actuator				- required
	 *		- customId (String): 				Custom ID for the driver 	- required
	 */
	function serviceUpdateActuator(req, resp) {
		logger.info("<Service> UpdateActuator.");
		var actuatorData = parseRequest(req, ['id', 'type', 'customId']);
		
		writeHeaders(resp);
		updateActuator(actuatorData.id, actuatorData.type, actuatorData.customId, function(bool) {
			if (!bool) error(2, resp);
			else resp.end(JSON.stringify({ status: 'ok' })); 
		});
	}
		
	/**
	 * updateActuatorType
	 * ====
	 * Update the type of the Actuator corresponding to the given id
	 * Parameters:
	 *	- id (String): 				ID
	 *	- type (String): 			Type to change
	 *	- cb (Function(bool):		Callback
	 */ 
	function updateActuatorType(id, type, cb) {
			models.Actuator.update({type: type}, {id: id}).success(function() {
			cb(true);
		});
	}
	/**
	 * serviceUpdateActuatorType
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		- type (String): 	Type 		- required
	 */
	function serviceUpdateActuatorType(req, resp) {
		logger.info("<Service> UpdateActuatorType.");
		var actuatorData = parseRequest(req, ['id', 'type']);
		
		writeHeaders(resp);
		updateActuatorType(actuatorData.id, actuatorData.type, function(bool) {
			if (!bool) error(2, resp);
			else resp.end(JSON.stringify({ status: 'ok' })); 
		});
	}
	
	/**
	 * updateActuatorCustomId
	 * ====
	 * Update the customId of the Actuator corresponding to the given id
	 * Parameters:
	 *	- id (String): 				ID
	 *	- customId (String): 			CustomId to change
	 *	- cb (Function(bool):		Callback
	 */ 
	function updateActuatorCustomId(id, customId, cb) {
			models.Actuator.update({customId: customId}, {id: id}).success(function() {
			cb(true);
		});
	}
	/**
	 * serviceUpdateActuatorCustomId
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		- customId (String): 	CustomId 		- required
	 */
	function serviceUpdateActuatorCustomId(req, resp) {
		logger.info("<Service> UpdateActuatorCustomId.");
		var actuatorData = parseRequest(req, ['id', 'customId']);
		
		writeHeaders(resp);
		updateActuatorCustomId(actuatorData.id, actuatorData.customId, function(bool) {
			if (!bool) error(2, resp);
			else resp.end(JSON.stringify({ status: 'ok' })); 
		});
	}	
	 

	/*
	 * ------------------------------------------
	 * RULES - CRUD Services
	 * ------------------------------------------
	 */
	 
	/**
	 * createRule
	 * ====
	 * Add a rule to the DB and system.
	 * Parameters:
	 *	- name (String): 					Name of the rule
	 *	- cb (Function(Erreur, int)):		Callback
	 */
	function createRule(name, cb) {
		models.Rule.create({ name: name }).success(function(rule) {
			cb(null, rule.id);
		});
	}
	/**
	 * serviceCreateRule
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 * 		- name (String): 			Name of the rule			- required
	 *		- customId (String): 		Custom ID for the driver 	- required
	 */
	function serviceCreateRule(req, resp) {
		logger.info("<Service> CreateRule.");
		var ruleData = parseRequest(req, ['name']);
		
		writeHeaders(resp);
		createRule(ruleData.name, function(err, id) {
			if (err) { error(10, resp, err); return; }
			resp.end(JSON.stringify({ status: 'ok', id: id }));
		});
	}
	 
	/**
	 * getRules
	 * ====
	 * Returns a list of rules.
	 * Parameters:
	 *	- limit (int): 					Number max of rules to return
	 *	- offset (int): 				Number of the rule to start with
	 *	- cb (Function(err, Rule[])):	Callback
	 */
	function getRules(limit, offset, cb) {
		if (!offset) offset = 0;
		if (limit) {
			models.Rule.findAll({ offset: offset, limit: limit, raw: true }).success(cb)
		}
		else {
			models.Rule.findAll({ offset: offset, raw: true }).success(cb)
		}
	}
	/**
	 * serviceGetRules
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 *		- limit (int): 		Number max to return				- optional
	 *		- offset (int): 	Number of the rule to start with	- optional
	 */
	function serviceGetRules(req, resp) {
		logger.info("<Service> GetRules.");
		var getData = parseRequest(req, ['limit', 'offset']);
		
		writeHeaders(resp);
		getRules(getData.limit, getData.offset, function(rules) {
			resp.end(JSON.stringify({ rules: rules })); 
		});
	}	
	 

	/*
	 * ------------------------------------------
	 * RULE Services
	 * ------------------------------------------
	 */
	 
	/**
	 * getRule
	 * ====
	 * Returns the Rule corresponding to the given id
	 * Parameters:
	 *	- id (int): 			Id
	 *	- cb (Function(Rule)):	Callback
	 */
	function getRule(id, cb) {
		models.Rule.find(id).success(cb);
	}
	/**
	 * serviceGetRule
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetRule(req, resp) {
		logger.info("<Service> GetRule.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getRule(getData.id, function(rule) {
			resp.end(rule.values); 
		});
	}
	 
	/**
	 * getRuleName
	 * ====
	 * Returns the Rule's name
	 * Parameters:
	 *	- id (String): 				ID
	 *	- cb (Function(err, name):	Callback
	 */
	function getRuleName(id, cb) {
		models.Rule.find(id).success(function(rule){
			cb(rule.name);
		});
	}
	/**
	 * serviceGetRuleName
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetRuleName(req, resp) {
		logger.info("<Service> GetRuleName.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getRuleName(getData.id, function(name) {
			resp.end(JSON.stringify({ name: name })); 
		});
	}
	
	/**
	 * deleteRule
	 * ====
	 * Delete the Rule corresponding to the given id
	 * Parameters:
	 *	- id (String): 			ID
	 *	- cb (Function(bool)):	Callback
	 */
	function deleteRule(id, cb) {
		models.Rule.destroy({id: id}).success(function() {
			cb(true);
		});
	}
	/**
	 * serviceDeleteRule
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceDeleteRule(req, resp) {
		logger.info("<Service> DeleteRule.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		deleteRule(getData.id, function (bool) {
			if (!bool) error(2, resp);
			else resp.end(JSON.stringify({ status: 'ok' })); 
		});
	}
	
	/**
	 * updateRule
	 * ====
	 * Update the Rule corresponding to the given id
	 * Parameters:
	 *	- name (String): 			Name of rule
	 *	- cb (Function(bool)):		Callback
	 */ 
	function updateRule(id, name, cb) {
		models.Rule.update({name: name}, {id: id}).success(function() {
			cb(true);
		});
	}
	/**
	 * serviceUpdateRule
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 * 		- name (String): 					Name of rule				- required
	 */
	function serviceUpdateRule(req, resp) {
		logger.info("<Service> UpdateRule.");
		var ruleData = parseRequest(req, ['id', 'name']);
		
		writeHeaders(resp);
		updateRule(ruleData.id, ruleData.name, function(bool) {
			if (!bool) error(2, resp);
			else resp.end(JSON.stringify({ status: 'ok' })); 
		});
	}
		
	/**
	 * updateRuleName
	 * ====
	 * Update the name of the Rule corresponding to the given id
	 * Parameters:
	 *	- id (String): 				ID
	 *	- name (String): 			Name to change
	 *	- cb (Function(bool):		Callback
	 */ 
	function updateRuleName(id, name, cb) {
			models.Rule.update({name: name}, {id: id}).success(function() {
			cb(true);
		});
	}
	/**
	 * serviceUpdateRuleName
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		- name (String): 	Name 		- required
	 */
	function serviceUpdateRuleName(req, resp) {
		logger.info("<Service> UpdateRuleName.");
		var ruleData = parseRequest(req, ['id', 'name']);
		
		writeHeaders(resp);
		updateRuleName(ruleData.id, ruleData.name, function(bool) {
			if (!bool) error(2, resp);
			else resp.end(JSON.stringify({ status: 'ok' })); 
		});
	}
	 
	 	 
	/*
	 * ------------------------------------------
	 * ROUTING
	 * ------------------------------------------
	 */
	 
	this.rest = {};
	this.rest['sensors'] = {
		'POST'	: serviceCreateSensor,
		'GET'	: serviceGetSensors
	};
	this.rest['sensor/:id'] = {
		'GET'	: serviceGetSensor,
		'DELETE': serviceDeleteSensor,
		'PUT'	: serviceUpdateSensor
	};
	this.rest['sensor/:id/type'] = {
		'GET'	: serviceGetSensorType,
		'PUT'	: serviceUpdateSensorType
	};
	this.rest['sensor/:id/customId'] = {
		'GET'	: serviceGetSensorCustomId,
		'PUT'	: serviceUpdateSensorCustomId
	};

	this.rest['actuators'] = {
		'POST'	: serviceCreateActuator,
		'GET'	: serviceGetActuators
	};
	this.rest['actuator/:id'] = {
		'GET'	: serviceGetActuator,
		'DELETE': serviceDeleteActuator,
		'PUT'	: serviceUpdateActuator
	};
	this.rest['actuator/:id/type'] = {
		'GET'	: serviceGetActuatorType,
		'PUT'	: serviceUpdateActuatorType
	};
	this.rest['actuator/:id/customId'] = {
		'GET'	: serviceGetActuatorCustomId,
		'PUT'	: serviceUpdateActuatorCustomId
	};

	this.rest['rules'] = {
		'POST'	: serviceCreateRule,
		'GET'	: serviceGetRules
	};
	this.rest['rule/:id'] = {
		'GET'	: serviceGetRule,
		'DELETE': serviceDeleteRule,
		'PUT'	: serviceUpdateRule
	};
	this.rest['rule/:id/name'] = {
		'GET'	: serviceGetRuleName,
		'PUT'	: serviceUpdateRuleName
	};
		
	return this;
};

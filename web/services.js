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

		logger.error("Error function with message : " + result.error.msg + (customMsg?' (err: '+customMsg+')':''));
		var jsonResult = JSON.stringify(result);
			resp.end(jsonResult);
	}
	
	// Adds the header indicating all went sucessfully.
	function writeHeaders(resp) {
		resp.header('Access-Control-Allow-Origin', '*');
		resp.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
		resp.header('Access-Control-Allow-Headers', 'Content-Type');
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
	 * INITIALIZATION - Services
	 * ------------------------------------------
	 */
	 
	/**
	 * loadDevices
	 * ====
	 * Fetch the devices added to the DB and call their drivers to handle them.
	 * Parameters:
	 *	- cb (Function(Erreur, Device):		Callback, in case an error appears when dealing with one of the devices
	 */
	function loadDevices(cb) {
		models.Sensor.findAll()
			.success(function(sensors){
				for (var i = 0; i < sensors.length; i++) {
					sensorsDrivers[sensors[i].type].add(sensors[i].customId, function(err){
						if (err) { cb(err, sensors[i]); }
						else { logger.info('<Sensor> ' + sensors[i].name + ' (type: ' + sensors[i].type + ', customId: ' + sensors[i].customId + ') - Ready'); }
					});
				}
			})
			.error(function(err) {
				cb(err, null);
			});
			
		models.Actuator.findAll()
			.success(function(actuators){
				for (var i = 0; i < actuators.length; i++) {
					actuatorsDrivers[actuators[i].type].add(actuators[i].customId, function(err){
						if (err) { cb(err, actuators[i]); }
						else { logger.info('<Actuator> ' + actuators[i].name + ' (type: ' + actuators[i].type + ', customId: ' + actuators[i].customId + ') - Ready'); }
					});
				}
			})
			.error(function(err) {
				cb(err, null);
			});
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
	 *  - name (String): 					Human-readable name	
	 *	- customId (String): 				Custom ID for the driver
	 *	- cb (Function(Erreur, int)):		Callback
	 */
	function createSensor(type, name, customId, baseAddr, cb) {
		if (sensorsDrivers[type]) { // If this kind of device is supported:
			// Check if this sensor isn't already added (the combination type + customId should be unique):
			var customDeviceId = customId+'+'+baseAddr;
			models.Sensor.findOrCreate({ customId: customDeviceId, type: type }, { name: name })
				.success(function(sensor, created) {
					if (!created) {
						cb('Device already added', sensor.id);
						return;
					}
					// Let the driver handle the integration of the device to the system:
					sensorsDrivers[type].add(customDeviceId, function(err){
						if (err) { // Cancelling Modif:
							models.Sensor.destroy({id: sensor.id})
								.success(function() {
									cb(err, null);
									return;
								});
						}
						else cb(null, sensor.id);
					});
				})
				.error(function(err) {
					cb(err, null);
				});
			
		} else {
			cb('Device not supported', null);
		}
	}
	/**
	 * serviceCreateSensor
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 * 		- type (String): 					Type of sensor				                - required
	 * 		- name (String): 					Human-readable name			                - required
	 *		- customId (String): 				Custom ID for the driver 	                - required
	 *		- baseStationUrl (String): 			Address where the base station is running	- required
	 */
	function serviceCreateSensor(req, resp) {
		logger.info("<Service> CreateSensor.");
		var sensorData = parseRequest(req, ['type', 'customId', 'name', 'baseAddr']);
		
		writeHeaders(resp);
		createSensor(sensorData.type, sensorData.name, sensorData.customId, sensorData.baseAddr, function(err, id) {
			if (err) { error(10, resp, err); return; }
			resp.end(JSON.stringify({ status: 'ok', id: id }));
		});
	}
	 
	/**
	 * getSensors
	 * ====
	 * Returns a list of sensors.
	 * Parameters:
	 *	- type (String): 					Type of sensor to find
	 *	- customId (String): 				Custom ID to find
	 *	- limit (int): 					Number max of sensors to return
	 *	- offset (int): 				Number of the sensor to start with
	 *	- cb (Function(err, Sensor[])):	Callback
	 */
	function getSensors(type, customId, limit, offset, cb) {
		if (!offset) offset = 0;
		var conditions = {};
		if (type) { condition.type = type; }
		if (customId) { condition.customId = customId; }
		
		if (limit) {
			models.Sensor.findAll({ where: conditions, offset: offset, limit: limit, raw: true })
				.success(function(ans){cb(null, ans);})
				.error(function(err) {
					cb(err, null);
				});
		}
		else {
			models.Sensor.findAll({ where: conditions, offset: offset, raw: true })
				.success(function(ans){cb(null, ans);})
				.error(function(err) {
					cb(err, null);
				});
		}
	}
	/**
	 * serviceGetSensors
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 *		- type (String): 		Type of sensor to find				- optional
	 *		- customId (String): 	Custom ID to find					- optional
	 *		- limit (int): 			Number max to return				- optional
	 *		- offset (int): 		Number of the sensor to start with	- optional
	 */
	function serviceGetSensors(req, resp) {
		logger.info("<Service> GetSensors.");
		var getData = parseRequest(req, ['limit', 'offset', 'type', 'customId']);
		
		writeHeaders(resp);
		getSensors(getData.type, getData.customId, getData.limit, getData.offset, function (err, sensors) {
			if (err) { error(2, resp, err); return; }
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
		models.Sensor.find(id)
			.success(function(ans){cb(null, ans);})
			.error(function(err) {
				cb(err, null);
			});
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
		getSensor(getData.id, function(err, sensor) {
			if (err) { error(2, resp, err); return; }
			resp.end(JSON.stringify({ sensor: (sensor?sensor.values:null) })); 
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
		models.Sensor.find(id)
			.success(function(sensor){
				cb(null, sensor.type);
			})
			.error(function(err) {
				cb(err, null);
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
		getSensorType(getData.id, function(err, type) {
			if (err) { error(2, resp, err); return; }
			resp.end(JSON.stringify({ type: type })); 
		});
	}
	
	/**
	 * getSensorName
	 * ====
	 * Returns the Sensor's name
	 * Parameters:
	 *	- id (String): 				ID
	 *	- cb (Function(err, name):	Callback
	 */
	function getSensorName(id, cb) {
		models.Sensor.find(id)
			.success(function(sensor){
				cb(null, sensor.name);
			})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceGetSensorName
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetSensorName(req, resp) {
		logger.info("<Service> GetSensorName.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getSensorName(getData.id, function(err, name) {
			if (err) { error(2, resp, err); return; }
			resp.end(JSON.stringify({ name: name })); 
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
		models.Sensor.find(id)
			.success(function(sensor){
				cb(null, sensor.customId);
			})
			.error(function(err) {
				cb(err, null);
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
		getSensorCustomId(getData.id, function(err, customId) {
			if (err) { error(2, resp, err); return; }
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
		getSensor(id, function(err, prevSensor) { // Getting info for driver
			if (err) { error(2, resp, err); return; }
			sensorsDrivers[prevSensor.type].remove(prevSensor.customId, function(err){
				if (err) {
					cb(err, null);
					return;
				}
				// Remove from DB:
				models.Sensor.destroy({id: id})
					.success(function() {
						cb(null, true);
					})
					.error(function(err1) { // Cancelling Modif:
						sensorsDrivers[prevSensor.type].add(prevSensor.customId, function(err2){
							if (err2) {
								cb('Device removed from system but not DB. Contact Admin', null);
								return;
							}
							cb(err1, null);
						});
					});
			});
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
		deleteSensor(getData.id, function (err, bool) {
			if (err) { error(2, resp, err); return; }
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
	 * 	- name (String):			Human-readable name
	 *	- customId (String): 		Custom ID for the driver
	 *	- cb (Function(bool)):		Callback
	 */ 
	function updateSensor(id, type, name,customId, cb) {
		if (sensorsDrivers[type]) { // If this kind of device is supported:
			getSensor(id, function(err, prevSensor) { // Getting previous customId to inform the Driver of the update:
				if (err) { error(2, resp, err); return; }
				// Add to DB:
				models.Sensor.update({type: type, customId: customId, name:name}, {id: id})
					.success(function() {
						// Inform the driver of the change:
						sensorsDrivers[type].update(prevSensor.customId, customId, function(err){
								if (err) { // Cancelling Modif:
									models.Sensor.update({type: prevSensor.type, customId: prevSensor.customId}, {id: id})
										.success(function() {
											cb(err, null);
											return;
										});
								}
								else cb(null, true);
							});
					})
					.error(function(err) {
						cb(err, null);
					});
			});
			
		} else {
			cb('Device not supported', null);
		}
	}
	/**
	 * serviceUpdateSensor
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 * 		- type (String): 					Type of sensor				- required
	 * 		- name (String):					Human-readable name			- required
	 *		- customId (String): 				Custom ID for the driver 	- required
	 */
	function serviceUpdateSensor(req, resp) {
		logger.info("<Service> UpdateSensor.");
		var sensorData = parseRequest(req, ['id', 'type', 'customId', 'name']);
		
		writeHeaders(resp);
		updateSensor(sensorData.id, sensorData.type, sensorData.name, sensorData.customId, function(err, bool) {
			if (err) { error(2, resp, err); return; }
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
			models.Sensor.update({type: type}, {id: id})
			.success(function() {
				cb(null, true);
			})
			.error(function(err) {
				cb(err, null);
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
		updateSensorType(sensorData.id, sensorData.type, function(err, bool) {
			if (!bool) error(2, resp);
			else resp.end(JSON.stringify({ status: 'ok' })); 
		});
	}
	
	/**
	 * updateSensorName
	 * ====
	 * Update the name of the Sensor corresponding to the given id
	 * Parameters:
	 *	- id (String): 				ID
	 *	- name (String): 			Name to change
	 *	- cb (Function(bool):		Callback
	 */ 
	function updateSensorName(id, name, cb) {
			models.Sensor.update({name: name}, {id: id})
			.success(function() {
				cb(null, true);
			})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceUpdateSensorName
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		- name (String): 	Name 		- required
	 */
	function serviceUpdateSensorName(req, resp) {
		logger.info("<Service> UpdateSensorName.");
		var sensorData = parseRequest(req, ['id', 'name']);
		
		writeHeaders(resp);
		updateSensorName(sensorData.id, sensorData.name, function(err, bool) {
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
		getSensor(id, function(err, prevSensor) { // Getting previous customId to inform the Driver of the update:
			if (err) { error(2, resp, err); return; }
				// Add to DB:
				models.Sensor.update({type: type, customId: customId}, {id: id})
					.success(function() {
						// Inform the driver of the change:
						sensorsDrivers[prevSensor.type].update(prevSensor.customId, customId, function(err){
								if (err) { // Cancelling Modif:
									models.Sensor.update({customId: prevSensor.customId}, {id: id})
										.success(function() {
											cb(err, null);
											return;
										});
								}
								else cb(null, true);
							});
					})
					.error(function(err) {
						cb(err, null);
					});
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
		updateSensorCustomId(sensorData.id, sensorData.customId, function(err, bool) {
			if (err) { error(2, resp, err); return; }
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
	 * 	- name (String):					Human-readable name
	 *	- customId (String): 				Custom ID for the driver
	 *	- cb (Function(Erreur, int)):		Callback
	 */
	function createActuator(type, name, customId, cb) {
		if (actuatorsDrivers[type]) { // If this kind of device is supported:
			// Add to DB:
			models.Actuator.findOrCreate({ customId: customId, type: type }, { name: name })
				.success(function(actuator, created) {
					if (!created) {
						cb('Device already added', actuator.id);
						return;
					}
					
					// Let the driver handle the integration of the device to the system:
					actuatorsDrivers[type].add(customId, function(err){
						if (err) { // Cancelling Modif:
							models.Actuator.destroy({id: actuator.id})
								.success(function() {
									cb(err, null);
									return;
								});
						}
						else cb(null, actuator.id);
					});
				})
				.error(function(err) {
					cb(err, 'nok');
				});
			
		} else {
			cb('Device not supported', null);
		}
	}
	/**
	 * serviceCreateActuator
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 * 		- type (String): 					Type of actuator			- required
	 * 		- name (String):					Human-readable name			- required
	 *		- customId (String): 				Custom ID for the driver 	- required
	 */
	function serviceCreateActuator(req, resp) {
		logger.info("<Service> CreateActuator.");
		var actuatorData = parseRequest(req, ['type', 'customId', 'name']);
		
		writeHeaders(resp);
		createActuator(actuatorData.type, actuatorData.name, actuatorData.customId, function(err, id) {
			if (err) { error(10, resp, err); return; }
			resp.end(JSON.stringify({ status: 'ok', id: id }));
		});
	}
	
	/**
	 * getActuators
	 * ====
	 * Returns a list of actuators.
	 * Parameters:
	 *	- type (String): 				Type of actuators to find
	 *	- customId (String): 			Custom ID to find
	 *	- limit (int): 					Number max of actuators to return
	 *	- offset (int): 				Number of the actuator to start with
	 *	- cb (Function(err, Actuator[])):	Callback
	 */
	function getActuators(type, customId, limit, offset, cb) {
		if (!offset) offset = 0;
		var conditions = {};
		if (type) { condition.type = type; }
		if (customId) { condition.customId = customId; }
		if (limit) {
			models.Actuator.findAll({ where: conditions, offset: offset, limit: limit, raw: true })
				.success(function(ans){cb(null, ans);})
				.error(function(err) {
					cb(err, null);
				});
		}
		else {
			models.Actuator.findAll({ where: conditions, offset: offset, raw: true })
				.success(function(ans){cb(null, ans);})
				.error(function(err) {
					cb(err, null);
				});
		}
	}
	/**
	 * serviceGetActuators
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 *		- type (String): 	Type of actuators to find				- optional
	 *		- customId (String):Custom ID to find						- optional
	 *		- limit (int): 		Number max to return					- optional
	 *		- offset (int): 	Number of the actuator to start with	- optional
	 */
	function serviceGetActuators(req, resp) {
		logger.info("<Service> GetActuators.");
		var getData = parseRequest(req, ['limit', 'offset']);
		
		writeHeaders(resp);
		getActuators(getData.limit, getData.offset, function(err, actuators) {
			if (err) { error(2, resp, err); return; }
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
		models.Actuator.find(id)
			.success(function(ans){cb(null, ans);})
			.error(function(err) {
				cb(err, null);
			});
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
		getActuator(getData.id, function(err, actuator) {
			if (err) { error(2, resp, err); return; }
			resp.end(JSON.stringify({ actuator: (actuator?actuator.values:null) })); 
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
		models.Actuator.find(id)
			.success(function(actuator){
				cb(null, actuator.type);
			})
			.error(function(err) {
				cb(err, null);
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
		getActuatorType(getData.id, function(err, type) {
			if (err) { error(2, resp, err); return; }
			resp.end(JSON.stringify({ type: type })); 
		});
	}
	
	/**
	 * getActuatorName
	 * ====
	 * Returns the Actuator's name
	 * Parameters:
	 *	- id (String): 				ID
	 *	- cb (Function(err, name):	Callback
	 */
	function getActuatorName(id, cb) {
		models.Actuator.find(id)
			.success(function(actuator){
				cb(null, actuator.name);
			})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceGetActuatorName
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetActuatorName(req, resp) {
		logger.info("<Service> GetActuatorName.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getActuatorName(getData.id, function(err, name) {
			if (err) { error(2, resp, err); return; }
			resp.end(JSON.stringify({ name: name })); 
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
		models.Actuator.find(id)
			.success(function(actuator){
				cb(null, actuator.customId);
			})
			.error(function(err) {
				cb(err, null);
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
		getActuatorCustomId(getData.id, function(err, customId) {
			if (err) { error(2, resp, err); return; }
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
		getActuator(id, function(err, prevActuator) { // Getting info in case it goes wrong
			if (err) { error(2, resp, err); return; }
			actuatorsDrivers[prevActuator.type].remove(prevActuator.customId, function(err){
				if (err) {
					cb(err, null);
					return;
				}
				// Remove from DB:
				models.Actuator.destroy({id: id})
					.success(function() {
						cb(null, true);
					})
					.error(function(err1) { // Cancelling Modif:
						actuatorsDrivers[prevActuator.type].add(prevActuator.customId, function(err2){
							if (err2) {
								cb('Device removed from system but not DB. Contact Admin', null);
								return;
							}
							cb(err1, null);
						});
					});
			});
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
		deleteActuator(getData.id, function (err, bool) {
			if (err) { error(2, resp, err); return; }
			if (!bool) error(2, resp);
			else resp.end(JSON.stringify({ status: 'ok' })); 
		});
	}
	
	/**
	 * updateActuator
	 * ====
	 * Update the Actuator corresponding to the given id
	 * Parameters:
	 * 	- id (String):				ID
	 *	- type (String): 			Type of actuator
	 * 	- name (String):			Human-readable name
	 *	- customId (String): 		Custom ID for the driver
	 *	- cb (Function(bool)):		Callback
	 */ 
	function updateActuator(id, type, name, customId, cb) {
		if (actuatorsDrivers[type]) { // If this kind of device is supported:
			getActuator(id, function(err, prevActuator) { // Getting previous customId to inform the Driver of the update:
				if (err) { error(2, resp, err); return; }
				// Add to DB:
				models.Actuator.update({type: type, customId: customId, name: name}, {id: id})
					.success(function() {
						// Inform the driver of the change:
						actuatorsDrivers[type].update(prevActuator.customId, customId, function(err){
								if (err) { // Cancelling Modif:
									models.Actuator.update({type: prevActuator.type, customId: prevActuator.customId}, {id: id})
										.success(function() {
											cb(err, null);
											return;
										});
								}
								else cb(null, true);
							});
					})
					.error(function(err) {
						cb(err, null);
					});
			});
			
		} else {
			cb('Device not supported', null);
		}
	}
	/**
	 * serviceUpdateActuator
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 * 		- type (String): 					Type of actuator			- required
	 * 		- name (String):					Human-readable name			- required
	 *		- customId (String): 				Custom ID for the driver 	- required
	 */
	function serviceUpdateActuator(req, resp) {
		logger.info("<Service> UpdateActuator.");
		var actuatorData = parseRequest(req, ['id', 'type', 'customId', 'name']);
		
		writeHeaders(resp);
		updateActuator(actuatorData.id, actuatorData.type, actuatorData.name, actuatorData.customId, function(err, bool) {
			if (err) { error(2, resp, err); return; }
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
			models.Actuator.update({type: type}, {id: id})
			.success(function() {
				cb(null, true);
			})
			.error(function(err) {
				cb(err, null);
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
		updateActuatorType(actuatorData.id, actuatorData.type, function(err, bool) {
			if (err) { error(2, resp, err); return; }
			if (!bool) error(2, resp);
			else resp.end(JSON.stringify({ status: 'ok' })); 
		});
	}
		
	/**
	 * updateActuatorName
	 * ====
	 * Update the name of the Actuator corresponding to the given id
	 * Parameters:
	 *	- id (String): 				ID
	 *	- name (String): 			Name to change
	 *	- cb (Function(bool):		Callback
	 */ 
	function updateActuatorName(id, name, cb) {
			models.Actuator.update({name: name}, {id: id})
			.success(function() {
				cb(null, true);
			})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceUpdateActuatorName
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		- name (String): 	Name 		- required
	 */
	function serviceUpdateActuatorName(req, resp) {
		logger.info("<Service> UpdateActuatorName.");
		var actuatorData = parseRequest(req, ['id', 'name']);
		
		writeHeaders(resp);
		updateActuatorName(actuatorData.id, actuatorData.name, function(err, bool) {
			if (err) { error(2, resp, err); return; }
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
		getActuator(id, function(err, prevActuator) { // Getting previous customId to inform the Driver of the update:
			if (err) { error(2, resp, err); return; }
			// Add to DB:
			models.Actuator.update({type: type, customId: customId}, {id: id})
				.success(function(actuator) {
					// Inform the driver of the change:
					actuatorsDrivers[prevActuator.type].update(prevActuator.customId, customId, function(err){
							if (err) { // Cancelling Modif:
								models.Actuator.update({customId: prevActuator.customId}, {id: id})
									.success(function() {
										cb(err, null);
										return;
									});
							}
							else cb(null, true);
						});
				})
				.error(function(err) {
					cb(err, null);
				});
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
		updateActuatorCustomId(actuatorData.id, actuatorData.customId, function(err, bool) {
			if (err) { error(2, resp, err); return; }
			if (!bool) error(2, resp);
			else resp.end(JSON.stringify({ status: 'ok' })); 
		});
	}	
	 

	/*
	 * ------------------------------------------
	 * MEASURES - CRUD Services
	 * ------------------------------------------
	 */
	 
	/**
	 * createMeasure
	 * ====
	 * Add a measure to the DB and system, if there is a driver to handle it.
	 * Parameters:
	 *	- value (float): 				Value
	 * 	- sensorId (int):				ID of the sensor
	 * 	- time (Date):					Date
	 *	- measureType (String): 		Type of measure
	 *	- cb (Function(Erreur, int)):		Callback
	 */
	function createMeasure(value, sensorId, time, measureType, cb) {
		if (!time) { time = new Date(); }
		
		models.Sensor.find({where: {customId:sensorId}})
			.success(function(sensor){
				if (!sensor) { cb('Sensor doesn\'t exist', null); return; }
				models.Measure.create({ value: value, measureType: measureType, time: time, sensorId: sensorId })
					.success(function(measure) {
						sensor.addMeasure(measure)
							.success(function() { cb(null, measure.id); })
							.error(function(err) {
								measure.destroy().success(function() {
									cb(err, null);
								})
							});
					})
					.error(function(err) {
						cb(err, null);
					});
			})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceCreateMeasure
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 *		- value (float): 				Value				- required
	 * 		- sensorId (int):				ID of the sensor	- required
	 * 		- time (Date):					Date				- required
	 *		- measureType (String): 		Type of measure		- required
	 */
	function serviceCreateMeasure(req, resp) {
		logger.info("<Service> CreateMeasure.");
		var light    = req.headers.light;
		var temp     = req.headers.temp;
		var sensorId = req.headers.address;
		var time     = new Date();
		
		writeHeaders(resp);
		createMeasure(light, sensorId, time, 'LIGHT',function(err, id) {
			if (err) { error(10, resp, err); return; }
		});
		createMeasure(temp, sensorId, time, 'TEMPERATURE',function(err, id) {
			if (err) { error(10, resp, err); return; }
			resp.end(JSON.stringify({ status: 'ok', id: id }));
		});
	}
	 
	/**
	 * getMeasures
	 * ====
	 * Returns a list of measures.
	 * Parameters:
	 *	- limit (int): 					Number max of measures to return
	 *	- offset (int): 				Number of the measure to start with
	 *	- cb (Function(err, Measure[])):	Callback
	 */
	function getMeasures(limit, offset, cb) {
		if (!offset) offset = 0;
		if (limit) {
			models.Measure.findAll({ offset: offset, limit: limit, raw: true })
				.success(function(ans){cb(null, ans);})
				.error(function(err) {
					cb(err, null);
				});
		}
		else {
			models.Measure.findAll({ offset: offset, raw: true })
				.success(function(ans){cb(null, ans);})
				.error(function(err) {
					cb(err, null);
				});
		}
	}
	/**
	 * serviceGetMeasures
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 *		- limit (int): 		Number max to return				- optional
	 *		- offset (int): 	Number of the measure to start with	- optional
	 */
	function serviceGetMeasures(req, resp) {
		logger.info("<Service> GetMeasures.");
		var getData = parseRequest(req, ['limit', 'offset']);
		
		writeHeaders(resp);
		getMeasures(getData.limit, getData.offset, function (err, measures) {
			if (err) { error(2, resp, err); return; }
			resp.end(JSON.stringify({ measures: measures })); 
		});
	}	
	  
	/**
	 * getRecentMeasuresPerSensor
	 * ====
	 * Returns a list of measures of a Sensor, created after a given Date.
	 * Parameters:
	 *	- sensorId (int): 			Sensor ID
	 *	- date (Date): 				Date
	 *	- cb (Function(err, Measure[])):	Callback
	 */
	function getRecentMeasuresPerSensor(sensorId, date, cb) {
		logger.error(date);
		if (!date) date = new Date(0);
		models.Measure.findAll({ where: ["sensorId = ? AND time > ?", sensorId, date] }, {raw: true })
			.success(function(ans){cb(null, ans);})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceGetRecentMeasuresPerSensor
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 *	- sensorId (int): 			Sensor ID	- required
	 *	- date (Date): 				Date		- required
	 */
	function serviceGetRecentMeasuresPerSensor(req, resp) {
		logger.info("<Service> GetRecentMeasuresPerSensor.");
		var getData = parseRequest(req, ['sensorId', 'date']);
		
		writeHeaders(resp);
		getRecentMeasuresPerSensor(getData.sensorId, getData.date, function (err, measures) {
			if (err) { error(2, resp, err); return; }
			resp.end(JSON.stringify({ measures: measures })); 
		});
	}	
	
	
	/*
	 * ------------------------------------------
	 * MEASURE Services
	 * ------------------------------------------
	 */
	 
	/**
	 * getMeasure
	 * ====
	 * Returns the Measure corresponding to the given id
	 * Parameters:
	 *	- id (int): 					Id
	 *	- cb (Function(Measure)):	Callback
	 */
	function getMeasure(id, cb) {
		models.Measure.find(id)
			.success(function(ans){cb(null, ans);})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceGetMeasure
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetMeasure(req, resp) {
		logger.info("<Service> GetMeasure.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getMeasure(getData.id, function(err, measure) {
			if (err) { error(2, resp, err); return; }
			resp.end(JSON.stringify({ measure: (measure?measure.values:null) })); 
		});
	}
	 
	/**
	 * getMeasureMeasureType
	 * ====
	 * Returns the Measure's measureType
	 * Parameters:
	 *	- id (String): 				ID
	 *	- cb (Function(err, measureType):	Callback
	 */
	function getMeasureMeasureType(id, cb) {
		models.Measure.find(id)
			.success(function(measure){
				cb(null, measure.measureType);
			})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceGetMeasureMeasureType
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetMeasureMeasureType(req, resp) {
		logger.info("<Service> GetMeasureMeasureType.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getMeasureMeasureType(getData.id, function(err, measureType) {
			if (err) { error(2, resp, err); return; }
			resp.end(JSON.stringify({ measureType: measureType })); 
		});
	}
	
	/**
	 * getMeasureValue
	 * ====
	 * Returns the Measure's value
	 * Parameters:
	 *	- id (String): 				ID
	 *	- cb (Function(err, value):	Callback
	 */
	function getMeasureValue(id, cb) {
		models.Measure.find(id)
			.success(function(measure){
				cb(null, measure.value);
			})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceGetMeasureValue
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetMeasureValue(req, resp) {
		logger.info("<Service> GetMeasureValue.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getMeasureValue(getData.id, function(err, value) {
			if (err) { error(2, resp, err); return; }
			resp.end(JSON.stringify({ value: value })); 
		});
	}
	
	/**
	 * getMeasureTime
	 * ====
	 * Returns the Measure's time
	 * Parameters:
	 *	- id (String): 				ID
	 *	- cb (Function(err, time):	Callback
	 */
	function getMeasureTime(id, cb) {
		models.Measure.find(id)
			.success(function(measure){
				cb(null, measure.time);
			})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceGetMeasureTime
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetMeasureTime(req, resp) {
		logger.info("<Service> GetMeasureTime.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getMeasureTime(getData.id, function(err, time) {
			if (err) { error(2, resp, err); return; }
			resp.end(JSON.stringify({ time: time })); 
		});
	}
	
	/**
	 * getMeasureSensor
	 * ====
	 * Returns the Measure's sensor
	 * Parameters:
	 *	- id (String): 				ID
	 *	- cb (Function(err, sensor):	Callback
	 */
	function getMeasureSensor(id, cb) {
		models.Measure.find(id)
			.success(function(measure){
				measure.getSensor()
					.success(function(sensor){
						cb(null, sensor);
					})
				.error(function(err) {
					cb(err, null);
				});
			})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceGetMeasureSensor
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetMeasureSensor(req, resp) {
		logger.info("<Service> GetMeasureSensor.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getMeasureSensor(getData.id, function(err, sensor) {
			if (err) { error(2, resp, err); return; }
			resp.end(JSON.stringify({ sensor: sensor })); 
		});
	}
	
	/**
	 * deleteMeasure
	 * ====
	 * Delete the Measure corresponding to the given id
	 * Parameters:
	 *	- id (String): 			ID
	 *	- cb (Function(bool)):	Callback
	 */
	function deleteMeasure(id, cb) {
		models.Measure.destroy({id: id})
			.success(function() {
				cb(null, true);
			})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceDeleteMeasure
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceDeleteMeasure(req, resp) {
		logger.info("<Service> DeleteMeasure.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		deleteMeasure(getData.id, function (err, bool) {
			if (err) { error(2, resp, err); return; }
			if (!bool) error(2, resp);
			else resp.end(JSON.stringify({ status: 'ok' })); 
		});
	}
	
	/**
	 * updateMeasure
	 * ====
	 * Update the Measure corresponding to the given id
	 * Parameters:
	 *	- id (float): 				ID
	 *	- value (float): 			Value
	 * 	- time (Date):				Date
	 *	- measureType (String): 	Type of measure
	 *	- cb (Function(bool)):		Callback
	 */ 
	function updateMeasure(id, value, time, measureType, cb) {
		models.Measure.update({ value: value, measureType: measureType, time: time }, {id: id})
			.success(function() {
				cb(null, true);
			})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceUpdateMeasure
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		- value (float): 			Value
	 * 		- sensorId (int):			ID of the sensor
	 * 		- time (Date):				Date
	 *		- measureType (String): 	Type of measure 	- required
	 */
	function serviceUpdateMeasure(req, resp) {
		logger.info("<Service> UpdateMeasure.");
		var measureData = parseRequest(req, ['id', 'value', 'time', 'measureType']);
		
		writeHeaders(resp);
		updateMeasure(measureData.id, measureData.value, measureData.time, measureData.measureType, function(err, bool) {
			if (err) { error(2, resp, err); return; }
			if (!bool) error(2, resp);
			else resp.end(JSON.stringify({ status: 'ok' })); 
		});
	}
		
	/**
	 * updateMeasureMeasureType
	 * ====
	 * Update the measureType of the Measure corresponding to the given id
	 * Parameters:
	 *	- id (String): 				ID
	 *	- measureType (String): 	MeasureType to change
	 *	- cb (Function(bool):		Callback
	 */ 
	function updateMeasureMeasureType(id, measureType, cb) {
			models.Measure.update({measureType: measureType}, {id: id})
			.success(function() {
				cb(null, true);
			})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceUpdateMeasureMeasureType
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		- measureType (String): 	MeasureType 		- required
	 */
	function serviceUpdateMeasureMeasureType(req, resp) {
		logger.info("<Service> UpdateMeasureMeasureType.");
		var measureData = parseRequest(req, ['id', 'measureType']);
		
		writeHeaders(resp);
		updateMeasureMeasureType(measureData.id, measureData.measureType, function(err, bool) {
			if (err) { error(2, resp, err); return; }
			if (!bool) error(2, resp);
			else resp.end(JSON.stringify({ status: 'ok' })); 
		});
	}
	
	/**
	 * updateMeasureValue
	 * ====
	 * Update the value of the Measure corresponding to the given id
	 * Parameters:
	 *	- id (String): 				ID
	 *	- value (float): 			Value to change
	 *	- cb (Function(bool):		Callback
	 */ 
	function updateMeasureValue(id, value, cb) {
			models.Measure.update({value: value}, {id: id})
			.success(function() {
				cb(null, true);
			})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceUpdateMeasureValue
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		- value (float): 	Value 		- required
	 */
	function serviceUpdateMeasureValue(req, resp) {
		logger.info("<Service> UpdateMeasureValue.");
		var measureData = parseRequest(req, ['id', 'value']);
		
		writeHeaders(resp);
		updateMeasureValue(measureData.id, measureData.value, function(err, bool) {
			if (err) { error(2, resp, err); return; }
			if (!bool) error(2, resp);
			else resp.end(JSON.stringify({ status: 'ok' })); 
		});
	}	
	
	/**
	 * updateMeasureTime
	 * ====
	 * Update the time of the Measure corresponding to the given id
	 * Parameters:
	 *	- id (String): 				ID
	 *	- time (Date): 				Time to change
	 *	- cb (Function(bool):		Callback
	 */ 
	function updateMeasureTime(id, time, cb) {
			models.Measure.update({time: time}, {id: id})
			.success(function() {
				cb(null, true);
			})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceUpdateMeasureTime
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		- time (Date): 	Time 		- required
	 */
	function serviceUpdateMeasureTime(req, resp) {
		logger.info("<Service> UpdateMeasureTime.");
		var measureData = parseRequest(req, ['id', 'time']);
		
		writeHeaders(resp);
		updateMeasureTime(measureData.id, measureData.time, function(err, bool) {
			if (err) { error(2, resp, err); return; }
			if (!bool) error(2, resp);
			else resp.end(JSON.stringify({ status: 'ok' })); 
		});
	}
			
	/**
	 * updateMeasureSensor
	 * ====
	 * Update the sensor of the Measure corresponding to the given id
	 * Parameters:
	 *	- id (String): 				ID
	 *	- sensorId (int): 			ID of new Sensor
	 *	- cb (Function(bool):		Callback
	 */ 
	function updateMeasureSensor(id, sensorId, cb) {
		models.Measure.find(id)
			.success(function(measure){
				measure.setSensor(sensorId)
					.success(function(){
						cb(null, true);
					})
				.error(function(err) {
					cb(err, false);
				});
			})
			.error(function(err) {
				cb(err, false);
			});
	}
	/**
	 * serviceUpdateMeasureSensor
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		- sensorId (int): 	ID of new Sensor - required
	 */
	function serviceUpdateMeasureSensor(req, resp) {
		logger.info("<Service> UpdateMeasureSensor.");
		var measureData = parseRequest(req, ['id', 'sensorId']);
		
		writeHeaders(resp);
		updateMeasureSensor(measureData.id, measureData.sensorId, function(err, bool) {
			if (err) { error(2, resp, err); return; }
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
		models.Rule.create({ name: name })
			.success(function(rule) {
				cb(null, rule.id);
			})
			.error(function(err) {
				cb(err, null);
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
	 * createSimpleRule
	 * ====
	 * Add a rule to the DB and system, binding only 1 sensor to 1 actuator
	 * Parameters:
	 *	- name (String): 					Name of the rule
	 *	- measureType (String): 			Type of measure concerned
	 *	- intervalStart (float): 			Smallest Value concerned
	 *	- intervalEnd (float): 				Biggest Value concerned
	 *	- value (float): 					Value to send to the actuator
	 *	- isActive (bool): 					IsActive Flag
	 *	- cb (Function(Erreur, int)):		Callback
	 */
	function createSimpleRule(name, measureType, intervalStart, intervalEnd, cb) {
		models.Rule.create({ name: name })
			.success(function(rule) {
				models.SensorRule.create({ measureType: measureType, intervalStart: intervalStart, intervalEnd: intervalEnd })
					.success(function(sensorRule) {
						sensor.addSensorRule(sensorRule)
							.success(function() {
								models.ActuatorRule.create({ value: value, isActive: isActive })
									.success(function(actuatorRule) {
										actuator.addActuatorRule(actuatorRule)
											.success(function() { cb(null, rule.id); })
											.error(function(err) {
												actuatorRule.destroy().success(function() {
													cb(err, null);
												})
											});
									})
									.error(function(err) {
										cb(err, null);
									});
							})
							.error(function(err) {
								sensorRule.destroy().success(function() {
									cb(err, null);
								})
							});
					})
					.error(function(err) {
						cb(err, null);
					});
			})
			.error(function(err) {
				cb(err, null);
			});
	}
	
	/**
	 * serviceCreateSimpleRule
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 * 		- name (String): 			Name of the rule				- required
	 *		- measureType (String): 	Type of measure concerned		- required
	 *		- intervalStart (float): 	Smallest Value concerned		- required
	 *		- intervalEnd (float): 		Biggest Value concerned			- required
	 *		- value (float): 			Value to send to the actuator	- required
	 *		- isActive (bool): 			IsActive Flag					- required
	 *		- customId (String): 		Custom ID for the driver 		- required
	 */
	function serviceCreateSimpleRule(req, resp) {
		logger.info("<Service> CreateSimpleRule.");
		var ruleData = parseRequest(req, ['name', 'measureType', 'intervalStart', 'intervalEnd', 'value', 'isActive', ]);
		
		writeHeaders(resp);
		createSimpleRule(ruleData.name, ruleData.measureType, ruleData.intervalStart, ruleData.intervalEnd, ruleData.value, ruleData.isActive, function(err, id) {
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
			models.Rule.findAll({ offset: offset, limit: limit, raw: true })
				.success(function(ans){cb(null, ans);})
				.error(function(err) {
					cb(err, null);
				});
		}
		else {
			models.Rule.findAll({ offset: offset, raw: true })
				.success(function(ans){cb(null, ans);})
				.error(function(err) {
					cb(err, null);
				});
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
		getRules(getData.limit, getData.offset, function(err, rules) {
			if (err) { error(2, resp, err); return; }
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
		models.Rule.find(id).success(function(ans){cb(null, ans);});
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
		getRule(getData.id, function(err, rule) {
			if (err) { error(2, resp, err); return; }
			resp.end(JSON.stringify({ rule: (rule?rule.values:null) })); 
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
		models.Rule.find(id)
			.success(function(rule){
				cb(null, rule.name);
			})
			.error(function(err) {
				cb(err, null);
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
		getRuleName(getData.id, function(err, name) {
			if (err) { error(2, resp, err); return; }
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
		models.Rule.destroy({id: id})
			.success(function() {
				cb(null, true);
			})
			.error(function(err) {
				cb(err, null);
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
		deleteRule(getData.id, function (err, bool) {
			if (err) { error(2, resp, err); return; }
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
		models.Rule.update({name: name}, {id: id})
			.success(function() {
				cb(null, true);
			})
			.error(function(err) {
				cb(err, null);
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
		updateRule(ruleData.id, ruleData.name, function(err, bool) {
			if (err) { error(2, resp, err); return; }
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
			models.Rule.update({name: name}, {id: id})
			.success(function() {
				cb(null, true);
			})
			.error(function(err) {
				cb(err, null);
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
		updateRuleName(ruleData.id, ruleData.name, function(err, bool) {
			if (err) { error(2, resp, err); return; }
			if (!bool) error(2, resp);
			else resp.end(JSON.stringify({ status: 'ok' })); 
		});
	}
	 

	/*
	 * ------------------------------------------
	 * SENSORRULES - CRUD Services
	 * ------------------------------------------
	 */
	 
	/**
	 * createSensorRule
	 * ====
	 * Add a sensorRule to the DB and system.
	 * Parameters:
	 *	- ruleId (int): 					ID of the parent Rule
	 *	- measureType (String): 			Type of measure concerned
	 *	- intervalStart (float): 			Smallest Value concerned
	 *	- intervalEnd (float): 				Biggest Value concerned
	 *	- cb (Function(Erreur, int)):		Callback
	 */
	function createSensorRule(ruleId, measureType, intervalStart, intervalEnd, cb) {
		models.Rule.find(ruleId)
			.success(function(rule){
				if (!rule) { cb('Rule doesn\'t exist', null); return; }
				models.SensorRule.create({ measureType: measureType, intervalStart: intervalStart, intervalEnd: intervalEnd })
					.success(function(sensorRule) {
						sensor.addSensorRule(sensorRule)
							.success(function() { cb(null, sensorRule.id); })
							.error(function(err) {
								sensorRule.destroy().success(function() {
									cb(err, null);
								})
							});
					})
					.error(function(err) {
						cb(err, null);
					});
			})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceCreateSensorRule
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 *	- ruleId (String): 					ID of the parent Rule		- required
	 *	- measureType (String): 			Type of measure concerned	- required
	 *	- intervalStart (float): 			Smallest Value concerned	- required
	 *	- intervalEnd (float): 				Biggest Value concerned 	- required
	 */
	function serviceCreateSensorRule(req, resp) {
		logger.info("<Service> CreateSensorRule.");
		var sensorRuleData = parseRequest(req, ['ruleId', 'measureType', 'intervalStart', 'intervalEnd']);
		
		writeHeaders(resp);
		createSensorRule(sensorRuleData.ruleId, sensorRuleData.measureType, sensorRuleData.intervalStart, sensorRuleData.intervalEnd, function(err, id) {
			if (err) { error(10, resp, err); return; }
			resp.end(JSON.stringify({ status: 'ok', id: id }));
		});
	}
	 
	/**
	 * getSensorRules
	 * ====
	 * Returns a list of sensorRules.
	 * Parameters:
	 *	- limit (int): 					Number max of sensorRules to return
	 *	- offset (int): 				Number of the sensorRule to start with
	 *	- cb (Function(err, SensorRule[])):	Callback
	 */
	function getSensorRules(limit, offset, cb) {
		if (!offset) offset = 0;
		if (limit) {
			models.SensorRule.findAll({ offset: offset, limit: limit, raw: true })
				.success(function(ans){cb(null, ans);})
				.error(function(err) {
					cb(err, null);
				});
		}
		else {
			models.SensorRule.findAll({ offset: offset, raw: true })
				.success(function(ans){cb(null, ans);})
				.error(function(err) {
					cb(err, null);
				});
		}
	}
	/**
	 * serviceGetSensorRules
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 *		- limit (int): 		Number max to return				- optional
	 *		- offset (int): 	Number of the sensorRule to start with	- optional
	 */
	function serviceGetSensorRules(req, resp) {
		logger.info("<Service> GetSensorRules.");
		var getData = parseRequest(req, ['limit', 'offset']);
		
		writeHeaders(resp);
		getSensorRules(getData.limit, getData.offset, function(err, sensorRules) {
			if (err) { error(2, resp, err); return; }
			resp.end(JSON.stringify({ sensorRules: sensorRules })); 
		});
	}	
	 
	/**
	 * getsensorRulesPerRule
	 * ====
	 * Returns a list of sensorRules of a Rule
	 * Parameters:
	 *	- ruleId (int): 			Rule ID
	 *	- cb (Function(err, sensorRule[])):	Callback
	 */
	function getsensorRulesPerRule(ruleId, cb) {
		logger.error(date);
		if (!date) date = new Date(0);
		models.sensorRule.findAll({ where: ["ruleId = ?", ruleId] }, {raw: true })
			.success(function(ans){cb(null, ans);})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceGetsensorRulesPerRule
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 *	- ruleId (int): 			Rule ID	- required
	 */
	function serviceGetsensorRulesPerRule(req, resp) {
		logger.info("<Service> GetsensorRulesPerRule.");
		var getData = parseRequest(req, ['ruleId']);
		
		writeHeaders(resp);
		getsensorRulesPerRule(getData.ruleId, function (err, sensorRules) {
			if (err) { error(2, resp, err); return; }
			resp.end(JSON.stringify({ sensorRules: sensorRules })); 
		});
	}	
	
	
	/*
	 * ------------------------------------------
	 * SENSORRULE Services
	 * ------------------------------------------
	 */
	 
	/**
	 * getSensorRule
	 * ====
	 * Returns the SensorRule corresponding to the given id
	 * Parameters:
	 *	- id (int): 			Id
	 *	- cb (Function(SensorRule)):	Callback
	 */
	function getSensorRule(id, cb) {
		models.SensorRule.find(id).success(function(ans){cb(null, ans);});
	}
	/**
	 * serviceGetSensorRule
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetSensorRule(req, resp) {
		logger.info("<Service> GetSensorRule.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getSensorRule(getData.id, function(err, sensorRule) {
			if (err) { error(2, resp, err); return; }
			resp.end(JSON.stringify({ sensorRule: (sensorRule?sensorRule.values:null) })); 
		});
	}
	 
	/**
	 * getSensorRuleMeasureType
	 * ====
	 * Returns the SensorRule's measureType
	 * Parameters:
	 *	- id (String): 				ID
	 *	- cb (Function(err, measureType):	Callback
	 */
	function getSensorRuleMeasureType(id, cb) {
		models.SensorRule.find(id)
			.success(function(sensorRule){
				cb(null, sensorRule.measureType);
			})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceGetSensorRuleMeasureType
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetSensorRuleMeasureType(req, resp) {
		logger.info("<Service> GetSensorRuleMeasureType.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getSensorRuleMeasureType(getData.id, function(err, measureType) {
			if (err) { error(2, resp, err); return; }
			resp.end(JSON.stringify({ measureType: measureType })); 
		});
	}
 
	/**
	 * getSensorRuleIntervalStart
	 * ====
	 * Returns the SensorRule's intervalStart
	 * Parameters:
	 *	- id (String): 				ID
	 *	- cb (Function(err, intervalStart):	Callback
	 */
	function getSensorRuleIntervalStart(id, cb) {
		models.SensorRule.find(id)
			.success(function(sensorRule){
				cb(null, sensorRule.intervalStart);
			})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceGetSensorRuleIntervalStart
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetSensorRuleIntervalStart(req, resp) {
		logger.info("<Service> GetSensorRuleIntervalStart.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getSensorRuleIntervalStart(getData.id, function(err, intervalStart) {
			if (err) { error(2, resp, err); return; }
			resp.end(JSON.stringify({ intervalStart: intervalStart })); 
		});
	}
	
	/**
	 * getSensorRuleIntervalEnd
	 * ====
	 * Returns the SensorRule's intervalEnd
	 * Parameters:
	 *	- id (String): 				ID
	 *	- cb (Function(err, intervalEnd):	Callback
	 */
	function getSensorRuleIntervalEnd(id, cb) {
		models.SensorRule.find(id)
			.success(function(sensorRule){
				cb(null, sensorRule.intervalEnd);
			})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceGetSensorRuleIntervalEnd
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetSensorRuleIntervalEnd(req, resp) {
		logger.info("<Service> GetSensorRuleIntervalEnd.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getSensorRuleIntervalEnd(getData.id, function(err, intervalEnd) {
			if (err) { error(2, resp, err); return; }
			resp.end(JSON.stringify({ intervalEnd: intervalEnd })); 
		});
	}

	/**
	 * getSensorRuleRule
	 * ====
	 * Returns the SensorRule's rule
	 * Parameters:
	 *	- id (String): 				ID
	 *	- cb (Function(err, rule):	Callback
	 */
	function getSensorRuleRule(id, cb) {
		models.RuleRule.find(id)
			.success(function(sensorRule){
				sensorRule.getRule()
					.success(function(rule){
						cb(null, rule);
					})
				.error(function(err) {
					cb(err, null);
				});
			})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceGetSensorRuleRule
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetSensorRuleRule(req, resp) {
		logger.info("<Service> GetSensorRuleRule.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getSensorRuleRule(getData.id, function(err, rule) {
			if (err) { error(2, resp, err); return; }
			resp.end(JSON.stringify({ rule: rule })); 
		});
	}
	
	/**
	 * deleteSensorRule
	 * ====
	 * Delete the SensorRule corresponding to the given id
	 * Parameters:
	 *	- id (String): 			ID
	 *	- cb (Function(bool)):	Callback
	 */
	function deleteSensorRule(id, cb) {
		models.SensorRule.destroy({id: id})
			.success(function() {
				cb(null, true);
			})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceDeleteSensorRule
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceDeleteSensorRule(req, resp) {
		logger.info("<Service> DeleteSensorRule.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		deleteSensorRule(getData.id, function (err, bool) {
			if (err) { error(2, resp, err); return; }
			if (!bool) error(2, resp);
			else resp.end(JSON.stringify({ status: 'ok' })); 
		});
	} 
	 
	/**
	 * updateSensorRule
	 * ====
	 * Update the SensorRule corresponding to the given id
	 * Parameters:
	 *	- id (int):		 					ID
	 *	- measureType (String): 			Type of measure concerned
	 *	- intervalStart (float): 			Smallest Value concerned
	 *	- intervalEnd (float): 				Biggest Value concerned 
	 *	- cb (Function(bool)):				Callback
	 */ 
	function updateSensorRule(measureType, intervalStart, intervalEnd, cb) {
		models.SensorRule.update({ measureType: measureType, intervalStart: intervalStart, intervalEnd: intervalEnd }, {id: id})
			.success(function() {
				cb(null, true);
			})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceUpdateSensorRule
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *	- measureType (String): 			Type of measure concerned	- required
	 *	- intervalStart (float): 			Smallest Value concerned	- required
	 *	- intervalEnd (float): 				Biggest Value concerned 	- required
	 */
	function serviceUpdateSensorRule(req, resp) {
		logger.info("<Service> UpdateSensorRule.");
		var sensorRuleData = parseRequest(req, ['measureType', 'intervalStart', 'intervalEnd']);
		
		writeHeaders(resp);
		updateSensorRule(sensorRuleData.measureType, sensorRuleData.intervalStart, sensorRuleData.intervalEnd, function(err, bool) {
			if (err) { error(2, resp, err); return; }
			if (!bool) error(2, resp);
			else resp.end(JSON.stringify({ status: 'ok' })); 
		});
	}
		
	/**
	 * updateSensorRuleMeasureType
	 * ====
	 * Update the measureType of the SensorRule corresponding to the given id
	 * Parameters:
	 *	- id (String): 				ID
	 *	- measureType (String): 			MeasureType to change
	 *	- cb (Function(bool):		Callback
	 */ 
	function updateSensorRuleMeasureType(id, measureType, cb) {
			models.SensorRule.update({measureType: measureType}, {id: id})
			.success(function() {
				cb(null, true);
			})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceUpdateSensorRuleMeasureType
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		- measureType (String): 	MeasureType 		- required
	 */
	function serviceUpdateSensorRuleMeasureType(req, resp) {
		logger.info("<Service> UpdateSensorRuleMeasureType.");
		var sensorRuleData = parseRequest(req, ['id', 'measureType']);
		
		writeHeaders(resp);
		updateSensorRuleMeasureType(sensorRuleData.id, sensorRuleData.measureType, function(err, bool) {
			if (err) { error(2, resp, err); return; }
			if (!bool) error(2, resp);
			else resp.end(JSON.stringify({ status: 'ok' })); 
		});
	}
		
	/**
	 * updateSensorRuleIntervalStart
	 * ====
	 * Update the intervalStart of the SensorRule corresponding to the given id
	 * Parameters:
	 *	- id (String): 				ID
	 *	- intervalStart (String): 	IntervalStart to change
	 *	- cb (Function(bool):		Callback
	 */ 
	function updateSensorRuleIntervalStart(id, intervalStart, cb) {
			models.SensorRule.update({intervalStart: intervalStart}, {id: id})
			.success(function() {
				cb(null, true);
			})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceUpdateSensorRuleIntervalStart
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		- intervalStart (String): 	IntervalStart 		- required
	 */
	function serviceUpdateSensorRuleIntervalStart(req, resp) {
		logger.info("<Service> UpdateSensorRuleIntervalStart.");
		var sensorRuleData = parseRequest(req, ['id', 'intervalStart']);
		
		writeHeaders(resp);
		updateSensorRuleIntervalStart(sensorRuleData.id, sensorRuleData.intervalStart, function(err, bool) {
			if (err) { error(2, resp, err); return; }
			if (!bool) error(2, resp);
			else resp.end(JSON.stringify({ status: 'ok' })); 
		});
	}
	 
	/**
	 * updateSensorRuleIntervalEnd
	 * ====
	 * Update the intervalEnd of the SensorRule corresponding to the given id
	 * Parameters:
	 *	- id (String): 				ID
	 *	- intervalEnd (String): 	IntervalEnd to change
	 *	- cb (Function(bool):		Callback
	 */ 
	function updateSensorRuleIntervalEnd(id, intervalEnd, cb) {
			models.SensorRule.update({intervalEnd: intervalEnd}, {id: id})
			.success(function() {
				cb(null, true);
			})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceUpdateSensorRuleIntervalEnd
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		- intervalEnd (String): 	IntervalEnd 		- required
	 */
	function serviceUpdateSensorRuleIntervalEnd(req, resp) {
		logger.info("<Service> UpdateSensorRuleIntervalEnd.");
		var sensorRuleData = parseRequest(req, ['id', 'intervalEnd']);
		
		writeHeaders(resp);
		updateSensorRuleIntervalEnd(sensorRuleData.id, sensorRuleData.intervalEnd, function(err, bool) {
			if (err) { error(2, resp, err); return; }
			if (!bool) error(2, resp);
			else resp.end(JSON.stringify({ status: 'ok' })); 
		});
	}
	 

	/*
	 * ------------------------------------------
	 * ACTUATORRULES - CRUD Services
	 * ------------------------------------------
	 */
	 
	/**
	 * createActuatorRule
	 * ====
	 * Add a actuatorRule to the DB and system.
	 * Parameters:
	 *	- ruleId (int): 					ID of the parent Rule
	 *	- value (float): 					Value to send to the actuator
	 *	- isActive (bool): 					IsActive Flag
	 *	- cb (Function(Erreur, int)):		Callback
	 */
	function createActuatorRule(ruleId, value, isActive, cb) {
		models.Rule.find(ruleId)
			.success(function(rule){
				if (!rule) { cb('Rule doesn\'t exist', null); return; }
				models.ActuatorRule.create({ value: value, isActive: isActive })
					.success(function(actuatorRule) {
						actuator.addActuatorRule(actuatorRule)
							.success(function() { cb(null, actuatorRule.id); })
							.error(function(err) {
								actuatorRule.destroy().success(function() {
									cb(err, null);
								})
							});
					})
					.error(function(err) {
						cb(err, null);
					});
			})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceCreateActuatorRule
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 *	- ruleId (String): 					ID of the parent Rule			- required
	 *	- value (float): 					Value to send to the actuator	- required	
	 *	- isActive (bool): 					IsActive Flag 					- required
	 */
	function serviceCreateActuatorRule(req, resp) {
		logger.info("<Service> CreateActuatorRule.");
		var actuatorRuleData = parseRequest(req, ['ruleId', 'value', 'isActive']);
		
		writeHeaders(resp);
		createActuatorRule(actuatorRuleData.ruleId, actuatorRuleData.value, actuatorRuleData.isActive, function(err, id) {
			if (err) { error(10, resp, err); return; }
			resp.end(JSON.stringify({ status: 'ok', id: id }));
		});
	}
	 
	/**
	 * getActuatorRules
	 * ====
	 * Returns a list of actuatorRules.
	 * Parameters:
	 *	- limit (int): 					Number max of actuatorRules to return
	 *	- offset (int): 				Number of the actuatorRule to start with
	 *	- cb (Function(err, ActuatorRule[])):	Callback
	 */
	function getActuatorRules(limit, offset, cb) {
		if (!offset) offset = 0;
		if (limit) {
			models.ActuatorRule.findAll({ offset: offset, limit: limit, raw: true })
				.success(function(ans){cb(null, ans);})
				.error(function(err) {
					cb(err, null);
				});
		}
		else {
			models.ActuatorRule.findAll({ offset: offset, raw: true })
				.success(function(ans){cb(null, ans);})
				.error(function(err) {
					cb(err, null);
				});
		}
	}
	/**
	 * serviceGetActuatorRules
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 *		- limit (int): 		Number max to return				- optional
	 *		- offset (int): 	Number of the actuatorRule to start with	- optional
	 */
	function serviceGetActuatorRules(req, resp) {
		logger.info("<Service> GetActuatorRules.");
		var getData = parseRequest(req, ['limit', 'offset']);
		
		writeHeaders(resp);
		getActuatorRules(getData.limit, getData.offset, function(err, actuatorRules) {
			if (err) { error(2, resp, err); return; }
			resp.end(JSON.stringify({ actuatorRules: actuatorRules })); 
		});
	}	
	 
	/**
	 * getactuatorRulesPerRule
	 * ====
	 * Returns a list of actuatorRules of a Rule
	 * Parameters:
	 *	- ruleId (int): 			Rule ID
	 *	- cb (Function(err, actuatorRule[])):	Callback
	 */
	function getactuatorRulesPerRule(ruleId, cb) {
		logger.error(date);
		if (!date) date = new Date(0);
		models.actuatorRule.findAll({ where: ["ruleId = ?", ruleId] }, {raw: true })
			.success(function(ans){cb(null, ans);})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceGetactuatorRulesPerRule
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 *	- ruleId (int): 			Rule ID	- required
	 */
	function serviceGetactuatorRulesPerRule(req, resp) {
		logger.info("<Service> GetactuatorRulesPerRule.");
		var getData = parseRequest(req, ['ruleId']);
		
		writeHeaders(resp);
		getactuatorRulesPerRule(getData.ruleId, function (err, actuatorRules) {
			if (err) { error(2, resp, err); return; }
			resp.end(JSON.stringify({ actuatorRules: actuatorRules })); 
		});
	}	
	
	
	/*
	 * ------------------------------------------
	 * ACTUATORRULE Services
	 * ------------------------------------------
	 */
	 
	/**
	 * getActuatorRule
	 * ====
	 * Returns the ActuatorRule corresponding to the given id
	 * Parameters:
	 *	- id (int): 			Id
	 *	- cb (Function(ActuatorRule)):	Callback
	 */
	function getActuatorRule(id, cb) {
		models.ActuatorRule.find(id).success(function(ans){cb(null, ans);});
	}
	/**
	 * serviceGetActuatorRule
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetActuatorRule(req, resp) {
		logger.info("<Service> GetActuatorRule.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getActuatorRule(getData.id, function(err, actuatorRule) {
			if (err) { error(2, resp, err); return; }
			resp.end(JSON.stringify({ actuatorRule: (actuatorRule?actuatorRule.values:null) })); 
		});
	}
 
	/**
	 * getActuatorRuleValue
	 * ====
	 * Returns the ActuatorRule's value
	 * Parameters:
	 *	- id (String): 				ID
	 *	- cb (Function(err, value):	Callback
	 */
	function getActuatorRuleValue(id, cb) {
		models.ActuatorRule.find(id)
			.success(function(actuatorRule){
				cb(null, actuatorRule.value);
			})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceGetActuatorRuleValue
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetActuatorRuleValue(req, resp) {
		logger.info("<Service> GetActuatorRuleValue.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getActuatorRuleValue(getData.id, function(err, value) {
			if (err) { error(2, resp, err); return; }
			resp.end(JSON.stringify({ value: value })); 
		});
	}
	
	/**
	 * getActuatorRuleIsActive
	 * ====
	 * Returns the ActuatorRule's isActive
	 * Parameters:
	 *	- id (String): 				ID
	 *	- cb (Function(err, isActive):	Callback
	 */
	function getActuatorRuleIsActive(id, cb) {
		models.ActuatorRule.find(id)
			.success(function(actuatorRule){
				cb(null, actuatorRule.isActive);
			})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceGetActuatorRuleIsActive
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetActuatorRuleIsActive(req, resp) {
		logger.info("<Service> GetActuatorRuleIsActive.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getActuatorRuleIsActive(getData.id, function(err, isActive) {
			if (err) { error(2, resp, err); return; }
			resp.end(JSON.stringify({ isActive: isActive })); 
		});
	}

	/**
	 * getActuatorRuleRule
	 * ====
	 * Returns the ActuatorRule's rule
	 * Parameters:
	 *	- id (String): 				ID
	 *	- cb (Function(err, rule):	Callback
	 */
	function getActuatorRuleRule(id, cb) {
		models.RuleRule.find(id)
			.success(function(actuatorRule){
				actuatorRule.getRule()
					.success(function(rule){
						cb(null, rule);
					})
				.error(function(err) {
					cb(err, null);
				});
			})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceGetActuatorRuleRule
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetActuatorRuleRule(req, resp) {
		logger.info("<Service> GetActuatorRuleRule.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getActuatorRuleRule(getData.id, function(err, rule) {
			if (err) { error(2, resp, err); return; }
			resp.end(JSON.stringify({ rule: rule })); 
		});
	}
	
	/**
	 * deleteActuatorRule
	 * ====
	 * Delete the ActuatorRule corresponding to the given id
	 * Parameters:
	 *	- id (String): 			ID
	 *	- cb (Function(bool)):	Callback
	 */
	function deleteActuatorRule(id, cb) {
		models.ActuatorRule.destroy({id: id})
			.success(function() {
				cb(null, true);
			})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceDeleteActuatorRule
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceDeleteActuatorRule(req, resp) {
		logger.info("<Service> DeleteActuatorRule.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		deleteActuatorRule(getData.id, function (err, bool) {
			if (err) { error(2, resp, err); return; }
			if (!bool) error(2, resp);
			else resp.end(JSON.stringify({ status: 'ok' })); 
		});
	} 
	 
	/**
	 * updateActuatorRule
	 * ====
	 * Update the ActuatorRule corresponding to the given id
	 * Parameters:
	 *	- id (int):		 					ID
	 *	- value (float): 					Value to send to the actuator
	 *	- isActive (bool): 					IsActive Flag
	 *	- cb (Function(err, bool)):				Callback
	 */ 
	function updateActuatorRule(measureType, value, isActive, cb) {
		models.ActuatorRule.update({ value: value, isActive: isActive }, {id: id})
			.success(function() {
				cb(null, true);
			})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceUpdateActuatorRule
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *	- value (float): 			Value to send to the actuator	- required
	 *	- isActive (bool): 			IsActive Flag					- required
	 */
	function serviceUpdateActuatorRule(req, resp) {
		logger.info("<Service> UpdateActuatorRule.");
		var actuatorRuleData = parseRequest(req, ['value', 'isActive']);
		
		writeHeaders(resp);
		updateActuatorRule(actuatorRuleData.value, actuatorRuleData.isActive, function(err, bool) {
			if (err) { error(2, resp, err); return; }
			if (!bool) error(2, resp);
			else resp.end(JSON.stringify({ status: 'ok' })); 
		});
	}
		
	/**
	 * updateActuatorRuleValue
	 * ====
	 * Update the value of the ActuatorRule corresponding to the given id
	 * Parameters:
	 *	- id (String): 				ID
	 *	- value (String): 			Value to change
	 *	- cb (Function(bool):		Callback
	 */ 
	function updateActuatorRuleValue(id, value, cb) {
			models.ActuatorRule.update({value: value}, {id: id})
			.success(function() {
				cb(null, true);
			})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceUpdateActuatorRuleValue
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		- value (String): 	Value 		- required
	 */
	function serviceUpdateActuatorRuleValue(req, resp) {
		logger.info("<Service> UpdateActuatorRuleValue.");
		var actuatorRuleData = parseRequest(req, ['id', 'value']);
		
		writeHeaders(resp);
		updateActuatorRuleValue(actuatorRuleData.id, actuatorRuleData.value, function(err, bool) {
			if (err) { error(2, resp, err); return; }
			if (!bool) error(2, resp);
			else resp.end(JSON.stringify({ status: 'ok' })); 
		});
	}
	 
	/**
	 * updateActuatorRuleIsActive
	 * ====
	 * Update the isActive of the ActuatorRule corresponding to the given id
	 * Parameters:
	 *	- id (String): 				ID
	 *	- isActive (bool): 			IsActive to change
	 *	- cb (Function(bool):		Callback
	 */ 
	function updateActuatorRuleIsActive(id, isActive, cb) {
			models.ActuatorRule.update({isActive: isActive}, {id: id})
			.success(function() {
				cb(null, true);
			})
			.error(function(err) {
				cb(err, null);
			});
	}
	/**
	 * serviceUpdateActuatorRuleIsActive
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		- isActive (bool): 	IsActive 		- required
	 */
	function serviceUpdateActuatorRuleIsActive(req, resp) {
		logger.info("<Service> UpdateActuatorRuleIsActive.");
		var actuatorRuleData = parseRequest(req, ['id', 'isActive']);
		
		writeHeaders(resp);
		updateActuatorRuleIsActive(actuatorRuleData.id, actuatorRuleData.isActive, function(err, bool) {
			if (err) { error(2, resp, err); return; }
			if (!bool) error(2, resp);
			else resp.end(JSON.stringify({ status: 'ok' })); 
		});
	}
	 
	 	  	 
	/*
	 * ------------------------------------------
	 * REST ROUTING
	 * ------------------------------------------
	 */
	 
	this.rest = {};
	this.rest['sensors'] = {
		'POST'	: serviceCreateSensor,
		'GET'	: serviceGetSensors
	};
	this.rest['sensors/offset/:offset'] = this.rest['sensors/offset/:offset/limit/:limit'] = {
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
	this.rest['sensor/:id/name'] = {
		'GET'	: serviceGetSensorName,
		'PUT'	: serviceUpdateSensorName
	};
	this.rest['sensor/:id/customId'] = {
		'GET'	: serviceGetSensorCustomId,
		'PUT'	: serviceUpdateSensorCustomId
	};

	this.rest['actuators'] = {
		'POST'	: serviceCreateActuator,
		'GET'	: serviceGetActuators
	};
	this.rest['actuators/offset/:offset'] = this.rest['actuators/offset/:offset/limit/:limit'] = {
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
	this.rest['actuator/:id/name'] = {
		'GET'	: serviceGetActuatorName,
		'PUT'	: serviceUpdateActuatorName
	};
	this.rest['actuator/:id/customId'] = {
		'GET'	: serviceGetActuatorCustomId,
		'PUT'	: serviceUpdateActuatorCustomId
	};
	
	this.rest['measures'] = {
		'POST'	: serviceCreateMeasure,
		'GET'	: serviceGetMeasures
	};
	this.rest['measures/offset/:offset'] = this.rest['measures/offset/:offset/limit/:limit'] = {
		'GET'	: serviceGetMeasures
	};
	this.rest['sensor/:sensorId/measures'] = {
		'GET'	: serviceGetRecentMeasuresPerSensor
	};
	this.rest['sensor/:sensorId/measures/after/:date'] = {
		'GET'	: serviceGetRecentMeasuresPerSensor
	};
	this.rest['measure/:id'] = this.rest['sensor/:sensorId/measure/:id'] = {
		'GET'	: serviceGetMeasure,
		'DELETE': serviceDeleteMeasure,
		'PUT'	: serviceUpdateMeasure
	};
	this.rest['measure/:id/value'] = {
		'GET'	: serviceGetMeasureValue,
		'PUT'	: serviceUpdateMeasureValue
	};
	this.rest['measure/:id/time'] = {
		'GET'	: serviceGetMeasureTime,
		'PUT'	: serviceUpdateMeasureTime
	};
	this.rest['measure/:id/measureType'] = {
		'GET'	: serviceGetMeasureMeasureType,
		'PUT'	: serviceUpdateMeasureMeasureType
	};
	this.rest['measure/:id/sensor'] = {
		'GET'	: serviceGetMeasureSensor,
		'PUT'	: serviceUpdateMeasureSensor
	};

	this.rest['rules'] = {
		'POST'	: serviceCreateRule,
		'GET'	: serviceGetRules
	};
	
	this.rest['simpleRules'] = {
		'POST'	: serviceCreateSimpleRule
	};
	
	this.rest['rules/offset/:offset'] = this.rest['rules/offset/:offset/limit/:limit'] = {
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

	this.rest['sensorRules'] = {
		'POST'	: serviceCreateSensorRule,
		'GET'	: serviceGetSensorRules
	};
	this.rest['sensorRules/offset/:offset'] = this.rest['sensorRules/offset/:offset/limit/:limit'] = {
		'GET'	: serviceGetSensorRules
	};
	this.rest['rule/:ruleId/sensorRules'] = {
		'GET'	: getsensorRulesPerRule
	};
	this.rest['sensorRule/:id'] = this.rest['rule/:ruleId/sensorRule/:id'] = {
		'GET'	: serviceGetSensorRule,
		'DELETE': serviceDeleteSensorRule,
		'PUT'	: serviceUpdateSensorRule
	};
	this.rest['sensorRule/:id/measureType'] = {
		'GET'	: serviceGetSensorRuleMeasureType,
		'PUT'	: serviceUpdateSensorRuleMeasureType
	};
	this.rest['sensorRule/:id/intervalStart'] = {
		'GET'	: serviceGetSensorRuleIntervalStart,
		'PUT'	: serviceUpdateSensorRuleIntervalStart
	};
	this.rest['sensorRule/:id/intervalEnd'] = {
		'GET'	: serviceGetSensorRuleIntervalEnd,
		'PUT'	: serviceUpdateSensorRuleIntervalEnd
	};
	this.rest['sensorRule/:id/rule'] = {
		'GET'	: serviceGetSensorRuleRule
	};
	
	this.rest['actuatorRules'] = {
		'POST'	: serviceCreateActuatorRule,
		'GET'	: serviceGetActuatorRules
	};
	this.rest['actuatorRules/offset/:offset'] = this.rest['actuatorRules/offset/:offset/limit/:limit'] = {
		'GET'	: serviceGetActuatorRules
	};
	this.rest['rule/:ruleId/actuatorRules'] = {
		'GET'	: getactuatorRulesPerRule
	};
	this.rest['actuatorRule/:id'] = this.rest['rule/:ruleId/actuatorRule/:id'] = {
		'GET'	: serviceGetActuatorRule,
		'DELETE': serviceDeleteActuatorRule,
		'PUT'	: serviceUpdateActuatorRule
	};
	this.rest['actuatorRule/:id/value'] = {
		'GET'	: serviceGetActuatorRuleValue,
		'PUT'	: serviceUpdateActuatorRuleValue
	};
	this.rest['actuatorRule/:id/isActive'] = {
		'GET'	: serviceGetActuatorRuleIsActive,
		'PUT'	: serviceUpdateActuatorRuleIsActive
	};
	this.rest['actuatorRule/:id/rule'] = {
		'GET'	: serviceGetActuatorRuleRule
	};

	 
	 	  	 
	/*
	 * ------------------------------------------
	 * LOCAL EXPORTS
	 * ------------------------------------------
	 */
	 
	 this.local = {};
	 this.local.loadDevices = loadDevices;
	 
	 
	return this;
};

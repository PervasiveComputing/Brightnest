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
			models.Sensor.create({ customId: customId, type: type })
				.success(function(sensor) {
					// Let the driver handle the integration of the device to the system:
					sensorsDrivers[type].add(customId, function(err){
							if (err) { cb(err, null); return; }
							cb(null, sensor.id);
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
			models.Sensor.findAll({ offset: offset, limit: limit, raw: true })
				.success(function(ans){cb(null, ans);})
				.error(function(err) {
					cb(err, null);
				});
		}
		else {
			models.Sensor.findAll({ offset: offset, raw: true })
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
	 *		- limit (int): 		Number max to return				- optional
	 *		- offset (int): 	Number of the sensor to start with	- optional
	 */
	function serviceGetSensors(req, resp) {
		logger.info("<Service> GetSensors.");
		var getData = parseRequest(req, ['limit', 'offset']);
		
		writeHeaders(resp);
		getSensors(getData.limit, getData.offset, function (err, sensors) {
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
		models.Sensor.destroy({id: id})
			.success(function() {
				cb(null, true);
			})
			.error(function(err) {
				cb(err, false);
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
	 *	- customId (String): 		Custom ID for the driver
	 *	- cb (Function(bool)):		Callback
	 */ 
	function updateSensor(id, type, customId, cb) {
		models.Sensor.update({type: type, customId: customId}, {id: id})
			.success(function() {
				cb(null, true);
			})
			.error(function(err) {
				cb(err, null);
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
		updateSensor(sensorData.id, sensorData.type, sensorData.customId, function(err, bool) {
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
	 * updateSensorCustomId
	 * ====
	 * Update the customId of the Sensor corresponding to the given id
	 * Parameters:
	 *	- id (String): 				ID
	 *	- customId (String): 			CustomId to change
	 *	- cb (Function(bool):		Callback
	 */ 
	function updateSensorCustomId(id, customId, cb) {
			models.Sensor.update({customId: customId}, {id: id})
			.success(function() {
				cb(null, true);
			})
			.error(function(err) {
				cb(err, null);
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
	 *	- customId (String): 				Custom ID for the driver
	 *	- cb (Function(Erreur, int)):		Callback
	 */
	function createActuator(type, customId, cb) {
		if (actuatorsDrivers[type]) { // If this kind of device is supported:
			// Add to DB:
			models.Actuator.create({ customId: customId, type: type })
				.success(function(actuator) {
					// Let the driver handle the integration of the device to the system:
					actuatorsDrivers[type].add(customId, function(err){
							if (err) { cb(err, null); return; }
							cb(null, actuator.id);
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
			models.Actuator.findAll({ offset: offset, limit: limit, raw: true })
				.success(function(ans){cb(null, ans);})
				.error(function(err) {
					cb(err, null);
				});
		}
		else {
			models.Actuator.findAll({ offset: offset, raw: true })
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
	 *		- limit (int): 		Number max to return				- optional
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
		models.Actuator.destroy({id: id})
			.success(function() {
				cb(null, true);
			})
			.error(function(err) {
				cb(err, null);
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
	 *	- type (String): 			Type of actuator
	 *	- customId (String): 		Custom ID for the driver
	 *	- cb (Function(bool)):		Callback
	 */ 
	function updateActuator(id, type, customId, cb) {
		models.Actuator.update({type: type, customId: customId}, {id: id})
			.success(function() {
				cb(null, true);
			})
			.error(function(err) {
				cb(err, null);
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
		updateActuator(actuatorData.id, actuatorData.type, actuatorData.customId, function(err, bool) {
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
	 * updateActuatorCustomId
	 * ====
	 * Update the customId of the Actuator corresponding to the given id
	 * Parameters:
	 *	- id (String): 				ID
	 *	- customId (String): 			CustomId to change
	 *	- cb (Function(bool):		Callback
	 */ 
	function updateActuatorCustomId(id, customId, cb) {
			models.Actuator.update({customId: customId}, {id: id})
			.success(function() {
				cb(null, true);
			})
			.error(function(err) {
				cb(err, null);
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
		models.Measure.create({ value: value, measureType: measureType, time: time })
			.success(function(measure) {
				measure.setSensor(sensorId)
					.success(function() {
						cb(null, measure.id);
					})
					.error(function(err) {
						measure.destroy().success(function() {
							cb(err, null);
						});
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
		var measureData = parseRequest(req, ['value', 'sensorId', 'time', 'measureType']);
		
		writeHeaders(resp);
		createMeasure(measureData.value, measureData.sensorId, measureData.time, measureData.measureType, function(err, id) {
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
			resp.end(measure.values); 
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
	 * 	- sensorId (int):			ID of the sensor
	 * 	- time (Date):				Date
	 *	- measureType (String): 	Type of measure
	 *	- cb (Function(bool)):		Callback
	 */ 
	function updateMeasure(id, value, sensorId, time, measureType, cb) {
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
		var measureData = parseRequest(req, ['id', 'value', 'sensorId', 'time', 'measureType']);
		
		writeHeaders(resp);
		updateMeasure(measureData.id, measureData.value, measureData.sensorId, measureData.time, measureData.measureType, function(err, bool) {
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

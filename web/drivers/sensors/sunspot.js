/**
 * =================
 * MODULE - Sunspot
 * =================
 * Driver to handle Sunspot
 */
var config = require("../../config");
var http = require('http');

var baseStationAddr;
var sunspots = new Array();
var numSunSpots = 0;

/**
 * add
 * ====
 * Add the sensor to the system.
 * Parameters:
 *	- customDeviceId (String):	Custom ID of the new device for the driver (MAC address + base station IP)
 *	- cb (Function(error)):		Callback with an error or *null* as parameter
 */
function add(customDeviceId, cb) {
	
	//Register request to the base station
	var deviceInfo = customDeviceId.split('+');
	customId = deviceInfo[0];
	baseAddr = deviceInfo[1];
	if(sunspots.indexOf(customDeviceId) < 0){
		baseStationAddr = baseAddr;
		//serverUrl = publicIp+":"+config.getProperty("http.port");
		var options = {
				host : baseStationAddr,
				port: 8000,
				path : '/register/sensor/?id='+customId+'&status=registered'+'&path=/api/measures&port='+config.getProperty("http.port"),
				method : 'GET'
			}
		var data = "";
		var request = http.request(options, function(response){
			 
			response.on('data', function(chunk){
			});

			response.on('end', function(){
				sunspots.splice(numSunSpots, 0, customDeviceId);
				numSunSpots++;

			});

			request.on('error', function(e) {
			   cb('Problem with request: ' + e.message);
		    });
		});
		request.end();
	}else{
		cb('SunSPOT already installed');
	}
	
}

/**
 * update
 * ====
 * Change the custom ID of the device.
 * Parameters:
 *	- prevCustomId (String):	Previous ID
 *	- newCustomId (String):		New ID
 *	- cb (Function(error)):		Callback with an error or *null* as parameter
 */
function update(prevCustomId, newCustomId, cb) {
	
	if(sunspots.indexOf(prevCustomId) > 0){

		var oldDeviceInfo = prevCustomId.split('+');
		oldCustomId = oldDeviceInfo[0];
		oldBaseAddr = oldDeviceInfo[1];

		var newDeviceInfo = newCustomId.split('+');
		customId = newDeviceInfo[0];
		baseAddr = newDeviceInfo[1];

		baseStationAddr = baseAddr;

		var options = {
				host : baseStationAddr,
				port: 8000,
				path : '/update/sensor/?status=updated&newId='+customId+'&oldId='+oldCustomId,
				method : 'GET'
			}
		var data = "";
		var request = http.request(options, function(response){
			 
			response.on('data', function(chunk){
			});

			response.on('end', function(){
				sunspots.splice(sunspots.indexOf(prevCustomId), 1, newCustomId);
			});

			request.on('error', function(e) {
			   cb('Problem with request: ' + e.message);
		    });
		});
		request.end();
	}else{
		cb('SunSPOT already installed');
	}
	cb(null);
}

/**
 * remove
 * ====
 * Remove a device.
 * Parameters:
 *	- customDeviceId (String):	Custom ID of the new device for the driver (MAC address + base station IP)
 *	- cb (Function(error)):		Callback with an error or *null* as parameter
 */
function remove(customDeviceId, cb) {

	var deviceInfo = customDeviceId.split('+');
	customId = deviceInfo[0];
	baseAddr = deviceInfo[1];

	baseStationAddr = baseAddr;
	
	if(sunspots.indexOf(customId)>=0){
		var options = {
			host : baseStationAddr,
			port: 8000,
			path : '/unregister/sensor/?id='+customId+'&status=unregistered',
			method : 'GET'
		}
		var data = "";
		var request = http.request(options, function(response){

			response.on('data', function(chunk){
			});

			response.on('end', function(){
				sunspots.splice(indexOf(customId), 1);
				numSunSpots--;

			});

			request.on('error', function(e) {
			   cb('Problem with request: ' + e.message);
		    });
		});
		request.end(); 
	}else{
		cb('SunSPOT not registered. It is not possible to delete it');
	}
}

exports.add = add;
exports.update = update;
exports.remove = remove;

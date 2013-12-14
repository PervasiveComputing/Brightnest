/**
 * =================
 * MODULE - OpenWeatherMap
 * =================
 * Driver to create virtual weather sensors, fetching the date from OpenWeatherMap API every 1 hour.
 */
 
 var http = require('http');
 
 var weatherSensors = [];

/**
 * add
 * ====
 * Add the sensor to the system.
 * Here, customId should be the name of the city to be watched over.
 * Parameters:
 *	- customId (String):		Custom ID of the new device for the driver
 *	- dbId (String):			ID of the new device in the DB (to be used to post measures)
 *	- cb (Function(error)):		Callback with an error or *null* as parameter
 */
function add(customId, dbId, cb) {
//	if (weatherSensors[customId]) { cb('Sensor ' + customId + ' already added'); return; }
//	weatherSensors[customId] = setTimeout(function(){ // Function to fetch data from OpenWeatherMap API:
//		var options = {
//			host : 'api.openweathermap.org',
//			path : '/data/2.5/weather?q='+customId,
//			port : 80,
//			method : 'GET'
//		}
//
//		var request = http.request(options, function(response){
//			var body = ""
//			response.on('data', function(data) {
//				body += data;
//			});
//			response.on('end', function() {
//				res.send(JSON.parse(body));
//			});
//		});
//		request.on('error', function(e) {
//			console.log('Problem with request: ' + e.message);
//		});
//	}, delay, [arg], [...]);
	cb(null);
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
	// TO DO
	cb(null);
}

/**
 * remove
 * ====
 * Remove a device.
 * Parameters:
 *	- customId (String):		ID
 *	- cb (Function(error)):		Callback with an error or *null* as parameter
 */
function remove(customId, cb) {
	// TO DO
	cb(null);
}

exports.add = add;
exports.update = update;
exports.remove = remove;

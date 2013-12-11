/**
 * =================
 * MODULE - Sunspot
 * =================
 * Driver to handle Sunspot
 */
 
var baseStationAddr;
var serverPublicDNS;
var sunspots = new Array();
var numSunSpots = 0;

/**
 * add
 * ====
 * Add the sensor to the system.
 * Parameters:
 *	- customId (String):		Custom ID of the new device for the driver
 *  - baseStationUrl (String):  Direction of the machine where the base station app is running
 *  - serverUrl (String):       Direction of the machine where the main server is running
 *	- cb (Function(error)):		Callback with an error or *null* as parameter
 */
function add(customId, baseStationUrl, serverUrl, cb) {
	
	if(a.indexOf(customId) < 0){
		baseStationAddr = baseStationUrl;
		serverPublicDNS = serverUrl;
		var options = {
				host : baseStationUrl,
				port: 8000,
				path : '/register/sensor/?id=customId&status=registered&url=http://'+serverUrl+':8080/api/measures&port=8080',
				method : 'GET'
			}
		var data;
		var request = http.request(options, function(response){
			 
			response.on('data', function(chunk){
			});

			response.on('end', function(){
				a.splice(numSunSpots, 1, customId);
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
	if(sunspots.indexOf(customId)>=0){
		var options = {
			host : baseStationAddr,
			port: 8000,
			path : '/unregister/sensor/?id=customId&status=unregistered',
			method : 'GET'
		}
		var data;
		var request = http.request(options, function(response){

			response.on('data', function(chunk){
			});

			response.on('end', function(){
				a.splice(indexOf(customId), 1);
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

/**
 * =================
 * MODULE - Hue
 * =================
 * Driver to handle Hue
 */
 
 var http = require('http');
 var hueArray = [];

/**
 * add
 * ====
 * Add the sensor to the system.
 * Parameters:
 *	- customId (String):		Custom ID of the new device for the driver
 *	- cb (Function(error)):		Callback with an error or *null* as parameter
 */
function add(customId, cb) {
	if(!hueArray[customId]){
		hueIPLookup(customId, function(err, ip){
		 	if (err) { cb(err) }
		 	else {
		 		hueArray[customId] = ip;
		 		cb(null);
		 	}
		 });
	}else{
		cb("Hue is Already Added");
	}
}


function hueIPLookup(customId, cb){
	
	var hubAddress = null;	
	var options = {
			host : 'www.meethue.com',
			path : '/api/nupnp',
			method : 'GET'
	}

	var request = http.request(options, function(response){
		    var str = ''
			response.on('data', function (chunk) {
				str += chunk;
			});

			response.on('end', function () {
				var reuslts = JSON.parse(str);
        		for (var item in reuslts){
					if (reuslts[item].id==customId) {
						hubAddress = reuslts[item].internalipaddress;
						break;
					}
				}				
				verifyAddress(customId, hubAddress, cb);					
			});
	});
	request.on('error', function(e) {
		    cb('Problem with request: ' + e.message);
	});
	request.end();
}

function verifyAddress(customId, hubAddress, cb){
	
	var options = {
			host : hubAddress,
			path : '/api/newdeveloper/config',
			method : 'GET'
	}

	var request = http.request(options, function(response){
		    var str = ''
			response.on('data', function (chunk) {
				str += chunk;
			});

			response.on('end', function () {
				var mac = JSON.parse(str).mac.replace(/:/g, '');
				if (customId.substr(0,6) + customId.substr(10) == mac){
					console.log(cb);
					cb(null, hubAddress);
				}
			});
	});
	request.on('error', function(e) {
		cb('Problem with request: ' + e.message);
	});
	request.end();
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
	if (hueArray[prevCustomId]){
		add(newCustomId, function(err){
		 	if (err) { cb(err) }
		 	else {
		 		hueArray[prevCustomId] = null;
		 		cb(null);
		 	}
		 });
	} 
	else {
		cb("prevCustomId does not exist");
	}
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
	hueArray[customId] = null;
	cb(null);
}

function apply(customId, value, cb){
	
	var options = {
		host : hueArray[customId],
		path : '/api/newdeveloper/groups/0/action',
		method : 'PUT',
	}

	var request = http.request(options, function(response){
		var str = ''
		response.on('data', function (chunk) {
			str += chunk;
		});

		response.on('end', function () {
			var results = JSON.parse(str);
			for (var i in results){
				if (results[i].error){
					cb(results[i].error.description);
				}
			}
		});
	});
	request.on('error', function(e) {
		cb('Problem with request: ' + e.message);
	});
	request.write(value);
	request.end();
	cb(null);
}

exports.add = add;
exports.update = update;
exports.remove = remove;
exports.apply = apply;

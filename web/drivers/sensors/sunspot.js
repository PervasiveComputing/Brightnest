/**
 * =================
 * MODULE - Sunspot
 * =================
 * Driver to handle Sunspot
 */
 

/**
 * add
 * ====
 * Add the sensor to the system.
 * Parameters:
 *	- customId (String):		Custom ID of the new device for the driver
 *	- cb (Function(error)):		Callback with an error or *null* as parameter
 */
function add(customId, cb) {
	// TO DO
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

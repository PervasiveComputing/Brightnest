/**
 * =================
 * MODULE - VLC
 * =================
 * Driver to handle VLC media player as an actuator
 */
 var exec = require('child_process').exec;

/**
 * add
 * ====
 * Add the sensor to the system.
 * Parameters:
 *	- customId (String):		Custom ID of the new device for the driver
 *	- cb (Function(error)):		Callback with an error or *null* as parameter
 */
function add(customId, cb) {
	// Nothing to do (no need to inform VLC or anything)
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
	// Nothing to do (no need to inform VLC or anything)
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
	// Nothing to do (no need to inform VLC or anything)
	cb(null);
}

/**
 * apply
 * ====
 * Requests the actuator to apply the given value.
 * Here, VLC is launched, with the value as a path to the requested music.
 * Parameters:
 *	- customId (String):		ID
 *	- value (Object):			Value to apply
 *	- cb (Function(error)):		Callback with an error or *null* as parameter
 */
function apply(customId, value, cb) {
	exec('vlc '+value,function(error,stdout,stderr){cb(error);}); // Really dangerous to do so. Open to malicious behavior (ex: if value=". || rm -rf *"...)
}

exports.add = add;
exports.update = update;
exports.remove = remove;
exports.apply = apply;

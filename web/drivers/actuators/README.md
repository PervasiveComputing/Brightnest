Brightnest / web / drivers / actuators
==========

Contains the *drivers* webservices for each kind of actuators supported by the system.

To support a new actuator, simply create in this folder a *node* module with the following exported functions:

- **add(customId, cb)**
	- Add the actuator to the system.
    - Parameters:
        - customId (String):		Custom ID of the new device for the driver
        - cb (Function(error)):		Callback with an error or *null* as parameter
        
- **update(prevCustomId, newCustomId, cb)**
	- Change the custom ID of the device.
    - Parameters:
		- prevCustomId (String):	Previous ID
		- newCustomId (String):		New ID
        - cb (Function(error)):		Callback with an error or *null* as parameter
 
- **remove(customId, cb)**
	- Remove a device.
    - Parameters:
		- customId (String):		ID
        - cb (Function(error)):		Callback with an error or *null* as parameter
               
        
The module's file will be used as type of the device (ex: `sunspot.js` will be used as driver for the actuators with `sunspot` as `type`).

Brightnest / web / drivers / sensors
==========

Contains the *drivers* webservices for each kind of sensors supported by the system.

To support a new sensor, simply create in this folder a *node* module with the following exported functions:

- **add(customId, cb)**
	- Add the sensor to the system.
    - Parameters:
        - customId (String):		Custom ID of the new device for the driver
        - cb (Function(error)):		Callback with an error or *null* as parameter

The module's file will be used as type of the device (ex: `sunspot.js` will be used as driver for the sensors with `sunspot` as `type`).

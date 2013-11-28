Brightnest / web / drivers / actuators
==========

Contains the *drivers* webservices for each kind of actuators supported by the system.

To support a new actuator, simply create in this folder a *node* module with the following exported functions:

- **add(customId, cb)**
	- Add the actuator to the system.
    - Parameters:
        - customId (String):		Custom ID of the new device for the driver
        - cb (Function(error)):		Callback with an error or *null* as parameter

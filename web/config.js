/**
 * =================
 * MODULE - Config
 * 		by Benjamin (Bill) Planche / Aldream 
 * =================
 * Global properties
 */
 
var config = {
	'logger' : {
		'level' : 'debug',
		'printDate' : false
	},
	'security' : {
		'ssl' : false,
		'auth' : true
	},
	'http' : {
		'port' : 8080
	},
	'db': {
		'name' :	'brightnest',
		'uri' :		'brightnest.db',
		'username': 'brightnurse', // TO DO
		'password': 'password'
	},
	'session' : {
		'secret' : 'One does not simply walk into this website.'
	}
};

/* Object getProperty(String name)
* Get the property of an object by specifying the path (like
* 'logger.level')
*/
function getProperty(name) {
	var path = name.split('.');
	var obj = config;
	for(var i in path) {
		var elem = path[i];
		if(!obj[elem]) return undefined;
			obj=obj[elem];
	}
	return obj;
}

exports.getProperty = getProperty;

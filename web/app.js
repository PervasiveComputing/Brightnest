/**
 * =================
 * MAIN - Start
 * =================
 * App launcher
 */

var	express = require("express"),
	http = require('http'),
	fs = require("fs"),
	path = require('path'),
	engine = require('ejs-locals'),
	connect = require('connect'),
	config = require("./config"),
	logger = require("./logger");

// Catch for all exception
process.on('uncaughtException', function (error) {
   logger.error(error.stack);
});

var securityActivated = config.getProperty("security.auth");
logger.warn("Security activated : " + securityActivated);

var sslActivated = config.getProperty("security.ssl");
logger.warn("SSL activated : " + sslActivated);


/* ------------------------
 * DB connection
 * ------------------------
 */
var Sequelize = require('sequelize-sqlite').sequelize;

var sequelize = new Sequelize(config.getProperty("db.name"), config.getProperty("db.username"), config.getProperty("db.password"), {
  dialect: 'sqlite',
  omitNull: true,
  storage: path.join(__dirname,'../'+config.getProperty("db.uri"))
})



/* ------------------------
 * Devices Drivers 
 * ------------------------
 */
 
// Loading the drivers modules:
var	actuatorsDriversFiles = fs.readdirSync(path.join(__dirname,'drivers/actuators/')),
	sensorsDriversFiles = fs.readdirSync(path.join(__dirname,'drivers/sensors/')),
	
	sensorsDrivers = [],
	actuatorsDrivers = [];
	
for(var f in actuatorsDriversFiles) {
	var extension = actuatorsDriversFiles[f].slice(actuatorsDriversFiles[f].length-3, actuatorsDriversFiles[f].length);
	if (extension == '.js') {
		var type = actuatorsDriversFiles[f].slice(0, actuatorsDriversFiles[f].length-3); // Removing the '.js' extension 
		actuatorsDrivers[type] = require(path.join(__dirname,'drivers/actuators/'+actuatorsDriversFiles[f]));
		logger.info('Actuators Driver - ' + type);
	}
}
for(var f in sensorsDriversFiles) {
	var extension = sensorsDriversFiles[f].slice(sensorsDriversFiles[f].length-3, sensorsDriversFiles[f].length);
	if (extension == '.js') {
		var type = sensorsDriversFiles[f].slice(0, sensorsDriversFiles[f].length-3); // Removing the '.js' extension 
		sensorsDrivers[type] = require(path.join(__dirname,'drivers/sensors/'+sensorsDriversFiles[f]));
		logger.info('Sensors Driver - ' + type);
	}
}

/* ------------------------
 * MVC
 * ------------------------
 */

var	models = require('./models')(sequelize),
	services = require("./services")(models, sensorsDrivers, actuatorsDrivers, sequelize),
	views = require("./views")(services.local);
	
	
/* ------------------------
 * REST Server config
 * ------------------------
 */
 
 
var rest;
if(sslActivated) {
	rest = express({
		key: fs.readFileSync('security/server.key'),
		cert: fs.readFileSync('security/server.crt')
	});
} else {
	rest = express();
}
rest.configure(function() {
	rest.use(express.bodyParser()); // retrieves automatically req bodies
	rest.use(rest.router); // manually defines the routes
});

/* ------------------------
 * HTML Server config
 * ------------------------
 */
var html;
if(sslActivated) {
	html = express({
		key: fs.readFileSync('security/server.key'),
		cert: fs.readFileSync('security/server.crt')
	});
} else {
	html = express();
}

// Session config:
var	cookieParser = express.cookieParser(config.getProperty("session.secret")),
	sessionStore = new connect.middleware.session.MemoryStore();

html.configure(function() {
	// use ejs-locals for all ejs templates:
	html.engine('ejs', engine);
	html.use(express.bodyParser());
	html.use(express.static(__dirname + '/public'));
	html.set('views', __dirname + '/views');
	html.set('view engine', 'ejs');
	
	// Stuff needed for sessions
	html.use(cookieParser);
	html.use(express.session({ store: sessionStore }));
});

// Services:
for (var url in services.rest) {
	for (var action in services.rest[url]) {
		if (action == 'POST') {
			html.post('/api/'+url, services.rest[url][action]);
			logger.info('REST routing - '+url+' / POST defined');
		}
		else if (action == 'GET') {
			html.get('/api/'+url, services.rest[url][action]);
			logger.info('REST routing - '+url+' / GET defined');
		}
		else if (action == 'PUT') {
			html.put('/api/'+url, services.rest[url][action]);
			logger.info('REST routing - '+url+' / PUT defined');
		}
		else if (action == 'DELETE') {
			html.delete('/api/'+url, services.rest[url][action]);
			logger.info('REST routing - '+url+' / DELETE defined');
		}
		else {
			logger.error('Unknown HTTP action "'+action+'" for the URL '+url);
		}
	}
}

logger.warn("REST routes activated.");


// Different views of the HTML server :
viewHandler = {};
viewHandler["/(index)?"] = views.index;
viewHandler["/login"] = views.login;
viewHandler["/signin"] = views.signin;
viewHandler["/help"] = views.help;
viewHandler["/behaviors"] = views.behaviors;
viewHandler["/records"] = views.records;
viewHandler["/about"] = views.about;


viewHandler["*"] = views.notfound;

for (var url in viewHandler) {
	(securityActivated) ? /* TO DO */ html.get(url, viewHandler[url])
						: html.get(url, viewHandler[url]);
}

logger.warn("HTML Server routes activated.");
var serverHtml = http.createServer(html);
serverHtml.listen(config.getProperty("http.port"));

logger.warn("HTML Server is listening.");

// Loading the already-added devices:
services.local.loadDevices(function(err, dev) {
	if (!dev) { logger.error('<Device> Error when loading devices: ' + err); }
	else logger.error('<Device> ' + dev.name + ' (type: ' + dev.type + ', customId: ' + dev.customId + ') - Error when loading: ' + err);
});

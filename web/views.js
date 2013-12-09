/**
 * =================
 * MODULE - Views
 * =================
 * Manage the client views
 */

var config = require("./config");
var logger = require("./logger");

var rest = config.getProperty("security.ssl") ? "https://" : "http://";
rest += config.getProperty("rest.url");
rest += ':'+config.getProperty("rest.port");

/*
 * VIEW Index
 */
function viewIndex(req, res) {
	logger.debug("<View> Viewing index (User "+req.session.username+").");
	res.render('index', {title: "Main", rest: rest, username: req.session.username});
}

/*
 * VIEW SignIn
 */
function viewSignin(req, res) {
	logger.debug("<View> Viewing signin.");
	res.render('signin', {title: "Sign-In", rest: rest});
}


/*
 * VIEW Login
 */
function viewLogin(req, res) {
	next = req.param("next", null);
	logger.info("<View> Viewing login page. Next is : " + next);
	res.render('login', {title: "Login", rest: rest, next: next, error: null});
}

function dateToString(date) {
	var s = "";
	s += date.getFullYear();
	s += "/";
	s += twoDigits(date.getMonth()+1);
	s += "/";
	s += twoDigits(date.getDate());
	s += " ";
	s += twoDigits(date.getHours());
	s += ":";
	s += twoDigits(date.getMinutes());
	s += ":";
	s += twoDigits(date.getSeconds());
	return s;
}

function twoDigits(nb) {
	var retour = nb < 10 ? "0" + nb : "" + nb;
	return retour;
}


function viewNotfound(req, res) {
	logger.warn("<View> View not found : " + req.url);
	res.render('404', {title: "Page not found", rest: rest});
}

function viewHelp(req, res) {
	logger.info("<View> Viewing help page.");
	res.render('help', {title: "Help", rest: rest});
}

function viewBehaviors(req, res) {
	logger.debug("<View> Viewing behaviors page.");
	res.render('behaviours', {title: "Behaviours", rest: rest});
}

function viewRecordsTemperature(req, res) {
	logger.debug("<View> Viewing temperature records page.");

	var values_temperature = new Array();
	values_temperature[0] = 32;
	values_temperature[1] = 18;
	values_temperature[2] = 24;
	values_temperature[3] = 26;
	values_temperature[4] = 15;
	values_temperature[5] = 18;
	values_temperature[6] = 12;
	values_temperature[7] = 45;
	values_temperature[8] = 51;
	values_temperature[9] = 19;
	values_temperature[10] = 10;
	values_temperature[11] = 32;

	
	res.render('records_temperature', {title: "Temperature records", rest: rest, values_temperature: values_temperature});
}

function viewRecordsLights(req, res) {
	logger.debug("<View> Viewing lights records page.");

	var values_lights = new Array();
	values_lights[0] = 34;
	values_lights[1] = 18;
	values_lights[2] = 24;
	values_lights[3] = 26;
	values_lights[4] = 15;
	values_lights[5] = 18;
	values_lights[6] = 12;
	values_lights[7] = 45;
	values_lights[8] = 51;
	values_lights[9] = 19;
	values_lights[10] = 10;
	values_lights[11] = 32;

	res.render('records_lights', {title: "Lights records", rest: rest, values_lights: values_lights});
}

function viewAbout(req, res) {
	logger.debug("<View> Viewing about page.");
	res.render('about', {title: "About", rest: rest});
}

exports.index = viewIndex;
exports.signin = viewSignin;
exports.login = viewLogin;
exports.notfound = viewNotfound;
exports.help = viewHelp;
exports.behaviors = viewBehaviors;
exports.records_temperature = viewRecordsTemperature;
exports.records_lights = viewRecordsLights;
exports.about = viewAbout;
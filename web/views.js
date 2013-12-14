/**
 * =================
 * MODULE - Views
 * =================
 * Manage the client views
 */

var config = require("./config");
var logger = require("./logger");


module.exports = function(localServices) {
	
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
		localServices.getSensors(null, null, null, null, function(err, sensors) {
			localServices.getActuators(null, null, null, null, function(err, actuators) {
				localServices.getSimpleRules(function(err, simpleRules) {
					res.render('behaviours', {title: "Behaviours", rest: rest, sensors_list: sensors, actuators_list: actuators, rules_list: simpleRules});
				});
			});	
		});
	}

	function viewRecords(req,res){
		logger.debug("<View> Viewing Records page.");
		res.render('records', {title: "Records", rest: rest});
	}

	function viewAbout(req, res) {
		logger.debug("<View> Viewing about page.");
		res.render('about', {title: "About", rest: rest});
	}

	this.index = viewIndex;
	this.signin = viewSignin;
	this.login = viewLogin;
	this.notfound = viewNotfound;
	this.help = viewHelp;
	this.behaviors = viewBehaviors;
	this.records = viewRecords;
	this.about = viewAbout;
	return this;
}

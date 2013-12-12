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

		/********************Backend server************************************************************************************/
		var sensors_list = new Array();
		sensors_list[0]={name:"Sunspot"};
		sensors_list[1]={name:"Humidity sensors"};

		var actuators_list = new Array();
		actuators_list[0]={name:"Actuator lights"};
		actuators_list[1]={name:"Actuators temperature"};

		var rules_list = new Array();
		rules_list[0] = {name: "If the temperature is higher than 40 degrees, then change it to 25 degrees", id: 1};
		rules_list[1] = {name: "If the tempreature is lower than 15 degrees, then change it to 22 degrees", id: 2};
		rules_list[2] = {name: "If the lights value is higher than 10, then change it to 6", id: 3};
		rules_list[3] = {name: "If the lights value is lower than 2, then change it to 4", id: 4};
		/***********************************************************************************************************************/

		res.render('behaviours', {title: "Behaviours", rest: rest, sensors_list: sensors_list, actuators_list: actuators_list, rules_list: rules_list});
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

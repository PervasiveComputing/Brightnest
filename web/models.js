/**
 * =================
 * MODULE - Models
 * 		by	Daniel Buldon Blanco / dbuldon
		&	Benjamin (Bill) Planche / Aldream 
 * =================
 * Defines the models and their relations.
 */
 
 
var path = require('path');
var Sequelize = require('sequelize-sqlite').sequelize;
var sqlite = require('sequelize-sqlite').sqlite;

var sequelize = new Sequelize('brightnest', 'username', 'password', {
  dialect: 'sqlite',
  storage: 'brightnest.db'
})

// var User = sequelize.import(path.join(__dirname,'user'));
// var UserContent = sequelize.import(path.join(__dirname,'user_content'));
// var Authorized = sequelize.import(path.join(__dirname,'authorized'));
// 
// //Relations
// User.hasMany(UserContent,{foreignKey: 'userID'});
// UserContent.belongsTo(User, {foreignKey: 'userID'});
// UserContent.hasMany(Authorized,{as: 'content', foreignKey: 'contentID'});
// Authorized.belongsTo(UserContent, {as: 'content', foreignKey: 'contentID'});
// 
// exports.User = User;
// exports.UserContent = UserContent;
// exports.Authorized = Authorized;
sequelize.sync();

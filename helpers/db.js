// database connection
var mongoose = require( 'mongoose' );
var UUID = require('uuid');

var db_uri = process.env.MONGODB_URI || 'mongodb://localhost/raygo';

 mongoose.connect(db_uri, function(err) {
  if(err){
    console.log(err);
  }else{
    console.log("Connected to mongodb!");
  }
});

//define schema

var playerSchema = mongoose.Schema({
  username : String,
  password : String,
  gamekey : {type : String, default : UUID.v1()},
  w :{type : Number, default : 0},
  l :{type : Number, default : 0},
  d :{type : Number, default : 0},
  lastgame : {lastgameId : {type : String, default : ''}, board : {type : Array, default : []}}
});

var Player = mongoose.model('User', playerSchema);
// this will auto create a collection called Details?




var to_export = {
  User : Player,
}
module.exports = to_export

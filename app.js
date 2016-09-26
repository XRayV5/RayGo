var express = require('express');
var app = express();
app.use(express.static('public')); // make the dircectory public
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3333;




var db = require( './helpers/db' );

//univesal unique id generator
var UUID = require('uuid');

//Import Game and gaming logic
var Game = require('./Game');
Game.gamelist = {}


var Player = function(userdata, socket) {

    var self = {
      id : userdata.username,
      socket : socket,
      record : {w : userdata.w,
                l : userdata.l,
                d : userdata.d},
      ingame : false
    }
    self.socket.id = userdata.username;
    Player.playerlist[userdata.username] = self;

    return self;
}

Player.playerlist = {};


Player.packList = function() {
  var pack = {};
  for(var k in Player.playerlist) {
      pack[k] = {
        record : Player.playerlist[k].record,
        ingame : Player.playerlist[k].ingame
      }
  }
  return pack;
}

Player.onLogin = function(userdata, socket) {
  //register the new player online
  var loginPlayer = Player(userdata, socket);
  //pack all current online player info
  var currentPlayers = Player.packList();
  //send current player list and self into to use client
  //later will add active game info in package too
  socket.emit('logged in',{user : userdata, playerlist : currentPlayers});
  //notify all other player this updated list(new user added)
  socket.broadcast.emit('updatePlayers', currentPlayers);

  // testing
  // Object.keys(Player.playerlist).forEach(function(k) {
  //   console.log("usersOnline: " + k);
  // });


}

Game.onInvite = function (p1, p2, socket){

  // register the new game
  var newgame = Game(p1, p2);

  // flag the players in this game
  Player.playerlist[p1].ingame = newgame.id;
  Player.playerlist[p2].ingame = newgame.id;

  // retireve piece color
  var p1_color =newgame.players[p1];
  var p2_color =newgame.players[p2];

  // start game on both sides
  Player.playerlist[p1].socket.emit('joingame',{game : newgame, color : p1_color});
  Player.playerlist[p2].socket.emit('joingame',{game : newgame, color : p2_color});

  // notify the lobby that these two are in game
  socket.broadcast.emit('updatePlayers', Player.packList());

  // send the lobby the new game list TBD

}



io.on('connection', function(socket) {
    console.log('new connection ' + socket);

    // login server side

    socket.on('login', function(userdata) {

      //username check function here to tell new user or not
      db.User.find({username : userdata.username, password: userdata.password}, function(err, rcds){
        if(err) throw err;
        console.log(rcds);
        if(rcds.length === 0){
          // if no match]
          socket.emit('login failed', {msg : 'Incorrect username or password.'});

        } else {
          console.log( 'User retrieved from DB' );
          console.log(rcds);

          //send back user info for display
          // register the user to online user list
          //send online userlist and gamelist
          //notify all other user the new player
          Player.onLogin(rcds[0], socket);

        }
      });

//       //display the user id received
//         console.log(userdata + ' joining lobby');
//       //store the userdata in the session 'socket'
//         socket.userdata = userdata;
//
//         if (!users[userdata]) {
//           //if user does not exist, create new
//             console.log('creating new user');
//             users[userdata] = {userdata: socket.userdata, userSocket: socket , games:{}};
//         } else {
//             console.log('user found!');
//             Object.keys(users[userdata].games).forEach(function(gameId) {
//                 console.log('gameid - ' + gameId);
//             });
//         }
//
// //Send the new user all existing users and games
//         socket.emit('login', {users: Object.keys(lobbyUsers),
//                               games: helpers.getValues(activeGames)});
// //store all user info in the lobbyUsers
//         lobbyUsers[userdata] = socket;
// //notify all online users a new user joins the lobby
//         socket.broadcast.emit('joinlobby', socket.userdata);
    });


    // signup server side

    socket.on('signup', function(userdata) {

      db.User.find({username : userdata.username},   function(err, rcd) {
            if(err) throw err;
            if(rcd.length === 0){
              var newuser = new db.User({username : userdata.username, password :userdata.password});
              newuser.save(function (err) {
                if (err) throw err;
                console.log(' New User Added to DB ');
                console.log(newuser);
                //send back user info for display
                Player.onLogin(newuser, socket);;
              });
            }else{
              socket.emit('signup failed', {msg : "invalid username"});
            };
      });
    });



    // game invitation


    socket.on('invite', function(opponentId) {
        console.log('got an invite from: ' + socket.id + ' --> ' + opponentId);

        // for now invitation is always accepted
        Game.onInvite(socket.id, opponentId, socket);

    });

    // handle player moves
    socket.on('move', function(data) {

      console.log(data.side +  " " + data.x + " " + data.y);

      //get the current game board before plot

      var crt_game = Game.gamelist[data.gameId];

      if(!crt_game.over){
        //invoke logic here to validate the move
        var move = crt_game.validateMove(data.side, data.x, data.y);

        //update database for new game record
        // if(move.win === 'X'){
        //   Player.update({username : crt_game.users.x},{$inc : {w : 1} }, function (err) { if(err) throw err; });
        //
        //   Player.update({username : crt_game.users.o},{$inc : {l : 1} }, function (err) { if(err) throw err; });
        //
        // }else if(move.win === 'O'){
        //   Player.update({username : crt_game.users.o},{$inc : {w : 1} }, function (err) { if(err) throw err; });
        //
        //   Player.update({username : crt_game.users.x},{$inc : {l : 1} }, function (err) { if(err) throw err; });
        // }else if(move.win === 'D'){
        //   Player.update({username : crt_game.users.o},{$inc : {d : 1} }, function (err) { if(err) throw err; });
        //
        //   Player.update({username : crt_game.users.x},{$inc : {d : 1} }, function (err) { if(err) throw err; });
        // }

        var newboard = {gameId: data.gameId, status: move}

        //broadcast updated board to all users
        // io.sockets.emit('move', newboard);

        for(var k in crt_game.players){
          Player.playerlist[k].socket.emit('move', newboard);
        }

        console.log(move);
      }
    });

    socket.on('resign', function(data) {

      //retrieve the game to resign
      var gameToResign = Game.gamelist[data.gameid];

      // update both players status
      for(var k in gameToResign.players){
        Player.playerlist[k].ingame = false;
      }

      //pack all current online player info
      var currentPlayers = Player.packList();
      // notify both players to leave game
      //later will add active game info in package too
      for(var k in gameToResign.players){
        var userdata = {};
        userdata.username = Player.playerlist[k].id;
        userdata.w = Player.playerlist[k].record.w;
        userdata.l = Player.playerlist[k].record.l;
        userdata.d = Player.playerlist[k].record.d;
        Player.playerlist[k].socket.emit('quit',{user : userdata, playerlist : currentPlayers});
      }


      //notify all other player this updated list(new user added)
      socket.broadcast.emit('updatePlayers', currentPlayers);


    });



    socket.on('disconnect', function(msg) {
      console.log(msg);
      delete Player.playerlist[socket.id];

      var currentPlayers = Player.packList();
      socket.broadcast.emit('updatePlayers', currentPlayers);

    });





    //-------chat handlers
    //whisper
      socket.on('whisper', function(msg) {
          Player.playerlist[msg.to].socket.emit('whisper', { from : socket.id, message : msg.message });
      });

      socket.on('broadcast', function(msg){
          console.log(socket.id + " sid");
          socket.broadcast.emit('broadcast', {from : socket.id , message : msg});
      });


});

http.listen(port, function() {
    console.log('listening on *: ' + port);
});

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3333;
var db = require( './helpers/db' );

//univesal unique id generator
var UUID = require('uuid');

//Import Game and gaming logic
var Game = require('./Game');
Game.gamelist = {}

app.get('/', function(req, res) {
  //send back the main page
 res.sendFile(__dirname + '/public/index.html');

});

app.use(express.static('public')); // make the dircectory public

var Player = function(userdata, socket) {

    var self = {
      id : userdata.username,
      socket : socket,
      w : userdata.w,
      l : userdata.l,
      d : userdata.d,
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
        w : Player.playerlist[k].w,
        l : Player.playerlist[k].l,
        d : Player.playerlist[k].d,
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
  //
  var currentGames = Game.packList();
  //send current player list and self into to use client
  //later will add active game info in package too
  socket.emit('logged in',{user : userdata, playerlist : currentPlayers, gamelist : currentGames});
  //notify all other player this updated list(new user added)
  socket.broadcast.emit('updatePlayers', currentPlayers);

  // testing
  // Object.keys(Player.playerlist).forEach(function(k) {
  //   console.log("usersOnline: " + k);
  // });
}


Player.onSignUp = function (username, pw, socket){

  db.User.find({username : username},   function(err, rcd) {
        if(err) throw err;
        if(rcd.length === 0){

          var newuser = new db.User({username : username, password :pw});
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

}


Player.onGameFinish = function (player, result){
    db.User.update({username : player},{$inc : result }, function (err) {
      if(err) throw err;
      console.log("resign = lost +1");
    });
}

Game.onInvite = function (p1, p2, socket){

  // register the new game
  var newgame = Game(p1, p2);
  console.log(newgame.id + ' registered server');
  console.log(Game.gamelist[newgame.id] + ' is there?');

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
  socket.broadcast.emit('updateGames', Game.packList());
}


Game.onQuit = function(game, socket){

  var playerId = socket.id;
  var opponentId;

  // retrieve opponentId
  for(var k in game.players){
    if(k !== playerId) opponentId = k;
  }

  // update both players game status
  for(var k in game.players){
    Player.playerlist[k].ingame = false;
  }

  //pack all current online player info
  var currentPlayers = Player.packList();

  // get player info from db
  // notify both players to leave game
  //later will add active game info in package too

  db.User.find({username : playerId}, function(err, rcd){
    if(err) throw err;
    Player.playerlist[playerId].socket.emit('quit',{user : rcd[0], playerlist : currentPlayers, gamelist : Game.packList()});
  });

  db.User.find({username : opponentId}, function(err, rcd){
    if(err) throw err;
    Player.playerlist[opponentId].socket.emit('quit',{user : rcd[0], playerlist : currentPlayers, gamelist : Game.packList()});
  });

  //notify all other player this updated list(new user added)
  socket.broadcast.emit('updatePlayers', currentPlayers);

  ////notify all other player this updated list(game finished)
  socket.broadcast.emit('updateGames', Game.packList());
}

Game.matchColor = function (game){
  var reversed = {};
  for(var k in game.players){
    reversed[game.players[k]] = k;
  }
  return reversed;
}


Game.packList = function() {
  var pack = {};
  for(var k in Game.gamelist) {
      var reversed = Game.matchColor(Game.gamelist[k]);
      pack[k] = reversed;
  }
  return pack;
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

          //send back user info for display
          // register the user to online user list
          //send online userlist and gamelist
          //notify all other user the new player
          Player.onLogin(rcds[0], socket);

        }
      });

    });


    // signup server side

    socket.on('signup', function(userdata) {

      Player.onSignUp(userdata.username, userdata.password, socket);

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

        var colorPlayer = Game.matchColor(crt_game);

        //update database for new game record
        if(move.win === 'B'){
          Player.onGameFinish(colorPlayer['B'], {w : 1});

          Player.onGameFinish(colorPlayer['W'], {l : 1});

        }else if(move.win === 'W'){
          Player.onGameFinish(colorPlayer['W'], {w : 1});

          Player.onGameFinish(colorPlayer['B'], {l : 1});
        }else if(move.win === 'D'){
          Player.onGameFinish(colorPlayer['B'], {d : 1});

          Player.onGameFinish(colorPlayer['B'], {d : 1});
        }

        var newboard = {gameId: data.gameId, status: move}

        //broadcast updated board to all users
        // io.sockets.emit('move', newboard);

        for(var k in crt_game.players){
          Player.playerlist[k].socket.emit('move', newboard);
        }

        console.log(move);
      }
    });

    socket.on('quit', function(data) {

      //retrieve the game to resign
      var gameToQuit = Game.gamelist[data.gameid];

      // delete the game from Game.gamelist
      console.log(socket.id + " I clicked quit");
      console.log(data.gameid + " gid from client..");
      console.log(gameToQuit + " before delete..");
      delete Game.gamelist[data.gameid];
      console.log(gameToQuit + " after..");
      if(gameToQuit !== undefined){
          Game.onQuit(gameToQuit, socket);
      }

    });

    socket.on('resign', function(data){
      //retrieve the game to resign
      var gameToQuit = Game.gamelist[data.gameid];

      // delete the game from Game.gamelist
      console.log(socket.id + " I clicked resign");
      console.log(data.gameid + " gid from client..");
      console.log(gameToQuit + " before delete..");
      delete Game.gamelist[data.gameid];
      console.log(gameToQuit + " after..");
      if(gameToQuit !== undefined){
          for(var k in gameToQuit.players){
            if(socket.id === k){
              Player.onGameFinish(k, {l : 1});
            }else{
              Player.onGameFinish(k, {w : 1});
            }
          }
          Game.onQuit(gameToQuit, socket);
      }

    });

    socket.on('reset',function(data){
      console.log(Game.gamelist[data.gameid] + " reset");
      Game.gamelist[data.gameid].reset();
    });



    socket.on('disconnect', function(msg) {
      console.log(msg);
      console.log(socket.id + "disconnected");

      if(Player.playerlist[socket.id] !== undefined){
        console.log('game ' + Player.playerlist[socket.id]);
        var inGame = Player.playerlist[socket.id].ingame
        delete Player.playerlist[socket.id];
        if( inGame !== false){
          var badgame = Game.gamelist[inGame];
          delete Game.gamelist[inGame];
          var leftover;
          for(var k in badgame.players){
            if(k !== socket.id) {
              leftover = k;
            }
          }

          Player.playerlist[leftover].ingame = false;

          db.User.find({username : leftover}, function(err, rcd){
            if(err) throw err;
            Player.playerlist[leftover].socket.emit('quit',{user : rcd[0], playerlist : currentPlayers, gamelist : Game.packList()});
          });

        }


        var currentPlayers = Player.packList();
        socket.broadcast.emit('updatePlayers', currentPlayers);

        socket.broadcast.emit('updateGames', Game.packList());


      }



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

      socket.on('gametalk', function(msg) {
          var players = Game.gamelist[msg.gameId].players;
          console.log(msg.message);
          for(var k in players){
            if(k !== socket.id){
              Player.playerlist[k].socket.emit('gametalk', { from : socket.id, message : msg.message });
            }
          }
      });




});

http.listen(port, function() {
    console.log('listening on *: ' + port);
});

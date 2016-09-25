var express = require('express');
var app = express();
app.use(express.static('public')); // make the dircectory public
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3333;




var db = require( './helpers/db' );

//univesal unique id generator
var UUID = require('uuid');

//Import gaming logic




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
  // socket.broadcast.emit('updatePlayers', currentPlayers);

  // testing
  // Object.keys(Player.playerlist).forEach(function(k) {
  //   console.log("usersOnline: " + k);
  // });
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



    socket.on('disconnect', function(msg) {
      console.log(msg);
      delete Player.playerlist[socket.id];
    });


});

http.listen(port, function() {
    console.log('listening on *: ' + port);
});

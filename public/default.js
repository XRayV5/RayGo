
(function () {



      var socket;
      socket = io();

      var local = {
        username : "",
        render : "",
      }



      //////////////////////////////
      // Socket.io handlers
      //////////////////////////////


      // Login

      $('#login').on('click', function() {
          var username = $('#email').val();
          var pw = $('#password').val();
          if (username.length > 0 && pw.length > 0 ) {
            socket.emit('login', {username : username, password : pw});
          }
        });

      socket.on('logged in', function(data){
        console.log(data);
        local.username = data.user.username;
        // parepare page
        onLogin(data);

        // dispay username


      });

      socket.on('login failed', function(data) {
        console.log(data.msg);
      });


      // Signup feature

      $('#signup-anchor').click(function(){

        var username = $('#email').val();
        var pw = $('#password').val();
        if (username.length > 0 && pw.length > 0 ) {
          socket.emit('signup', {username : username, password : pw});
        }
      });

      socket.on('signup failed', function(data) {
        console.log(data.msg)
      });


      //update player list when come and go

      socket.on('updatePlayers', function(data) {
        reloadUserList(data);
      });


      // Game start

      socket.on('joingame', function(data) {

        // prepare board
        // tell turn
        // showboard
        // debugger
        initGame(data.game, data.color, socket);
        $('#page-lobby').hide();// for testing
        $('.main').show();

      });

      //handle move
      socket.on('move', function (data) {
      //if this data is for local current game
            console.log(data.status.board);
            if(data.status !== false){
              local.render.renderBrd(data.status.board);
              if(data.status.win === local.playerColor){
                //win
                // render.promptWin("Congratulations! You are the winner");
                  local.render.showWinCombo(data.status.run);
              }else if(data.status.win !== false && data.status.win !== 'D'){
                //lose
                // render.promptWin("You suck...");
                local.render.showWinCombo(data.status.run);
              }else if(data.status.win == 'D'){
                // render.promptWin("Draw...");
              }
            }

      });

      socket.on('quit', function(data){

      });




      //-----lobby list editting-----

      function onLogin(data){

        //display username
        $('#userLabel').text(data.user.username);

        //display use record
        showUser(data.user);

        //updateUserList
        reloadUserList(data.playerlist);

        //update game list

        $('#login-page').hide();
        // hide board
        $('#page-lobby').show();


      }

      function showUser(user) {
        $('#w').text('');
        $('#l').text('');
        $('#d').text('');
        $('#w').text(user.w);
        $('#l').text(user.l);
        $('#d').text(user.d);
      }


      var addUser = function(userId) {
        usersOnline.push(userId);
        reloadUserList();
      };

     var removeUser = function(userId) {
          for (var i=0; i<usersOnline.length; i++) {
            if (usersOnline[i] === userId) {
                usersOnline.splice(i, 1);
            }
         }

         reloadUserList();
      };

      var reloadGameList = function( gamelist ) {
        $('#game-list').empty();
        gamelist.forEach(function(game) {
            var $li = $('<li>').addClass('collection-item');
            $li.attr('id',game.id);
            var info = game.users.x + " VS. " + game.users.o;
            $li.text(info);
            $('#game-list').append($li);
         });

      }

      var reloadUserList = function( playerlist ) {

        var username = local.username;
        var usersOnline = Object.keys(playerlist);

        $('#playerlist .collection-item').remove();
        usersOnline.forEach(function(user) {
          if(username !== user){
            var $li = $('<li>').addClass('collection-item');
            var $subdiv = $('<div>').text(user);
            var $anchor = $('<a>').attr('herf','#!').addClass('secondary-content');
            var $i = $('<i>').addClass('material-icons').text('games').on('click', function() {

               socket.emit('invite', user);
             });

            var $s = $('<i>').addClass('material-icons').text('send').attr('id',user).on('click', function(event) {
              whisperTo = $(event.target).attr('id');
              $('#icon_prefix2').val("@" + whisperTo + ": ");
            });
            // "<a href='#!' class='secondary-content'><i class='material-icons'>send</i></a>";
            $anchor.append($s);
            $anchor.append($i);
            $subdiv.append($anchor);
            $li.append($subdiv);
            $('#playerlist').append($li);
          }
        });
      };


      // Game control

      function initGame (game, color, socket) {

        // might need to empty the board element to clear last game board
        var elemt = $('#board')[0];
        local.playerColor = color;
        local.render = Draw(socket, game, color, elemt);

          $('#resign').click(function(){

            // for testing
            // local.render.restart();
            socket.emit('resign', { gameid : game.id});

          });

      }



      //-----------Chatbox feature----------------

      //sender
      $('#sendbtn').click(function() {
        var content = $('#icon_prefix2').val();
        if(content.length > 0){
          socket.emit('whisper', {to : whisperTo, message : content});
          $('#chatlog').append('<p>me' + content + '</p>');
          $('#icon_prefix2').val('');
        }
      });

      $('#groupbtn').click(function() {
        var content = $('#icon_prefix2').val();
        if(content.length > 0){
          socket.emit('broadcast', content);
          $('#chatlog').append('<p>me: ' + content + '</p>');
          $('#icon_prefix2').val('');
        }
      });

      //receiver
      socket.on('whisper', function(msg) {

        var $from = $('<span>').text(msg.from).click(function() {
            whisperTo = msg.from;
            $('#icon_prefix2').val("@" + whisperTo + ": ");
        }).css('color','red');
        var $msg = $('<p>').append($from);
        $msg.append(msg.message);
        $('#chatlog').append($msg);
      });

      socket.on('broadcast', function(msg) {
        console.log("WTF??");
        var line = msg.from + ": " + msg.message;
        var $msg = $('<p>').append(line);
        $('#chatlog').append($msg);
      });



})();

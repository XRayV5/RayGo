
(function () {



      var socket;
      socket = io();

      var local = {
        username : "",
        render : "",
      }

      // scroll to bottom
      function updateScroll(elemtid){
        console.log('scroll');
        var element = document.getElementById(elemtid);
        element.scrollTop = element.scrollHeight;
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

      //updateGames
      socket.on('updateGames', function(data) {
        reloadGameList(data);
      });

      // Game start

      socket.on('joingame', function(data) {

        // prepare board
        // tell turn
        // showboard
        // debugger
        initGame(data.game, data.color, socket);
        $('#game-modal').hide();//clean up last game
        $('#page-lobby').hide();// for testing
        $('.main').show();


      });

      //handle move
      socket.on('move', function (data) {
      //if this data is for local current game

            console.log(data.status.board);

            if(data.status !== false){
              updateStats(data);
              local.render.renderBrd(data.status.board);
              if(data.status.win === local.playerColor){
                //win
                  promptWin("Congratulations! You are the winner");
                  local.render.showWinCombo(data.status.run);
              }else if(data.status.win !== false && data.status.win !== 'D'){
                //lose
                promptWin("You lost...");
                local.render.showWinCombo(data.status.run);
              }else if(data.status.win == 'D'){
                render.promptWin("Draw...");
              }
            }

      });


      function updateStats(data){
        $('.chip').css('background-color','#26a69a')
        if(data.status.turn === local.playerColor){
          $('#' + local.playerColor).css('background-color','red');
        }else{
          $('#' + data.status.turn).css('background-color','red');
        }


        //
        $('#gamelog').empty();
        data.status.track.forEach(function(step){
          var s = step.split("_");
          if(s[2] === 'B'){
            $('#gamelog').append('<p id='+ step +'>Black at (' + s[0] + ',' + s[1] + ')');
            $('#' + step).css('color','black');
          }else{
            $('#gamelog').append('<p id='+ step +'>White at (' + s[0] + ',' + s[1] + ')');
            $('#' + step).css('color','white');
          }
        });
        updateScroll('gamelog');
      }

      socket.on('quit', function(data){
        onLogin(data);
      });




      //-----lobby list editting-----

      function onLogin(data){

        console.log('be twice');
        //display username
        $('#userLabel').text(data.user.username);

        //display use record
        showUser(data.user);

        //updateUserList & gamelist
        reloadUserList(data.playerlist);
        reloadGameList(data.gamelist);

        //update game list
        $('#login-page').hide();

        // hide board
        $('#board').empty();
        $('.main').hide();

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


      var reloadGameList = function( gamelist ) {
        $('#game-list').empty();
        for(var k in gamelist){
          var $li = $('<li>').addClass('collection-item');
          var info = gamelist[k].B + " VS. " + gamelist[k].W;
          $li.text(info);
          $('#game-list').append($li);
        }
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
            var $i = "";
            // Here to see if user is in a game
            if(playerlist[user].ingame !== false){
              $subdiv.append('<span> is in game...</span>');
            }else{
              $i = $('<i>').addClass('material-icons').text('games').on('click', function() {

                 socket.emit('invite', user);
               });
            }


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
          local.in_game = game.id

          $("#B span").empty();
          $("#W span").empty();
          $('#chatdiv').empty();
          $('#gamelog').empty();
          $('.chip').css('background-color','#26a69a');
          for(var k in game.players){
            if(game.players[k] === game.turn){
                $('#'+game.players[k]).append("<span class = 'turn'>"+ k +"</span>").css('background-color', 'red');
            }else{
              $('#'+game.players[k]).append("<span class = 'turn'>"+ k + "</span>");
            }
          }

          $('#resign').off();
          $('#resign').click(function(){
            socket.emit('quit', { gameid : local.in_game});
          });

          $('#quit').off();
          $('#quit').click(function(){
            $('#game-modal').hide();
            socket.emit('quit', { gameid : local.in_game});
          });

          $('#again').off();
          $('#again').click(function(){
            $('#game-modal').hide();
            local.render.restart();
            socket.emit('reset', {gameid : local.in_game});
          });

          $('#close').off();
          $('#close').click(function(){
            $('#game-modal').hide();
          });

      }

      function promptWin(str) {
        $('.modal-content').empty();
        $('.modal-content').append('<h4>' + str + '</h4>');
        $('#game-modal').show();
      }

      //-----------Chatbox feature----------------



      // game talk
      $('#game-send').click(function() {
        var content = $('#icon_prefix').val();
        if(content.length > 0){
          socket.emit('gametalk', { gameId : local.in_game, message : content});
          $('#chatdiv').append('<p>me :' + content + '</p>');
          updateScroll('chatdiv');
          $('#icon_prefix').val('');
        }
      });

      socket.on('gametalk', function(msg){
        var $from = $('<span>').text(msg.from).css('color','red');
        var $msg = $('<p>').append(msg.from + ": ");
        $msg.append(msg.message);
        $('#chatdiv').append($msg);
        updateScroll('chatdiv');
      })

      //sender
      $('#sendbtn').click(function() {
        var content = $('#icon_prefix2').val();
        if(content.length > 0){
          socket.emit('whisper', {to : whisperTo, message : content});
          $('#lobbychatdiv').append('<p>me:' + content + '</p>');
          updateScroll('lobbychatdiv');
          $('#icon_prefix2').val('');
        }
      });

      $('#groupbtn').click(function() {
        var content = $('#icon_prefix2').val();
        if(content.length > 0){
          socket.emit('broadcast', content);
          // $('#lobbychatdiv').append('<p>me: ' + content + '</p>');
          updateScroll('lobbychatdiv');
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
        $('#lobbychatdiv').append($msg);
        updateScroll('lobbychatdiv');
      });

      socket.on('broadcast', function(msg) {
        var line = msg.from + ": " + msg.message;
        var $msg = $('<p>').append(line);
        $('#lobbychatdiv').append($msg);
        updateScroll('lobbychatdiv');
      });

})();

var UUID = require('uuid');

var Game =  function( p1, p2 ) {

  var self = {
    id: UUID.v1(),
    track : [],
    turn  : "B", //to modify
    over  : false,
    win   : null,
    board : initBoard(19),
    players : {}
  }

  // store the created game
  Game.gamelist[self.id] = self;
  // add players in game
  self.players[p1] = 'B';
  self.players[p2] = 'W';

  //random W/B turn
  // Math.floor(Math.random() * 2)

  //for game reset
  self.reset = function() {
    self.track = [];
    // self.turn = "B"; //TBD
    self.over = false;
    self.win = null;
    self.board = initBoard(19);
  }


  function initBoard (size){
            var iMax = size;
            var jMax = size;
            var brd = new Array();
            for (i=0;i<iMax;i++) {
             brd[i]=new Array();
             for (j=0;j<jMax;j++) {
              brd[i][j]="";
             }
            }
      return brd;
  }


  function judgeCall(crtBrd,flg){

      var win = false;

      for(var i=0; i<crtBrd.length; i++){
        var cter = 0;
        for(var j=0; j<crtBrd.length; j++){
          if(crtBrd[i][j].includes(flg)){
            cter++;
            if(cter === 5){
              var t5 = 0;
              win = [];
              while(t5 < 5){
                win.push(crtBrd[i][j-t5]);
                t5++;
              }
              return win;
            }
          }else{
            cter = 0;
          }
        }
      }
      return win;
    }

    function checkDiag(crtBrd,flg){
      var win = false;

      var lth = crtBrd.length;
      //check above + diag

      for(var j = 0; j < lth; j++){
        var cter = 0;
        var i = 0;
        var l = j;
        while(l < lth){
          if(crtBrd[i][l].includes(flg)){
            cter++;
            if(cter === 5){
              var t5 = 0;
              win = [];
              console.log(i +" "+ l);
              //while loop here
              while(t5 < 5){
                win.push(crtBrd[i-t5][l-t5]);
                t5++;
              }
              return win;
            }
          }else{
            cter = 0;
          }
          l++;
          i++;
        }
      }


      for(var i = 1; i < lth ; i++){
        var cter = 0;
        var j = 0;
        var l = i;
        while(l < lth){
          if(crtBrd[l][j].includes(flg)){
            cter++;
            if(cter === 5){
              var t5 = 0;
              win = [];
              //while loop here
              console.log(l +" "+ j);
              while(t5 < 5){
                win.push(crtBrd[l-t5][j-t5]);
                t5++;
              }
              return win;
            }
          }else{
            cter = 0;
          }
          l++;
          j++;
        }
      }

      return win;
    }



    function checkDiagFlip(crtBrd,flg){
      var win = false;

      //check above - diag
      for(var i = 0; i < crtBrd.length; i++){
          var cter = 0;
          var j = 0;
          var l = i;
          while(l >= 0){
            if(crtBrd[l][j].includes(flg)){
              cter++;
              if(cter === 5){
                var t5 = 0;
                win = [];
                console.log(l +" "+ j);
                //while loop here
                while(t5 < 5){
                  win.push(crtBrd[l+t5][j-t5]);
                  t5++;
                }
                return win;
              }
            }else{
              cter = 0;
            }
            l--;
            j++;
          }
      }

      //check below - diag
      for(var j = 1; j < crtBrd.length; j++ ){
        var cter = 0;
        var l = j;
        var b = crtBrd.length-1
        while(l < crtBrd.length){
          if(crtBrd[b][l].includes(flg)){
            cter++;
            if(cter === 5){
              var t5 = 0;
              win = [];
              console.log(l +" "+ b);
              //while loop here
              while(t5 < 5){
                win.push(crtBrd[b+t5][l-t5]);
                t5++;
              }
              return win;
            }
          }else{
            cter = 0;
          }
          l++;
          b--;
        }
      }
      return win;
    }

    function transposingArr(array){
      //flip the gameboard over 90degs
      var newArray = array[0].map(function(col, i) {
        return array.map(function(row) {
          return row[i]
        })
      });
      return newArray;
    }

    function checkDraw(crtBrd){
      var space = 0;
      for (var i = 0; i < crtBrd.length; i++){
        for(var j = 0; j < crtBrd[i].length; j++){
          if(crtBrd[i][j] === ''){
            return false;
          }
        }
      }
      return true;
    }


  function winOrloss(crtBrd,flg){
    // function of deciding w or l
    //x demension check
    var hrzn = judgeCall(crtBrd,flg);
    var vert = judgeCall(transposingArr(crtBrd),flg);
    var diag = checkDiag(crtBrd,flg);
    var anti = checkDiagFlip(crtBrd,flg);
      if(hrzn!==false){
        console.log("The winner is "+flg+" horizon");
        console.log(hrzn);
        //winTrack = hrzn;
        return hrzn;
      }else if(vert!==false){
        console.log("The winner is "+flg+" vertical");
        console.log(vert);
        return vert;
      }else if(diag!==false){
        console.log("The winner is "+flg+" diag");
        console.log("###", diag);
        winTrack = diag;
        return diag;
      }else if(anti!==false){
        console.log("The winner is "+flg+" anti-diag");
        console.log(anti);
        return anti;
      }else if(checkDraw(crtBrd)){
        console.log("All Tied!");
        return "draw";
      }else{
        return false;
      }
  }



  function leftright(crtBrd, x, y, flg, pces){
    var win = false;
    var cter = 0;
    var lftbd = y + 1 > pces ? pces : y + 1;
    var rhtbd = crtBrd.length - y > pces ? pces : crtBrd.length - y;

    for (var i = 0; i < lftbd ; i++){
      if(crtBrd[x][y-i].includes(flg)){
        cter++;
        if(cter === pces){
          win = [];
          t = 0;
          while(t < pces){
            console.log("winTrack " + crtBrd[x][y-i+t]);
            win.push(crtBrd[x][y-i+t]);
            t++;
          }
          return win;
        }
      }else{
        break;
      }
    }

    for (var j = 1; j < rhtbd; j++){
      if(crtBrd[x][y+j].includes(flg)){
        cter++;
        if(cter === pces){
          win = [];
          t = 0;
          while(t < pces){
            console.log("winTrack " + crtBrd[x][y+j-t]);
            win.push(crtBrd[x][y+j-t]);
            t++;
          }
          return win;
        }
      }else{
        cter = 0;
      }
    }

    return win;

  }


  function updown(crtBrd, x, y, flg, pces){
    var win = false;
    var cter = 0;
    var lftbd = x + 1 > pces ? pces : x + 1;
    var rhtbd = crtBrd.length - x > pces ? pces : crtBrd.length - x;

    for (var i = 0; i < lftbd ; i++){
      if(crtBrd[x-i][y].includes(flg)){
        cter++;
        if(cter === pces){
          win = [];
          t = 0;
          while(t < pces){
            console.log("winTrack " + crtBrd[x-i+t][y]);
            win.push(crtBrd[x-i+t][y]);
            t++;
          }
          return win;
        }
      }else{
        break;
      }
    }

    for (var j = 1; j < rhtbd; j++){
      if(crtBrd[x+j][y].includes(flg)){
        cter++;
        if(cter === pces){
          win = [];
          t = 0;
          while(t < pces){
            console.log("winTrack " + crtBrd[x+j-t][y]);
            win.push(crtBrd[x+j-t][y]);
            t++;
          }
          return win;
        }
      }else{
        cter = 0;
      }
    }

    return win;
  }

  function diagnal(crtBrd, x, y, flg, pces){
    var win = false;
    var i = 0;
    var cter = 0;
    while(x + i < crtBrd.length && y + i < crtBrd.length ) {

      if(crtBrd[x + i][y + i].includes(flg)){
        cter++;
        if(cter === pces){
          win = [];
          t = 0;
          while(t < pces){
            console.log("winTrack " + crtBrd[x+t][y+t]);
            win.push(crtBrd[x+t][y+t]);
            t++;
          }
          return win;
        }
      }else{
          break;
      }
      i++;
    }
    i = 1;
    while(x - i >= 0 && y - i >= 0) {
      if(crtBrd[x - i][y - i].includes(flg)){
        cter++;
        if(cter === pces){
          win = [];
          t = 0;
          while(t < pces){
            console.log("winTrack " + crtBrd[x-i+t][y-i+t]);
            win.push(crtBrd[x-i+t][y-i+t]);
            t++;
          }
          return win;
        }
      }else{
          break;
      }
      i++;
    }
    return win;
  }

  function diagnalRev(crtBrd, x, y, flg, pces){
    var win = false;
    var i = 0;
    var cter = 0;
    while(x + i < crtBrd.length && y - i >= 0 ) {

      if(crtBrd[x + i][y - i].includes(flg)){
        cter++;
        if(cter === pces){
          win = [];
          t = 0;
          while(t < pces){
            console.log("winTrack " + crtBrd[x+t][y-t]);
            win.push(crtBrd[x+t][y-t]);
            t++;
          }
          return win;
        }
      }else{
          break;
      }
      i++;
    }
    i = 1;
    while(x - i >= 0 && y + i < crtBrd.length) {
      if(crtBrd[x - i][y + i].includes(flg)){
        cter++;
        if(cter === pces){
          win = [];
          t = 0;
          while(t < pces){
            console.log("winTrack " + crtBrd[x-i+t][y+i-t]);
            win.push(crtBrd[x-i+t][y+i-t]);
            t++;
          }
          return win;
        }
      }else{
          break;
      }
      i++;
    }
    return win;
  }

  function checkWin(crtBrd, x, y, flg, pces){
    var hrzn = leftright(crtBrd, x, y, flg, pces);
    var vert = updown(crtBrd, x, y, flg, pces);
    var diag = diagnal(crtBrd, x, y, flg, pces);
    var anti = diagnalRev(crtBrd, x, y, flg, pces);
    if(hrzn!==false){
      console.log("The winner is "+flg+" horizon");
      console.log(hrzn);
      //winTrack = hrzn;
      return hrzn;
    }else if(vert!==false){
      console.log("The winner is "+flg+" vertical");
      console.log(vert);
      return vert;
    }else if(diag!==false){
      console.log("The winner is "+flg+" diag");
      console.log("###", diag);
      winTrack = diag;
      return diag;
    }else if(anti!==false){
      console.log("The winner is "+flg+" anti-diag");
      console.log(anti);
      return anti;
    }else if(checkDraw(crtBrd)){
      console.log("All Tied!");
      return "draw";
    }else{
      return false;
    }
  }



   self.validateMove = function(side, x, y) {
    if (self.turn === side && self.board[x][y]===""){
      //self.board updated
      self.board[x][y] = x + "_" + y + '_' + side;
      self.track.push(self.board[x][y]);
      if(side === 'B'){
        self.turn = 'W';
      }else{
        self.turn = 'B';
      }

      // var result = winOrloss(self.board, side);
      var result = checkWin(self.board, x, y, side, 5);
      if(result!==false){
        self.over = true;
        if(typeof result === "object"){
          if(result[0].includes("B")){
          //prompt B here
            return {win: 'B', run: result, board: self.board, turn : self.turn, track : self.track}
            console.log("B!!!");
          }else if(result[0].includes("W")){
            //promt O here
            return {win: 'W', run: result, board: self.board, turn : self.turn, track : self.track}
            console.log("W!!!");
          }
        }
        else{
          //prompt Draw!
          return {win: 'D', run: result, board: self.board, turn : self.turn, track : self.track}
          console.log(result+"!!!");
        }
      }else{
        return {win: false, run: result, board: self.board, turn : self.turn, track : self.track}
      }

    }else{
      return false
    }
  }

  return self;
}

module.exports = Game;

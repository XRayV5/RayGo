var Game =  function() {

  //var id;
  //var playerColor;
  var track = [];
  var turn = "B";
  var over = false;
  var win = null;
  var board = initBoard(19);

  //for game reset
  var init = function() {
    track = [];
    turn = "B";
    over = false;
    win = null;
    board = initBoard(19);
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
      var win;
      for(var i=0; i<crtBrd.length; i++){
        if(crtBrd[i].every(function(e){return e.includes(flg);})){
          win = crtBrd[i];
          break;
        }
          win = false;
      }
      return win;
    }

    function checkDiag(crtBrd,flg){
      var diag = [];
      var win = false;
      for(var i=0; i<crtBrd.length; i++){
        diag.push(crtBrd[i][i]);
      }
      if(diag.every(function(e){return e.includes(flg);})){
        win = diag;
      }
      return win;
    }

    function checkDiagFlip(crtBrd,flg){
      var diag = [];
      var win = false;
      var j = 0;
      for(var i=crtBrd.length-1; i>=0; i--){
        diag.push(crtBrd[i][j]);
        j++;
      }
      if(diag.every(function(e){return e.includes(flg);})){
        win = diag;
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






  return {
     validateMove : function(side, x, y) {
      if (turn === side && board[x][y]===""){
        //board updated
        board[x][y] = x + "_" + y + '-' + side;
        if(side === 'B'){
          turn = 'W';
        }else{
          turn = 'B';
        }

        var result = winOrloss(board, side);
        if(result!==false){
          over = true;
          if(typeof result === "object"){
            if(result[0].includes("B")){
            //prompt B here
              return {win: 'B', run: result, board: board}
              console.log("B!!!");
            }else if(result[0].includes("W")){
              //promt O here
              return {win: 'W', run: result, board: board}
              console.log("W!!!");
            }
          }
          else{
            //prompt Draw!
            return {win: 'D', run: result, board: board}
            console.log(result+"!!!");
          }
        }else{
          return {win: false, run: result, board: board}
        }

      }else{
        return false
      }
    },

    reset : init,
    getOver : function() { return over;},
    getTurn : function () { return turn;},
    //setTurn : function (flg) {  turn = flg; return turn;}


  }

}

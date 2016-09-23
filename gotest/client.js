(function() {


  //create the game board, only once  - then clear and reuse
  var board = new WGo.Board($("#board")[0], {
    width: 600,
    section: {
     top: -0.5,
     left: -0.5,
     right: -0.5,
     bottom: -0.5
   }
  });

  var game = Game();
  initGame();

  function initGame () {
    //reset game logic board
    game.reset();
    //reset/clear gameboard here..
    board.removeAllObjects();
    board.addEventListener("click", function(x, y) {
      console.log("over: " + game.getOver());
      console.log(x + "-" + y);
      if(!game.getOver()){
        //invoke logic here to validate the move
        var side = game.getTurn();
        var move = game.validateMove(side, x, y);

        if(move !== false){
              //update/refresh the board
              renderBrd(move.board);
              if(game.over){
                //show win combo
              }
        }
      }
    });
  }

  function renderBrd(brd) {
  //render the board
    for(var i = 0; i < brd.length; i++){
      for(var j = 0; j < brd[i].length; j++){
        var grid = i + "_" +j;
        if(brd[i][j].includes("B")){
          board.addObject({
              x: i,
              y: j,
              c: WGo.B
          });
        }else if(brd[i][j].includes("W")){
          board.addObject({
              x: i,
              y: j,
              c: WGo.W
          });
        }
      }
    }
  }




//add side coord

var coordinates = {
    // draw on grid layer
    grid: {
        draw: function(args, board) {
            var ch, t, xright, xleft, ytop, ybottom;

            this.fillStyle = "rgba(0,0,0,0.7)";
            this.textBaseline="middle";
            this.textAlign="center";
            this.font = board.stoneRadius+"px "+(board.font || "");

            xright = board.getX(-0.75);
            xleft = board.getX(board.size-0.25);
            ytop = board.getY(-0.75);
            ybottom = board.getY(board.size-0.25);

            for(var i = 0; i < board.size; i++) {
                ch = i+"A".charCodeAt(0);
                if(ch >= "I".charCodeAt(0)) ch++;

                t = board.getY(i);
                this.fillText(board.size-i, xright, t);
                this.fillText(board.size-i, xleft, t);

                t = board.getX(i);
                this.fillText(String.fromCharCode(ch), t, ytop);
                this.fillText(String.fromCharCode(ch), t, ybottom);
            }

            this.fillStyle = "black";
		}
    }
}
board.addCustomObject(coordinates);


}
)();

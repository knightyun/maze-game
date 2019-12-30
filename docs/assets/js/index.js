/*
方法一：
盒子: m x n；
出路(length): >= m-1 + n-1 + 2；
             <= 
出路长度 = 难度；

方法二：
直接画出道路，所有道路画完存在唯一出路；
*/

try {

var cvs = document.getElementById('maze');
var ctx = cvs.getContext('2d');

class Maze {
  constructor(w, h, step) {
    this.w = w;
    this.h = h;
    this.step = step;
    this.mazeGrids = [];
    this.entrance = {
      x: 3,
      y: 3
    }
    this.exit = {
      x: w / step - 2,
      y: h / step - 1
    }
    this.init();
    this.drawWall();
    this.drawPath(this.entrance);
  }
  
  init() {
    var mazeGrids = this.mazeGrids,
    w = this.w,
    h = this.h,
    step = this.step,
    entrance = this.entrance,
    exit = this.exit,
    x, y;
    
    for (y = 0; y < h / step; y++) {
      mazeGrids[y] = [];
      for (x = 0; x < w / step; x++) {
        mazeGrids[y][x] = {
          x: x,
          y: y,
          isWall: (x === 0 || y === 0 ||
                   x === w / step - 1 ||
                   y === h / step - 1) && 
                  !((x === entrance.x &&
                     y === entrance.y) ||
                    (x === exit.x &&
                     y === exit.y)),
          isPath: false
        }
      }
    }
  }
  
  fill(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * this.step, y * this.step, this.step, this.step);
    this.mazeGrids[y][x].isWall = true;
  }
  
  getNeighbors(x, y) {
    // 格子周围有上下左右四个邻居（第一层），
    // 以及第二层四个领居（外层），
    // 索引 0, 1, 2, 3，
    // 第二层领居索引为墙，
    // 则第一层该索引对应的领居不取，
    // 如果领居数为 0，则寻路结束；
    
    var mazeGrids = this.mazeGrids;
    var neighbors = [],
        outerNeighbors = [];
    var top = {
      x: x,
      y: y - 1
    },
    bottom = {
      x: x,
      y: y + 1
    },
    left = {
      x: x - 1,
      y: y
    },
    right = {
      x: x + 1,
      y: y
    },
    outerTop = {
      x: x,
      y: y - 2
    },
    outerBottom = {
      x: x,
      y: y + 2
    },
    outerLeft = {
      x: x - 2,
      y: y
    },
    outerRight = {
      x: x + 2,
      y: y
    }
    
    neighbors.push(top, bottom, left, right);
    outerNeighbors.push(outerTop, outerBottom, outerLeft, outerRight);
    neighbors = neighbors.filter((item, idx) => {
      var _x = item.x,
          _y = item.y;
      var bol = mazeGrids[_y] &&
          mazeGrids[_y][_x] &&
          !mazeGrids[_y][_x].isWall &&
          !mazeGrids[_y][_x].isPath;
      
      if (bol) {
        var _item = outerNeighbors[idx],
            _ox = _item.x,
            _oy = _item.y;
        var _bol = mazeGrids[_oy] &&
            mazeGrids[_oy][_ox] &&
            !mazeGrids[_oy][_ox].isWall &&
            !mazeGrids[_oy][_ox].isPath;
            
        return _bol;
      } else {
        return 0;
      }
    });
    
    return neighbors;
  }
  
  getRandomNeighbor(neighbors) {
    // 在已有领居中随机选取一个领居返回
    var len = neighbors.length;
    var idx = Math.round(Math.random * (len - 1));
    
    if (len === 0) return 0;
    else return neighbors[idx];
  }
  
  drawWall() {
    this.mazeGrids.forEach(y => {
      y.forEach(x => {
        x.isWall && this.fill(x.x, x.y, 'black');
      })
    })
  }
  
  drawPath(grid) {
    var ctx = arguments[1] || this;
    var x = grid.x,
        y = grid.y;
    var mazeGrids = ctx.mazeGrids,
        neighbors = ctx.getNeighbors(x, y);
        
  //  console.log(x + ',' + y + '\n')
    if(neighbors.length === 0) {
      console.log('end');
      return;
    }
    
    var randomNeighbor = ctx.getRandomNeighbor(neighbors);
    
    //console.log(JSON.
    //stringify(randomNeighbor));
      
    var bol = mazeGrids[y] && 
        mazeGrids[y][x] &&
        !mazeGrids[y][x].isWall &&
        !mazeGrids[y][x].isPath;
        
    if (bol) {
      mazeGrids[y][x].isPath = true;
      ctx.fill(x, y, 'red');
   //   this.drawPath(randomNeighbor);
      setTimeout(ctx.drawPath, 200, randomNeighbor, ctx);
    } else {
      console.log('end');
    }
  }
  
}

var maze = new Maze(200, 200, 10);

} catch(e) {/*
  Object.getOwnPropertyNames(e).forEach(x => {
    document.write(x + ': ' +e[x])
  });*/
  console.log(e);
}
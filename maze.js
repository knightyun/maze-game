/*
    迷宫特点：
        路与墙成对出现；
        经历保证长宽都为奇数；

    实现：
        初始全为墙，依次在其中挖路（寻路）；
        包括出入口，和四周的围墙，不在寻路范围内；

    寻路：
        寻路时只能以两格为单位前进；
        最多三个方向，每次一个方向前进两个
        
    起步位置
        (1, 1)；
        然后开始每次行进两格；

    候选路径：
        一个单元格有上下左右四个方向；
        不为墙或路的作为候选方向，最多三个，最少为 0；
        是围墙的方向排除；
        “前面” 是路的方向排除（避免挖穿墙使两条路联通）；

    判断候选方向的 “前面”：
        当前格子：(x, y)；
        候选方向：(x1, y1);
        “前面”的格子：(x2, y2) = (x1 + (x1 - x),
                                 y1 + (y1 - y))
                              = (2x1 - x, 2y1 - y)

    分叉：
        遇到围墙或路时，向左右分叉前进（两格）；
        左右存在围墙或路时，停止该方向的前进；

    停止：
        前进方向全为墙或路时停止；
        出入口视为围墙；
        全部分叉寻路停止时画迷宫结束；

    难度等级：
        - 迷宫尺寸
        - 寻路时最多随机分叉路数
            - 1
            - 2
            - 3

    盒子: m x n；
    出路(length): >= m-1 + n-1 + 2；
                  <= 
*/

class Maze {
    /**
     * @constructor
     * @param {Element} elMaze 承载迷宫的 canvas 元素
     * @param {number}  w      迷宫宽度
     * @param {number}  h      迷宫高度
     * @param {*}       step   单元格大小
     * @memberof Maze
     */
    constructor(elMaze, w, h, step) {
        this.w = w;
        this.h = h;
        this.step = step;
        this.elMaze = elMaze;
        this.cvsCtx = this.elMaze.getContext('2d');

        // 包含所有格子的二维数组
        this.mazeGrids = [];

        // 入口位置
        this.entrance = {
            x: 1,
            y: 0
        }

        // 出口位置
        this.exit = {
            x: w / step - 2,
            y: h / step - 1
        }

        this.init();
    }

    /**
     * 初始化迷宫
     *
     * @memberof Maze
     */
    init() {
        var mazeGrids = this.mazeGrids,
            w         = this.w,
            h         = this.h,
            step      = this.step,
            elMaze    = this.elMaze,
            entrance  = this.entrance,
            exit      = this.exit;

        // 调整 canvas 元素尺寸
        elMaze.width  = w;
        elMaze.height = h;

        // 绘画初始迷宫，包括围墙，出入口，
        // 并初始化每个单元格的信息
        for (var y = 0; y < h / step; y++) {
            
            mazeGrids[y] = [];

            for (var x = 0; x < w / step; x++) {

                // 每个单元格的信息，包括坐标，是否为墙，是否为路
                mazeGrids[y][x] = {
                    // 格子坐标
                    x: x,
                    y: y,
                    // 判断是否是围墙
                    isWall: (x === 0 || y === 0 ||
                             x === w / step - 1 ||
                             y === h / step - 1),
                    // 是否为入口
                    isEntrance: x === entrance.x &&
                                y === entrance.y,
                    // 是否为出口
                    isExit: x === exit.x &&
                            y === exit.y,
                    // 判断是否为路：后期画路时置为 true
                    isPath: false
                }
            }
        }

        // 画墙和出入口
        this.drawWall('black', 'white');

        // 挖路
        this.drawPath(entrance, {x:1, y:-1});
    }

    /**
     * 封装的画格子方法
     *
     * @param {number} x 左上角的 x 坐标
     * @param {number} y 左上角的 y 坐标
     * @param {string} color 格子颜色
     * @memberof Maze
     */
    fillGrid(x, y, color) {
        var ctx = this.cvsCtx;

        ctx.fillStyle = color;
        ctx.fillRect(x * this.step, y * this.step,
            this.step, this.step);
    }

    /**
     * 获取当前格子的“前面”一个格子（相对）
     *
     * @param   {number} x1 前一个格子的 x 坐标
     * @param   {number} y1 前一个格子的 y 坐标
     * @param   {number} x2 当前格子的 x 坐标
     * @param   {number} y2 当前格子的 y 坐标
     * @returns {object}    迷宫格子对象
     * @memberof Maze
     */
    getFrontGrid(x1, y1, x2, y2) {
        var x = 2 * x2 - x1,
            y = 2 * y2 - y1;
        
        // 判断该格子是否存在；
        var isExist = !!this.mazeGrids[y] &&
                      !!this.mazeGrids[y][x];

        return isExist ? this.mazeGrids[y][x] : null;
    }

    /**
     * 获取当前格子的左前方一个格子（相对）
     *
     * @param   {number} x1 前一个格子的 x 坐标
     * @param   {number} y1 前一个格子的 y 坐标
     * @param   {number} x2 当前格子的 x 坐标
     * @param   {number} y2 当前格子的 y 坐标
     * @returns {object}    迷宫格子对象
     * @memberof Maze
     */
    getFrontLeftGrid(x1, y1, x2, y2) {
        // 先获取前方格子
        var x = 2 * x2 - x1,
            y = 2 * y2 - y1;
        
        // 再判断左前方
        if (x2 - x1 === 0) {
            if (y2 - y1 > 0)
                x += this.step;
            else
                x -= this.step; 
        }
        
        if (y2 - y1 === 0) {
            if (x2 - x1 > 0)
                y -= this.step;
            else
                y += this.step;
        }
        
        // 判断该格子是否存在；
        var isExist = !!this.mazeGrids[y] &&
                      !!this.mazeGrids[y][x];

        return isExist ? this.mazeGrids[y][x] : null;
    }

    /**
     * 获取当前格子的右前方一个格子（相对）
     *
     * @param   {number} x1 前一个格子的 x 坐标
     * @param   {number} y1 前一个格子的 y 坐标
     * @param   {number} x2 当前格子的 x 坐标
     * @param   {number} y2 当前格子的 y 坐标
     * @returns {object}    迷宫格子对象
     * @memberof Maze
     */
    getFrontRightGrid(x1, y1, x2, y2) {
        // 先获取前方格子
        var x = 2 * x2 - x1,
            y = 2 * y2 - y1;
        
        // 再判断右前方
        if (x2 - x1 === 0) {
            if (y2 - y1 > 0)
                x -= this.step;
            else
                x += this.step; 
        }
        
        if (y2 - y1 === 0) {
            if (x2 - x1 > 0)
                y += this.step;
            else
                y -= this.step;
        }
        
        // 判断该格子是否存在；
        var isExist = !!this.mazeGrids[y] &&
                      !!this.mazeGrids[y][x];

        return isExist ? this.mazeGrids[y][x] : null;
    }

    /**
     * 获取当前格子的所有有效候选方向
     *
     * @param   {*} x   当前格子 x 坐标
     * @param   {*} y   当前格子 y 坐标
     * @returns {Array} 有效的候选方向（格子对象）
     * @memberof Maze
     */
    getValidDirections(x, y) {
        // 格子周围有上右下左四个方向,
        // 索引 0, 1, 2, 3，
        // 无效方向：
        //   格子为围墙；
        //   格子前面是路；
        // 如果领居数为 0，则寻路结束； 

        var mazeGrids = this.mazeGrids,
            directions = [];

        // 4 个方向
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
            }

        directions.push(top, bottom, left, right);

        // 过滤掉无效方向
        directions = directions.filter(item => {

            // 候选方向的 x, y 坐标
            var _x = item.x,
                _y = item.y;

            // 是否为有效方向（按顺序判断）：
            //     格子存在；
            //     格子不是围墙；
            //     格子不是路；
            //     前方格子存在；
            //     前方格子不是路；
            var isValidDirection,
                isExist,
                isWall,
                isPath,
                isFrontExist,
                isFrontPath;

            isExist = !!mazeGrids[_y] && !!mazeGrids[_y][_x];

            isFrontExist = !!this.getFrontGrid(x, y, _x, _y);
            // 格子不存在直接排除
            if (!isExist || !isFrontExist)
                return false;
                /*
            isWall = _x === 0 || _x === this.w ||
                     _y === 0 || _y === this.h;*/

            isWall = mazeGrids[_y][_x].isWall;

            isPath = mazeGrids[_y][_x].isPath;
                          
            isFrontPath = this.getFrontGrid(x, y, _x, _y).isPath;

            isValidDirection = !isWall && !isPath && !isFrontPath;

            return isValidDirection;
        });

        // 转换为迷宫格子对象
        directions = directions.map(item => {
            return mazeGrids[item.y][item.x];
        })

        // 标注可选的方向
        directions.forEach(i => {
            this.fillGrid(i.x, i.y, 'rgba(0, 100, 0, 0.3)');
        })

        return directions;
    }
    
    /**
     * 判断第三个格子相对于第二个格子的方位
     *
     * @param   {object} grid1 格子对象
     * @param   {object} grid2 格子对象
     * @param   {object} grid2 格子对象
     * @returns {string='front'|'left'|'right'} 方位 
     * @memberof Maze
     */
    getDirection(grid1, grid2, grid3) {
        var directions = ['front', 'left', 'right'];

        var x1 = grid1.x, y1 = grid1.y,
            x2 = grid2.x, y2 = grid2.y,
            x3 = grid3.x, y3 = grid3.y;

        var isFront, isLeft, isRight;
        
        isFront = (x3 - x2 === x2 - x1) ||
                  (y3 - y2 === y2 - y1);
                      
        if (y2 === y1) {
            if (x2 > x1) {
                if (x3 === x2 && y3 < y2) isLeft  = true;
                if (x3 === x2 && y3 > y2) isRight = true;
            } else {
                if (x3 === x2 && y3 > y2) isLeft  = true;
                if (x3 === x2 && y3 < y2) isRight = true;
            }
        }

        if (x2 === x1) {
            if (y2 > y1) {
                if (y3 === y2 && x3 > x2) isLeft  = true;
                if (y3 === y2 && x3 < x2) isRight = true;
            } else {
                if (y3 === y2 && x3 < x2) isLeft  = true;
                if (y3 === y2 && x3 > x2) isRight = true;
            }
        }

        if (isFront) return directions[0];
        if (isLeft)  return directions[1];
        if (isRight) return directions[2];
    }

    /**
     * 随机返回一个候选方向
     *
     * @param   {Array} directions 包含候选方向的数组
     * @returns {object}           一个随机的候选方向
     * @memberof Maze
     */
    getRandomDirection(directions) {
        var len = directions.length;
        
        // 随机候选方向的索引
        var idx = Math.round(Math.random() * (len - 1));
        
        return directions[idx];
    }
    
    /**
     * 处理当前格子下一步路径分叉的问题
     *
     * @param   {object}   grid1      前一个格子对象
     * @param   {object}   grid2      当前格子对象
     * @param   {object[]} directions 候选方向的格子对象
     * @returns {object[]}            返回确定要挖的格子对象
     * @memberof Maze
     */
    forkPath(grid1, grid2, directions) {
        // 判断是否需要路径分叉：（按顺序）
        //   前方是围墙（分左、右）；
        //   前方的前方是路（分左、右）；
        //   左前方的左前方是路（分前、左）；
        //   右前方的右前方是路（分前、右）；
        //   左右前方的前方都是路（分前、左、右）；
        // 前方是围墙、或前方的前方是路、或左右前方的前方都是路，
        // 则所有候选方向都要挖；
        // 左右前方的前方其中一个为路时，只能挖前方和左或右；
        // 以上情况都不是，则使用随机选择；
        
        var isFrontWall,
            isFrontPath;

        // 标记每个候选方向的方位
        var _directions = {
            front: null,
            left: null,
            right: null
        }

        // 最后汇总返回的方向
        var returnDirections = [];

        // 遍历判断 directions 的方位
        directions.forEach(grid => {
            var direction = this.getDirection(grid1, grid2, grid);

            _directions[direction] = grid;
        })


        // 现获取前面的格子
        // 前面一定存在有效格子
        // 不存在是路的情况
        // 如果是围墙直接返回全部方向，不用继续判断
        var frontGrid = this.getFrontGrid(grid1.x, grid1.y,
                                          grid2.x, grid2.y);
        isFrontWall = frontGrid.isWall;

        if (isFrontWall) return directions;


        // 获取前面的前面的格子
        // 此时前面的前面也一定存在有效格子
        // 不存在是围墙的情况
        // 如果是路直接返回全部对象，不判断左右
        var frontFrontGrid = this.getFrontGrid(grid2.x, grid2.y,
                                  frontGrid.x, frontGrid.y);
        isFrontPath = frontFrontGrid.isPath;

        if (isFrontPath) return directions;

   
        // 此时前方的前方不是路，也不会是围墙，
        // 只会是待挖的路，所以需要返回 front 方位的候选方向
        returnDirections.push(_directions['front']);


        // 获取左前方的左前方的格子
        // 左前方一定存在有效格子
        var frontLeftGrid = this.getFrontLeftGrid(grid1.x, grid1.y,
                                                  grid2.x, grid2.y);
        if (!frontLeftGrid.isWall) {
            // 如果左前方是围墙，则跳过

            // 否则继续判断左前方的左前方
            // 此时左前方的左前方一定不会是围墙
            var frontFrontLeftGrid = this.getFrontLeftGrid(grid2.x, grid2.y,
                                          frontLeftGrid.x, frontLeftGrid.y);

            // 如果是路，则需要返回 left 方位的候选方向（需要存在）
            if (frontFrontLeftGrid.isPath && !!_directions['left'])
                returnDirections.push(_directions['left']);
                
            // 如果不是，就要考虑随机选择 front, left
        }


        // 获取右前方的左前方的格子
        // 右前方一定存在有效格子
        var frontRightGrid = this.getFrontRightGrid(grid1.x, grid1.y,
                                                    grid2.x, grid2.y);
        if (!frontRightGrid.isWall) {
            // 如果右前方也是墙（很难出现）则跳过

            // 否则继续判断右前方的左前方
            // 此时右前方的右前方一定不会是围墙
            var frontFrontRightGrid = this.getFrontRightGrid(grid2.x, grid2.y,
                                           frontRightGrid.x, frontRightGrid.y);

            // 如果也是路，则需要返回 right 方位的候选方向（需要存在）
            if (frontFrontRightGrid.isPath && !!_directions['right'])
                returnDirections.push(_directions['right']);
                
            // 如果不是，就要考虑随机选择 front, right
            // 如果 left 方位也要考虑随机，则随机选择 front, left, right
        }


        // todo：处理随机选择一个候选方向
        // 使用随机的情况：
        //   前方的前方不是路（可以挖）；
        //   左右前方的前方只有一个是路时，随机选择前面和另一个不是路的方位；
        //   左右前方的前方都不是路时，三个方位随机选一个；
        // 此时

        return _directions;
    }

    /**
     * 绘画四周的围墙，以及出入口
     *
     * @param {string} wallColor   围墙的颜色
     * @param {string} tunnelColor 出入口的颜色
     * @memberof Maze
     */
    drawWall(wallColor, tunnelColor) {
        this.mazeGrids.forEach(y => {
            y.forEach(x => {
                
                // 画墙
                x.isWall && 
                    this.fillGrid(x.x, x.y, wallColor);
                
                // 画出入口
                x.isEntrance &&
                    this.fillGrid(x.x, x.y, tunnelColor);
                x.isExit &&
                    this.fillGrid(x.x, x.y, tunnelColor);
            })
        })
    }

    /**
     * 挖路实现函数，递归地绘制有效路径
     * 从 this.start 开始，到无路后结束
     *
     * @param {object} grid    当前格子对象（要挖的路）；
     * @param {object} preGrid 前一个格子对象，
     *                         用于获取前进两格需要的方向；
     * @param {object} ctx     保存当前类的上下文，
     *                         方便递归时使用当前类的方法；
     * @memberof Maze
     */
    drawPath(grid, preGrid, ctx) {
        var x    = grid.x,
            y    = grid.y,
            preX = preGrid.x,
            preY = preGrid.y;

        ctx = ctx || this;

        var mazeGrids = ctx.mazeGrids;
        
        // 绘制路
        ctx.fillGrid(x, y, 'red');
        
        // 标记当前格子为路
        mazeGrids[y][x].isPath = true;
        
        // 获取前面方向的格子
        var fwdGrid = ctx.getFrontGrid(preX, preY, x, y);
        var fwdX = fwdGrid.x,
            fwdY = fwdGrid.y;
            
        // 画同方向第二格路
        ctx.fillGrid(fwdX, fwdY, 'red')
        mazeGrids[fwdY][fwdX].isPath = true;
            

        // 获取候选方向（第二格的）
        var directions = ctx.getValidDirections(fwdX, fwdY);
        
        // 递归挖路结束
        if (directions.length === 0) {
            elConsole.innerText += 'done\n';
            return;
        }
        
 
        // 处理分叉情况，获取最终要挖的所有方向
        directions = ctx.forkPath(grid, fwdGrid, directions);
        

        if (isNeedFork) {
            directions.forEach(item => {
                setTimeout(ctx.drawPath, 0, item,
                           mazeGrids[fwdY][fwdX], ctx);
            });

        } else {
        
            // 从候选方向中获取随机方向
            var randomDirection = ctx.getRandomDirection(directions);

            // 挖下一格路，传递的格子应为挖的第二格路
            setTimeout(ctx.drawPath, 0, randomDirection,
                       mazeGrids[fwdY][fwdX], ctx);
            //ctx.drawPath(randomDirection, mazeGrids[fwdY][fwdX], ctx);
        }
    }
}

var cvs = document.querySelector('#maze');
var elConsole = document.querySelector('.console');

var maze = new Maze(cvs, 210, 210, 10);

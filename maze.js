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
     * 获取候选方向的“前面”一个格子
     *
     * @param {number} x1 当前格子的 x 坐标
     * @param {number} y1 当前格子的 y 坐标
     * @param {number} x2 候选方向的 x 坐标
     * @param {number} y2 候选方向的 y 坐标
     * @returns {object}  迷宫格子对象
     * @memberof Maze
     */
    getForwardGrid(x1, y1, x2, y2) {
        var x = 2 * x2 - x1,
            y = 2 * y2 - y1;
        
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
            isFrontExist = !!this.getForwardGrid(x, y, _x, _y);
            // 格子不存在直接排除
            if (!isExist || !isFrontExist)
                return false;
                /*
            isWall = _x === 0 || _x === this.w ||
                     _y === 0 || _y === this.h;*/
            isWall = mazeGrids[_y][_x].isWall;
            isPath = mazeGrids[_y][_x].isPath;
                          
            isFrontPath = this.getForwardGrid(x, y, _x, _y).isPath;

            isValidDirection = !isWall && !isPath &&
                               !isFrontPath;

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
    
    // 遇到前方是围墙，或前方的前方是路，则分叉挖路
    // 挖完第二格路时判断，判断逻辑放在 drawPath 中；
    // 此时最多只存在左右两个候选路径；
    // 所以直接挖所有候选路径，避免随机获取；
    // 该函数获取分叉后的两个格子，
    // 再分别传给 drawPath 当做第一格继续挖
    forkPath() {}

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
     * @param {object} grid    格子对象（要挖的路）；
     * @param {object} preGrid 前一个格子对象，
     *                         用于获取前进两格需要的方向；
     * @param {object} ctx     保存当前类的上下文，
     *                         方便递归时使用当前类的方法；
     * @memberof Maze
     * @todo 一次前进两格
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
        var fwdGrid = ctx.getForwardGrid(preX, preY, x, y);
        var fwdX = fwdGrid.x,
            fwdY = fwdGrid.y;
            
        // 画同方向第二格路
        ctx.fillGrid(fwdX, fwdY, 'red')
        
        mazeGrids[fwdY][fwdX].isPath = true;
            
        // 获取候选方向（第二格的）
        var directions = ctx.getValidDirections(fwdX, fwdY);
        
        // 递归挖路结束
        if (directions.length === 0) {
            elConsole.innerHTML += 'done';
            return;
        }
        
        // 判断是否需要路径分叉：
        //   第二格前方是围墙；
        //   第二格前方的前方是路；
        var isNeedForkPath = false;
        
        var isWall = ctx.getForwardGrid(x, y, fwdX, fwdY).isWall;
        
        isNeedForkPath = isWall;
        
        if (isNeedForkPath) {
            directions.forEach(item => {
                setTimeout(ctx.drawPath, 2000, item, mazeGrids[fwdY][fwdX], ctx);
            })
        } else {
        
        // 从候选方向中获取随机方向
        var randomDirection = ctx.getRandomDirection(directions);

        if (randomDirection) {

            // 挖下一格路，传递的格子应为挖的第二格路
            setTimeout(ctx.drawPath, 0, randomDirection, mazeGrids[fwdY][fwdX], ctx);
            //ctx.drawPath(randomDirection, mazeGrids[fwdY][fwdX], ctx);

        } else {

            // 无任何候选方向
            elConsole.innerText = 'no direction.';
        }
        
        }
        

    }

}

var cvs = document.querySelector('#maze');
var elConsole = document.querySelector('.console');

var maze = new Maze(cvs, 210, 210, 10);

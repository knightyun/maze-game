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
        
    起步位置：(0, 1)

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

var cvs = document.querySelector('#maze');
var elConsole = document.querySelector('.console');
var ctx = cvs.getContext('2d');

class Maze {
    /**
     * @constructor
     * @param {Element} elMaze 承载迷宫的元素
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
        this.drawWall();
        this.drawPath(this.entrance);
    }

    /**
     * 初始化迷宫
     *
     * @memberof Maze
     */
    init() {
        var mazeGrids = this.mazeGrids,
            w = this.w,
            h = this.h,
            step = this.step,
            elMaze = this.elMaze,
            entrance = this.entrance,
            exit = this.exit,
            x, y;

        // 调整 canvas 元素尺寸
        elMaze.width = w,
        elMaze.height = h;

        // 绘画初始迷宫，包括围墙，出入口，
        // 并初始化每个单元格的信息
        for (y = 0; y < h / step; y++) {
            mazeGrids[y] = [];

            for (x = 0; x < w / step; x++) {
                // 每个单元格的信息，包括坐标，是否为墙，是否为路
                mazeGrids[y][x] = {
                    x: x,
                    y: y,
                    // 判断是否为围墙：单元格是不包括出、入口的围墙格子
                    isWall: (x === 0 || y === 0 ||
                             x === w / step - 1 ||
                             y === h / step - 1) &&
                            !((x === entrance.x &&
                               y === entrance.y) ||
                              (x === exit.x &&
                               y === exit.y)),
                    // 判断是否为路：后期画路时置为 true
                    isPath: false
                }
            }
        }
    }

    /**
     * 封装的画格子方法
     *
     * @param {number} x 左上角的 x 坐标
     * @param {number} y 左上角的 y 坐标
     * @param {string} color 格子颜色
     * @memberof Maze
     */
    fill(x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * this.step, y * this.step,
            this.step, this.step);
    }

    /**
     * 获取候选方向的“前面”一个格子
     *
     * @param {number} x 当前格子的 x 坐标
     * @param {number} y 当前格子的 y 坐标
     * @returns {object} 格子对象
     * @memberof Maze
     */
    getForwardGrid(x, y) {
        return null;
    }

    /**
     * 获取当前格子的候选方向
     *
     * @param {*} x 当前格子 x 坐标
     * @param {*} y 当前格子 y 坐标
     * @returns {Array} 有效的候选方向
     * @memberof Maze
     */
    getNeighbors(x, y) {
        // 格子周围有上右下左四个邻居,
        // 索引 0, 1, 2, 3，
        // 无效领居：
        //   格子为围墙
        //   格子前面是路
        // 如果领居数为 0，则寻路结束；

        // 格子周围第二层某领居为墙或路，
        // 则不选取对应的第一层某领居；
        // 第二层存在墙或路时，路径需分叉；

        var mazeGrids = this.mazeGrids,
            neighbors = [];
        // 4 个领居
        var top = {
            x: x,
            y: y - 1
        }, bottom = {
            x: x,
            y: y + 1
        }, left = {
            x: x - 1,
            y: y
        }, right = {
            x: x + 1,
            y: y
        }

        neighbors.push(top, bottom, left, right);
        neighbors = neighbors.filter(item => {
            var _x = item.x,
                _y = item.y;
            var bol = !!mazeGrids[_y] &&
                !!mazeGrids[_y][_x] &&
                !(mazeGrids[_y][_x].isWall ||
                    mazeGrids[_y][_x].isPath);

            // 排除无效领居（不存在、为墙、为路）
            if (bol) {
                // 判断该领居是否可取

                // 先判断该领居位于的方位:
                //   top: y - _y = 1;
                //   bottom: y - _y = -1;
                //   left: x - _x = 1;
                //   right: x - _x = -1;

                var direction;
                if (y - _y === 1)
                    direction = 'top';
                else if (y - _y === -1)
                    direction = 'bottom';
                else if (x - _x === 1)
                    direction = 'left';
                else
                    direction = 'right'

                // 再获取该方位上的周围 5 个领居:
                var arounds = this.getNeighborArounds(_x, _y, direction);

                // 最后判断 “周围” 是否存在、含墙或含路
                var _bol = arounds.every(_item => {
                    var _fx = _item.x,
                        _fy = _item.y;
                    var _fBol = mazeGrids[_fy] &&
                        mazeGrids[_fy][_fx] &&
                        !(mazeGrids[_fy][_fx].isWall ||
                            mazeGrids[_fy][_fx].isPath);

                    return _fBol;
                });

                return _bol;
            } else {
                return 0;
            }
        });

        // 标注可选的方向
        neighbors.forEach(i => {
            this.fill(i.x, i.y,
                'rgba(0, 100, 0, 0.3)')
        })

        return neighbors;
    }

    getNeighborArounds(x, y, direction) {
        var arounds = [],
            frontLeft = null, // 左前方
            frontCenter = null, // 正前方
            frontRight = null, // 右前方
            left = null, // 左方
            right = null; // 右方

        switch (direction) {
            case 'top':
                frontLeft = {
                    x: x - 1,
                    y: y - 1
                };
                frontCenter = {
                    x: x,
                    y: y - 1
                };
                frontRight = {
                    x: x + 1,
                    y: y - 1
                };
                left = {
                    x: x - 1,
                    y: y
                };
                right = {
                    x: x + 1,
                    y: y
                };
                break;
            case 'bottom':
                frontLeft = {
                    x: x + 1,
                    y: y + 1
                };
                frontCenter = {
                    x: x,
                    y: y + 1
                };
                frontRight = {
                    x: x - 1,
                    y: y + 1
                };
                left = {
                    x: x + 1,
                    y: y
                };
                right = {
                    x: x - 1,
                    y: y
                };
                break;
            case 'left':
                frontLeft = {
                    x: x - 1,
                    y: y + 1
                };
                frontCenter = {
                    x: x - 1,
                    y: y
                };
                frontRight = {
                    x: x - 1,
                    y: y - 1
                };
                left = {
                    x: x,
                    y: y + 1
                };
                right = {
                    x: x,
                    y: y - 1
                };
                break;
            case 'right':
                frontLeft = {
                    x: x + 1,
                    y: y - 1
                };
                frontCenter = {
                    x: x + 1,
                    y: y
                };
                frontRight = {
                    x: x + 1,
                    y: y + 1
                };
                left = {
                    x: x,
                    y: y - 1
                };
                right = {
                    x: x,
                    y: y + 1
                };
                break;
        }
        arounds.push(frontLeft, frontCenter, frontRight, left, right);
        return arounds;
    }

    getRandomNeighbor(neighbors) {
        // 在已有领居中随机选取一个领居返回
        var len = neighbors.length;
        var idx = Math.round(Math.random() * (len - 1));
        // this.fill(neighbors[idx].x, neighbors[idx].y, 'yellow');

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

        if (neighbors.length === 0) {
            elConsole.innerText = 'done';
            return;
        }

        var randomNeighbor = ctx.getRandomNeighbor(neighbors);
        var bol = mazeGrids[y] && mazeGrids[y][x] &&
            !(mazeGrids[y][x].isWall || mazeGrids[y][x].isPath);

        if (bol) {
            mazeGrids[y][x].isPath = true;
            ctx.fill(x, y, 'red');
            //this.drawPath(randomNeighbor);
            setTimeout(ctx.drawPath, 200, randomNeighbor, ctx);
        } else {
            elConsole.innerText = 'end';
        }
    }

}

var maze = new Maze(200, 200, 10);

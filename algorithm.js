var c = document.getElementById("drawCanvas");
var ctx = c.getContext("2d");
var CENTER_EXIT = false;
var HEIGHT = c.height;//画布的高
var WIDTH = c.width;//画布的宽
ctx.translate(0, HEIGHT);
ctx.scale(1, -1);
var ADD_NUMBER = 20;//点的一次添加数量
var POPULATION_SIZE = 100;//种群的大小
var POINT_NUMBER = 0;//站点的个数
var MUTATION_RATE = 0.1;//变异概率
var CROSSOVER_RATE = 0.8;//交叉概率
var points = [];//点的坐标集
var point_object = [];//点对象集合
var individuals = [];//种群（个体的集合）
var oldindividuals = [];//交叉变异前的种群的个体
var comp_object = [];//比较对象集合
var counter = 2;//目标函数个数
var MAX_CAR = 2;//断点个数（最大车辆数m+1）
var set_interval_object;//运行时间
var best_pareto_individual = [];//目前的较好的个体
var color_arr = ["#DC143C", "#050505", "#FFD700", "#006400", "#0000CD", "#A2CD5A", "#696969"];//颜色数组
var myChart1 = echarts.init(document.getElementById('char1'));//初始化chart
var myChart2 = echarts.init(document.getElementById('char2'));//初始化chart
var ITERATION = 0;
var bugout = new debugout();
var paretonum = 0;
var CATASTROPHY = 0;
var final_set = [];
var MARK;
var GlobalMap = new Map();

Array.prototype.shuffle = function () {
    for (let j, x, i = this.length; i; j = randomNumber(i), x = this[--i], this[i] = this[j], this[j] = x);
    return this;
};  //打乱数组顺序
Array.prototype.distinctCloseTo = function () {
    let temp = [];
    let t = 0;
    for (let i = 0; i < this.length; i++) {
        if (this[i] !== this[(i + 1) % this.length]) {
            temp[t] = this[i];
            t++;
        }
    }
    this.length = 0;
    let arr = [];
    this[0] = 0;
    t = 1;
    for (let j = temp.indexOf(0) + 1; j < temp.indexOf(0) + temp.length; j++) {
        if (temp[j % temp.length] !== 0) {
            this[t] = temp[j % temp.length];
            t++;
        }
        else
            arr.push(t - 1);
    }
    return arr;
};//去掉0(返回0的插入点)
Array.prototype.frontDot = function (value) {
    if (this.indexOf(value) === 0)
        return this[this.length - 1];
    return this[this.indexOf(value) - 1];
};//返回数组中值为value的上一个元素
Array.prototype.nextDot = function (value) {
    if (this.indexOf(value) === (this.length - 1))
        return this[0];
    return this[this.indexOf(value) + 1];
}; //返回数组中值为value的下一个元素
Array.prototype.equals = function (array) {
    if (!array)
        return false;
    if (this.length !== array.length)
        return false;
    for (let i = 0, l = this.length; i < l; i++) {
        if (this[i] instanceof Array && array[i] instanceof Array) {
            if (!this[i].equals(array[i]))
                return false;
        }
        else if (this[i] !== array[i]) {
            return false;
        }
    }
    return true;
};  //比较数组（各元素）是否相等
function sleep(numberMillis) {
    var now = new Date();
    var exitTime = now.getTime() + numberMillis;
    while (true) {
        now = new Date();
        if (now.getTime() > exitTime)
            return;
    }
}//暂停函数
function randomNumber(number) {
    return Math.floor(Math.random() * number);
} //产生随机数0=<x<number
function randomNumberN(number, n) {
    let arr = []
    for (let i = 0; i < number; i++) {
        arr[i] = i;
    }
    let ret = [];
    for (let j = 0; j < n; j++) {
        let index = randomNumber(arr.length);
        ret.push(arr[index]);
        arr.splice(index, 1);
    }
    ret.sort((a, b) => a - b);
    return ret;
}
function Point(x, y) {
    this.x = x;
    this.y = y;
}  //产生随机点构造函数
function compareObject(sum, balance, car, cross_point) {
    this.sum = sum;
    this.balance = balance;
    this.car = car;
    this.cross_point = cross_point;
} // 三个适应值的构造函数
function copy(arr) {
    let obj = [];
    for (let temp in arr)
        obj[temp] = arr[temp];
    return obj;
}  //复制对象
function showPoint() {
    points.length = 0;
    let file = document.getElementById("local_file").files[0];
    let reader = new FileReader();
    let k = 1;
    reader.readAsText(file);
    reader.onload = function () {
        let str = reader.result.split("\n");
        if (str.length - 8 === 150)
            k = 1;
        else if (str.length - 8 === 51 || str.length - 8 === 76)
            k = 10;
        else if (str.length - 8 === 52)
            k = 0.4;
        else if (str.length - 8 === 99)
            k = 3.5;
        for (let i = 6; i < str.length - 2; i++) {
            let coordinate = str[i].split(" ");
            points.push(new Point(parseFloat(coordinate[1]) * k, parseFloat(coordinate[2]) * k));
        }
        POINT_NUMBER += points.length;
        drawPoints(points.length);
        ctx.fillStyle = "#de0629";
        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
        CENTER_EXIT = true;
        renewTextShow();
    };
}  //显示测试点
function addPoints() {
    POINT_NUMBER += ADD_NUMBER;
    let point;
    for (let i = 0; i < ADD_NUMBER; i++) {
        do {
            point = new Point(randomNumber(WIDTH), randomNumber(HEIGHT));
        } while (points.indexOf(point) >= 0);
        points.push(point);
    }
    drawPoints(ADD_NUMBER);
    renewTextShow();
}    //点的添加
function drawPoints(t) {
    for (let i = points.length - t; i < points.length; i++)
        drawPoint(points[i]);
}  //画所有点
function drawPoint(point) {
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
}  //画单点
function calculatePointAngle(i) {
    let x = points[i].x - points[0].x;
    let y = points[i].y - points[0].y;
    if (y === 0 && x < 0)
        return Math.PI;
    else if (y < 0)
        return 2 * Math.PI + Math.atan2(y, x);
    else
        return Math.atan2(y, x);
}  //计算点i相对仓库的角度 设无重复点(0~2*PI)
function produceRandomIndividuals() {
    individuals.length = 0;
    comp_object.length = 0;
    while (individuals.length !== POPULATION_SIZE) {
        let arr = produceRandomArr();
        arr.push((randomDriveWay()));
        arr = delIndividual(arr);

        let mapkey = getMapKey(arr);
        if (!GlobalMap.has(mapkey)) {
            individuals.push(arr);
            GlobalMap.set(mapkey, true);
        } else {
            console.log("重复")
        }
    }
    getObjectValue();
}  //种群的产生(包含断点的设置)
// function produceRandomIndividuals() {
//     individuals.length=0;
//     comp_object.length=0;
//     point_object.length=0;//以p[0]为原点 计算每个点相应的角度
//     for(var i=1;i<POINT_NUMBER;i++){
//         var temp=new Object();
//         temp.point_index=i;
//         temp.point_angle=calculatePointAngle(i);
//         point_object.push(temp);
//     }
//     point_object.sort(function (a, b) {  return a.point_angle-b.point_angle; });
//     for(var j=0;j<POPULATION_SIZE;j++){
//         var arr, mapkey;
//         do{
//             arr=produceRandomArr();
//             arr.push(randomDriveWay());
//             arr=delIndividual(arr);
//             mapkey = getMapKey(arr);
//         }while(GlobalMap.has(mapkey))
//         GlobalMap.set(mapkey,true);
//         individuals.push(arr);
//     }
//     getObjectValue();
// }
// function produceRandomArr() {
//     var arr=[];
//     var num=randomNumber(point_object.length);
//     do{
//         arr.push(point_object[num].point_index);
//         num++;num%=point_object.length;
//     }while(arr.length<point_object.length);
//     arr.unshift(0);
//     return arr;
// } //种群的产生(扫描排序的)
// 得到个体的唯一标识
function getMapKey(arr) {
    return JSON.stringify(arr);
}
function produceRandomArr() {
    let arr = [];
    for (let i = 0; i < POINT_NUMBER - 1; i++)
        arr.push(i + 1);
    arr.shuffle();
    arr.unshift(0);
    return arr;
}//产生随机个体

function randomDriveWay() {
    /*    let temp;
        do{
            temp=randomNumber(MAX_CAR);
        }while(temp===0);*/
    let arr = [];
    let num;
    for (let i = 0; i < MAX_CAR; i++) {
        do {
            num = randomNumber(POINT_NUMBER - 1);
        } while (arr.indexOf(num) >= 0 || num === 0);
        arr.push(num);
    }
    return arr.sort(function (a, b) {
        return a - b;
    });
} //随机产生断点
function getObjectValue() {
    comp_object.length = 0;
    for (let i = 0; i < individuals.length; i++)
        comp_object.push(getCompareObject(individuals[i]));
}  //得到目标的适应度值
function startIteration() {
    if (!CENTER_EXIT) {
        alert("please set the center point!");
        return;
    }
    produceRandomIndividuals();
    set_interval_object = setInterval(getCurrentBest, 10);
}  //开始迭代
function redraw() {  //重新画点
    for (let i = 1; i < points.length; i++) {
        drawPoint(points[i]);
    }
    ctx.fillStyle = "#f71001";
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
}  //重新画点
function getCurrentBest() {
    iterationProcedure();
    ctx.clearRect(0, 0, WIDTH, HEIGHT);//清除画板
    redraw();
    getNonDominated();
    best_pareto_individual = kneePoint();
    drawLine(best_pareto_individual);
    ITERATION++;
    if (ITERATION % 1800 === 0) {
        stopIteration();
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        redraw();
        if (CATASTROPHY < 10) {
            CATASTROPHY++;
            GlobalMap.clear();
            let t = getCompareObject(best_pareto_individual);
            bugout.log(t.sum + " " + t.balance + " " + " KneePoint" + best_pareto_individual);
            /* downLoad(); */
            bugout.clear();
            if ((CATASTROPHY + 1) !== 11)
                startIteration();
            else {
                individuals = final_set;
                getObjectValue();
                getNonDominated();
                let p = 0;
                while (comp_object[p] && comp_object[p].level === 0) {
                    bugout.log(comp_object[p].sum + " " + comp_object[p].balance + " " + individuals[p]);
                    p++;
                }
                bugout.logFilename = POINT_NUMBER + "-" + (MAX_CAR + 1) + "(1800代newcrossover)总的非支配前沿";
                bugout.downloadLog();
            }
        }
    }
    // else
    //     iterationProcedure();
}  //得到当前最好并开始NSGAⅡ
function kneePoint() {
    let count = 0;
    let current_comp_object = [];// 取第0层的非支配前沿
    while (comp_object[count] && comp_object[count].level === 0) {
        current_comp_object.push(Object.assign({}, comp_object[count], { index: count }));
        count++;
    }
    current_comp_object.sort((a, b) => a.sum - b.sum);
    let pointA = { x: current_comp_object[0].sum, y: current_comp_object[0].balance };
    let pointB = { x: current_comp_object[current_comp_object.length - 1].sum, y: current_comp_object[current_comp_object.length - 1].balance };
    let k = (pointA.y - pointB.y) / (pointA.x - pointB.x);
    let b = pointA.y - k * pointA.x;
    current_comp_object.map(obj => {
        obj.extremeline = ((k * obj.sum - obj.balance + b)) / Math.sqrt(k * k + 1)
    })
    current_comp_object.sort((a, b) => b.extremeline - a.extremeline);
    drawChart(current_comp_object.length, current_comp_object[0].index);
    paretonum = current_comp_object.length;
    if ((ITERATION + 1) % 1800 === 0) {
        for (let k = 0; k < current_comp_object.length; k++) {
            let ind = current_comp_object[k].index;
            bugout.log(comp_object[ind].sum + " " + comp_object[ind].balance + " " + individuals[ind]);
            final_set.push(individuals[ind].slice(0));
        }
    }
    console.log(ITERATION + "代 " + comp_object[current_comp_object[0].index].sum + " " + comp_object[current_comp_object[0].index].balance);
    console.log(JSON.stringify(individuals[current_comp_object[0].index].slice(0)));
    return individuals[current_comp_object[0].index].slice(0);
}   //返回knee point个体
function clearCanvas() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    POINT_NUMBER = 0;
    renewTextShow();
    points.length = 0;
    individuals.length = 0;
    CENTER_EXIT = false;
}  //清空画布
function renewTextShow() {
    document.getElementById("textShow").innerHTML = "Here are " + POINT_NUMBER + " points";
} //显示已存在的点的个数
function getCoordinates(ev) {
    let x, y;
    x = ev.offsetX;
    y = ev.offsetY;
    y = HEIGHT - y;
    document.getElementById("xyCoordinates").innerHTML = "Coordinates: (" + x + "," + y + ")";
}  //鼠标移动坐标显示
function clearCoordinates() {
    document.getElementById("xyCoordinates").innerHTML = "";
}
function addCenter(ev) {
    if (CENTER_EXIT)
        return;
    let xc, yc;
    xc = ev.offsetX;
    yc = HEIGHT - ev.offsetY;
    let point = { x: xc, y: yc };
    if (points.indexOf(point) >= 0) {
        alert("this point has already existed ,please choose another one!");
    }
    else {
        points.unshift(point);
        POINT_NUMBER++;
        renewTextShow();
        ctx.fillStyle = "#f71001";
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
        CENTER_EXIT = true;
    }
}  //画布点击事件处理程序
function stopIteration() {
    window.clearInterval(set_interval_object);
}  //停止迭代
function startAgain() {
    set_interval_object = setInterval(getCurrentBest, 10);
}
Object.defineProperty(Array.prototype, "equals", { enumerable: false });
function drawLine(individual) {
    let j = 0;
    ctx.lineWidth = 1;
    ctx.beginPath();
    let temp_arr = partitionIndividual(individual);
    ctx.moveTo(points[temp_arr[0]].x, points[temp_arr[0]].y);
    for (let i = 1; i < temp_arr.length; i++) {
        ctx.lineTo(points[temp_arr[i]].x, points[temp_arr[i]].y);
        if (temp_arr[i] === 0) {
            ctx.strokeStyle = color_arr[j++];
            ctx.stroke();
            ctx.closePath();
            ctx.beginPath();
            ctx.lineTo(points[temp_arr[i]].x, points[temp_arr[i]].y);
        }
    }
}  //画出路径
function getCompareObject(individual) {
    let temp_arr = partitionIndividual(individual);
    let sum = 0;
    let max_single = 0;
    let min_single = Number.POSITIVE_INFINITY;
    let single_sum = 0;
    for (let i = 1; i < temp_arr.length; i++) {
        single_sum += distanceOfTwoPoint(points[temp_arr[i]], points[temp_arr[i - 1]]);
        if (temp_arr[i] === 0) {
            max_single = single_sum > max_single ? single_sum : max_single;
            min_single = single_sum < min_single ? single_sum : min_single;
            sum += single_sum;
            single_sum = 0;
        }
    }
    /*    sum/=100;
        max_single/=100;*/
    return new compareObject((Math.round(sum * 100)) / 100, Math.round((max_single - min_single) * 100) / 100, individual[individual.length - 1].length + 1, Math.round(max_single * 100) / 100);
}  //创建比较对象（个体的总路程，个体间平衡度）
function partitionIndividual(individual) {
    let temp_arr = [];
    for (let i = 0; i < individual.length - 1; i++) {
        if (individual[individual.length - 1].indexOf(i) < 0) {
            temp_arr.push(individual[i]);
        }
        else {
            temp_arr.push(individual[i]);
            temp_arr.push(0);
        }
    }
    temp_arr.push(0);
    return temp_arr;
} //划分路径  0->x->0
function distanceOfTwoPoint(p1, p2) {   //计算两点之间的距离
    let dx = p1.x - p2.x;
    let dy = p1.y - p2.y;
    if (points.length === 51 || points.length === 76) {
        dx /= 10;
        dy /= 10;
    }
    else if (points.length === 52) {
        dx /= 0.4;
        dy /= 0.4;
    }
    else if (points.length === 99) {
        dx /= 3.5;
        dy /= 3.5;
    }
    return Math.sqrt(dx * dx + dy * dy);
}  //计算两点的距离
/******************************************过程**************************************************************/
function iterationProcedure() {
    let temps = [];
    oldindividuals = [];
    let temp;
    for (let i = 0; i < POPULATION_SIZE; i++) {
        temp = individuals[i].slice(0);
        temps.push(temp);
        oldindividuals.push(temp);
    }
    produceChildByTournament();
    mutation();
    for (let j = 0; j < POPULATION_SIZE; j++)
        individuals.push(temps[j].slice(0));
    getObjectValue();
    getNewIndividuals();
}   //迭代一次
function getNewIndividuals() {
    getNonDominated();
    var new_children = [];
    var temp = comp_object[POPULATION_SIZE - 1].level; //分三种情况 1.temp在第一个 2.temp在最后一个 3.temp在中间
    if (comp_object[POPULATION_SIZE] && comp_object[POPULATION_SIZE].level > temp)
        new_children = individuals.slice(0, POPULATION_SIZE);
    else {
        var i = 0;
        while (comp_object[i] && comp_object[i].level < temp) {
            new_children.push(individuals[i].slice(0));
            i++;
        }
        var temp_arr = [];
        while (comp_object[i] && comp_object[i].level === temp) {
            temp_arr.push(individuals[i]);
            i++;
        }
        crowdingDistanceSort(temp_arr);
        var m = POPULATION_SIZE - new_children.length;
        for (var j = 0; j < m; j++)
            new_children.push(temp_arr[j]);
    }
    individuals.length = 0;
    individuals = new_children;
    // GlobalMap.clear();
    // for(let i=0; i<individuals.length; i++){
    //     let key = getMapKey(individuals[i]);
    //     GlobalMap.set(key, true)
    // }
    getObjectValue();
}  //2N->N产生新的种群 取前几层
function crowdingDistanceSort(arr) {
    var arr_dis = [];
    for (var j = 0; j < arr.length; j++) {
        arr_dis.push(getObject(arr[j]));
    }
    var cmp_ob = Object.getOwnPropertyNames(comp_object[0]);
    for (var i = 0; i < counter; i++) {
        var prop_name = cmp_ob[i];
        arr_dis.sort(function (a, b) {
            var temp_1 = individuals.indexOf(a.individual);
            var temp_2 = individuals.indexOf(b.individual);
            a[prop_name] = comp_object[temp_1][prop_name];
            b[prop_name] = comp_object[temp_2][prop_name];
            return a[prop_name] - b[prop_name];
        });
        for (var k = 1; k < arr_dis.length - 1; k++) {
            arr_dis[k].distance += (arr_dis[k + 1][prop_name] - arr_dis[k - 1][prop_name]) / (arr_dis[arr_dis.length - 1][prop_name] - arr_dis[0][prop_name]);
        }
        arr_dis[0].distance = Number.POSITIVE_INFINITY;
        arr_dis[arr_dis.length - 1].distance = Number.POSITIVE_INFINITY;
    }
    arr_dis.sort(function (a, b) { return b.distance - a.distance; });
    arr.length = 0;
    for (var m = 0; m < arr_dis.length; m++) {
        arr.push(arr_dis[m].individual);
    }
} //计算聚集距离
//得到knee和边界集

/**
 *从集合中选取拐点，距离最小与最大两点的连线最远的点
 *
 */
function getKneePoint(fronts) {
    let fronts_obj = fronts.map((individual) => {
        let ret = {};
        ret.individual = individual;
        ret.comp = getCompareObject(individual);
        return ret;
    })
    fronts_obj.sort((a, b) => a.comp.sum - b.comp.sum);
    let ret = [];
    let pointA = {
        x: fronts_obj[0].comp.sum,
        y: fronts_obj[0].comp.balance
    };
    let pointB = {
        x: fronts_obj[fronts_obj.length - 1].comp.sum,
        y: fronts_obj[fronts_obj.length - 1].comp.balance
    }
    let k = (pointA.y - pointB.y) / (pointA.x - pointB.x);
    let b = pointA.y - k * pointA.x;
    //删除首尾两点，避免重复添加
    fronts_obj.shift(); fronts_obj.pop();
    fronts_obj.map(temp => {
        temp.el = ((k * temp.comp.sum - temp.comp.balance + b)) / Math.sqrt(k * k + 1)
    })
    fronts_obj.sort((a, b) => b.el - a.el);
    if (fronts_obj[0] && fronts_obj[0].el > 0) {
        ret.push(fronts_obj[0].individual.slice(0));
        let count = 1;
        while (fronts_obj[count] && fronts_obj[count].el == fronts_obj[0].el && JSON.stringify(fronts_obj[count].individual) !== JSON.stringify(fronts_obj[0].individual)) {
            ret.push(fronts_obj[count].individual.slice(0));
            count++;
        }
    }
    // ret 由三种形式，1）只有一个值，就是knee点，2）有多个值，表明有多个knee相同的点，3）没有值，表明没有凸点
    return ret;
}
function getObject(arr) {
    let arr_dis = new Object();
    arr_dis.individual = arr;
    arr_dis.distance = 0;
    return arr_dis;
}
function produceChildByTournament() {
    getNonDominated();
    let children = [];
    let arr_1 = [];
    let arr_2 = [];
    for (let i = 0; i < POPULATION_SIZE; i++) {
        arr_1.push(i);
        arr_2.push(i);
    }
    arr_1.shuffle(); arr_2.shuffle();
    let parent_1, parent_2;
    let mapkey_1, mapkey_2;
    for (let j = 0; j < POPULATION_SIZE; j += 4) {
        let count;

        parent_1 = chooseBetter(arr_1[j], arr_1[j + 1]);
        parent_2 = chooseBetter(arr_1[j + 2], arr_1[j + 3]);
        doCrossoverNewX(parent_1, parent_2);
        parent_1 = delIndividual(parent_1); parent_2 = delIndividual(parent_2);
        mapkey_1 = getMapKey(parent_1); mapkey_2 = getMapKey(parent_2);
        count = 0;
        while (GlobalMap.has(mapkey_1)) {
            count++;
            if (count > 100) {
                mutation2(parent_1);
            } else {
                parent_1.splice(parent_1.length - 1, 1, randomDriveWay());
            }
            parent_1 = delIndividual(parent_1);
            mapkey_1 = getMapKey(parent_1)
        }
        children.push(parent_1.slice(0));
        GlobalMap.set(mapkey_1, true);
        count = 0;
        while (GlobalMap.has(mapkey_2)) {
            count++;
            if (count > 100) {
                mutation2(parent_2);
            } else {
                parent_2.splice(parent_2.length - 1, 1, randomDriveWay());
            }
            parent_2 = delIndividual(parent_2);
            mapkey_2 = getMapKey(parent_2)
        }
        children.push(parent_2.slice(0));
        GlobalMap.set(mapkey_2, true);
        parent_1 = chooseBetter(arr_2[j], arr_2[j + 1]);
        parent_2 = chooseBetter(arr_2[j + 2], arr_2[j + 3]);
        doCrossoverNewX(parent_1, parent_2);
        parent_1 = delIndividual(parent_1); parent_2 = delIndividual(parent_2);
        mapkey_1 = getMapKey(parent_1); mapkey_2 = getMapKey(parent_2);
        count = 0;
        while (GlobalMap.has(mapkey_1)) {
            count++;
            if (count > 100) {
                mutation2(parent_1);
            } else {
                parent_1.splice(parent_1.length - 1, 1, randomDriveWay());
            }
            parent_1 = delIndividual(parent_1);
            mapkey_1 = getMapKey(parent_1);
        }
        children.push(parent_1.slice(0));
        GlobalMap.set(mapkey_1, true);
        count = 0;
        while (GlobalMap.has(mapkey_2)) {
            count++;
            if (count > 100) {
                mutation2(parent_2);
            } else {
                parent_2.splice(parent_2.length - 1, 1, randomDriveWay());
            }
            parent_2 = delIndividual(parent_2);
            mapkey_2 = getMapKey(parent_2);
        }
        children.push(parent_2.slice(0));
        GlobalMap.set(mapkey_2, true);
    }
    individuals.length = 0;
    individuals = children;
}  //二进制锦标赛产生后代
function chooseBetter(m, n) {
    //不同级的，取非支配等级较低（靠前的）
    if (comp_object[m].level !== comp_object[n].level)
        return comp_object[m].level < comp_object[n].level ? individuals[m].slice(0) : individuals[n].slice(0);
    else {
        // 相同等级的，就取最靠近拐点的
        let temp_arr = [];
        for (let i = 0; i < comp_object.length; i++) {
            if (comp_object[i].level < comp_object[m].level)
                continue;
            if (comp_object[i].level === comp_object[m].level)
                temp_arr.push(Object.assign({}, { individual: individuals[i], index: i }, comp_object[i]));
            else if (comp_object[i].level > comp_object[m].level)
                break;
        }
        temp_arr.sort((a, b) => a.sum - b.sum);
        let pointA = { x: temp_arr[0].sum, y: temp_arr[0].balance };
        let pointB = { x: temp_arr[temp_arr.length - 1].sum, y: temp_arr[temp_arr.length - 1].balance };
        let k = (pointA.y - pointB.y) / (pointA.x - pointB.x);
        let b = pointA.y - k * pointA.x;
        temp_arr.map(obj => {
            obj.extremeline = ((k * obj.sum - obj.balance + b)) / Math.sqrt(k * k + 1)
        })
        temp_arr.sort((a, b) => b.extremeline - a.extremeline);
        return temp_arr[0].individual.slice(0);
    }
}
function getNonDominated() {
    let temp_i = [];
    let temp_d = [];
    let l = 0;
    do {
        let nd_set = [];
        eachNonDominated(0, individuals.length - 1, nd_set);
        for (let i = 0; i < nd_set.length; i++) {
            temp_i.push(individuals[nd_set[i]].slice(0));
            temp_d.push(comp_object[nd_set[i]]);
            comp_object[nd_set[i]].level = l;
            individuals.splice(nd_set[i], 1);
            comp_object.splice(nd_set[i], 1);
        }
        l++;
    } while (individuals.length > 0);
    individuals = temp_i;
    comp_object = temp_d;
}  //将individuals排序成非支配集
function eachNonDominated(s, t, nd_set) {
    let k;
    if (s < t) {
        k = quickSort(s, t);
        if (comp_object[k].is_nd === true)
            nd_set.push(k);
        eachNonDominated(s, k - 1, nd_set);
    } else if (s === t) {
        comp_object[s].is_nd = true;
        nd_set.push(s);
    }
}  //得到每一层的非支配集
function quickSort(s, t) {
    let i = s;
    let j = t;
    let x = comp_object[s];
    let y = individuals[s];
    x.is_nd = true;
    while (i < j) {
        while (i < j && dominate(x, comp_object[j])) {
            j--;
            if (dominate(comp_object[j], x))
                x.is_nd = false;
        }
        comp_object[i] = comp_object[j]; individuals[i] = individuals[j];   //每个dis和individuals相对应
        while (i < j && (!dominate(x, comp_object[i]))) {
            i++;
            if (dominate(comp_object[i], x) === true)
                x.is_nd = false;
        }
        comp_object[j] = comp_object[i]; individuals[j] = individuals[i];
    }
    comp_object[i] = x; individuals[i] = y;
    return i;
}  //快速排序构造非支配集（QS）
function dominate(cmp1, cmp2) {
    if (cmp1.sum <= cmp2.sum && cmp1.balance <= cmp2.balance && !isObjectValueEqual(cmp1, cmp2))
        return true;
    return false;
}  //比较支配关系
function isObjectValueEqual(a, b) {   //比较两对象前counter项是否相等
    let aProps = Object.getOwnPropertyNames(a);
    for (let i = 0; i < counter; i++) {
        let propName = aProps[i];
        if (a[propName] !== b[propName]) {
            return false;
        }
    }
    return true;
}  //判断对象是否相等
/**
 * 判断个体v是否被P中个体非支配
 */
function beenDominate(pops, ind) {
    for (let i = 0; i < pops.length; i++) {
        if (dominate(getCompareObject(pops[i]), getCompareObject(ind))) {
            return true;
        }
    }
    return false;
}
/**
 * 统一每个个体，由小到大，去重用
 */
function delIndividual(param) {
    let indiv = JSON.parse(JSON.stringify(param));
    let temp_arr = [];
    let end_arr = indiv[indiv.length - 1];
    for (let i = 0; i < end_arr.length; i++) {
        if (i == 0) {
            temp_arr.push(indiv.slice(1, end_arr[i] + 1));
        } else {
            temp_arr.push(indiv.slice(end_arr[i - 1] + 1, end_arr[i] + 1));
        }
    }
    temp_arr.push(indiv.slice(end_arr[end_arr.length - 1] + 1, indiv.length - 1));
    //每个旅行商的起点数字都要小于终点
    let arr_arr = temp_arr.map(arr => {
        if (arr[0] > arr[arr.length - 1]) {
            arr.reverse();
        }
        return arr;
    });
    //所有旅行商按照第一个城市的数字由小到大排列
    arr_arr.sort((a, b) => {
        return a[0] - b[0];
    });
    //数组扁平化
    let ret_arr = [];
    let end = [];
    for (let i = 0; i < arr_arr.length; i++) {
        ret_arr = ret_arr.concat(arr_arr[i]);
        if (i != arr_arr.length - 1)
            end.push(ret_arr.length)
    }
    ret_arr.push(end);
    ret_arr.unshift(0);
    return ret_arr;
}
// 判断两个个体是否相等
function judgeIndividual(ind1, ind2) {
    let temp1 = ind1.slice(0);
    let temp2 = ind2.slice(0);
    if (JSON.stringify(temp1) == JSON.stringify(temp2))
        return true;
    else return false;
}
//判断种群中是否包含某一个个体
function judgeContain(arrs, ind) {
    return arrs.some((temp) => judgeIndividual(temp, ind));
}
function doCrossoverNewX(ar1, ar2, randomN) {    //取相邻位置中较短距离的
    let temp_1 = findShort(ar1.slice(0), ar2.slice(0), 1, randomN);//前向取
    let temp_2 = findShort(ar1.slice(1, ar1.length - 1), ar2.slice(1, ar1.length - 1), 2, randomN);//后向取
    //let temp_2=findShort(ar1.slice(0),ar2.slice(0),2);//后向取
    //合理化---去重复零再添加插入点
    rationalization(temp_1);
    //rationalization(temp_2);
    for (let i = 0; i < temp_1.length; i++) {
        ar1[i] = temp_1[i];
        //ar2[i]=temp_2[i];
    }
    for (let i = 0; i < temp_2.length; i++) {
        ar2[i + 1] = temp_2[i];
    }
}
function findShort(ar1, ar2, n, randomN) {
    let result = [];
    let px;
    let py;
    if (n === 1) {
        px = partitionIndividual(ar1).slice(0, partitionIndividual(ar1).length - 1);
        py = partitionIndividual(ar2).slice(0, partitionIndividual(ar2).length - 1);
    }
    else if (n === 2) {
        px = ar1.slice(0);
        py = ar2.slice(0);
    }
    let ind = randomN != undefined ? randomN : randomNumber(ar1.length);
    let temp = px[ind];
    result.push(temp);
    let dx, dy;
    while (px.length > 1) {
        if (n === 1) {
            dx = px.frontDot(temp);
            dy = py.frontDot(temp);
        }
        else {
            dx = px.nextDot(temp);
            dy = py.nextDot(temp);
        }
        px.splice(px.indexOf(temp), 1);
        py.splice(py.indexOf(temp), 1);
        temp = distanceOfTwoPoint(points[temp], points[dx]) < distanceOfTwoPoint(points[temp], points[dy]) ? dx : dy;
        result.push(temp);
    }
    return result;
}
function rationalization(arr) {
    let temp = arr.distinctCloseTo();
    let count = MAX_CAR - temp.length;
    let num;
    for (let i = 0; i < count; i++) {
        do {
            num = randomNumber(POINT_NUMBER - 1);
        } while (temp.indexOf(num) >= 0 || num === 0);
        temp.push(num);
    }
    temp.sort(function (a, b) {
        return a - b;
    });
    arr.push(temp);
}
function doCrossoverPMX(ar1, ar2) {
    let result_1 = ar1.slice(1);//去首个0
    let result_2 = ar2.slice(1);
    let cro_point_x, cro_point_y;     //交叉点
    do {
        cro_point_x = randomNumber(result_1.length - 1);
        cro_point_y = randomNumber(result_1.length - 1);
    } while (cro_point_x >= cro_point_y || cro_point_x === 0 || cro_point_y === result_1.length - 2);//不包含第一位和倒数第二位
    for (let i = cro_point_x; i <= cro_point_y; i++) {  //交换交叉部分
        result_1[i] = ar2[i + 1];
        result_2[i] = ar1[i + 1];
    }
    let cross_xy_1 = result_2.slice(cro_point_x, cro_point_y + 1);
    let cross_xy_2 = result_1.slice(cro_point_x, cro_point_y + 1);
    for (let j = 0; j < result_1.length - 1; j++) {   //修复重复的元素
        if (j >= cro_point_x && j <= cro_point_y)
            continue;
        if (cross_xy_2.indexOf(result_1[j]) >= 0)
            result_1[j] = mapping(result_1[j], cross_xy_2, cross_xy_1);
        if (cross_xy_1.indexOf(result_2[j]) >= 0)
            result_2[j] = mapping(result_2[j], cross_xy_1, cross_xy_2);
    }
    result_1.unshift(0);
    result_2.unshift(0);
    result_2.splice(result_2.length - 1, 1, randomDriveWay());//重新随机生成车辆的分配情况
    ar1.length = 0; ar2.length = 0;
    for (let k = 0; k < result_1.length; k++) {
        ar1.push(result_1[k]);
        ar2.push(result_2[k]);
    }
}  //修改的PMX部分映射交叉
function mapping(x, array1, array2) {
    let index;
    while (array1.indexOf(x) >= 0) {
        index = array1.indexOf(x);
        x = array2[index];
    }
    return x;
} //返回数组1中的x在数组2中的映射


function mutation() {
    for (let i = 0; i < POPULATION_SIZE; i++)
        if (Math.random() < MUTATION_RATE) {
            let temp_ind = individuals[i].slice(0);
            // while (judgeContain(individuals, temp_ind) || judgeContain(oldindividuals, temp_ind)) {
            let mapkey = getMapKey(temp_ind);
            while (GlobalMap.has(mapkey)){
                if (Math.random() < 0.5) {
                    mutation1(temp_ind);
                } else {
                    mutation2(temp_ind);
                }
                temp_ind = delIndividual(temp_ind);
                mapkey = getMapKey(temp_ind)
            }
            individuals[i] = temp_ind.slice(0);
        }
}

// function mutation() {
//     for (var i = 0; i < POPULATION_SIZE; i++)
//         if (Math.random() < MUTATION_RATE) {
//             let routers = preMutation(individuals[i]);
//             let router;
//             let arr_copy = individuals[i].slice(0);
//             let salsarr = [];
//             let mapkey = getMapKey(arr_copy);
//             while (GlobalMap.has(mapkey)) {
//                 arr_copy = [];
//                 salsarr = [];
//                 if (Math.random() < 0.33) {
//                     router = routermutation1(routers);
//                 } else if (Math.random() < 0.66) {
//                     router = routermutation2(routers);
//                 } else {
//                     router = routermutation3(routers);
//                 }
//                 router.map((temp, index) => {
//                     arr_copy.push(...temp);
//                     if (index == 0) {
//                         salsarr.push(temp.length);
//                     } else if (index != router.length - 1) {
//                         salsarr.push(salsarr[salsarr.length - 1] + temp.length);
//                     }
//                 });
//                 arr_copy.unshift(0);
//                 arr_copy.push(salsarr);
//                 arr_copy = delIndividual(arr_copy);
//                 mapkey = getMapKey(arr_copy);
//             }
//             GlobalMap.set(mapkey, true);
//             for (let j = 0; j < individuals[i].length; j++) {
//                 individuals[i][j] = arr_copy[j];
//             }
//         }
// }

function mutation1(arr) {
    var x;
    var y;
    do {
        x = randomNumber(arr.length - 2);
        y = randomNumber(arr.length - 1);
    } while (x >= y || x === 0);
    var temp;
    var mid = x + (y - x) / 2;
    for (var i = x; i <= mid; i++ , y--) {
        temp = arr[i];
        arr[i] = arr[y];
        arr[y] = temp;
    }
    arr.splice(arr.length - 1, 1, randomDriveWay());
} //翻转变异
function mutation2(arr) {
    var x, y;
    do {
        x = randomNumber(arr.length >> 1);
        y = randomNumber(arr.length - 1);
    } while (x >= y || x === 0);
    var s1 = arr.slice(1, x);
    var s2 = arr.slice(x, y);
    var s3 = arr.slice(y, arr.length - 1);
    arr.length = 0;
    s2 = s2.concat(s1).concat(s3);
    for (var i = 0; i < s2.length; i++) {
        arr.push(s2[i]);
    }
    arr.unshift(0);
    arr.push(randomDriveWay());
} //片段换位变异
function mutation3(arr) {
    let arr_copy;
    let x;
    let y;
    arr_copy = arr.slice(0);
    do {
        x = randomNumber(arr_copy.length - 2);
        y = randomNumber(arr_copy.length - 1);
    } while (x >= y || x === 0);
    let temp;
    let mid = x + (y - x) / 2;
    for (let i = x; i <= mid; i++ , y--) {
        temp = arr_copy[i];
        arr_copy[i] = arr_copy[y];
        arr_copy[y] = temp;
    }
    for (let i = 0; i < arr.length; i++) {
        arr[i] = arr_copy[i];
    }

} //翻转变异

function mutation4(arr) {
    let arr_copy;
    let salsarr;
    let salenumber = MAX_CAR + 1;
    let salesmans;
    arr_copy = arr.slice(0);
    salsarr = arr_copy[arr_copy.length - 1].slice(0);
    salesmans = salsarr.map((num, index) => {
        if (index == 0) {
            return arr_copy.slice(1, num + 1);
        } else {
            return arr_copy.slice(salsarr[index - 1] + 1, num + 1);
        }
    })
    salesmans.push(arr_copy.slice(salsarr[salsarr.length - 1] + 1, -1));//将剩下的最后一组添加到salesmans中
    let salesmans_comp = salesmans.map((arr, index) => {
        let temp = arr.slice(0);
        temp.push(0);
        temp.unshift(0);
        let sum = 0;
        for (let i = 1; i < temp.length; i++) {
            sum += distanceOfTwoPoint(points[i - 1], points[i]);
        }
        return {
            sum: sum,
            index, index
        };
    });
    salesmans_comp.sort((a, b) => {
        return b.sum - a.sum;
    })
    let s1 = salesmans_comp[0].index;
    let s2 = salesmans_comp[salesmans_comp.length - 1].index;

    let mutate_part1 = salesmans[s1].slice(0);
    let mutate_part2 = salesmans[s2].slice(0);
    if (mutate_part1.length == 1) {
        while (mutate_part2.length == 1) {
            do {
                s2 = randomNumber(salenumber);
            } while (s2 == s1)
            mutate_part2 = salesmans[s2].slice(0);
        }
        // p1.len == 1并且 p2.len !== 1 将p2中的一部分分给p1
        let randomdep = 1 + randomNumber(mutate_part2.length - 2);
        mutate_part1.push(...mutate_part2.slice(0, randomdep));
        mutate_part2 = mutate_part2.slice(randomdep);
    } else {
        if (mutate_part2.length == 1) {
            // p1.len != 1并且 p2.len == 1 将p1中的一部分分给p2
            let randomdep = 1 + randomNumber(mutate_part1.length - 2);
            mutate_part2.push(...mutate_part1.slice(0, randomdep));
            mutate_part1 = mutate_part1.slice(randomdep);
        } else {
            // p1.len != 1并且 p2.len != 1 则调换p1和p2中的一个片段
            let p1_d1, p1_d2, p2_d1, p2_d2;
            do {
                [p1_d1, p1_d2] = randomNumberN(mutate_part1.length, 2);
            } while (p1_d1 == p1_d2 && Math.abs(p1_d1 - p1_d2) !== mutate_part1.length - 1);
            let p1_p1 = mutate_part1.slice(0);
            let p1_p2 = p1_p1.splice(p1_d1, Math.abs(p1_d2 - p1_d1));
            do {
                [p2_d1, p2_d2] = randomNumberN(mutate_part2.length, 2);
            } while (p2_d1 == p2_d2 && Math.abs(p2_d1 - p2_d2) !== mutate_part1.length - 1);
            let p2_p1 = mutate_part2.slice(0);
            let p2_p2 = p2_p1.splice(p2_d1, Math.abs(p2_d2 - p2_d1));
            p1_p1.splice(p1_d1, 0, ...p2_p2).slice(0);
            p2_p1.splice(p2_d1, 0, ...p1_p2).slice(0);
            mutate_part1 = p1_p1;
            mutate_part2 = p2_p1;
        }
    }
    salesmans[s1] = mutate_part1.slice(0);
    salesmans[s2] = mutate_part2.slice(0);
    arr_copy.length = 0;
    salsarr = [];
    salesmans.map((temp, index) => {
        arr_copy.push(...temp);
        if (index == 0) {
            salsarr.push(temp.length);
        } else if (index != salesmans.length - 1) {
            salsarr.push(salsarr[salsarr.length - 1] + temp.length);
        }
    });
    arr_copy.unshift(0);
    arr_copy.push(salsarr);
    for (let i = 0; i < arr.length; i++) {
        arr[i] = arr_copy[i];
    }
}//解码后的片段换位变异：任选两个旅行商，在旅行商在之间进行片段换位变异

function preMutation(arr) {
    let arr_copy;
    let salsarr;
    let salesmans;
    arr_copy = arr.slice(0);
    salsarr = arr_copy[arr_copy.length - 1].slice(0);
    salesmans = salsarr.map((num, index) => {
        if (index == 0) {
            return arr_copy.slice(1, num + 1);
        } else {
            return arr_copy.slice(salsarr[index - 1] + 1, num + 1);
        }
    })
    salesmans.push(arr_copy.slice(salsarr[salsarr.length - 1] + 1, -1));//将剩下的最后一组添加到salesmans中
    return salesmans;
} // 将个体拆分开来，分成m个销售人员的路径
//变异Ⅰ 旅行商内部变异，内部反转变异 对于最长路径最小化能同时减少平衡度和总距离
function routermutation1(routers) {
    let router = routers.slice(0);
    let len = router.length;
    for (let i = 0; i < len; i++) {
        let routeri = router[i].slice(0);
        for (let j = 0; j < routeri.length * routeri.length; j++) {
            if (routeri.length == 1) break;
            let [index1, index2] = randomNumberN(routeri.length, 2);
            if (index1 > index2) [index1, index2] = [index2, index1];
            let [point1, point2] = [points[routeri[index1]], points[routeri[index2]]];
            let point1pre = (index1 == 0 ? points[0] : points[routeri[index1 - 1]]);
            let point2pre = (index2 == routeri.length - 1 ? points[0] : points[routeri[index2 + 1]]);
            let oldd = distanceOfTwoPoint(point1pre, point1) + distanceOfTwoPoint(point2pre, point2);
            let newd = distanceOfTwoPoint(point1pre, point2) + distanceOfTwoPoint(point2pre, point1);
            if (newd < oldd) {
                let mid = index1 + (index2 - index1) / 2;
                for (let i = index1, y = index2; i <= mid; i++ , y--) {
                    temp = routeri[i];
                    routeri[i] = routeri[y];
                    routeri[y] = temp;
                }
                router[i] = routeri;
                break;
            }
        }
    }
    return router;
}
// 变异2 旅行商之间的变异 选取两个位置 换位变异 随机选取第一个 第二个 根据距离其重心最近的一个进行交换（挨着最近的最容易出现组间交叉）
function routermutation2(routers) {
    let router = routers.slice(0);
    let obj_arr = [];
    router.map((arr) => {
        //求和
        let sum = arr.length == 1 ? 0 : arr.reduce((prev, cur, index) => {
            if (index == 0) return 0;
            return prev + distanceOfTwoPoint(points[arr[index - 1]], points[cur])
        }, 0);
        sum += distanceOfTwoPoint(points[0], points[arr[0]]);
        sum += distanceOfTwoPoint(points[0], points[arr[arr.length - 1]]);
        //求重心
        let centerX = 0;
        let centerY = 0;
        arr.map((cur) => {
            centerX += points[cur].x;
            centerY += points[cur].y;
        });
        centerX += points[0].x;
        centerY += points[0].y;
        let centerpoint = new Point(centerX / (arr.length + 1), centerY / (arr.length + 1));
        obj_arr.push({
            sum: sum,
            centerpoint: centerpoint,
            arr: arr
        });
    })
    //  选择路程最大的旅行商
    obj_arr.sort((a, b) => {
        return b.sum - a.sum;
    })
    let randomindex1 = 0;
    //将每一个对象增加一个属性corediff 表示当前的旅行商重心距离路程最大的旅行商重心的差值
    obj_arr.map((obj) => {
        obj.corediff = distanceOfTwoPoint(obj.centerpoint, obj_arr[randomindex1].centerpoint);
    });
    obj_arr.sort((a, b) => {
        return a.corediff - b.corediff;
    });
    // 取得需要变异的两条旅行商（第一个路程最长的个体,第二个随机个体根据概率进行选择,重心差越小的概率越高）
    let route1 = obj_arr[0].arr.slice(0);
    let pos = Math.random() < 0.7 ? 1 : Math.floor((obj_arr.length - 1) / 2) + 1;
    let randomindex2 = randomNumber((obj_arr.length - 1) / 2) + pos;
    let route2 = obj_arr[randomindex2].arr.slice(0);
    router = [];
    for (let k = 0; k < obj_arr.length; k++) {
        router.push(obj_arr[k].arr.slice(0));
    }
    if (route1.length == 1 || route2.length == 1)
        return router;
    // 记录循环中的所有变换了的最小的总和
    let mintotalsum = 0;
    let minrouter = router;
    for (let j = 0; j < route1.length; j++) {
        let newroute1 = [];
        let newroute2 = [];
        let [rand1, rand2] = randomNumberN(route1.length + 1, 2);
        let [rand3, rand4] = randomNumberN(route2.length + 1, 2);
        //左闭右开合区间, 保证有存在只相互交换一个的情况
        let random1_2 = route1.slice(rand1, rand2);
        let random3_4 = route2.slice(rand3, rand4);

        newroute1.push(...route1.slice(0, rand1));
        let p1 = rand1 == 0 ? 0 : route1[rand1 - 1];
        if (distanceOfTwoPoint(points[p1], points[route2[rand3]]) > distanceOfTwoPoint(points[p1], points[route2[rand4 - 1]])) {
            //4-3
            let random4_3 = random3_4.slice(0).reverse();
            newroute1.push(...random4_3);
        } else {
            //3-4
            newroute1.push(...random3_4);
        }
        newroute1.push(...route1.slice(rand2));

        newroute2.push(...route2.slice(0, rand3));
        let p2 = rand3 == 0 ? 0 : route2[rand3 - 1];
        if (distanceOfTwoPoint(points[p2], points[route1[rand1]]) > distanceOfTwoPoint(points[p2], points[route1[rand2 - 1]])) {
            //2-1
            let random2_1 = random1_2.slice(0).reverse();
            newroute2.push(...random2_1);
        } else {
            //1-2
            newroute2.push(...random1_2);
        }
        newroute2.push(...route2.slice(rand4));
        //得到两个新的个体，计算总和是否减小
        let sum1 = 0; let nsum1 = 0;
        let sum2 = 0; let nsum2 = 0;
        route1.map((cur, index) => {
            if (index == 0)
                sum1 += distanceOfTwoPoint(points[0], points[route1[index]]);
            else
                sum1 += distanceOfTwoPoint(points[route1[index - 1]], points[route1[index]]);
            if (index == route1.length - 1)
                sum1 += distanceOfTwoPoint(points[0], points[route1[index]]);
        })
        route2.map((cur, index) => {
            if (index == 0)
                sum2 += distanceOfTwoPoint(points[0], points[route2[index]]);
            else
                sum2 += distanceOfTwoPoint(points[route2[index - 1]], points[route2[index]]);
            if (index == route2.length - 1)
                sum2 += distanceOfTwoPoint(points[0], points[route2[index]]);
        })

        newroute1.map((cur, index) => {
            if (index == 0)
                nsum1 += distanceOfTwoPoint(points[0], points[newroute1[index]]);
            else
                nsum1 += distanceOfTwoPoint(points[newroute1[index - 1]], points[newroute1[index]]);
            if (index == newroute1.length - 1)
                nsum1 += distanceOfTwoPoint(points[0], points[newroute1[index]]);
        })
        newroute2.map((cur, index) => {
            if (index == 0)
                nsum2 += distanceOfTwoPoint(points[0], points[newroute2[index]]);
            else
                nsum2 += distanceOfTwoPoint(points[newroute2[index - 1]], points[newroute2[index]]);
            if (index == newroute2.length - 1)
                nsum2 += distanceOfTwoPoint(points[0], points[newroute2[index]]);
        })
        if (j == 0) {
            mintotalsum = nsum2 + nsum1;
            minrouter[0] = newroute1;
            minrouter[randomindex2] = newroute2;
        }
        if (mintotalsum < nsum2 + nsum1) {
            mintotalsum = nsum2 + nsum1;
            minrouter[0] = newroute1;
            minrouter[randomindex2] = newroute2;
        }
    }
    return minrouter;
}

// 随机选择一个, 再依据重心相对近的进行排列,在前n/2中再选择一个,由此得的两个个体,将其中一个抽取一个位置,插入到另一个中(大的插入到小的中)
function routermutation3(routers) {
    let router = routers.slice(0);
    let len = router.length;
    let obj_arr = [];
    router.map((arr) => {
        //求和
        let sum = arr.length == 1 ? 0 : arr.reduce((prev, cur, index) => {
            if (index == 0) return 0;
            return prev + distanceOfTwoPoint(points[arr[index - 1]], points[cur])
        }, 0);
        if (!points[arr[0]]) {
            console.log(JSON.stringify(arr), arr[0])
        }
        sum += distanceOfTwoPoint(points[0], points[arr[0]]);
        sum += distanceOfTwoPoint(points[0], points[arr[arr.length - 1]]);
        //求重心
        let centerX = 0;
        let centerY = 0;
        arr.map((cur) => {
            centerX += points[cur].x;
            centerY += points[cur].y;
        });
        centerX += points[0].x;
        centerY += points[0].y;
        let centerpoint = new Point(centerX / (arr.length + 1), centerY / (arr.length + 1));
        obj_arr.push({
            sum: sum,
            centerpoint: centerpoint,
            arr: arr
        });
    })
    //  选择路程最大的旅行商
    obj_arr.sort((a, b) => {
        return b.sum - a.sum;
    })
    let random1 = 0;
    obj_arr.map((obj) => {
        obj.corediff = distanceOfTwoPoint(obj.centerpoint, obj_arr[random1].centerpoint);
    });
    obj_arr.sort((a, b) => {
        return a.corediff - b.corediff;
    });
    // 除第一个以外,取剩下销售人员的n/2的值中的随机一个值,再进行变异,将较大总和中的一个放到较小的总和中
    // 较大的概率选择重心距离相对较小的,
    let pos = Math.random() < 0.7 ? 1 : Math.floor((obj_arr.length - 1) / 2) + 1;
    let random2 = randomNumber((obj_arr.length - 1) / 2) + pos;
    random1 = 0;
    if (obj_arr[random1].arr.length == 1 && obj_arr[random2].arr.length == 1) {
        // 都等于1 则暂且先不变异
        router = [];
        for (let k = 0; k < obj_arr.length; k++) {
            router.push(obj_arr[k].arr);
        }
        return router;
    }
    if (obj_arr[random1].sum > obj_arr[random2].sum) {
        [random1, random2] = [random2, random1];
    }
    if (obj_arr[random2].arr.length == 1) {
        //较大的那个只有1个城市也不变异
        router = [];
        for (let k = 0; k < obj_arr.length; k++) {
            router.push(obj_arr[k].arr);
        }
        return router;
    }
    let mindiff;
    let randomindex;
    let minminindex;
    for (let k = 0; k < obj_arr[random2].arr.length; k++) {
        let randomindex = randomNumber(obj_arr[random2].arr.length);
        let deldis = 0;
        if (randomindex == 0) {
            deldis = distanceOfTwoPoint(points[0], points[obj_arr[random2].arr[0]]) + distanceOfTwoPoint(points[obj_arr[random2].arr[0]], points[obj_arr[random2].arr[1]]);
        } else if (randomindex == obj_arr[random2].arr.length - 1) {
            deldis = distanceOfTwoPoint(points[0], points[obj_arr[random2].arr[randomindex]]) + distanceOfTwoPoint(points[obj_arr[random2].arr[randomindex]], points[obj_arr[random2].arr[randomindex - 1]]);
        } else {
            deldis = distanceOfTwoPoint(points[obj_arr[random2].arr[randomindex]], points[obj_arr[random2].arr[randomindex - 1]]) + distanceOfTwoPoint(points[obj_arr[random2].arr[randomindex]], points[obj_arr[random2].arr[randomindex + 1]]);
        }
        let city = obj_arr[random2].arr[randomindex];
        let temparr = obj_arr[random1].arr;
        let minindex = distanceOfTwoPoint(points[city], points[temparr[0]]) <= distanceOfTwoPoint(points[city], points[temparr[temparr.length - 1]]) ?
            0 : temparr.length - 1;
        let mindis = distanceOfTwoPoint(points[city], points[temparr[0]]) <= distanceOfTwoPoint(points[city], points[temparr[temparr.length - 1]]) ?
            distanceOfTwoPoint(points[city], points[0]) + distanceOfTwoPoint(points[city], points[temparr[0]]) : distanceOfTwoPoint(points[city], points[0]) + distanceOfTwoPoint(points[city], points[temparr[temparr.length - 1]]);
        for (let l = 1; l < temparr.length; l++) {
            let temp = distanceOfTwoPoint(points[city], points[temparr[l - 1]]) + distanceOfTwoPoint(points[city], points[temparr[l]]);
            if (temp < mindis) {
                mindis = temp;
                minindex = l;
            }
        }
        if (k == 0) {
            mindiff = mindis - deldis;
            minrandomindex = randomindex;
            minminindex = minindex;
            mincity = city;
        }
        //  取插入前后距离的变化最小的
        if (mindiff < mindis - deldis) {
            mindiff = mindis - deldis;
            minrandomindex = randomindex;
            minminindex = minindex;
            mincity = city;
        }
    }
    obj_arr[random2].arr.splice(minrandomindex, 1);
    obj_arr[random1].arr.splice(minminindex, 0, mincity);
    router = [];
    for (let k = 0; k < obj_arr.length; k++) {
        router.push(obj_arr[k].arr);
    }
    return router;
}

function insertSegment(lines, line) {
    let angle_1, angle_2;
    let i = 0;
    for (; i < lines.length; i++) {
        angle_2 = Math.atan2(points[lines[i][1]].y - points[lines[i][0]].y, points[lines[i][1]].x - points[lines[i][0]].x);
        if (lines[i][0] === line[0]) {
            angle_1 = Math.atan2(points[line[1]].y - points[line[0]].y, points[line[1]].x - points[line[0]].x);
            if (angle_1 < angle_2)
                break;
            else if (angle_1 === angle_2 && points[line[1]].x > points[lines[i][1]].x)
                break;
            else
                continue;
        }
        else {
            angle_1 = Math.atan2(points[line[0]].y - points[lines[i][0]].y, points[line[0]].x - points[lines[i][0]].x);
            if (angle_1 < angle_2)
                break;
            else if (angle_1 > angle_2)
                continue;
            else {
                if (angle_2 < 0)
                    break;
                else
                    continue;
            }
        }
    }
    lines.splice(i, 0, line);
}
function above(lines, line) {
    let x1 = points[line[0]].x;
    let y1 = points[line[0]].y;
    let x2 = points[line[1]].x;
    let y2 = points[line[1]].y;
    let i = 0;
    while (i < lines.length) {
        if (points[lines[i][0]].x === x1 && points[lines[i][1]].x === x2 && points[lines[i][0]].y === y1 && points[lines[i][1]].y === y2)
            break;
        i++;
    }
    if (i === 0)
        return false;
    else
        return lines[--i];
}
function below(lines, line) {
    let x1 = points[line[0]].x;
    let y1 = points[line[0]].y;
    let x2 = points[line[1]].x;
    let y2 = points[line[1]].y;
    let i = 0;
    while (i < lines.length) {
        if (points[lines[i][0]].x === x1 && points[lines[i][1]].x === x2 && points[lines[i][0]].y === y1 && points[lines[i][1]].y === y2)
            break;
        i++;
    }
    if (i === lines.length - 1)
        return false;
    else
        return lines[++i];
}
function segmentsIntr(p1, p2, p3, p4) {
    if (p1 === p3 || p1 === p4 || p2 === p3 || p2 === p4)
        return false;
    let d1 = directed(p3, p4, p1);
    let d2 = directed(p3, p4, p2);
    let d3 = directed(p1, p2, p3);
    let d4 = directed(p1, p2, p4);
    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || d3 < 0 && d4 > 0))
        return true;
    else if (d1 === 0 && onSegment(p3, p4, p1))
        return true;
    else if (d2 === 0 && onSegment(p3, p4, p2))
        return true;
    else if (d3 === 0 && onSegment(p1, p2, p3))
        return true;
    else if (d4 === 0 && onSegment(p1, p2, p4))
        return true;
    else
        return false;
}
function directed(p1, p2, p3) {
    return (points[p3].x - points[p1].x) * (points[p2].y - points[p1].y) - (points[p2].x - points[p1].x) * (points[p3].y - points[p1].y);
}
function onSegment(p1, p2, p3) {
    if (Math.min(points[p1].x, points[p2].x) <= points[p3].x && points[p3].x <= Math.max(points[p1].x, points[p2].x)
        && Math.min(points[p1].y, points[p2].y) <= points[p3].y && points[p3].y <= Math.max(points[p1].y, points[p2].y))
        return true;
    else
        return false;
}
function deleteSegment(lines, line) {
    let x1 = points[line[0]].x;
    let y1 = points[line[0]].y;
    let x2 = points[line[1]].x;
    let y2 = points[line[1]].y;
    let i = 0;
    while (i < lines.length) {
        if (points[lines[i][0]].x === x1 && points[lines[i][1]].x === x2 && points[lines[i][0]].y === y1 && points[lines[i][1]].y === y2)
            break;
        i++;
    }
    lines.splice(i, 1);
}
function eliminateCross(arr, a, b) {
    //每个线段取一个点，若线段中间包含且仅包含另外两个点中的一个则换一种取法，翻转没有包含另外两个点的片段
    let p1 = arr.indexOf(a[0]);
    let p2 = arr.indexOf(a[1]);
    let p3 = arr.indexOf(b[0]);
    let p4 = arr.indexOf(b[1]);
    let new_arr = arr.slice(0);
    let temp;
    let x, y;
    if ((Math.min(p1, p3) < p2 && p2 < Math.max(p1, p3) && (p4 < Math.min(p1, p3) || p4 > Math.max(p1, p3))) ||
        (Math.min(p1, p3) < p4 && p4 < Math.max(p1, p3) && (p2 < Math.min(p1, p3) || p2 > Math.max(p1, p3)))) {
        //则取p1 p4
        if (Math.min(p1, p4) < p2 && p2 < Math.max(p1, p4)) {
            //则翻转p2 p3（包含p2 p3）
            x = p2 > p3 ? p3 : p2;
            y = p2 > p3 ? p2 : p3;
        }
        else {
            //翻转p1 p4(包含p1 p4)
            x = p1 > p4 ? p4 : p1;
            y = p1 > p4 ? p1 : p4;
        }
    }
    else {
        //则取p1 p3
        if (Math.min(p1, p3) < p2 && p2 < Math.max(p1, p3)) {
            //则翻转 p2 p4
            x = p2 > p4 ? p4 : p2;
            y = p2 > p4 ? p2 : p4;
        }
        else {
            //翻转p1 p3
            x = p1 > p3 ? p3 : p1;
            y = p1 > p3 ? p1 : p3;
        }
    }
    let mid = x + (y - x) / 2;
    for (let i = x; i <= mid; i++ , y--) {
        temp = new_arr[i];
        new_arr[i] = new_arr[y];
        new_arr[y] = temp;
    }
    let inde = new_arr.indexOf(0);
    arr.length = 0;
    while (arr.length < new_arr.length) {
        arr.unshift(new_arr[++inde % new_arr.length]);
    }
}

function drawChart(length, key) {
    let data1 = [];
    for (let i = 0; i < length; i++) {
        if (comp_object[i].sum === comp_object[key].sum && comp_object[i].balance === comp_object[key].balance)
            data1.push({ value: [comp_object[i].sum, comp_object[i].balance, 0.1], itemStyle: { normal: { color: "red" } }, individual: individuals[i] });
        else
            data1.push({ value: [comp_object[i].sum, comp_object[i].balance, 0.1], itemStyle: { normal: { color: "yellow" } }, individual: individuals[i] });
    }
    for (let j = length; j < POPULATION_SIZE; j++)
        data1.push({ value: [comp_object[j].sum, comp_object[j].balance, 0.1], itemStyle: { normal: { color: "black" } }, individual: individuals[j] });
    // 指定图表的配置项和数据
    let option = {
        tooltip: {
            trigger: 'item',
            formatter(params) {
                return `totalCost: ${params.data.value[0]}, balance: ${params.data.value[1]}`;
            }
        },
        dataZoom: [
            {
                id: 'dataZoomX',
                type: 'slider',
                xAxisIndex: [0],
                filterMode: 'filter'
            },
            {
                id: 'dataZoomY',
                type: 'slider',
                yAxisIndex: [0],
                filterMode: 'empty'
            }
        ],
        xAxis: {
            type: 'value'
        },
        yAxis: {
            type: 'value'
        },
        series: [
            {
                /*name: '总路程和平衡度',*/
                type: 'scatter',
                data: data1
            }
        ]
    };
    // 使用刚指定的配置项和数据显示图表。
    myChart1.setOption(option);
}//散点图显示
function downLoad() {
    bugout.logFilename = points.length + "点" + (MAX_CAR + 1) + "车" + paretonum + "个非支配前沿";
    bugout.downloadLog();
}//下载日志文件
document.getElementById("RandomAdd").addEventListener("click", addPoints);//为添加按钮绑定事件
document.getElementById("Eliminate").addEventListener("click", clearCanvas);//为清空按钮绑定事件
document.getElementById("Start").addEventListener("click", startIteration);//为开始按钮绑定事件
document.getElementById("drawCanvas").addEventListener("click", addCenter);//为画布绑定事件产生中间点
document.getElementById("drawCanvas").addEventListener("mousemove", getCoordinates);//鼠标移入画布事件
document.getElementById("drawCanvas").addEventListener("mouseout", clearCoordinates);//鼠标移出画布事件
document.getElementById("Stop").addEventListener("click", stopIteration);//停止按钮事件
document.getElementById("Stop").addEventListener("dblclick", startAgain);//停止按钮事件
document.getElementById("GetOutput").addEventListener("click", downLoad);//下载输出日志
document.getElementById("draw").addEventListener("click", showPoint);//解析文件并显示在画布上

function loacalSearchPopulation() {
    for (let i = 0; i < individuals.length; i++) {
        let temp = individuals[i].slice(0);
        localSearch(temp);
        temp = delIndividual(temp);
        if (dominate(getCompareObject(temp), getCompareObject(individuals[i]))) {
            individuals[i] = temp.slice(0);
        }
    }
}

function localSearch(arr) {
    let temp_old = arr.slice(0);
    let salsarr = arr[arr.length - 1].slice(0);
    let salesmans;
    salesmans = salsarr.map((num, index) => {
        if (index == 0) {
            return arr.slice(1, num + 1);
        } else {
            return arr.slice(salsarr[index - 1] + 1, num + 1);
        }
    })
    salesmans.push(arr.slice(salsarr[salsarr.length - 1] + 1, -1));//将剩下的最后一组添加到salesmans中
    let newarr = [];
    newarr = salesmans.map((arr) => {
        let temp = arr.slice(0);
        let len = temp.length;
        let ret = [0];
        for (let i = 0; i < len; i++) {
            if (temp.length > 1) {
                temp.sort((a, b) => {
                    return distanceOfTwoPoint(points[ret[ret.length - 1]], points[a]) - distanceOfTwoPoint(points[ret[ret.length - 1]], points[b]);
                })
            }
            ret.push(temp[0]);
            temp.shift();
        }
        ret.shift();
        return ret;
    });
    arr.length = 0;
    salsarr = [];
    newarr.map((temp, index) => {
        arr.push(...temp);
        if (index == 0) {
            salsarr.push(temp.length);
        } else if (index != newarr.length - 1) {
            salsarr.push(salsarr[salsarr.length - 1] + temp.length);
        }
    });
    arr.unshift(0);
    arr.push(salsarr);
}//组内变异 取最短距离的变异

myChart1.on('click', function (params) {
    let individual = params.data.individual;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);//清除画板
    redraw();
    drawLine(individual);
    console.log(params.data)
});

function circleSearch(new_children, len) {
    let arr = combine(len, 2);// 取所有可能的组合
    for (let i = 0; i < arr.length; i++) {
        let rand1, rand2;
        rand1 = arr[i][0] - 1;
        rand2 = arr[i][1] - 1;
        let ar1 = new_children[rand1].slice(0);
        let ar2 = new_children[rand2].slice(0);
        let select_arr = [];
        for (let i = 0; i < points.length - 1; i++) {
            select_arr[i] = i;
        }
        let flag = 0;
        do {
            let index = randomNumber(select_arr.length);
            let count = select_arr[index];
            select_arr.splice(index, 1);
            doCrossoverNewX(ar1, ar2, count);
            if (select_arr.length == 0) {
                break;
            }
            if (new_children.length >= 3 && !beenDominate([new_children[rand1]], ar1)) {
                flag = 3;
                break;
            }
            if (new_children.length >= 3 && !beenDominate([new_children[rand2]], ar2)) {
                flag = 4;
                break;
            }
            if (!beenDominate([new_children[rand1]], ar1)) {
                flag = 1;
                break;
            }
            if (!beenDominate([new_children[rand2]], ar2)) {
                flag = 2;
                break;
            }
            // console.log("循环变异")
            // let temp_ind = ar1.slice(0);
            // while (judgeIndividual(temp_ind, ar1)) {
            //     if (Math.random() < 0.5) {
            //         mutation1(temp_ind);
            //     } else {
            //         mutation2(temp_ind);
            //     }
            //     temp_ind = delIndividual(temp_ind);
            // }
            // ar1 = temp_ind.slice(0);
            // if(new_children.length>=10 && !beenDominate(new_children, ar1)){
            //     flag = 1;
            //     break;
            // }
        } while (true);
        if (flag == 1 || flag == 3) {
            new_children.push(ar1.slice(0));
            flag = 0;
        }
        if (flag == 2 || flag == 4) {
            new_children.push(ar2.slice(0));
            flag = 0;
        }
        // if(Math.random()<0.01 && !judgeContain(new_children, ar1)){
        //     new_children.push(ar1.slice(0));
        // }
        // if(Math.random()<0.01 && !judgeContain(new_children, ar2)){
        //     new_children.push(ar2.slice(0));
        // }
        if (new_children.length >= POPULATION_SIZE)
            return;
    }
}

// 从1到n之间，任意取k个数的组合
var combine = function (n, k) {
    const res = [];

    (function step(start = 1, confirm = []) {
        if (confirm.length === k) {
            res.push([...confirm]);
            return;
        }

        for (let i = start; i <= n; i++) {
            confirm.push(i);
            step(i + 1, confirm);
            confirm.pop();
        }
    })();
    return res;
};
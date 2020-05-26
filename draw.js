var c = document.getElementById("drawCanvas");
var HEIGHT = c.height;//画布的高
var WIDTH = c.width;//画布的宽
var ctx = c.getContext("2d");
ctx.translate(0, HEIGHT);
ctx.scale(1, -1);
var color_arr = ["#DC143C", "#050505", "#FFD700", "#006400", "#0000CD", "#A2CD5A", "#696969"];//颜色数组
var points = [];//点的坐标集
var POINT_NUMBER = 0;//站点的个数
var len = 6;

function Point(x, y) {
    this.x = x;
    this.y = y;
}  //产生随机点构造函数

function showPoint() {
    points.length = 0;
    var file = document.getElementById("local_file").files[0];
    var reader = new FileReader();
    var k = 1;
    reader.readAsText(file);
    reader.onload = function () {
        var str = reader.result.split("\n");
        if (str.length - 8 === 150)
            k = 1;
        else if (str.length - 8 === 51 || str.length - 8 === 76)
            k = 10;
        else if (str.length - 8 === 52)
            k = 0.4;
        else if (str.length - 8 === 99)
            k = 3.5;
        for (var i = 6; i < str.length - 2; i++) {
            var coordinate = str[i].split(" ");
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

function drawPoints(t) {
    for (var i = points.length - t; i < points.length; i++)
        drawPoint(points[i]);
}  //画所有点
function drawPoint(point) {
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
}  //画单点

function drawLine() {
    redraw();
    var individual = document.getElementById("individual").value.split(",").map(val=>Number(val));
    var temp_arr = [];
    for(let i=0; i<len; i++){
        temp_arr.push(individual.pop());
    }
    individual.push(temp_arr);
    console.log(getCompareObject(individual))
    var j = 0;
    ctx.lineWidth = 1;
    ctx.beginPath();
    var temp_arr = partitionIndividual(individual);
    ctx.moveTo(points[temp_arr[0]].x, points[temp_arr[0]].y);
    for (var i = 1; i < temp_arr.length; i++) {
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

function partitionIndividual(individual) {
    var temp_arr = [];
    for (var i = 0; i < individual.length - 1; i++) {
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

function renewTextShow() {
    document.getElementById("textShow").innerHTML = "Here are " + POINT_NUMBER + " points";
} //显示已存在的点的个数

function redraw() {  //重新画点
    ctx.clearRect(0, 0, WIDTH, HEIGHT);//清除画板
    for (var i = 1; i < points.length; i++) {
        drawPoint(points[i]);
    }
    ctx.fillStyle = "#f71001";
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
}  //重新画点

document.getElementById("draw").addEventListener("click", drawLine);//解析文件并显示在画布上

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
} 

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

function compareObject(sum, balance, car, cross_point) {
    this.sum = sum;
    this.balance = balance;
    this.car = car;
    this.cross_point = cross_point;
} // 三个适应值的构造函数
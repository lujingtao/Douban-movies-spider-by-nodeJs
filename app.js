var cheerio = require('cheerio');
var http = require('https');
const opn = require('opn'); //打开浏览器模块

var express             = require('express');
var app                 = express();
var bodyParse           = require('body-parser')
app.use(bodyParse.urlencoded({extended:false})) ;



// 监听3000端口
var server=app.listen(3000) ;
opn('http://127.0.0.1:3000');


/* 筛选配置：筛选最低8分，且评分人数不低于10000人的电影 */
var year=2018;    //年份
var minRange = 9;   //最低分
var maxRange = 10;   //最高分
var peoples = 10000; //最低评分人数

//全局变量
var pageSize = 20;
var curPage = 0;
var moviesJson =[];
var moviesCount =0;
var resultMoviesJson=[];
var res0;

// 处理根目录的get请求
app.get('/',function(req,res){
    res.sendfile('main.html') ;
    console.log('服务器等待请求中...\n');
}) ;

// 处理/login请求
app.post('/action',function(req,res){
    //获取登录名称和密码
    year=parseInt(req.body.year);
    minRange=parseInt(req.body.minRange);
    maxRange=parseInt(req.body.maxRange);
    peoples= parseInt(req.body.peoples);
    curPage = 0;
    moviesJson =[];
    moviesCount =0;
    resultMoviesJson=[];

    res0 = res;
    //程序开始
    getMovies();
});


//获取符合评分的所有电影
function getMovies(){
    var start = pageSize*curPage;
    var url = 'https://movie.douban.com/j/new_search_subjects?sort=S&range='+minRange+','+maxRange+'&tags=%E7%94%B5%E5%BD%B1&start='+start+'&year_range='+year+','+year+'';
    
    console.log("正在获取前"+(curPage+1)+"页数据...");
    http.get(url, function(sres) {
        var chunks = [];
        sres.on('data', function(chunk) {
            chunks.push(chunk); // chunks里面存储着网页的 Buffer 内容
        });
        //获取结束
        sres.on('end', function() {
            var data = Buffer.concat(chunks);
            var dataString = data.toString();
            var dataJson = JSON.parse(dataString);
            console.log("第"+(curPage+1)+"页共"+dataJson.data.length +"条数据\n");

            //如果有数据则继续获取下一页
            if( dataJson.data.length>0 ){
                moviesCount = moviesCount+dataJson.data.length;
                dataJson.data.forEach(e => {
                    moviesJson.push(e)
                });
                //继续获取下一页
                setTimeout(function(){
                    curPage++;
                    getMovies();
                },3000*(curPage));
            }else{
                console.log("共"+moviesCount+"条数据\n");
                console.log("进入各个电影页获取评分人数再进行筛选...\n");

                for (let i = 1; i <= moviesJson.length; i++) {
                    setTimeout(function(){
                        filterMovies(moviesJson[i-1],i);
                    },500*i);
                }
            }

        });
    });
}

//根据评分人数筛选电影
function filterMovies(e,i){
    http.get(e.url, function(sres) {
        var chunks = [];
        sres.on('data', function(chunk) {
            chunks.push(chunk); // chunks里面存储着网页的 Buffer 内容
        });
        //获取结束
        sres.on('end', function() {
            var data = Buffer.concat(chunks);
            var dataString = data.toString();
            var $ = cheerio.load(dataString); //cheerio模块开始处理 DOM处理
            var peo = $(".rating_people span").text();
            var isOk = "不符合";
            if(peo>peoples){
                e.peoples=peo;
                resultMoviesJson.push(e);
                isOk="符合";
            }
            console.log("（"+i+"/"+moviesCount+"）"+e.title+"：评分"+e.rate+"，人数"+peo+"-->"+isOk);
            if(i>=moviesCount){
                console.log("\n共"+resultMoviesJson.length+"部符合要求\n");
                if(resultMoviesJson.length>0){
                    resultMoviesJson.forEach(e => {
                        console.log(e.title+"：评分"+e.rate+"，人数"+e.peoples);
                    });
                    console.log("--------------------------------------------");
                    //向前台反馈信息
                    res0.status(200).send(
                        resultMoviesJson
                    );
                }
            }
        });
    });
}





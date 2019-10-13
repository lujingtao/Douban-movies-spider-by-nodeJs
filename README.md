@[toc](老板，今年有哪些大众好电影？（nodejs豆瓣电影爬虫）)

# 前言
现在看电影通常都会看豆瓣评分，虽然豆瓣本身有筛选功能，但是缺乏了一个重要元素：**评分人数**。
 
想看好电影，通常是按评分排序，这时候会有好几十个评分9+的电影，但是点击查看发现评分人数寥寥无几，这些就缺乏参考价值了，通常只是少数人的狂欢，意义不大。所以必须综合考虑，加上评分人数，最少上w吧。
 
<font color="red">现在我们用nodejs做爬虫，查找评分8+，评论人数10000+的大众好电影！</font>
 
 # 目标页面分析
先看要爬的页面：[https://movie.douban.com/tag/#/](https://movie.douban.com/tag/#/)
分页是ajax分页的，查看通过chrome的XHR能看到ajax的地址：
https://movie.douban.com/j/new_search_subjects?sort=U&range=0,10&tags=&start=0&year_range=2018,2018
分页是通过start参数控制的，通过分页能获取所有符合范围的数据，但是评分人数是需要进入到具体页面获取的。
 
# 设计思路
1、前台输入参数范围（评分、人数、年份）
2、后台通过nodejs的 http.get() 来获取所有分页的电影，然后进入各个电影页面获取评分人数
3、通过评分人数再筛选电影，把最终符合的电影写到集合里面
4、后台把集合传给前台，前台显示出来
 
 # 效果演示
1、前台查询：
![在这里插入图片描述](https://img-blog.csdnimg.cn/20191011001606624.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2lhbWx1amluZ3Rhbw==,size_16,color_FFFFFF,t_70)

 
2、后台处理过程：
![在这里插入图片描述](https://img-blog.csdnimg.cn/20191011001930927.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2lhbWx1amluZ3Rhbw==,size_16,color_FFFFFF,t_70)
。。。。。。
![在这里插入图片描述](https://img-blog.csdnimg.cn/20191011001950455.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2lhbWx1amluZ3Rhbw==,size_16,color_FFFFFF,t_70)

 
3、前台最终结果：
![在这里插入图片描述](https://img-blog.csdnimg.cn/20191011002127425.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2lhbWx1amluZ3Rhbw==,size_16,color_FFFFFF,t_70)

<font color="red">这就是2018年评分8+，评分人数大于10000人的大众好电影了！</font>

# GitHub 和源码
[-->GitHub地址](https://github.com/lujingtao/Douban-movies-spider-by-nodeJs)

下载后先执行 `npm i` 安装模块，然后执行 `node app.js`

nodejs源码：
```js
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
```
var Page=window.Page||{};
function init(){
    var width=document.body.scrollWidth;
    var height=document.body.scrollHeight;


    Page.Sence.init(width,height);

    var line=Page.Sence.createLine(0,0,100,50);
        line.color="red";
    var line2=Page.Sence.createLine(0,0,100,50);
        line2.color="blue";
    var line3=Page.Sence.createLine(0,0,100,50);
        line3.color="green";

    var line4=Page.Sence.createLine(0,50,100,50);
    line4.color="red";
    var line5=Page.Sence.createLine(0,50,100,50);
    line5.color="blue";
    var line6=Page.Sence.createLine(0,50,100,50);
    line6.color="green";

    var line7=Page.Sence.createLine(0,100,100,50);
        line7.color="red";
    var line8=Page.Sence.createLine(0,100,100,50);
        line8.color="blue";
    var line9=Page.Sence.createLine(0,100,100,50);
        line9.color="green";




    var dir = Page.Sence.createDir(width/2,height/2);
        dir.color="red"
    var dir2 = Page.Sence.createDir(width/2,height/2);
        dir2.color="green"
    var dir3 = Page.Sence.createDir(width/2,height/2);
        dir3.color="blue"

    var ddd=document.getElementById("infoBox");
    $("#infoBox").text("fefe");

    Page.Sence.bindEvent("motion",function(event){

        line.push(event.acceleration.x*2);
        line2.push(event.acceleration.y*2);
        line4.push(event.accelerationIncludingGravity.x*2);
        line5.push(event.accelerationIncludingGravity.y*2);
        line6.push(event.accelerationIncludingGravity.z*2);

        line7.push(event.rotationRate.alpha/2);
        line8.push(event.rotationRate.beta/2);
        line9.push(event.rotationRate.gamma/2);

        //console.log("a");
    });
    Page.Sence.bindEvent("orientation",function(event){
        var a=event.alpha;
        var b=event.beta;
        var g=event.gamma;
        var h=event.webkitCompassHeading;
        if(!event.webkitCompassHeading){
           h=a;
        }


        dir.rotate=360-h;//compassHeading(a,b,g);
        dir2.rotate=b;
        dir3.rotate=g;

    });

    function go(){
        Page.Sence.clearScreen();
        Page.Sence.drawAll();
        requestAnimationFrame(function(){
            go();
        })
    }
    go();
}


(function(){
    var ctx=null;
    var screenWidth=null,
        screenHeight=null;
    var Lines=[];
    var Dirs=[];

    function _bindEvent(action,callback){
        if(window.DeviceMotionEvent&&action=="motion"){
            window.addEventListener("devicemotion",function(event){
                callback?callback(event):"";
            });
        }
        if(window.DeviceOrientationEvent&&action=="orientation"){
            window.addEventListener("deviceorientation",function(){
                callback?callback(event):"";
            });
        }

    }

    function Line(x,y,w,h){
        this.height=h;
        this.x=x;
        this.y=y;
        this.points=[];
        this.color="#000000"
    }
    Line.prototype.drawSelf=function(){
        var length=this.points.length,
            one=this.points.length;
        ctx.strokeStyle=this.color;
        ctx.beginPath();
        while(length--){
            if(length==one){
                ctx.moveTo(length,this.points[length]);
            }
            ctx.lineTo(length,this.points[length]);
        }
        ctx.stroke();
        ctx.closePath();
    }
    Line.prototype.update=function(/*points*/ary){

    }
    Line.prototype.push=function(/*points*/point){
        point=point+this.height/2+this.y;
        if(this.points.length>screenWidth){
            this.points.shift();
        }
        this.points.push(point);
    }

    function Dir(x,y){
        this.x=x;
        this.y=y;
        this.rotate=0;
        this.color="#000";
    }
    Dir.prototype.drawSelf=function(){
        ctx.beginPath();
        ctx.strokeStyle=this.color;
        ctx.save();
        ctx.translate(this.x,this.y);
        ctx.rotate(this.rotate/180*Math.PI);
        ctx.moveTo(0,-50);
        ctx.lineTo(0,50);
        ctx.arc(0,50,5,Math.PI*2,0,false)
        ctx.restore();
        ctx.stroke();
        ctx.closePath();
    }


    Page.Sence={
        init:function(width,height){
            var canvas=document.getElementById("canvasShow");
            screenWidth=width;
            screenHeight=height;
            canvas.width=screenWidth;
            canvas.height=screenHeight;
            ctx=canvas.getContext("2d");
            window.ctx=ctx;
        },
        drawAll:function(){
            var length=Lines.length;
            while(length--){
                Lines[length].drawSelf();
            }
            var length=Dirs.length;
            while(length--){
                Dirs[length].drawSelf();
            }
        },
        clearScreen:function(){
            ctx.clearRect(0,0,screenWidth,screenHeight);
        },
        createLine:function(x,y,w,h){
            var line=new Line(x,y,w,h);
            Lines.push(line);
            return  line;
        },
        createDir:function(x,y,w,h){
            var dir=new Dir(x,y,w,h);
            Dirs.push(dir);
            return dir;
        },
        bindEvent:_bindEvent,
    }
})();
function compassHeading(alpha, beta, gamma) {

    // Convert degrees to radians
    var alphaRad = alpha * (Math.PI / 180);
    var betaRad = beta * (Math.PI / 180);
    var gammaRad = gamma * (Math.PI / 180);

    // Calculate equation components
    var cA = Math.cos(alphaRad);
    var sA = Math.sin(alphaRad);
    var cB = Math.cos(betaRad);
    var sB = Math.sin(betaRad);
    var cG = Math.cos(gammaRad);
    var sG = Math.sin(gammaRad);

    // Calculate A, B, C rotation components
    var rA = - cA * sG - sA * sB * cG;
    var rB = - sA * sG + cA * sB * cG;
    var rC = - cB * cG;

    // Calculate compass heading
    var compassHeading = Math.atan(rA / rB);

    // Convert from half unit circle to whole unit circle
    if(rB < 0) {
        compassHeading += Math.PI;
    }else if(rA < 0) {
        compassHeading += 2 * Math.PI;
    }

    // Convert radians to degrees
    compassHeading *= 180 / Math.PI;

    return compassHeading;

}






/*
//motion
{
    acceleration:{//ios
        x:12,
        y:12,
        c:12
    },
    accelerationIncludingGravity:{
         x:12,
         y:12,
         c:12
    },
    rotationRate:{
        alpha:12,
        beta:12,
        gamma:12
    }
    interval:0.020230
}
// orientation
    {
        alpha:232.1323,
        beta:23234,
        gamma:-13.123123123123,
        webkitCompassHeading:103.343434,// only ios
        webkitCompassAccuracy:25, //only ios
    }


Android:



* */
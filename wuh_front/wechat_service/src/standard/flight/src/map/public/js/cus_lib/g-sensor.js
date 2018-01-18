//基于G-Sensor的计步算法
(function () {
    var oriValues = []; //存放三轴数据
    var valueNum = 4;
    var tempValue = []; //用于存放计算阈值的波峰波谷差值  
    var tempCount = 0;    
    var isDirectionUp = false; //是否上升的标志位 
    var continueUpCount = 0;   //持续上升次数 
    var continueUpFormerCount = 0;  //上一点的持续上升的次数，为了记录波峰的上升次数  
    var lastStatus = false;    //上一点的状态，上升还是下降  

    var peakOfWave = 0;      //波峰值  
    var valleyOfWave = 0;  //波谷值  
    //此次波峰的时间  
    var timeOfThisPeak = 0;  
    //上次波峰的时间  
    var timeOfLastPeak = 0;  
    //当前的时间  
    var timeOfNow = 0;  
    //当前传感器的值  
    var gravityNew = 0;  
    //上次传感器的值  
    var gravityOld = 0;  
    //动态阈值需要动态的数据，这个值用于这些动态数据的阈值  
    var initialValue = 1.3;  
    //初始阈值  
    var ThreadValue = 2.0;

    //步数
    var stepValue = 0;
    //上一次取的步值
    var lastStepValue = 0;
    //步数差值
    var diffStepValue = 0;

    //开始计步
    window.addEventListener("devicemotion", countStep, false);
    var _callback = null;

    //计步响应
    function countStep(eventData) {
        oriValues.splice(0, oriValues.length);
        var accelerationGravity = eventData.accelerationIncludingGravity;
        oriValues.push(accelerationGravity.x);
        oriValues.push(accelerationGravity.y);
        oriValues.push(accelerationGravity.z);

        gravityNew = Math.sqrt(oriValues[0] * oriValues[0]
                + oriValues[1] * oriValues[1] + oriValues[2] * oriValues[2]);
        DetectorNewStep(gravityNew);

        var stepDom = document.getElementById("step");
        stepDom ? stepDom.innerHTML = gSensor.getStep() : "";
        //回调
        _callback ? _callback(stepValue) : "";
    }

    /* 
    * 检测步子，并开始计步 
    * 1.传入sersor中的数据 
    * 2.如果检测到了波峰，并且符合时间差以及阈值的条件，则判定为1步 
    * 3.符合时间差条件，波峰波谷差值大于initialValue，则将该差值纳入阈值的计算中 
    * */  
    function DetectorNewStep(values) {
        if (gravityOld == 0) {
            gravityOld = values;
        } else {
            if (DetectorPeak(values, gravityOld)) {
                timeOfLastPeak = timeOfThisPeak;
                timeOfNow = new Date().getTime();
                if (timeOfNow - timeOfLastPeak >= 250
                        && (peakOfWave - valleyOfWave >= ThreadValue)) {
                    timeOfThisPeak = timeOfNow;
                    /* 
                     * 更新界面的处理，不涉及到算法 
                     * 一般在通知更新界面之前，增加下面处理，为了处理无效运动： 
                     * 1.连续记录10才开始计步 
                     * 2.例如记录的9步用户停住超过3秒，则前面的记录失效，下次从头开始 
                     * 3.连续记录了9步用户还在运动，之前的数据才有效 
                     * */
                    //mStepListeners.onStep();
                    stepValue++;
                    diffStepValue = stepValue - lastStepValue;
                }
                if (timeOfNow - timeOfLastPeak >= 250
                        && (peakOfWave - valleyOfWave >= initialValue)) {
                    timeOfThisPeak = timeOfNow;
                    ThreadValue = Peak_Valley_Thread(peakOfWave - valleyOfWave);
                }
            }
        }
        gravityOld = values;
    }

    /* 
    * 检测波峰 
    * 以下四个条件判断为波峰： 
    * 1.目前点为下降的趋势：isDirectionUp为false 
    * 2.之前的点为上升的趋势：lastStatus为true 
    * 3.到波峰为止，持续上升大于等于2次 
    * 4.波峰值大于20 
    * 记录波谷值 
    * 1.观察波形图，可以发现在出现步子的地方，波谷的下一个就是波峰，有比较明显的特征以及差值 
    * 2.所以要记录每次的波谷值，为了和下次的波峰做对比 
    * */  
    function DetectorPeak(newValue, oldValue) {
        lastStatus = isDirectionUp;
        if (newValue >= oldValue) {
            isDirectionUp = true;
            continueUpCount++;
        } else {
            continueUpFormerCount = continueUpCount;
            continueUpCount = 0;
            isDirectionUp = false;
        }

        if (!isDirectionUp && lastStatus
                && (continueUpFormerCount >= 2 || oldValue >= 20)) {
            peakOfWave = oldValue;
            return true;
        } else if (!lastStatus && isDirectionUp) {
            valleyOfWave = oldValue;
            return false;
        } else {
            return false;
        }
    }

    /* 
   * 阈值的计算 
   * 1.通过波峰波谷的差值计算阈值 
   * 2.记录4个值，存入tempValue[]数组中 
   * 3.在将数组传入函数averageValue中计算阈值 
   * */  
    function Peak_Valley_Thread(value) {
        var tempThread = ThreadValue;
        if (tempCount < valueNum) {
            tempValue[tempCount] = value;
            tempCount++;
        } else {
            tempThread = averageValue(tempValue, valueNum);
            for (var i = 1; i < valueNum; i++) {
                tempValue[i - 1] = tempValue[i];
            }
            tempValue[valueNum - 1] = value;
        }
        return tempThread;
    }

    /* 
   * 梯度化阈值 
   * 1.计算数组的均值 
   * 2.通过均值将阈值梯度化在一个范围里 
   * */  
    function averageValue(value, n) {
        var ave = 0;
        for (var i = 0; i < n; i++) {
            ave += value[i];
        }
        ave = ave / valueNum;
        if (ave >= 8)
            ave = 4.3;
        else if (ave >= 7 && ave < 8)
            ave = 3.3;
        else if (ave >= 4 && ave < 7)
            ave = 2.3;
        else if (ave >= 3 && ave < 4)
            ave = 2.0;
        else {
            ave = 1.3;
        }
        return ave;
    }

    window.gSensor = {
        setCallback: function (callback) {
            _callback = callback;
        },
        getDiffStep: function () {
            diffStepValue = stepValue - lastStepValue;
            lastStepValue = stepValue;
            return diffStepValue;
        },

        getStep: function () {
            return stepValue;
        }
    }
})()
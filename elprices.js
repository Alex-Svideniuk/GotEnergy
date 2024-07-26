var hourlyChart = null;
var dailyChart = null;
var monthlyChart = null; 

$(document).ready(function() {
    $("#lblDate").val(new Date());
    //$("#W").text($(window).width()) 
    //$("#H").text($(window).height())
    //$("#M").text(navigator.userAgentData.mobile)
    $("#hourlyChart").ondblclick = function(click2){
        print("Double click")
    }
    
    hourlyChartInit();
    dailyChartInit();
    monthlyChartInit();
    getPrices(+1);
});

// ==========================================================================================
function hourlyChartInit(){
    var hData = {
        datasets: [{
            stepped: true,
            fill: true,
            parsing: {yAxisKey: 'value'},
            backgroundColor: "rgba(0,0,255,0.1)",
            borderColor: "rgba(0,0,255,0.5)",
            segment: {
                backgroundColor: function(ctx) {
                    if (checkMinPrice(ctx.p0.parsed.y, ctx.chart.min)) 
                        return "rgba(0,204,0,0.1)"
                    return "rgba(0,0,255,0.1)"
                },
                borderColor: function(ctx) {
                    if (checkMinPrice(ctx.p0.parsed.y, ctx.chart.min)) 
                        return "rgba(0,204,0,0.5)"
                    return "rgba(0,0,255,0.5)"
                },
              }
        }]
    };

    var hOpt= {
        zoomed: false,
        parsing: {xAxisKey: 'dt'},
        scales: {
            y: {ticks: {font:fontSize}, 
                grid:{
                    color: function(ctx) {
                        let v = ctx.tick.value;
                        let y = ctx.chart.scales.y;
                        if (v % 100 == 0 && v != y.max  && v != y.min)
                            return "rgba(0,0,0,0.5)";
                        if (ctx.tick.label)
                            return "rgba(0,0,0,0.2)";
                    },
                    lineWidth: function(ctx) {
                        let v = ctx.tick.value;
                        let y = ctx.chart.scales.y;
                        if (v % 100 == 0 && v != y.max  && v != y.min)
                            return 3;
                        return 1;
                    },
                }
            },
            x: {type:'timeseries',
                time:{
                    unit:'hour',
                    tooltipFormat: "DD MMM YY HH:mm",
                }, 
                grid: {
                    drawTicks:false,
                    color: function(ctx) {
                        if (ctx.type != "tick")
                            return ;
                        //print(ctx.tick.label)
                        if (ctx.tick.label.length > 5)
                            return "rgba(0,0,0,0.2)";
                        if (ctx.tick.label)
                            return "rgba(0,0,0,0.2)";
                        return "rgba(0,0,0,0.2)";
                    },
                    lineWidth: function(ctx) {
                        if (ctx.type != "tick")
                            return;
                        dt = new Date(ctx.tick.value)
                        var i = ctx.index;
                        if (ctx.tick.label.length > 5 && i !=0 && i != ctx.chart.scales.x.max)
                            return 3;
                        if (ctx.tick.label)
                            return 1;
                        return 0;
                    }
                },
                ticks: {
                    autoSkip:false,
                    font:fontSize,
                    callback: function(value, index, ticks) {
                        let hour = this.getLabelForValue(value);
                        dt = new Date(hour)
                        if (dt.getHours() == 0)
                            return strDate(dt,"DD MMM");
                        if (dt.getHours() % 2 == 1)
                            return "" ;
                        return strDate(dt,"HH:mm");
                    }
                }
            }
        },
        plugins: {
            legend: false,
            /*animation:{
                annotations:{
                    nowLine:{
                        type: 'line',
                        scaleID: "x",
                        borderColor: 'rgba(255, 100, 0, 0.4)',
                        borderWidth: 8,
                        value: new Date(),
                        label:{
                            rotation:90,
                            enabled:true,
                            position:"start",
                            content: "NOW",
                        }
                    },
                    thisHour: {
                        type: 'box',
                        //scaleID: "x",
                        borderColor: 'rgba(0, 0, 0, 0.2)',
                        backgroundColor:'rgba(0, 0, 0, 0.2)',
                        borderWidth: 1,
                        xMin: new Date().setMinutes(0, 0, 0),
                        xMax: new Date().setMinutes(60,0,0),
                        yMin: function(ctx) {
                            return ctx.chart.scales.y.min;
                        },
                        yMax: function(ctx) {
                            return ctx.chart.scales.y.max;
                        },
                    }
                }
            }*/
        },
        events: ['click', 'touchstart', 'touchmove', 'touchend'],
        onClick: (e) => {
            if (e.native.detail == 2) {
                hourlyChart.options.zoomed = ! hourlyChart.options.zoomed;
                setScale(hourlyChart);
                hourlyChart.update();
            }
        }
    }
    plugin = [{
        id: 'myEvetCatcher',
        beforeEvent(chart, args, pluginOptions) {
            let e = args.event.native;

            if (e.type == 'touchstart'){
                pluginOptions.startX = args.event.x;
                pluginOptions.startY = args.event.y;
            }
            else if (e.type == 'touchmove'){
                pluginOptions.endX = args.event.x;
                pluginOptions.endY = args.event.y;
            }
            else if (e.type == 'touchend'){
                let deltaX = pluginOptions.startX - pluginOptions.endX;
                let deltaY = pluginOptions.startY - pluginOptions.endY;
                if (deltaX < -300){
                    $('#log').text($('#log').text()+"right "+deltaX+'\r\n')
                    getPrices(-1);
                }
                if (deltaX > 300){
                    $('#log').text($('#log').text()+"left "+deltaX+'\r\n')
                    getPrices(+1);
                }
                if (deltaY < -300){
                    $('#log').text($('#log').text()+"down "+deltaY+'\r\n')
                }
                if (deltaY > 300){
                    $('#log').text($('#log').text()+"up "+deltaY+'\r\n')
                    hourlyChart.options.zoomed = ! hourlyChart.options.zoomed;
                    setScale(hourlyChart);
                    hourlyChart.update();
                }
            }
            else if (e.type == 'mousemove'){
            }
            else {
                //$('#log').text($('#log').text()+args.event.native.type+" x="+args.event.x.toString() + " y="+args.event.y.toString()+'\r\n')
                //print(args.event.native.type)
            }

        },
        defaults:{
            start: null,
            end: null,
        }
      }]

      hourlyChart = new Chart("hourlyChart", {type: "line", data:hData, options: hOpt, plugins:plugin});
}

// ==========================================================================================
function dailyChartInit() {
    // prepare Daily chart
    var dData = {
        datasets: [{
            label:"Min",
            parsing: {yAxisKey: 'min'},
            borderColor: "rgba(0,153,0,0.5)",
            backgroundColor:"rgba(224,224,224,0.5)",
            fill:+1
        },{
            label:"Max",
            parsing: {yAxisKey: 'max'},
            borderColor: "rgba(204,0,0,0.5)",
            backgroundColor: "rgba(204,0,255,0.5)",
            fill:2
        }]
    };

    var dOpt = {
        animation : false,
        parsing: {xAxisKey: 'date'},
        scales: {
            y: {grid: {
                    lineWidth: function(ctx) {
                        var v = ctx.tick.value;
                        if (v == 0)
                            return 5;
                        if (ctx.tick.label)
                            return 3;
                        return 1;
                    }
                },
                ticks:{
                    font:fontSize,
                    autoSkip:false,
                    stepSize : 10,
                    callback: function(value, index, ticks) {
                        var label = +this.getLabelForValue(value);
                        if (label % 50 == 0 || label == this.min || label == this.max)
                            return label;
                        return "";
                    }
                }
            },
            x:{ grid:{
                    drawTicks:false,
                    color: function(ctx) {
                        if (ctx.type != "tick")
                            return ;
                        if (ctx.tick.label.length > 2)
                            return "rgba(0,0,0,0.4)";
                        return "rgba(0,0,0,0.2)";
                    },
                    lineWidth: function(ctx) {
                        //print(this.dailyChart);
                        if (ctx.type != "tick")
                            return;
                        var i = ctx.index;
                        if (ctx.tick.label.length > 2 /*&& i != ctx.chart.scales.x.max*/)
                            return 5;
                        if (ctx.tick.label)
                            return 1;
                        return 0;
                    }
                },
                ticks: {
                    autoSkip:false,
                    font:fontSize,
                    callback: function(value, index, ticks) {
                        var label = this.getLabelForValue(value);
                        dt = new Date(label);
                        //print(dt)
                        //hour = +label.substr(11,2);
                        if (dt.getDate() == 1)
                            return moment(dt).format("MMM'YY");
                        return moment(dt).format('DD');
                    }
                }
            }
        },
        plugins: {
            legend: false,
        },
        onClick: (e) => {
            const canvasPosition = Chart.helpers.getRelativePosition(e, dailyChart);

            // Substitute the appropriate scale IDs
            const dataX = dailyChart.scales.x.getValueForPixel(canvasPosition.x);
            const dataY = dailyChart.scales.y.getValueForPixel(canvasPosition.y);
            selectedDate = new Date(dailyChart.scales.x.getLabelForValue(dataX));
            //print(selectedDate);
            getPrices(0, selectedDate);
        }
    }
    
    dailyChart = new Chart("dailyChart", {type: "line", data:dData,  options: dOpt});
    //$("#dailyChart").hide()
}

// ==========================================================================================
function monthlyChartInit() {
    var mData = {
        datasets: [{
            label:"Min",
            parsing: {yAxisKey: 'min'},
            borderColor: "rgba(0,153,0,0.5)",
            backgroundColor: "rgba(0,153,0,0.2)",
            cubicInterpolationMode: 'monotone',
            fill:+1
        },{
            label:"Average",
            parsing: {yAxisKey: 'avg'},
            borderColor: "rgba(0,0,204,0.5)",
            cubicInterpolationMode: 'monotone',
            fill:2
        },{
            label:"Max",
            parsing: {yAxisKey: 'max'},
            borderColor: "rgba(204,0,0,0.5)",
            backgroundColor: "rgba(204,0,0,0.2)",
            cubicInterpolationMode: 'monotone',
            fill:'-1'
        }]
    };

    var mOpt = {
        parsing: {xAxisKey: 'month'},
        scales: {
            y:{ ticks:{
                    font:fontSize,
                    autoSkip:false,
                }
            },
            x:{ grid:{
                    drawTicks:false,
                    color: function(ctx) {
                        if (ctx.type != "tick")
                            return ;
                        if (ctx.tick.label.slice(0,3) == 'Jan' )
                            return "rgba(0,0,0,0.4)";
                        return "rgba(0,0,0,0.2)";
                    },
                    lineWidth: function(ctx) {
                        //print(this.dailyChart);
                        if (ctx.type != "tick")
                            return;
                        var i = ctx.index;
                        if (i !=0 && ctx.tick.label.slice(0,3) == 'Jan' )
                            return 5;
                        return 1;
                    }
                },
                ticks: {
                    autoSkip:false,
                    font:fontSize,
                    callback: function(value, index, ticks) {
                        var label = this.getLabelForValue(value);
                        dt = new Date(label);
                        return moment(dt).format("MMM'YY");
                    }
                }
            }
        },
        plugins: {
            legend: false,
        }
    }
    
    monthlyChart = new Chart("monthlyChart", {type: "line", data:mData, options: mOpt});
}

// ==========================================================================================
function getPrices(delta=0, day=null){
    let tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate()+1);
    tomorrow = strDate(tomorrow);

    zone = $("#zoner").val();
    params = {"zone":zone};
    if (day == null) {
        day = $("#lblDate").val()
        if (delta == 1 && strDate(day) == tomorrow)
            return
        day.setDate(day.getDate()+delta);
    }
    day = strDate(day);
    if (day == tomorrow) {
        $("#next").removeClass('btn-primary');
        $("#next").addClass('btn-outline-primary disabled');
    }
    else {
        params["date"] =  day;
        $("#next").removeClass('disabled btn-outline-primary');
        $("#next").addClass('btn-primary');
    } 

    print("Requesting hourly prices for zone "+zone +" & date " + day)
    $.getJSON("/api/elprice",params, showHourlyPrices)
}

// ==========================================================================================
function showHourlyPrices (values, status){
    values.map(function(o){o.dt = new Date(o.date+" "+o.hour+":00:00");/*o.label = strDate(o.dt,"YY-MM-DD HH:mm");*/ return o})
    $("#lblDate").val(values[values.length-2].dt);
    $("#lblDate").text(strDate(values[values.length-2].dt, 'MMMM Do, YYYY'));
    //print( values);


    // calculate Minimum value
    let min = Math.min(...values.map(o => o.value));
    hourlyChart.min = min;
    $("#lblMinP").text(min);
    minT = values.find(v => v.value == min).dt
    $("#lblMinT").text(hourRange(minT));

    // calculate Maximum value
    let max = Math.max(...values.map(o => o.value));
    //hourlyChart.max = max;
    $("#lblMaxP").text(max);
    $("#lblMaxT").text(hourRange(values.find(v => v.value == max).dt));

    // calcualte chart scales
    let yMax = (Math.floor(max*1.02 / 50)+1)*50;
    yMax = yMax < 100 ? 100 : yMax;
    // check if last number will be under zone select then apply ratio
    ratio = (Math.max(...values.slice(-6).map(o => o.value))) / yMax
    if (ratio > 0.8){
        yMax = (Math.floor((yMax * (ratio + 0.20)) / 25)+1)*25;
    }
    let yMin = 0
    if (min < 0) {
        yMin = (Math.floor(min / 10))*10;
    }
    // set scales for zooming in and out
    hourlyChart.yMax = yMax;
    hourlyChart.yMin = yMin;
    hourlyChart.yZoomMin = (Math.floor(min / 5))*5;
    let yZoomMax = (Math.floor(max*1.02 / 5)+1)*5;
    ratio = (Math.max(...values.slice(-6).map(o => o.value))) / yZoomMax
    if (ratio > 0.8){
        yZoomMax = (Math.floor(max * (ratio + 0.25) / 5)+1)*5
    }
    hourlyChart.yZoomMax = yZoomMax
    setScale(hourlyChart);
    
    // Prepare data for chart
    hourlyChart.data.datasets[0].data = values;
    
    annots = {
        nowLine:{
            type: 'line',
            scaleID: "x",
            borderColor: 'rgba(255, 100, 0, 0.4)',
            borderWidth: 8,
            value: new Date(),
            label:{
                rotation:90,
                enabled:true,
                position:"start",
                content: "NOW",
            }
        },
        thisHour: {
            type: 'box',
            //scaleID: "x",
            borderColor: 'rgba(0, 0, 0, 0.2)',
            backgroundColor:'rgba(0, 0, 0, 0.2)',
            borderWidth: 1,
            xMin: new Date().setMinutes(0, 0, 0),
            xMax: new Date().setMinutes(60,0,0),
            yMin: function(ctx) {
                return ctx.chart.scales.y.min;
            },
            yMax: function(ctx) {
                return ctx.chart.scales.y.max;
            },
        }
    };

    /*if (values.length > 26) {
        annots.tomorrow = createLabelAnnot(
            values.map(function (e) {return e.hour;}).indexOf(values.find(v => v.dt.getHours() == 0).hour), 
            'TOMORROW');
    }*/

    // check if showing today's data
    let nowIndex = findNowIndex(values);
    if (values[nowIndex]) {
        //calculate position of "now" indicator
        $("#lblCurP").text(values[nowIndex].value);
        $("#lblCurT").text(hourRange(values[nowIndex].dt));
        $("#divNow").show();
        hourlyChart.options.plugins.annotation = {annotations: annots};
        //hourlyChart.options.plugins.annotation.annotations.nowLine.display = true;
        //hourlyChart.options.plugins.annotation.annotations.thisHour.display = true;
    }
    else{
        $("#divNow").hide();
        //hourlyChart.options.plugins.annotation.annotations.nowLine.display = false;
        //hourlyChart.options.plugins.annotation.annotations.thisHour.display = false;
        hourlyChart.options.plugins.annotation = false;
    }
    
    hourlyChart.update();

    // update Daily chart after Hourly chart is ready 
    zone = $("#zoner").val();
    date = strDate($("#lblDate").val())
    params = {"zone":zone, "date": date};
    print("Requesting daily prices for zone "+zone +" & date " + date)
    $.getJSON("/api/dailystats", params, showDailyStats)	
    
};		

// ==========================================================================================
function showDailyStats (values, status){
    values.map(function(o){o.dt = new Date(o.date); return o})
    //print(values)

    //calculate boundaries
    let y = dailyChart.options.scales.y;
    let min = Math.min(...values.map(o => o.min));
    y.min = 0;
    if (min < 0) {
        y.min = (Math.floor(min / 10))*10;
    }
    let max = Math.max(...values.map(o => o.max));
    y.max = (Math.floor(max / 10)+1)*10;;

    // prepare dataset
    dateLabels = []
    for (let d = values[0].dt; 
        d <= values[values.length-1].dt; 
        d.setDate(d.getDate() + 1)){
            dateLabels.push(strDate(d))
        }
    dailyChart.data.labels = dateLabels;
    dailyChart.data.datasets[0].data = values;
    dailyChart.data.datasets[1].data = values;


    // Create labels for 1st day of each month on chart + for the first tick  
    var annots = values.filter(item => item.dt.getDate() == 1).map(o => o.date);
    annots = annots.reduce((a, v) => ({ ...a, [v]: null}), {});
    annots[values[0].date] = {};
    for (var key in annots) {
        annots[key] = createLabelAnnot(values.map(function (e) {return e.date;}).indexOf(key),strDate(key,"MMMM YYYY"),10)
    }
    // add annotaition for the currently displayed date
    annots['lineCurrentDate'] = {
        type: 'line',
        scaleID: "x",
        borderColor: 'rgba(178, 102, 255, 0.5)',
        borderWidth: 8,
        value: dateLabels.findIndex(function(val) { return val == strDate($("#lblDate").val()); }),
        label:{
            rotation:90,
            enabled:true,
            position:"start",
            content: strDate($("#lblDate").val(),"DD MMM YYYY"),
        }
    };
    //print(annots)
    dailyChart.options.plugins.annotation = {annotations: annots};

    //improve options
    dailyChart.update();
    $("#dailyChart").parent().parent().removeClass("d-none");
}

// ==========================================================================================
function getMonthlyStats(){
    zone = $("#zoner").val();
    date = strDate($("#lblDate").val())
    params = {"zone":zone, "date": date};
    print("Requesting monthly prices for zone "+zone)
    $.getJSON("/api/monthlystats", params, showMonthlyStats)
    $('#btnMontly').addClass('d-None')
}
// ==========================================================================================
function showMonthlyStats (values, status){
    values.map(function(o){o.label = new Date(o.year,o.month-1); return o})
    print(values)

    //calculate boundaries
    var min = Math.min(...values.map(o => o.min));
    var max = Math.max(...values.map(o => o.max));
    let y = monthlyChart.options.scales.y; 
    y.max = (Math.floor(max / 50)+1)*50;
    y.min = 0;
    if (min < 0) {
        y.min = (Math.floor(min / 50))*50;
    }

    let ds = monthlyChart.data.datasets; 
    ds[0].data = values;
    ds[1].data = values;
    ds[2].data = values;

    annots = values.filter(function(val, m, vals){
        if (m > 0 && m < vals.length-1 && (vals[m+1].max < val.max) && (val.max > vals[m-1].max )){
            return {"x":val.month,"y":val.max};
        }
    })
    //print(annots)
    /*for (var m = 1; m < values.length-1; m++){
//        values[m].max = +values[m].max;
        if ((values[m+1].max < values[m].max) && (values[m].max > values[m-1].max )){
            print(values[m])
        }
    }**/

    //improve options
    monthlyChart.update();
    $("#monthlyChart").removeClass("d-none");
}

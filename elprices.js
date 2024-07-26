var hourlyChart = null;
var dailyChart = null;
var monthlyChart = null; 
var currentDate = new Date();

$(document).ready(function() {    
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
            parsing: {yAxisKey: 'price.totalprice'},
            backgroundColor: "rgba(0,0,255,0.1)",
            borderColor: "rgba(0,0,255,0.5)",
            segment: {
                backgroundColor: function(ctx) {
                    let now = new Date();
                    let transp = (new Date(ctx.p0.raw.dt) < now && new Date(ctx.p1.raw.dt) > now)? 0.7 : 0.1;
                    if (checkMinPrice(ctx.p0.parsed.y, ctx.chart.min)) 
                        return "rgba(0,204,0,"+transp+")"
                    return "rgba(0,0,255,"+transp+")"
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
        interaction: {
            intersect: false,
            mode: 'index',
            axis:'x',
            xAlign:"center",
            yAlign:'bottom',
            titleColor:"rgba(255,255,0,1)",
            titleAlign:'center',
        },
      
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
            x: {autoSkip:false,
                type:'time',
                time:{
                    unit:'hour',
                    tooltipFormat: "DD MMM YY HH:mm",
                    displayFormats: {
                        hour:'HH:mm'
                    }
                }, 
                grid: {
                    drawTicks:false,
                    /*color: function(ctx) {
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
                        //print(ctx.tick)
                        dt = new Date(ctx.tick.value)
                        var i = ctx.index;
                        if (ctx.tick.label.length > 5 && i !=0 && i != ctx.chart.scales.x.max)
                            return 3;
                        if (ctx.tick.label)
                            return 1;
                        return 0;
                    }*/
                },
                ticks: {
                    autoSkip:false,
                    font: function(ctx){
                        let fnt = fontSize();
                        if (new Date(ctx.tick.value).getHours() == 0) {
                            //print(strDate(dt,"DD MMM"))
                            fnt['weight']='bolder';
                        }
                        return fnt;
                    },
                    callback: function(value, index, ticks) {
                        let hour = this.getLabelForValue(value);
                        dt = new Date(hour);
                        if (dt.getHours() == 0) {
                            //print(strDate(dt,"DD MMM"))
                            return strDate(dt,"DD MMM");
                        }
                        if (dt.getHours() % 2 == 1) {
                            return "" ;
                        }
                        return strDate(dt,"HH:mm");
                    }
                }
            }
        },
        plugins: {
            legend: false,
            tooltip: {
                callbacks: {
                    beforeLabel: function (ctx) {
                        let item = ctx.raw.price;
                        return [
                            item.spotprice.toFixed(2)+ ' Spot Price',
                            item.elcert.toFixed(2)+ ' El.Certificats',
                            item.vat.toFixed(2) + ' VAT',
                            ""
                        ]
                    },
                    label: function (ctx) {
                        return ctx.raw.price.totalprice.toFixed(2) + ' Total Price'
                    },
                }
            }
        
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
                    //$('#log').text($('#log').text()+"right "+deltaX+'\r\n')
                    getPrices(-1);
                }
                if (deltaX > 300){
                    //$('#log').text($('#log').text()+"left "+deltaX+'\r\n')
                    getPrices(+1);
                }
                if (deltaY < -300){
                    //$('#log').text($('#log').text()+"down "+deltaY+'\r\n')
                }
                if (deltaY > 300){
                    //$('#log').text($('#log').text()+"up "+deltaY+'\r\n')
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
            fill:+2,
            cubicInterpolationMode: 'monotone',
            segment: {
                backgroundColor: function(ctx){
                    let month = +ctx.p0.raw.date.slice(5,7);
                    if (month % 2) 
                        return "rgba(255,228,181,0.5)"
                    return "rgba(175,238,238,0.5)"
                },
            }

        },{
            label:"Average",
            parsing: {yAxisKey: 'avg'},
            cubicInterpolationMode: 'monotone',
            borderColor: "rgba(0,0,0,0.5)",
            backgroundColor: "rgba(0,0,0,0.5)",
            borderDash:[5,5],
            pointStyle:false,
            fill:false,
        },{
            label:"Max",
            parsing: {yAxisKey: 'max'},
            cubicInterpolationMode: 'monotone',
            borderColor: "rgba(204,0,0,0.5)",
            backgroundColor: "rgba(204,0,255,0.5)",
            fill:2
        }]
    };

    var dOpt = {
        parsing: {xAxisKey: 'date'},
        animation:false,
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
            x:{ autoSkip:false,
                type:'time',
                time:{
                    unit:'day',
                },
                /*grid:{
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
                        if (ctx.tick.label.length > 20)// && i != ctx.chart.scales.x.max)
                            return 5;
                        if (ctx.tick.label)
                            return 1;
                        return 0;
                    }
                },*/
                ticks: {
                    autoSkip:false,
                    font:fontSize,
                    /*callback: function(value, index, ticks) {
                        var label = this.getLabelForValue(value);
                        dt = new Date(label);
                        //print(dt)
                        //hour = +label.substr(11,2);
                        if (dt.getDate() == 1)
                            return moment(dt).format("MMM'YY");
                        return moment(dt).format('DD');
                    }*/
                }
            }
        },
        plugins: {
            legend: false,
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
        },
        onClick: (e) => {
            const canvasPosition = Chart.helpers.getRelativePosition(e, dailyChart);

            // Substitute the appropriate scale IDs
            const dataX = dailyChart.scales.x.getValueForPixel(canvasPosition.x + this.innerWidth/66);
            //const dataY = dailyChart.scales.y.getValueForPixel(canvasPosition.y);
            selectedDate = new Date(dailyChart.scales.x.getLabelForValue(dataX));
            getPrices(0, selectedDate);
        }
    }
    
    dailyChart = new Chart("dailyChart", {type: "line", data:dData,  options: dOpt});
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
        parsing: {xAxisKey: 'date'},
        scales: {
            y:{ ticks:{
                    font:fontSize,
                    autoSkip:false,
                }
            },
            x:{ autoSkip:false,
                type:'time',
                time:{
                    unit:'month',
                    tooltipFormat:"MMMM YYYY",
                    displayFormats: {
                        month:"MMM'YY"
                    }
                }, 
                grid:{
                    drawTicks:false,
                    color: function(ctx) {
                        if (ctx.type != "tick")
                            return ;
                        if (new Date(ctx.tick.value).getMonth() == 0 )
                            return "rgba(0,0,0,0.4)";
                        return "rgba(0,0,0,0.2)";
                    },
                    lineWidth: function(ctx) {
                        //print(this.dailyChart);
                        if (ctx.type != "tick")
                            return;
                        if (ctx.index !=0 && new Date(ctx.tick.value).getMonth() == 0 )
                            return 3;
                        return 1;
                    }
                },
                ticks: {
                    autoSkip:false,
                    font:fontSize,
                    /*callback: function(value, index, ticks) {
                        var label = this.getLabelForValue(value);
                        dt = new Date(label);
                        return moment(dt).format("MMM'YY");
                    }*/
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
    $("#next").addClass('disabled');
    $("#prev").addClass('disabled');
    let tomorrow = strDate(new Date().setHours(24,0,0,0));
    //dailyChart.options.animation = (day != null);

    if (day == null) {
        day = currentDate;
    }
    /*if (delta == 1 && strDate(day) == tomorrow)
        return*/
    ;
    //day = strDate(day.setHours(24*delta));
    /* if (day == tomorrow) {
        //request current date data
        day = null;
        $("#next").removeClass('btn-primary');
        $("#next").addClass('btn-outline-primary disabled');
    }
    else {
        $("#next").removeClass('disabled btn-outline-primary');
        $("#next").addClass('btn-primary');
    } */

    requestHourlyPrice(day.setHours(24*delta), showHourlyPrices);
}

// ==========================================================================================
function showHourlyPrices (resp){
    $("#prev").removeClass('disabled');
    if (isTomorrowRequested()) {
        $("#next").removeClass('btn-primary');
        $("#next").addClass('btn-outline-primary disabled');
    }
    else {
        $("#next").removeClass('disabled btn-outline-primary');
        $("#next").addClass('btn-primary');
    } 
    //print(resp);
    //resp.hours[6].price.totalprice = -20;
    //resp.min = resp.hours[6];
    currentDate = new Date(resp.curdate);
    $("#lblDate").text(strDate(resp.curdate, 'MMMM Do, YYYY'));

    // calculate Minimum value
    let min = resp.min.price.totalprice;
    hourlyChart.min = min;
    $("#lblMinP").text(min.toFixed(2));
    $("#lblMinT").text(hourRange(resp.min.dt));

    // calculate Maximum value
    let max = resp.max.price.totalprice;
    $("#lblMaxP").text(max.toFixed(2));
    $("#lblMaxT").text(hourRange(resp.max.dt));

    // calcualte chart scales
    let yMax = roundUpBy(max, 50);
    yMax = yMax < 100 ? 100 : yMax;
    // check if last number will be under zone select then apply ratio
    /*ratio = (Math.max(...values.slice(-6).map(o => o.value))) / yMax
    if (ratio > 0.8){
        yMax = (Math.floor((yMax * (ratio + 0.20)) / 25)+1)*25;
    }*/
    let yMin = 0
    if (min < 0) { yMin = roundDownBy(min, 10); }
    // set scales for zooming in and out
    hourlyChart.yMax = yMax;
    hourlyChart.yMin = yMin;
    /*let yZoomMax = roundUpBy(max, 5);
    ratio = (Math.max(...values.slice(-6).map(o => o.value))) / yZoomMax
    if (ratio > 0.8){
        yZoomMax = (Math.floor(max * (ratio + 0.25) / 5)+1)*5
    }*/
    hourlyChart.yZoomMin = roundDownBy(min, 5);
    hourlyChart.yZoomMax = roundUpBy(max/0.9, 5);
    setScale(hourlyChart);
    
    // Prepare data for chart
    hourlyChart.data.datasets[0].data = resp.hours;
    
    annots = {
        nowLine:{
            type: 'line',
            scaleID: "x",
            borderColor: 'rgba(255, 100, 0, 0.8)',
            borderWidth: 4,
            drawTime:'afterDraw',
            value: new Date(),
            label:{
                rotation:90,
                enabled:true,
                position:"start",
                content: "NOW",
            }
        },
        thisHour_up: {
            type: 'box',
            borderColor: 'rgba(0, 0, 0, 0.3)',
            backgroundColor:'rgba(0, 0, 0, 0.1)',
            borderWidth: 1,
            drawTime:'afterDraw',
            xMin: new Date().setMinutes( 0, 0, 0),
            xMax: new Date().setMinutes(60, 0, 0),
            yMin: function(ctx) {
                return ctx.chart.scales.y.min;
            },
            yMax: function(ctx) {
                return ctx.chart.scales.y.max;
            },
        },
    };

    if (resp.count > 26) {
        annots.tomorrow = createLabelAnnot(resp.hours[resp.count-2].date,'TOMORROW');
    }

    // check if showing today's data
    if (resp.cur == undefined){
        $("#divNow").hide();
        hourlyChart.options.plugins.annotation = false;
    }
    else{
        //calculate position of "now" indicator
        $("#lblCurP").text(resp.cur.price.totalprice.toFixed(2));
        $("#lblCurT").text(hourRange(resp.cur.dt));
        $("#divNow").show();
        hourlyChart.options.plugins.annotation = {annotations: annots};
    }
    
    hourlyChart.update();
    hourlyChart.options.animation.onComplete = function(chart, currentStep,initial,numSteps){
        //print('animation accomplished')
    }

    // update Daily chart after Hourly chart is ready 
    requestDailyStats(strDate(currentDate), showDailyStats);    
};		

// ==========================================================================================
function showDailyStats (resp, status){
    //print(resp)

    //calculate boundaries
    let y = dailyChart.options.scales.y;
    y.min = 0;
    if (resp.min < 0) {
        y.min = (Math.floor(resp.min / 10))*10;
    }
    y.max = (Math.floor(resp.max / 10)+1)*10;;

    // prepare dataset
    let dateLabels = [];
    for (let d = new Date(resp.first); 
        d <= new Date(resp.last); 
        d.setDate(d.getDate() + 1)){
        dateLabels.push(strDate(d))
    }
    dailyChart.data.labels = dateLabels;
    dailyChart.data.datasets[0].data = resp.days;
    dailyChart.data.datasets[1].data = resp.days;
    dailyChart.data.datasets[2].data = resp.days;


    // add annotaition for the currently displayed date
    let  annots = {};
    for (let nextMonth = new Date(resp.first);
        nextMonth < new Date(resp.last);
        nextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 1)) {
            annots[strDate(nextMonth)] = createLabelAnnot(strDate(nextMonth), strDate(nextMonth,"MMMM YYYY"));
        }
    annots[resp.first] = createLabelAnnot(resp.first,strDate(resp.first,"MMMM YYYY"), xAdj=-8);
    annots['lineCurrentDate'] = {
        type: 'line',
        scaleID: "x",
        borderColor: 'rgba(178, 102, 255, 0.5)',
        borderWidth: 8,
        value: strDate(currentDate),
        label:{
            rotation:90,
            enabled:true,
            position:"start",
            content: strDate(currentDate,"DD MMM YYYY"),
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
    date = strDate(currentDate)
    params = {"zone":zone, "date": date};
    print("Requesting monthly prices for zone "+zone)
    $.getJSON("/api/monthlytibberstats", params, showMonthlyStats)
    $('#btnMontly').addClass('d-None')
}
// ==========================================================================================
function showMonthlyStats (resp, status){
    print(resp)

    //calculate boundaries
    //var min = resp.min
    //var max = resp.max;
    let y = monthlyChart.options.scales.y; 
    y.max = roundUpBy(resp.max, 50);
    y.min = 0;
    if (resp.min < 0) {
        y.min = roundDownBy(resp.min, 50);
    }

    let ds = monthlyChart.data.datasets; 
    ds[0].data = resp.months;
    ds[1].data = resp.months;
    ds[2].data = resp.months;

    /*annots = values.filter(function(val, m, vals){
        if (m > 0 && m < vals.length-1 && (vals[m+1].max < val.max) && (val.max > vals[m-1].max )){
            return {"x":val.month,"y":val.max};
        }
    })*/
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

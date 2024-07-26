function strDate(date, fortmat = 'YYYY-MM-DD') {
    return moment(new Date(date)).format(fortmat);
}

function hourRange(dt, dataFormat = ""){
    if (dataFormat == "" && new Date().setHours(0,0,0,0) < new Date(dt).setHours(0,0,0,0)){
        return "TOMORROW";
    }
    let curH = new Date(dt).setMinutes(0, 0, 0);
    return strDate(curH,dataFormat+"HH:mm-") + strDate(new Date(curH).setMinutes(60),"HH:mm");
}

function fontSize (context) {
    return {size: Math.round(context.chart.width / 52)};
    //return {size: Math.round($(window).width() / 56)}
};

function fontSize1vw (context) {
    return {size: Math.round(context.chart.width / 78)};
    //return {size: Math.round($(window).width() / 56)}
};

function print(str){
    console.info(str);
}

function checkMinPrice(val, min){
    return ((val < 0) || (val - min < 4) || (min > 0 && val / min < 1.1) );
}

function roundUpBy(val, step){
    return (Math.floor(val / step)+1)*step;
}

function roundDownBy(val, step){
    return (Math.floor(val / step))*step;
}

function findNowIndex(values) {
    now = new Date()
    return values.findIndex(function(val) {
        return (val.dt < now && now - val.dt < 3600000);
    });
}

function setScale(chart){
    let y = chart.options.scales.y;
    if (chart.options.zoomed == true){
        y.max = chart.yZoomMax;
        y.min = chart.yZoomMin;
    }
    else{
        y.max = chart.yMax;
        y.min = chart.yMin;
    }
}

function createLabelAnnot(date, text, xAdj=14, yAdj=0){
    return {
        type: 'line',
        scaleID: "x",
        borderColor: "rgba(0,0,0,0.2)",
        borderWidth: 4,
        value: date,
        label:{
            rotation:90,
            enabled:true,
            position:"0%",
            backgroundColor: "rgba(153,0,153,0.1)",
            borderRadius:0,
            width: 200,
            color:"rgba(0,0,0,0.3)",
            content: text,
            yAdjust: yAdj,       
            xAdjust: xAdj,
            font: fontSize,
        }
    }
    /*return {
        type:'label',
        backgroundColor: "rgba(153,0,153,0.1)",
        color:"rgba(0,0,0,0.3)",
        width: 200,
        xValue: date,
        yValue: function(ctx){
            let y = ctx.chart.scales.y;
            return y.min + (y.max - y.min)*0.86;
        } ,    
        yAdjust: yAdjust,       
        xAdjust: 16,
        content: strDate(date,"MMMM YYYY"),
        rotation: 90,
        font: fontSize,
    }*/
}
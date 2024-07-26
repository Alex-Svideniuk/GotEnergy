function strDate(date, fortmat = 'YYYY-MM-DD') {
    return moment(new Date(date)).format(fortmat);
}

function hourRange(dt){
    if (new Date((new Date()).toDateString()) < new Date(dt.toDateString())){
        return "TOMORROW";
    }
    let nextH = new Date(dt); nextH.setHours(nextH.getHours()+1)
    return toHourString(dt.getHours()) +"-" + toHourString(nextH.getHours());
}

function toHourString(hour){
    return String(hour).padStart(2, '0')+":00";
}

function fontSize (context) {
    return {size: Math.round($(window).width() / 56)}
};

function print(str){
    console.info(str);
}

function checkMinPrice(val, min){
    return ((val < 0) || (val - min < 4) || (min > 0 && val / min < 1.1) );
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

function createLabelAnnot(pos, text, yAdjust=0){
    return {
        type:'label',
        backgroundColor: "rgba(153,0,153,0.1)",
        color:"rgba(0,0,0,0.3)",
        width: 200,
        xValue: pos,
        yValue: function(ctx){
            let y = ctx.chart.scales.y;
            return y.min + (y.max - y.min)*0.86;
        } ,    
        yAdjust: yAdjust,       
        xAdjust: 16,
        content: text,
        rotation: 90,
        font: fontSize,
    }
}
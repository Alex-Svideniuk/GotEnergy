var h_cache = {}
var d_cache = {}
var tomorrow = strDate(new Date().setHours(24,0,0,0));
var dayRequested = null

function isTomorrowRequested(){
    return tomorrow == dayRequested;
};

function requestHourlyPrice(date, cbFunciton, stack = 0){
    if (stack == 3) return;

    date = strDate(date)
    tomorrow = strDate(new Date().setHours(24,0,0,0));

    let zone = $("#zoner").val();
    let params = {"zone":zone};
    dayRequested = date;
    if (date != tomorrow) {
        params['date'] = date; 
    }
    else{
        //print('request today')
    }

    let hash = String(zone)+"d"+date
    if (h_cache[hash] != undefined) {
        if (stack == 0){
            print("CACHE >> hourly prices for zone "+zone +" & " + (date == this.tomorrow ? 'current date' : date))
            cbFunciton(h_cache[hash]) 
        }
        requestHourlyPrice(new Date(date).setHours(-24), null, stack + 1);
    }
    else{
        print("API   >> hourly prices for zone "+zone +" & " + (date == this.tomorrow ? 'current date' :  date))
        $.getJSON("/api/tibberprice",params)
        .done(function(resp, status){
            if (status != 'success') {
                print(status)
                return
            }
            if (date != strDate(new Date().setHours(24,0,0,0))) {
                print('CACHE << hourly prices for '+date)
                h_cache[hash] = resp;
            }
            if (stack == 0){
                cbFunciton(resp)
            }
        })
        .fail(function(){

        })
        .always(function(){
            requestHourlyPrice(new Date(date).setHours(-24), null, stack + 1);
        })
    }
};

function requestDailyStats(date, cbFunciton, stack=0){
    if (stack == 3) return;

    let zone = $("#zoner").val();
    date = strDate(date)
    let params = {"zone":zone, "date":date};

    let hash = String(zone)+"d"+date
    if (d_cache[hash] != undefined) {
        if (stack == 0){
            print("CACHE >> daily stats z"+zone +" & " + date)
            cbFunciton(d_cache[hash]) 
        }
        requestDailyStats(new Date(date).setHours(-24), null, stack + 1);
    }
    else{
        print("API   >> daily stats z"+zone +" & " + date)
        $.getJSON("/api/dailytibberstats", params)	
        .done(function(resp, status){
            if (status != 'success') {
                print(status)
                return
            }
            print('CACHE << daily stats for '+date)
            d_cache[hash] = resp;
            if (stack == 0){
                cbFunciton(resp)
            }
        })
        .fail(function(){
    
        })
        .always(function(){
            requestDailyStats(new Date(date).setHours(-24), null, stack + 1);
        })
    }
}

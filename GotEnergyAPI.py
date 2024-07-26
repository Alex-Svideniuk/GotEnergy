import requests, time
from datetime import date, timedelta, datetime, time as t
import falcon, json

class CurrentEnergyPricies(object):
    def on_get(self, req, resp):
        #resp.text = json.dumps({"status":"Ok"})
        #return
        start_time = time.time()
        today = date.today()
        now = datetime.now()
        dates = [today, today + timedelta(days=1)]  
        #print(dates)

        results = {"minNext":None, "minDT":None, "values":{"x":[], "y":[], "ym":[]}}
        nowIndex = -1
        max = None
        min = None
        for day in dates:
            parapms = {
                'zone': 3,
                'date': day.strftime("%Y-%m-%d"),
            }
            #print("Request day" + parapms["date"])
            res = requests.post("https://www.goteborgenergi.se/external-web/Api/HourlyPricesStatisticsElement/GetHourlyPrices",parapms)
            #print("Responce" + str(res.status_code))
            if res.status_code == 200:
                values = res.json()["result"]["values"]
                #print(values)
                for v in values:
                    dt = datetime.strptime(v['dateTime'],"%Y-%m-%d %H:%M") + timedelta(hours=2)
                    if dt <= now:
                        nowIndex = nowIndex + 1
                    elif (results["minNext"] == None or results["minNext"] > v['value']):
                        results["minNext"] = v['value']
                        results["minDT"] = dt

                    if (max == None or max < v['value']):
                        max = v['value']
                    if (min == None or min > v['value']):
                        min = v['value']

                    if (dt.time() == t(hour=0,minute=0)):
                        results["values"]["x"].append(dt.strftime("%Y-%m-%d"))
                    else:
                        results["values"]["x"].append(dt.strftime("%H:%M"))
                    results["values"]["y"].append(v['value'])
                    results["values"]["ym"].append(None)
                    #print(nowIndex)
        if (results["minNext"] > 10 and results["minNext"] <= 100 ):
            delta = 5
        elif results["minNext"] <= 200:
            delta = 10
        else:
            delta = 20
        
        for x in range(len(results["values"]["y"])):
            if x >= nowIndex and (results["values"]["y"][x] - results["minNext"]) <= delta:
                results["values"]["ym"][x] = results["values"]["y"][x]
        results["nowIndex"] = nowIndex
        delta = results["minDT"] - now
        results["max"] = (max//100+1)*100
        if min > 0 :
            min = 0
        results["min"] = (min//20)*20
        results["minIn"] = str(int(delta.total_seconds()//3600))+"h "+str(int((delta.total_seconds()//60)%60))+"m"
        results["minDT"] = results["minDT"].strftime("%Y-%m-%d %H:%M")
        #print(json.dumps(results))
        #print("--- %s seconds ---" % (time.time() - start_time))
        resp.status = falcon.HTTP_200
        resp.text = json.dumps(results)

#==================================================================================================

class getWeb(object):
    def on_get(self, req, resp):
        resp.status = falcon.HTTP_200
        resp.content_type = 'text/html'
        with open('GotEnergyHourlyRate.html', 'r') as f:
            resp.text = f.read()

#==================================================================================================
app = falcon.App()
app.add_route('/api/elpricesnow', CurrentEnergyPricies())
app.add_route('/elpricesnow', getWeb())

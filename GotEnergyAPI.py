import time
from datetime import date, timedelta, datetime, time as t
import falcon, json
from myslq import dbEnergy

#falcon.Request.uri

class CurrentEnergyPricies(object):
    def on_get(self, req, resp):
        start_time = time.time()
        print(req.params)
        zone = validateZone(req.params)
        if zone == None:
            print("worng zone")
            resp.status = falcon.HTTP_400
            return

        day = validateDate(req.params)
        if day == None:
            print("worng date")
            resp.status = falcon.HTTP_400
            return 

        try:            
            client = dbEnergy()
            if day == date.today().strftime("%Y-%m-%d"):
                print ("Сurrent date requested")
                results = client.getCurrentPrise(zone)
            else:
                results = client.getDayPrise(zone, day)
            client.endSession()
            resp.status = falcon.HTTP_200
            resp.text = json.dumps(results, default=str)
        except:
            print("Error getting prices")
            resp.status = falcon.HTTP_500
        print("--- %s ms ---" % ((time.time() - start_time)*1000//1))

#==================================================================================================
class getDailyStats(object):
    def on_get(self, req, resp):
        start_time = time.time()
        print(req.params)
        zone = validateZone(req.params)
        if zone == None:
            print("worng zone")
            resp.status = falcon.HTTP_400
            return

        day = validateDate(req.params)
        if day == None:
            print("worng date")
            resp.status = falcon.HTTP_400
            return 

        client = dbEnergy()
        results = client.getDailyPrise(zone, day)
        client.endSession()
        try:            
            resp.status = falcon.HTTP_200
            resp.text = json.dumps(results, default=str)
        except:
            print("Error getting prices")
            resp.status = falcon.HTTP_500
        print("--- %s ms ---" % ((time.time() - start_time)*1000//1))

class getWeb(object):
    def on_get(self, req, resp):
        resp.status = falcon.HTTP_200
        resp.content_type = 'text/html'
        with open('GotEnergyHourlyRate.html', 'r') as f:
            resp.text = f.read()

#==================================================================================================
def validateZone(params):
    zone = params.get("zone","3")
    if zone not in ["1","2","3","4"]:
        return None
    return zone

def validateDate(params):
    if "date" not in params:
        return date.today().strftime("%Y-%m-%d")
    try:
        date.fromisoformat(params["date"])
    except ValueError:
        return None
    return params["date"]    

#==================================================================================================

app = falcon.App()
app.add_route('/api/elprice', CurrentEnergyPricies())
app.add_route('/api/dailystats', getDailyStats())
app.add_route('/elprices', getWeb())

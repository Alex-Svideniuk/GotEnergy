import time
from datetime import date, timedelta, datetime, time as t
import falcon, json
from myslq import dbEnergy

#falcon.Request.uri

class CurrentEnergyPricies(object):
    def on_get(self, req, resp):
        start_time = time.time()
        print(req.params)
        zone = req.params.get("zone",3)
        if zone not in ["1","2","3","4"]:
            print("worng zone")
            resp.status = falcon.HTTP_404
            return

        today = date.today().strftime("%Y-%m-%d")
        if "date" not in req.params:
            day = today
        else:
            day = req.params["date"]
            try:
                date.fromisoformat(day)
            except ValueError:
                print("worng date")
                resp.status = falcon.HTTP_404
                return      
        try:            
            client = dbEnergy()
            if day == today:
                print ("Сurrent date requested")
                results = client.getCurrentPrise(zone)
            else:
                results = client.getDayPrise(zone, day)
            client.endSession()
            resp.status = falcon.HTTP_200
            resp.text = json.dumps( results, default=str)
        except:
            print("Error getting prices")
            resp.status = falcon.HTTP_500
        print("--- %s ms ---" % ((time.time() - start_time)*1000//1))

#==================================================================================================

class getWeb(object):
    def on_get(self, req, resp):
        resp.status = falcon.HTTP_200
        resp.content_type = 'text/html'
        with open('GotEnergyHourlyRate.html', 'r') as f:
            resp.text = f.read()

#==================================================================================================
#prepareHPriceJSON()
app = falcon.App()
app.add_route('/api/elprice', CurrentEnergyPricies())
app.add_route('/elprices', getWeb())

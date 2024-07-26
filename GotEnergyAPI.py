import time
from datetime import date, timedelta, datetime, time as t
import falcon, json
from myslq import dbEnergy

#==================================================================================================
class apiEndpoint(object):
    def on_get(self, req, resp, endpoint):
        start_time = time.time()
        print("API request '/api/%s' with '%s'" % (endpoint,req.params))

        zone = req.get_param_as_int("zone", True, 1, 4)

        client = dbEnergy()
        if (endpoint == 'dailystats'):
            day = req.get_param_as_date("date", format_string='%Y-%m-%d', required=True)
            results = client.getDailyStats(zone, day)
            resp.status = falcon.HTTP_200

        elif (endpoint == 'monthlystats'):
            results = client.getMonthlyStats(zone)
            resp.status = falcon.HTTP_200

        elif (endpoint == 'elprice'):
            day = req.get_param_as_date("date", format_string='%Y-%m-%d', required=False)
            if day == None:
                print ("Current date requested")
                results = client.getCurrentPrise(zone)
            else:
                results = client.getDayPrise(zone, day)
            if results == None:
                resp.status = falcon.HTTP_404
            else:
                resp.status = falcon.HTTP_200

        else: 
            print("Endpoint not supported")
            resp.status = falcon.HTTP_404
        client.endSession()

        try:
            if resp.status == falcon.HTTP_200:
                resp.text = json.dumps(results, default=str)
        except:
            print("Error getting prices")
            resp.status = falcon.HTTP_500
        print("--- %s ms ---" % ((time.time() - start_time)*1000//1))

#==================================================================================================
class getWeb(object):
    def on_get(self, req, resp, filename):
        start_time = time.time()
        isMobile = int(req.get_header('SEC-CH-UA-MOBILE',default='?0')[1])
        try:
            print("Web requested '/%s'" % filename)
            if filename.count('.') == 0:
                filename = filename +'.html'
                print("request: %s\n%s\n%s" % (req.access_route, isMobile, req.user_agent))
                #for key in req.headers :
                #    print ("%s:%s" % (key, req.headers[key]))
            with open(filename, 'r') as f:
                print
                resp.status = falcon.HTTP_200
                resp.content_type = 'text/html'
                resp.text = f.read()
        except:
            resp.status = falcon.HTTP_404
        print("--- %s ms ---" % ((time.time() - start_time)*1000//1))

#==================================================================================================

app = falcon.App()
app.add_route('/api/{endpoint}',    apiEndpoint())
app.add_route('/{filename}',        getWeb())

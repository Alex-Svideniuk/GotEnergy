from datetime import date#, timedelta, datetime, time as t
import time, falcon, json, logging, os
from myslq import dbEnergy

#==================================================================================================
class apiEndpoint(object):
    def on_get(self, req, resp, endpoint):
        start_time = time.time()
        logging.info("API request '/api/%s' with '%s'" % (endpoint,req.params))

        zone = req.get_param_as_int("zone", True, 1, 4)

        client = dbEnergy()
        match endpoint:

            ################    Endpoint for Gothenburg Energy    #####################
            case 'elprice':
                day = req.get_param_as_date("date", format_string='%Y-%m-%d', required=False)
                if day == None:
                    logging.info("Current date requested")
                    results = client.getCurrentPrise(zone)
                else:
                    results = client.getDayPrise(zone, day)
                if results == None:
                    resp.status = falcon.HTTP_204
                else:
                    resp.status = falcon.HTTP_200

            case 'dailystats':
                day = req.get_param_as_date("date", format_string='%Y-%m-%d', required=True)
                results = client.getDailyStats(zone, day)
                if results == client.EMPTY_DAYS:
                    resp.status = falcon.HTTP_204
                else:
                    resp.status = falcon.HTTP_200

            case 'monthlystats':
                #results = client.getMonthlyStats(zone)
                resp.status = falcon.HTTP_404

            ################    Endpoint for Gothenburg Energy    #####################
            case 'tibberprice':
                day = req.get_param_as_date("date", format_string='%Y-%m-%d', required=False)
                if day == None:
                    logging.info ("Current date requested")
                    results = client.getCurrentTibberPrise(zone)
                else:
                    results = client.getDayTibberPrise(zone, day)
                if results == client.EMPTY_HOURS:
                    resp.status = falcon.HTTP_204
                else:
                    resp.status = falcon.HTTP_200

            case 'dailytibberstats':
                day = req.get_param_as_date("date", format_string='%Y-%m-%d', required=True)
                results = client.getDailyTibberStats(zone, day)
                if results == client.EMPTY_DAYS:
                    resp.status = falcon.HTTP_204
                else:
                    resp.status = falcon.HTTP_200

            case 'monthlytibberstats':
                results = client.getMonthlyTibberStats(zone)
                resp.status = falcon.HTTP_200

            ################    the rest is not supported    #####################
            case _: 
                logging.warning("Endpoint not supported")
                resp.status = falcon.HTTP_404
        client.endSession()

        try:
            if resp.status == falcon.HTTP_200:
                resp.text = json.dumps(results, default=str)
        except:
            logging.error("Error getting prices")
            resp.status = falcon.HTTP_500
        logging.info("--- %s ms ---" % ((time.time() - start_time)*1000//1))

#==================================================================================================
class getWeb(object):
    def on_get(self, req, resp, filename):
        start_time = time.time()
        isMobile = int(req.get_header('SEC-CH-UA-MOBILE',default='?0')[1])
        try:
            logging.info("Web requested '/%s'" % filename)
            if filename.count('.') == 0:
                filename = filename +'.html'
                logging.debug("request: %s\n%s\n%s" % (req.access_route, isMobile, req.user_agent))
                #for key in req.headers :
                #    logging.info ("%s:%s" % (key, req.headers[key]))
            with open(filename, 'r') as f:
                #logging.info
                resp.status = falcon.HTTP_200
                resp.content_type = 'text/html'
                resp.text = f.read()
        except:
            resp.status = falcon.HTTP_404
        logging.info("--- %s ms ---" % ((time.time() - start_time)*1000//1))

#==================================================================================================
if not os.path.exists('logs'):
   os.makedirs('logs')

logging.basicConfig(format='%(asctime)s|%(threadName)s|%(levelname)s|%(message)s', 
                    datefmt='%Y-%m-%d %H:%M:%S', 
                    filename='logs/api_%s.log' % date.today().isoformat(),
                    encoding='utf-8', level=logging.DEBUG)
app = falcon.App()
app.add_route('/api/{endpoint}',    apiEndpoint())
app.add_route('/{filename}',        getWeb())

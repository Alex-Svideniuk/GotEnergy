import requests, pytz, logging
from datetime import date, timedelta, datetime, time as t
import mysql.connector

class dbEnergy:
    EMPTY_HOURS = {'hours':[]}
    EMPTY_DAYS = {'days':[]}
    EMPTY_MONTHS = {'months':[]}
    def __init__(self):
        try:
            self.db = mysql.connector.connect( 
                host="",
                user="",
                password="",
                database="",
                connection_timeout=1
            )
            self.cursor = self.db.cursor(buffered=True,dictionary=True)
        except:
            self.db = None
            logging.error("DB not connected")

    def endSession(self):
        if self.db:
            self.cursor.close()
            self.db.close()

    def getCurrentPrise(self, zone=3):
        if self.db:
            return self.__getCurrentPriseDB(zone)
        else:
            return self.__getDummy()

    def getDayPrise(self, zone, day):
        if self.db:
            return self.__getDayPriseDB(zone, day)
        else:
            return self.__getDummy()

    def getCurrentTibberPrise(self, zone=3):
        if self.db:
            return self.__getCurrentPriseDB(zone,"Tibber")
        else:
            return self.EMPTY_HOURS

    def getDayTibberPrise(self, zone, day):
        if self.db:
            return self.__getDayPriseDB(zone, day,"Tibber")
        else:
            return self.EMPTY_HOURS
    #=========================================================================================================
    def __getDummy(self):
        logging.debug("Sending dummy data")
        values = [{"value":0},{"value":0},{"value":0},{"value":0},{"value":30},{"value":60},{"value":90},{"value":60},{"value":30},{"value":0},{"value":-30},{"value":-60},{"value":-90},{"value":-60},{"value":-30},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0}]
        dt = datetime.now()
        dt = dt.replace(hour=0, minute=0, second=0, microsecond=0)
        t = 0
        for v in values:
            v["date"] = dt.strftime("%Y-%m-%d")
            v["hour"] = dt.hour
            dt = dt + timedelta(hours=1)

        return values
                            
    #===========================================================================================================
    def __getCurrentPriseDB(self, zone, provider = ""):
        count = self.__getCurrCount("currPrices", "zone = %s" % (zone))

        if count == 0:
            logging.warning ("No today data in DB. Reading from Web...")
            prices = self.__getNStoreWebHourlyPrise(date.today(), zone)
            count = len(prices)

        if count!= 0 and count <= 24 and datetime.now().hour > 12:
            logging.warning ("No tommorrow data in DB. Reading from Web...")
            self.__getNStoreWebHourlyPrise(date.today() + timedelta(days=1), zone)

        count = self.__getCurrCount("currPrices", "zone = %s" % (zone))
        if count > 25:
            table = "curr%sPrices" % provider
        else:
            table = "fullCur%sPrices" % provider

        return self.__wrapDailyValues(self.__getGetHourlyPriceDB(table, "zone = %s" % (zone)), provider)

    #===========================================================================================================
    def __getDayPriseDB(self, zone, day, provider = ""):
        table = 'hourly%sPrices' % provider
        cond = "zone = %s AND date = '%s'" % (zone,day)
        count = self.__getCurrCount(table, cond)
        if count == 0:
            logging.warning ("No data in DB for %s. Reading from Web..." % (day))
            self.__getNStoreWebHourlyPrise(day, zone)

        return self.__wrapDailyValues(self.__getGetHourlyPriceDB(table, cond),provider)

    #===========================================================================================================
    def __getGetHourlyPriceDB(self, table, conditions):
        sql = 'SELECT * FROM %s WHERE %s;' % (table, conditions)
        self.cursor.execute(sql)
        hprises = self.cursor.fetchall()
        values = []
        for row in hprises:
            item = {}
            for key in row:
                match key:
                    case 'date':
                        item[key] = row[key]
                    case 'hour':
                        item[key] = int(row[key])
                    case 'value':
                        item['price'] = {'spotprice': float(row[key])}
                    case 'spotprice' | 'elcert' | 'vat' | 'totalprice':
                        if 'price' not in item:
                            item['price'] = {}
                        item['price'][key] = float(row[key])
                    case 'zone':
                        continue
                    case _:
                        raise Exception("Unknown key %s" % key)
            item['dt'] = datetime.combine(row['date'], datetime.min.time()) + timedelta(hours=row['hour'])
            values.append(item)
        if len(values):
            item = item.copy()
            item['hour'] = 24
            item['dt'] = datetime.combine(item['date'], datetime.min.time()) + timedelta(hours=item['hour'])
            values.append(item)
        return values
    
    #===========================================================================================================    
    def __wrapDailyValues(self, values, provider):
        if len(values) == 0:
            return self.EMPTY_HOURS
        
        if (len(values) % 2 == 0):
            values.pop(0)

        resp = {'count':len(values),'curdate':values[-1]['date'], 'min':values[0], 'max':values[0]}
        key =  "spotprice" if provider == "" else 'totalprice'
        now = datetime.now()
        for row in values:
            if row['price'][key] < resp['min']['price'][key]:
                resp['min'] = row
            if row['price'][key] > resp['max']['price'][key]:
                resp['max'] = row
            dt = datetime.combine(row['date'], datetime.min.time()) + timedelta(hours=row['hour'])
            if row['hour'] != 24 and dt < now and now < dt + timedelta(hours=1):
                resp['cur'] = row
        resp['hours'] = values
        return resp
        
    #===========================================================================================================
    def getDailyTibberStats(self, zone, day):
        return self.getDailyStats(zone, day, "Tibber")

    def getDailyStats(self, zone, day, provider = ""):
        if not self.db:
            return self.EMPTY_DAYS
        sql = "SELECT * FROM daily%sStats WHERE zone = %s AND DATE >= (IF((NOW() - INTERVAL 15 DAY) < '%s', NOW() - INTERVAL 15 DAY, '%s') - INTERVAL 15 DAY) LIMIT 31;" % (provider,zone, day, day)
        self.cursor.execute(sql)
        dprises = self.cursor.fetchall()

        resp = {'first':dprises[0]['date'], 'last':dprises[-1]['date'], 'min':dprises[0]['min'], 'max':dprises[0]['max'], 'days':[]}
        for rec in dprises:
            rec.pop('zone')
            resp['days'].append(rec)
            if resp['max'] < rec['max']:
                resp['max'] = rec['max']
            if resp['min'] > rec['min']:
                resp['min'] = rec['min']
        return resp

    #===========================================================================================================
    def getMonthlyTibberStats(self, zone):
        if not self.db:
            return self.EMPTY_MONTHS
        sql = "SELECT year,month,min,avg,max FROM monthlyTibberStats WHERE zone = %s;" % (zone)
        self.cursor.execute(sql)
        mprises = self.cursor.fetchall()

        resp = {'min':mprises[0]['min'], 'max':mprises[0]['max'], 'months':[]}
        for rec in mprises:
            rec['date'] = date(rec['year'],rec['month'],1)
            rec.pop('year')
            rec.pop('month')
            resp['months'].append(rec)
            if resp['max'] < rec['max']:
                resp['max'] = rec['max']
            if resp['min'] > rec['min']:
                resp['min'] = rec['min']
        return resp

    #===========================================================================================================
    def __getCurrCount(self, table, contions):
        self.cursor.execute("SELECT count(*) FROM %s WHERE %s;" % (table, contions))
        res = self.cursor.fetchone()
        return res['count(*)']

    #===========================================================================================================
    def getMinDate(self, zone=3):
        if self.db:
            self.cursor.execute("select min(DATE) from dailyStats3 where zone = %s;",[zone])
            return self.cursor.fetchone()[0]
        else:
            return None

    #===========================================================================================================
    def __getNStoreWebHourlyPrise(self, day, zone):
        hprises = self.__getWebHourlyPrise(day, zone)
        if len(hprises) != 0:
            self.cursor.executemany("""INSERT IGNORE INTO hourlyPrices (zone, date, hour, value) VALUES (%s, %s, %s, %s)""", 
                                hprises)
            self.db.commit()
            logging.info ("New Hours Added to DB zone=%s date='%s'" % (zone, day))
        else:
            logging.warning("No Web data is awailable for %s" % day)
        return hprises

    #===========================================================================================================
    def __getWebHourlyPrise(self, day, zone):
        parapms = {
            'zone': zone,
            'date': day,
        }
        logging.debug("Request day %s" % day)
        res = requests.post("https://www.goteborgenergi.se/external-web/Api/HourlyPricesStatisticsElement/GetHourlyPrices",parapms)
        dailyValues = []
        tz = pytz.timezone('Europe/Stockholm')
        if res.status_code == 200:
            values = res.json()["result"]["values"]
            for v in values:
                dt = tz.localize(datetime.strptime(v['dateTime'],"%Y-%m-%d %H:%M"))
                dt = dt + dt.utcoffset()
                dailyValues.append((zone, dt.strftime("%Y-%m-%d"), dt.hour, v['value']))
                
            #logging.debug(dailyValues)
        return dailyValues

    #===========================================================================================================
    def updateTibberFee(self):
        logging.info('Checking tibber fees')
        fees = self.__getTibberFees(3)
        if fees != None:
            affected_rows = self.cursor.executemany("""INSERT IGNORE INTO tibber_fee (year, month, elcertificates) VALUES (%s, %s, %s)""", 
                fees)
            self.db.commit()
            logging.info ("%s new rows were added to Tibber Fees" % self.cursor.rowcount)
        else:
            logging.warning("No Tibber Fees data is awailable")


    def __getTibberFees(self, zone):
        codes = [97232, 83751, 11543, 21115]
        res = requests.get("https://tibber.com/se/api/lookup/price-overview?postalCode=%s" % codes[zone-1])
        if res.status_code != 200:
            return None
        values = res.json()['energy']
        res = []
        for v in values['last12Months']:
            res.append((v['year'],v['month'],round(v['priceComponents'][1]['priceExcludingVat']*100,2)))
        
        v = values['todayHours'][0]
        dt = v['date'].split('-')
        res.append((dt[0],dt[1],round(v['priceComponents'][1]['priceExcludingVat']*100,2)))
        return res
        
    #===========================================================================================================
    def populateHourlyPrices(self):
        logging.info('Checking hourly prices')
        for zone in range(1,5):
            misDates = self.__getMissingDates(zone)
            if not misDates:
                continue
            logging.debug("Missing hourly date for zone=%s and dates=%s",zone, misDates)
            for d in misDates:
                self.__getNStoreWebHourlyPrise(d,zone)


    def __getMissingDates(self, zone):
        startDate = '2023-01-01'
        sql  = "WITH recursive Date_Ranges AS (select '%s' as date union all select date + interval 1 day from Date_Ranges where date < DATE_ADD(CURDATE(), INTERVAL 1 DAY)) " % startDate
        sql += "select date from Date_Ranges where date not in "
        sql += "(select date from GoteborEnergy.hourlyPrices where zone =%s and date >= '%s' group by zone, date having count(hour)=24);" % (zone, startDate)
        self.cursor.execute(sql)
        misDates = self.cursor.fetchall()
        return [x['date'] for x in misDates]


#tibber API:
#SE1 https://tibber.com/se/api/lookup/price-overview?postalCode=97232
#SE2 https://tibber.com/se/api/lookup/price-overview?postalCode=83751
#SE3 https://tibber.com/se/api/lookup/price-overview?postalCode=11543
#SE4 https://tibber.com/se/api/lookup/price-overview?postalCode=21115

#mydb = dbEnergy()
#mydb.updateTibberFee()
#mydb.populateHourlyPrices()
#mydb.getCurrentPrise(zone=3)
#mydb.getCurrentTibberPrise(zone=3)
#mydb.getDayPrise(zone=3, day='2023-08-08')
#mydb.getDayTibberPrise(zone=3, day='2023-10-27')
#mydb.getDailyStats(zone=3, day='2023-07-15')
#mydb.getDailyTibberStats(zone=3, day='2023-07-15')

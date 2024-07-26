import requests, time
from datetime import date, timedelta, datetime, time as t
import mysql.connector

class dbEnergy:
    def __init__(self):
        try:
            self.db = mysql.connector.connect( 
                host="",
                user="",
                password="",
                database="",
                connection_timeout=1
            )
            self.cursor = self.db.cursor(buffered=True)
        except:
            self.db = None
            print("DB not connected")

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

    #=========================================================================================================
    def __getDummy(self):
        print("Sending dummy data")
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
    def __getDayPriseDB(self, zone, day):
        fromWhere = " FROM hourlyprices WHERE zone = %s AND date = '%s';" % (zone,day)
        self.cursor.execute("SELECT COUNT(*)" + fromWhere)
        count = self.cursor.fetchone()[0]
        if count == 0:
            print ("No data in DB for %s. Reading from Web..." % (day))
            self.__getNStoreWebHourlyPrise(day, zone)

        return self.__getGetHourlyPriceDB(fromWhere)

    #===========================================================================================================
    def __getCurrentPriseDB(self, zone=3, day = date.today()):
        count = self.__getCurrCount(zone)

        if count == 0:
            print ("No today data in DB. Reading from Web...")
            prices = self.__getNStoreWebHourlyPrise(day, zone)
            count = len(prices)

        if count!= 0 and count <= 24 and datetime.now().hour > 12:
            print ("No tommorrow data in DB. Reading from Web...")
            self.__getNStoreWebHourlyPrise(day + timedelta(days=1), zone)

        count = self.__getCurrCount(zone)
        if count == 0:
            return None

        if count > 25:
            table = "currPrices"
        else:
            table = "fullCurPrices"
        fromWhere = "FROM %s  WHERE zone = %s;" % (table, zone)
        return self.__getGetHourlyPriceDB(fromWhere)
        
    #===========================================================================================================
    def __getGetHourlyPriceDB(self, fromWhere):
        sql = 'SELECT date, hour, value ' + fromWhere
        self.cursor.execute(sql)
        hprises = self.cursor.fetchall()
        if len(hprises) == 0:
            return None

        values = []
        for rec in hprises:
            values.append({"date":rec[0],"hour":int(rec[1]),"value":float(rec[2])})
        #nextDay = rec[0] + timedelta(days=1)
        values.append({"date":rec[0], "hour":24, "value":float(rec[2])})
        return values
    
    #===========================================================================================================
    def getDailyStats(self, zone, day):
        if self.db:
            sql = "SELECT DATE_FORMAT(DATE,'%%Y-%%m-%%d'), MIN, AVG, MAX FROM dailyStats WHERE zone = %s AND DATE >= (IF((NOW() - INTERVAL 15 DAY) < '%s', NOW() - INTERVAL 15 DAY, '%s') - INTERVAL 15 DAY) LIMIT 31;" % (zone, day, day)
            self.cursor.execute(sql)
            dprises = self.cursor.fetchall()

            values = []
            for rec in dprises:
                values.append({
                    "date": rec[0],
                    "min":  float(rec[1]),
                    "avg":  float(rec[2]),
                    "max":  float(rec[3])
                })
            return values
        else:
            return None

    #===========================================================================================================
    def getMonthlyStats(self, zone):
        if self.db:
            sql = "SELECT year,month,min,avg,max FROM monthlyStats WHERE zone = %s;" % (zone)
            self.cursor.execute(sql)
            dprises = self.cursor.fetchall()

            values = []
            for rec in dprises:
                values.append({
                    "year": rec[0],
                    "month":rec[1],
                    "min":  float(rec[2]),
                    "avg":  float(rec[3]),
                    "max":  float(rec[4])
                })
            return values
        else:
            return None

    #===========================================================================================================
    def __getCurrCount(self, zone):
        self.cursor.execute("SELECT count(*) FROM currPrices WHERE zone = %s;" % (zone))
        return self.cursor.fetchone()[0]

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
            self.cursor.executemany("""INSERT IGNORE INTO hourlyprices (zone, date, hour, value) VALUES (%s, %s, %s, %s)""", 
                                hprises)
            self.db.commit()
            print ("New data populated to DB")
        return hprises

    #===========================================================================================================
    def __getWebHourlyPrise(self, day, zone):
        parapms = {
            'zone': zone,
            'date': day,
        }
        #print("Request day" + parapms["date"])
        res = requests.post("https://www.goteborgenergi.se/external-web/Api/HourlyPricesStatisticsElement/GetHourlyPrices",parapms)
        dailyValues = []
        if res.status_code == 200:
            values = res.json()["result"]["values"]
            for v in values:
                dt = datetime.strptime(v['dateTime'],"%Y-%m-%d %H:%M") + timedelta(hours=2)
                dailyValues.append((zone, dt.strftime("%Y-%m-%d"), dt.hour, v['value']))
                
            #print(dailyValues)
        return dailyValues

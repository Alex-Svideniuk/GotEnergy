import requests, time
from datetime import date, timedelta, datetime, time as t
import mysql.connector

class dbEnergy:
    def __init__(self):
        try:
            self.db = mysql.connector.connect( 
                host="192.168.31.254",
                user="goteborenergy",
                password="F@Ww*Am4#IvG",
                database="GoteborEnergy",
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

    def getDailyPrise(self, zone, day):
        if self.db:
            return self.__getDailyPriseDB(zone, day)
        else:
            return None
    #===========================================================================================================
    def __getDummy(self):
        print("Sending dummy data")
        values = [{"y":0},{"y":0},{"y":0},{"y":0},{"y":30},{"y":60},{"y":90},{"y":60},{"y":30},{"y":0},{"y":-30},{"y":-60},{"y":-90},{"y":-60},{"y":-30},{"y":0},{"y":0},{"y":0},{"y":0},{"y":0},{"y":0},{"y":0},{"y":0},{"y":0},{"y":0}]
        dt = datetime.now()
        dt = dt.replace(hour=0, minute=0, second=0, microsecond=0)
        t = 0
        for v in values:
            v["x"] = dt.strftime("%Y-%m-%d %H:%M")
            dt = dt + timedelta(hours=1)

        return values
                            
    #===========================================================================================================
    def __getDayPriseDB(self, zone, day):
        sql = " FROM hourlyprices WHERE zone = %s AND DATE(datetime) = '%s';" % (zone,day)
        self.cursor.execute("SELECT COUNT(*)" + sql)
        count = self.cursor.fetchone()[0]
        if count == 0:
            print ("No data in DB for %s. Reading from Web..." % (day))
            self.__getNStoreWebHourlyPrise(day, zone)

        return self.__getGetHourlyPriceDB("SELECT datetime, value" + sql)

    #===========================================================================================================
    def __getCurrentPriseDB(self, zone=3, day = date.today()):
        count = self.__getCurrCount(zone)
        print(count)

        if count == 0:
            print ("No today data in DB. Reading from Web...")
            self.__getNStoreWebHourlyPrise(day, zone)
            count = 24

        if count <= 24:
            print ("No tommorrow data in DB. Reading from Web...")
            self.__getNStoreWebHourlyPrise(day + timedelta(days=1), zone)

        count = self.__getCurrCount(zone)
        print(count)

        if count > 24:
            table = "currPrices"
        else:
            table = "fullCurPrices"
        sql = "SELECT datetime, value FROM %s  WHERE zone = %s;" % (table, zone)
        return self.__getGetHourlyPriceDB(sql)
        
    #===========================================================================================================
    def __getGetHourlyPriceDB(self, sql):
        self.cursor.execute(sql)
        hprises = self.cursor.fetchall()

        values = []
        for rec in hprises:
            values.append({"x":rec[0].strftime("%Y-%m-%d %H:%M"),"y":rec[1]})
        values.append({"x":(rec[0]+timedelta(hours=1)).strftime("%Y-%m-%d %H:%M"), "y":rec[1]})
        return values
    
    #===========================================================================================================
    def __getDailyPriseDB(self, zone, day):
        sql = "SELECT DATE, MIN, AVG, MAX FROM dailyStats WHERE zone = %s AND DATE >= (IF((NOW() - INTERVAL 15 DAY) < '%s', NOW() - INTERVAL 15 DAY, '%s') - INTERVAL 15 DAY) LIMIT 31;" % (zone, day, day)
        self.cursor.execute(sql)
        dprises = self.cursor.fetchall()

        values = []
        for rec in dprises:
            values.append({
                "x":    rec[0].strftime("%Y-%m-%d"),
                "min":  rec[1],
                "avg":  rec[2],
                "max":  rec[3]
            })
        return values

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
    #def __getDatePriseDB(self, day, zone=3):
    #    self.cursor.execute("select * from hourlyprices where DATE(datetime) = %s and zone = %s;",[day,zone])
    #    hprises = self.cursor.fetchall()
    #    if len(hprises) == 0:
    #        hprises = self.__getNStoreWebHourlyPrise(day, zone)
    #    return hprises

    #===========================================================================================================
    def __getNStoreWebHourlyPrise(self, day, zone):
        hprises = self.__getWebHourlyPrise(day, zone)
        if len(hprises) != 0:
            self.cursor.executemany("""INSERT IGNORE INTO hourlyprices (zone, datetime, value) VALUES (%s, %s, %s)""", 
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
        #print("Responce" + str(res.status_code))
        dailyValues = []
        if res.status_code == 200:
            values = res.json()["result"]["values"]
            for v in values:
                dt = datetime.strptime(v['dateTime'],"%Y-%m-%d %H:%M") + timedelta(hours=2)
                dailyValues.append((zone, dt.strftime("%Y-%m-%d %H:%M:%S"),v['value']))
                
            #print(dailyValues)
        return dailyValues

#getHourlyPrise()
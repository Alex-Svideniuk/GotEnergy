from myslq import dbEnergy
from datetime import date
import logging, os

if not os.path.exists('logs'):
   os.makedirs('logs')

logging.basicConfig(format='%(asctime)s|%(levelname)s|%(message)s', 
                    datefmt='%Y-%m-%d %H:%M:%S', 
                    filename='logs/updater_%s.log' % date.today().isoformat(),
                    encoding='utf-8', level=logging.DEBUG)

logging.info("Updater script Started")
mydb = dbEnergy()
mydb.updateTibberFee()
mydb.populateHourlyPrices()
logging.info("Updater script Finished\n")


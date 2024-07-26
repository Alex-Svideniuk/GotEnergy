import tibber.const
import tibber
import asyncio
from datetime import datetime as dt
import pytz

access_token = 'tB0q8T3f2sEu8FpfN2k5Xa-TtFfU-pCQz7iYcnSRqnI'
tibber_connection = tibber.Tibber(access_token, user_agent="KattHuset",time_zone=pytz.UTC)

async def home_data():
  home = tibber_connection.get_homes(False)[0]
  await home.fetch_consumption_data()
  await home.update_info()
  print(home.current_price_data())

  await home.update_price_info()
  print(home.current_price_info)

async def start():
  await tibber_connection.update_info()
  print(tibber_connection.name)
  ids = tibber_connection.get_home_ids(False)
  tibber_connection
  print (ids)
  await home_data()
  await tibber_connection.close_connection()

loop = asyncio.get_event_loop()
loop.run_until_complete(start())
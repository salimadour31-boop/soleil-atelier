# Regenerates tests/reference-astral.json with the independent Python "astral" package (pip install astral==3.2).
# Run from the repository root: python tests/make-reference.py
import json, datetime as dt
from zoneinfo import ZoneInfo
from astral import LocationInfo, Observer
from astral import sun, moon
from astral.sun import SunDirection
places=[("Alger",36.7538,3.0588,"Africa/Algiers"),("Tizi Ouzou",36.7169,4.0497,"Africa/Algiers"),("Paris",48.8566,2.3522,"Europe/Paris"),
("Montreal",45.5019,-73.5674,"America/Toronto"),("Sydney",-33.8688,151.2093,"Australia/Sydney"),("Reykjavik",64.1466,-21.9426,"Atlantic/Reykjavik"),("Tamanrasset",22.785,5.5228,"Africa/Algiers")]
dates=[(2026,1,15),(2026,3,29),(2026,6,21),(2026,10,17),(2026,12,21)]
out=[]
ms=lambda d: None if d is None else int(d.timestamp()*1000)
def safe(f):
    try: return f()
    except Exception: return None
for name,lat,lon,tz in places:
    o=Observer(lat,lon,0); z=ZoneInfo(tz)
    for y,m,d in dates:
        D=dt.date(y,m,d); r={"place":name,"lat":lat,"lon":lon,"tz":tz,"date":[y,m,d]}
        r["sunrise"]=ms(safe(lambda: sun.sunrise(o,D,z))); r["sunset"]=ms(safe(lambda: sun.sunset(o,D,z))); r["noon"]=ms(sun.noon(o,D,z))
        r["civilDawn"]=ms(safe(lambda: sun.dawn(o,D,6,z))); r["civilDusk"]=ms(safe(lambda: sun.dusk(o,D,6,z)))
        r["nauticalDawn"]=ms(safe(lambda: sun.dawn(o,D,12,z))); r["astroDusk"]=ms(safe(lambda: sun.dusk(o,D,18,z)))
        g=safe(lambda: sun.golden_hour(o,D,SunDirection.RISING,z)); r["goldenMorning"]=[ms(g[0]),ms(g[1])] if g else None
        g=safe(lambda: sun.golden_hour(o,D,SunDirection.SETTING,z)); r["goldenEvening"]=[ms(g[0]),ms(g[1])] if g else None
        b=safe(lambda: sun.blue_hour(o,D,SunDirection.SETTING,z)); r["blueEvening"]=[ms(b[0]),ms(b[1])] if b else None
        r["moonrise"]=ms(safe(lambda: moon.moonrise(o,D,z))); r["moonset"]=ms(safe(lambda: moon.moonset(o,D,z)))
        r["moonPhase"]=moon.phase(D)
        t=dt.datetime(y,m,d,12,0,tzinfo=z); r["probe"]=ms(t); r["probeAz"]=sun.azimuth(o,t); r["probeEl"]=sun.elevation(o,t,with_refraction=False)
        out.append(r)
json.dump(out,open('tests/reference-astral.json','w'),indent=0)
print(len(out))

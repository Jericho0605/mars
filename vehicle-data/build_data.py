"""Rebuild offline from the official downloaded archive; standard-library only."""
import csv, io, json, zipfile, pathlib, sqlite3, hashlib, collections
from datetime import datetime, timezone
ROOT=pathlib.Path(__file__).resolve().parent
ARCHIVE=ROOT/'raw/vehicles.csv.zip'
SOURCE='https://www.fueleconomy.gov/feg/epadata/vehicles.csv.zip'
def number(r,key,positive=False):
    try: v=float(r.get(key,''))
    except (ValueError,TypeError): return None
    if v<0 or (positive and v==0): return None
    return int(v) if v.is_integer() else v

def normalize(r):
    atv=r['atvType']; electric=atv in ('EV','Plug-in Hybrid'); hydrogen=atv in ('FCV','eFCV') or r['fuelType1']=='Hydrogen'
    pt={'EV':'BEV','Hybrid':'HEV','Plug-in Hybrid':'PHEV','Diesel':'DIESEL','FFV':'FLEX_FUEL','FCV':'FCEV','eFCV':'FCEV'}.get(atv,'GASOLINE' if 'gas' in r['fuelType1'].lower() else 'OTHER')
    fuel_mpg=number(r,'comb08',True) if not (pt=='BEV' or hydrogen) else None
    ev_range=number(r,'range',True) if pt=='BEV' else None
    alt_range=number(r,'rangeA',True) if pt=='PHEV' else None
    kwh=number(r,'combE',True) if electric else None
    flags=['sales_trim_not_verified','price_missing','seats_missing','battery_capacity_missing','connector_missing']
    if pt=='PHEV':flags.append('charge_depleting_range_is_not_guaranteed_engine_off_range')
    if electric and kwh is None:flags.append('electric_consumption_missing')
    return dict(epa_id=int(r['id']),market='US',model_year=int(r['year']),make=r['make'],model=r['model'],base_model=r['baseModel'],sales_trim=None,
      powertrain=pt,epa_atv_type=atv or None,drive=r['drive'] or None,transmission=r['trany'] or None,engine_description=r['eng_dscr'] or None,engine_displacement_l=number(r,'displ',True),cylinders=number(r,'cylinders',True),vehicle_class=r['VClass'],fuel_primary=r['fuelType1'],fuel_secondary=r['fuelType2'] or None,
      fuel_mpg_city=number(r,'city08',True) if fuel_mpg else None,fuel_mpg_highway=number(r,'highway08',True) if fuel_mpg else None,fuel_mpg_combined=fuel_mpg,fuel_l_per_100km=round(235.214583/fuel_mpg,3) if fuel_mpg else None,
      ev_mpge_combined=number(r,'comb08',True) if pt=='BEV' else None,electric_kwh_per_100mi=kwh,electric_kwh_per_100km=round(kwh/1.609344,4) if kwh else None,
      bev_range_mi=ev_range,bev_range_km=round(ev_range*1.609344,2) if ev_range else None,phev_charge_depleting_range_mi=alt_range,
      phev_blended=r['phevBlended'].lower()=='true' if pt=='PHEV' else None,phev_cd_gal_per_100mi=number(r,'combinedCD') if pt=='PHEV' else None,phev_epa_utility_factor=number(r,'combinedUF') if pt=='PHEV' else None,
      epa_charge240_hours=number(r,'charge240',True) if electric else None,epa_charge240_description=r['c240Dscr'] or None,
      epa_primary_tailpipe_co2_g_per_mi=number(r,'co2TailpipeGpm'),seats=None,battery_capacity_kwh=None,ac_connector=None,dc_connector=None,base_msrp_usd=None,destination_usd=None,current_market_price_usd=None,
      base_msrp_filter_ready=False,budget_filter_ready=False,seat_filter_ready=False,source_url='https://www.fueleconomy.gov/ws/rest/vehicle/'+r['id'],epa_modified_on=r['modifiedOn'],quality_flags=flags)

def write(name,data): (ROOT/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def main():
    with zipfile.ZipFile(ARCHIVE) as z:raw=list(csv.DictReader(io.TextIOWrapper(z.open('vehicles.csv'),encoding='utf-8-sig')))
    selected=[r for r in raw if 2024<=int(r['year'])<=2026]
    rows=sorted((normalize(r) for r in selected),key=lambda r:(r['model_year'],r['make'],r['model'],r['epa_id']))
    assert len({r['epa_id'] for r in rows})==len(rows)
    assert all(r['fuel_mpg_combined'] is None and r['ev_mpge_combined'] for r in rows if r['powertrain']=='BEV')
    assert all(r['base_msrp_usd'] is None for r in rows)
    write('vehicles-2024-2026.json',rows)
    byid={r['epa_id']:r for r in rows}
    overrides=json.loads((ROOT/'curated-overrides.json').read_text())
    curated=[]
    for o in overrides:
        r=dict(byid[o['epa_id']]);r.update(o);r['base_msrp_filter_ready']=True
        r['quality_flags']=[f for f in r['quality_flags'] if f not in ('sales_trim_not_verified','price_missing')]+o.get('additional_flags',[])
        r['field_sources']={'identity_efficiency_drive':r['source_url'],'sales_trim_base_msrp':r['price_source_url']}
        if r.get('destination_usd') is not None:r['field_sources']['destination_usd']=r['price_source_url']
        if r.get('battery_capacity_kwh') is not None:
            r['field_sources']['battery_capacity_kwh']=r['price_source_url'];r['quality_flags'].remove('battery_capacity_missing')
        assert r['make']==o['expected_make'] and r['model']==o['expected_epa_model'],o
        curated.append(r)
    write('curated-2025.json',curated)
    with sqlite3.connect(ROOT/'vehicles.sqlite') as db:
        db.execute('DROP TABLE IF EXISTS vehicles');db.execute('CREATE TABLE vehicles (epa_id INTEGER PRIMARY KEY, model_year INTEGER, make TEXT, model TEXT, powertrain TEXT, drive TEXT, data_json TEXT)')
        db.executemany('INSERT INTO vehicles VALUES (?,?,?,?,?,?,?)',[(r['epa_id'],r['model_year'],r['make'],r['model'],r['powertrain'],r['drive'],json.dumps(r)) for r in rows])
        db.execute('DROP TABLE IF EXISTS curated');db.execute('CREATE TABLE curated (epa_id INTEGER PRIMARY KEY REFERENCES vehicles(epa_id), sales_trim TEXT, base_msrp_usd REAL, data_json TEXT)')
        db.executemany('INSERT INTO curated VALUES (?,?,?,?)',[(r['epa_id'],r['sales_trim'],r['base_msrp_usd'],json.dumps(r)) for r in curated])
        db.execute('CREATE INDEX IF NOT EXISTS vehicle_search ON vehicles(model_year,make,powertrain)')
    report=dict(source_url=SOURCE,raw_archive_sha256=hashlib.sha256(ARCHIVE.read_bytes()).hexdigest(),downloaded_at_utc=datetime.fromtimestamp(ARCHIVE.stat().st_mtime,timezone.utc).isoformat(),generated_at_utc=datetime.now(timezone.utc).isoformat(),raw_records=len(raw),selected_records=len(rows),curated_records=len(curated),years=dict(collections.Counter(r['model_year'] for r in rows)),makes=len(set(r['make'] for r in rows)),powertrains=dict(collections.Counter(r['powertrain'] for r in rows)),quality_flags=dict(collections.Counter(f for r in rows for f in r['quality_flags'])),checks=['EPA IDs unique','BEV MPGe never stored as gasoline MPG','Missing prices retained as null','Curated make and EPA model identities match','All source records retained in raw archive'])
    write('quality-report.json',report)
    print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=='__main__':main()

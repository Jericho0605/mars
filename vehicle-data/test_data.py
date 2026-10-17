import json, unittest
from pathlib import Path
from build_data import normalize
ROOT=Path(__file__).resolve().parent
class DataTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.rows=json.loads((ROOT/'vehicles-2024-2026.json').read_text());cls.curated=json.loads((ROOT/'curated-2025.json').read_text())
 def test_no_duplicated_ids(self):self.assertEqual(len(self.rows),len({r['epa_id'] for r in self.rows}))
 def test_ev_not_gas_mpg(self):
  for r in self.rows:
   if r['powertrain']=='BEV':self.assertIsNone(r['fuel_mpg_combined']);self.assertGreater(r['ev_mpge_combined'],0)
 def test_units(self):
  for r in self.rows:
   if r['fuel_mpg_combined']:self.assertAlmostEqual(r['fuel_l_per_100km'],235.214583/r['fuel_mpg_combined'],places=3)
   if r['electric_kwh_per_100mi']:self.assertAlmostEqual(r['electric_kwh_per_100km'],r['electric_kwh_per_100mi']/1.609344,places=4)
 def test_unknown_prices_not_free(self):
  for r in self.rows:self.assertIsNone(r['base_msrp_usd']);self.assertIsNone(r['current_market_price_usd'])
 def test_phev_modes(self):
  for r in self.rows:
   if r['powertrain']=='PHEV':self.assertGreater(r['fuel_mpg_combined'],0);self.assertGreater(r['electric_kwh_per_100mi'],0);self.assertIsNone(r['bev_range_mi'])
 def test_curated_joins(self):
  source={r['epa_id']:r for r in self.rows}
  for r in self.curated:
   self.assertEqual(r['model_year'],2025);self.assertGreater(r['base_msrp_usd'],0)
   for k in ['drive','fuel_mpg_combined','electric_kwh_per_100mi','bev_range_mi']:self.assertEqual(r[k],source[r['epa_id']][k])
   self.assertTrue(r['price_source_url'].startswith('https://'));self.assertIsNone(r['current_market_price_usd'])
 def test_range_conflict_retained(self):
  r=next(r for r in self.curated if r['epa_id']==49015)
  self.assertEqual(r['manufacturer_published_electric_range_mi'],44);self.assertEqual(r['phev_charge_depleting_range_mi'],45)
 def test_zero_tailpipe_is_not_total_emissions(self):
  leaf=next(r for r in self.rows if r['epa_id']==48400)
  self.assertEqual(leaf['epa_primary_tailpipe_co2_g_per_mi'],0)
  self.assertGreater(leaf['electric_kwh_per_100mi'],0)
if __name__=='__main__':unittest.main()

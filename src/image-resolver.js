import {mediaKey, vehiclePresentation} from './vehicle-media.js';

const brandDomains = {
  'Acura': 'https://www.acura.com',
  'Alfa Romeo': 'https://www.alfaromeousa.com',
  'Aston Martin': 'https://www.astonmartin.com',
  'Audi': 'https://www.audiusa.com',
  'Bentley': 'https://www.bentleymotors.com',
  'BMW': 'https://www.bmwusa.com',
  'Bugatti': 'https://www.bugatti.com',
  'Buick': 'https://www.buick.com',
  'Cadillac': 'https://www.cadillac.com',
  'Chevrolet': 'https://www.chevrolet.com',
  'Chrysler': 'https://www.chrysler.com',
  'Dodge': 'https://www.dodge.com',
  'Ferrari': 'https://www.ferrari.com',
  'Fiat': 'https://www.fiatusa.com',
  'Fisker': 'https://www.fiskerinc.com',
  'Ford': 'https://www.ford.com',
  'Genesis': 'https://www.genesis.com/us/en',
  'GMC': 'https://www.gmc.com',
  'Honda': 'https://automobiles.honda.com',
  'Hyundai': 'https://www.hyundaiusa.com',
  'Infiniti': 'https://www.infinitiusa.com',
  'Jaguar': 'https://www.jaguarusa.com',
  'Jeep': 'https://www.jeep.com',
  'Kia': 'https://www.kia.com/us/en',
  'Lamborghini': 'https://www.lamborghini.com',
  'Land Rover': 'https://www.landroverusa.com',
  'Lexus': 'https://www.lexus.com',
  'Lincoln': 'https://www.lincoln.com',
  'Lucid': 'https://www.lucidmotors.com',
  'Maserati': 'https://www.maserati.com/us/en',
  'Mazda': 'https://www.mazdausa.com',
  'McLaren': 'https://cars.mclaren.com',
  'Mercedes-Benz': 'https://www.mbusa.com',
  'MINI': 'https://www.miniusa.com',
  'Mitsubishi': 'https://www.mitsubishicars.com',
  'Nissan': 'https://www.nissanusa.com',
  'Polestar': 'https://www.polestar.com/us',
  'Porsche': 'https://www.porsche.com/usa',
  'Ram': 'https://www.ramtrucks.com',
  'Rivian': 'https://rivian.com',
  'Rolls-Royce': 'https://www.rolls-roycemotorcars.com',
  'Subaru': 'https://www.subaru.com',
  'Tesla': 'https://www.tesla.com',
  'Toyota': 'https://www.toyota.com',
  'Volkswagen': 'https://www.vw.com',
  'Volvo': 'https://www.volvocars.com/us'
};

export function getOfficialUrl(v) {
  if (v.sources?.manufacturerUrl) return v.sources.manufacturerUrl;
  const b = v.brand;
  const m = (v.model || '').toLowerCase();
  
  if (b === 'Tesla') {
    if (m.includes('model 3')) return 'https://www.tesla.com/model3';
    if (m.includes('model y')) return 'https://www.tesla.com/modely';
    if (m.includes('model s')) return 'https://www.tesla.com/models';
    if (m.includes('model x')) return 'https://www.tesla.com/modelx';
    if (m.includes('cybertruck')) return 'https://www.tesla.com/cybertruck';
  }
  if (b === 'Toyota') {
    if (m.includes('prius')) return 'https://www.toyota.com/prius/';
    if (m.includes('rav4')) return 'https://www.toyota.com/rav4/';
    if (m.includes('camry')) return 'https://www.toyota.com/camry/';
    if (m.includes('corolla cross')) return 'https://www.toyota.com/corollacross/';
    if (m.includes('corolla')) return 'https://www.toyota.com/corolla/';
    if (m.includes('highlander')) return 'https://www.toyota.com/highlander/';
    if (m.includes('grand highlander')) return 'https://www.toyota.com/grandhighlander/';
    if (m.includes('sienna')) return 'https://www.toyota.com/sienna/';
    if (m.includes('tacoma')) return 'https://www.toyota.com/tacoma/';
    if (m.includes('tundra')) return 'https://www.toyota.com/tundra/';
    if (m.includes('bz4x')) return 'https://www.toyota.com/bz4x/';
  }
  if (b === 'Honda') {
    if (m.includes('cr-v')) return 'https://automobiles.honda.com/cr-v';
    if (m.includes('civic')) return 'https://automobiles.honda.com/civic-sedan';
    if (m.includes('accord')) return 'https://automobiles.honda.com/accord';
    if (m.includes('pilot')) return 'https://automobiles.honda.com/pilot';
    if (m.includes('odyssey')) return 'https://automobiles.honda.com/odyssey';
    if (m.includes('hr-v')) return 'https://automobiles.honda.com/hr-v';
    if (m.includes('prologue')) return 'https://automobiles.honda.com/prologue';
  }
  if (b === 'Ford') {
    if (m.includes('mach-e')) return 'https://www.ford.com/suvs/mach-e/';
    if (m.includes('mustang')) return 'https://www.ford.com/cars/mustang/';
    if (m.includes('f-150') || m.includes('f150')) return 'https://www.ford.com/trucks/f150/';
    if (m.includes('maverick')) return 'https://www.ford.com/trucks/maverick/';
    if (m.includes('explorer')) return 'https://www.ford.com/suvs/explorer/';
    if (m.includes('bronco')) return 'https://www.ford.com/suvs/bronco/';
  }
  if (b === 'Kia') {
    if (m.includes('ev9')) return 'https://www.kia.com/us/en/ev9';
    if (m.includes('ev6')) return 'https://www.kia.com/us/en/ev6';
    if (m.includes('telluride')) return 'https://www.kia.com/us/en/telluride';
    if (m.includes('sportage')) return 'https://www.kia.com/us/en/sportage';
    if (m.includes('sorento')) return 'https://www.kia.com/us/en/sorento';
    if (m.includes('carnival')) return 'https://www.kia.com/us/en/carnival';
    if (m.includes('niro')) return 'https://www.kia.com/us/en/niro';
  }
  if (b === 'Hyundai') {
    if (m.includes('ioniq 5')) return 'https://www.hyundaiusa.com/us/en/vehicles/ioniq-5';
    if (m.includes('ioniq 6')) return 'https://www.hyundaiusa.com/us/en/vehicles/ioniq-6';
    if (m.includes('tucson')) return 'https://www.hyundaiusa.com/us/en/vehicles/tucson';
    if (m.includes('palisade')) return 'https://www.hyundaiusa.com/us/en/vehicles/palisade';
    if (m.includes('santa fe')) return 'https://www.hyundaiusa.com/us/en/vehicles/santa-fe';
    if (m.includes('elantra')) return 'https://www.hyundaiusa.com/us/en/vehicles/elantra';
  }
  if (b === 'Volkswagen') {
    if (m.includes('id. buzz') || m.includes('id.buzz')) return 'https://www.vw.com/en/models/id-buzz.html';
    if (m.includes('id.4') || m.includes('id. 4')) return 'https://www.vw.com/en/models/id-4.html';
    if (m.includes('atlas')) return 'https://www.vw.com/en/models/atlas.html';
    if (m.includes('tiguan')) return 'https://www.vw.com/en/models/tiguan.html';
    if (m.includes('gti') || m.includes('golf')) return 'https://www.vw.com/en/models/golf-gti.html';
  }
  if (b === 'Nissan') {
    if (m.includes('leaf')) return 'https://www.nissanusa.com/vehicles/electric-cars/leaf.html';
    if (m.includes('ariya')) return 'https://www.nissanusa.com/vehicles/electric-cars/ariya.html';
    if (m.includes('rogue')) return 'https://www.nissanusa.com/vehicles/crossovers-suvs/rogue.html';
    if (m.includes('pathfinder')) return 'https://www.nissanusa.com/vehicles/crossovers-suvs/pathfinder.html';
  }
  if (b === 'Subaru') {
    if (m.includes('outback')) return 'https://www.subaru.com/vehicles/outback.html';
    if (m.includes('forester')) return 'https://www.subaru.com/vehicles/forester.html';
    if (m.includes('crosstrek')) return 'https://www.subaru.com/vehicles/crosstrek.html';
    if (m.includes('ascent')) return 'https://www.subaru.com/vehicles/ascent.html';
    if (m.includes('solterra')) return 'https://www.subaru.com/vehicles/solterra.html';
  }
  if (b === 'Rivian') {
    if (m.includes('r1s')) return 'https://rivian.com/r1s';
    if (m.includes('r1t')) return 'https://rivian.com/r1t';
  }
  if (b === 'Chrysler' && m.includes('pacifica')) return 'https://www.chrysler.com/pacifica.html';
  if (b === 'Chevrolet') {
    if (m.includes('corvette')) return 'https://www.chevrolet.com/performance/corvette';
    if (m.includes('camaro')) return 'https://www.chevrolet.com/performance/camaro';
    if (m.includes('silverado')) return 'https://www.chevrolet.com/trucks/silverado/1500';
    if (m.includes('tahoe')) return 'https://www.chevrolet.com/suvs/tahoe';
    if (m.includes('suburban')) return 'https://www.chevrolet.com/suvs/suburban';
    if (m.includes('equinox')) return 'https://www.chevrolet.com/suvs/equinox';
    if (m.includes('traverse')) return 'https://www.chevrolet.com/suvs/traverse';
  }
  if (b === 'BMW') {
    if (m.includes('330') || m.includes('m340') || m.includes('3 series')) return 'https://www.bmwusa.com/vehicles/3-series/sedan/overview.html';
    if (m.includes('x3')) return 'https://www.bmwusa.com/vehicles/x-models/x3/sports-activity-vehicle/overview.html';
    if (m.includes('x5')) return 'https://www.bmwusa.com/vehicles/x-models/x5/sports-activity-vehicle/overview.html';
    if (m.includes('x7')) return 'https://www.bmwusa.com/vehicles/x-models/x7/sports-activity-vehicle/overview.html';
    if (m.includes('i4')) return 'https://www.bmwusa.com/vehicles/all-electric/i4/gran-coupe/overview.html';
    if (m.includes('ix')) return 'https://www.bmwusa.com/vehicles/all-electric/ix/sports-activity-vehicle/overview.html';
  }
  if (b === 'Mercedes-Benz') {
    if (m.includes('c 300') || m.includes('c-class')) return 'https://www.mbusa.com/en/vehicles/class/c-class/sedan';
    if (m.includes('e 350') || m.includes('e-class')) return 'https://www.mbusa.com/en/vehicles/class/e-class/sedan';
    if (m.includes('s 500') || m.includes('s-class')) return 'https://www.mbusa.com/en/vehicles/class/s-class/sedan';
    if (m.includes('glc')) return 'https://www.mbusa.com/en/vehicles/class/glc/suv';
    if (m.includes('gle')) return 'https://www.mbusa.com/en/vehicles/class/gle/suv';
    if (m.includes('gls')) return 'https://www.mbusa.com/en/vehicles/class/gls/suv';
    if (m.includes('eqe')) return 'https://www.mbusa.com/en/vehicles/class/eqe/sedan';
    if (m.includes('eqs')) return 'https://www.mbusa.com/en/vehicles/class/eqs/sedan';
  }
  if (b === 'Porsche') {
    if (m.includes('911')) return 'https://www.porsche.com/usa/models/911/';
    if (m.includes('taycan')) return 'https://www.porsche.com/usa/models/taycan/';
    if (m.includes('macan')) return 'https://www.porsche.com/usa/models/macan/';
    if (m.includes('cayenne')) return 'https://www.porsche.com/usa/models/cayenne/';
    if (m.includes('panamera')) return 'https://www.porsche.com/usa/models/panamera/';
    if (m.includes('718') || m.includes('boxster') || m.includes('cayman')) return 'https://www.porsche.com/usa/models/718/';
  }

  return brandDomains[b] || ('https://www.google.com/search?q=' + encodeURIComponent(`${v.year} ${b} ${v.model} official website`));
}

export function resolveVehicleImage(v, catalog = {}) {
  const key = v.brand === 'Honda' && v.year === 2025
    ? (/^CR-V /.test(v.model) ? 'hondaCrv' : v.model === 'Civic 4Dr' ? 'hondaCivicSedan' : null)
    : mediaKey(v);
  const asset = key ? catalog[key] : null;
  const photo = asset && asset.referenceYear === v.year && asset.sourcePage && asset.credit && asset.license ? asset : null;
  
  const officialUrl = getOfficialUrl(v);
  const inventoryUrl = vehiclePresentation(v).purchase.officialUrl || ('https://www.google.com/search?q=' + encodeURIComponent(`${v.year} ${v.brand} ${v.model} for sale inventory`));

  return {
    imageUrl: photo?.src ?? null,
    imageSource: photo?.sourcePage ?? null,
    imageLicense: photo?.license ?? null,
    imageAttribution: photo?.credit ?? null,
    imageModelYear: photo?.referenceYear ?? null,
    imageMatchLevel: photo ? 'Same Model / Year' : 'Generic Body Type',
    imageLicenseUrl: photo?.licenseUrl ?? null,
    bodyType: v.bodyType ?? null,
    officialVehicleUrl: officialUrl,
    inventoryUrl: inventoryUrl
  };
}

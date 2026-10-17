import fs from 'node:fs';
import {recommend} from '../src/recommend.js';
import {scenarios} from '../src/scenarios.js';
const db=JSON.parse(fs.readFileSync('data/vehicles.json'));
const results=Object.fromEntries(Object.entries(scenarios).map(([name,profile])=>{const r=recommend(db,profile);return [name,{profile,assumptions:'Editable user demo assumptions; official vehicle facts stay in vehicle database',annualMiles:r.mileage.annualMiles,excluded:r.excluded,top3:r.recommendations.map(x=>({id:x.vehicle.id,year:x.vehicle.year,brand:x.vehicle.brand,model:x.vehicle.model,trim:x.vehicle.trim,msrpUsd:x.vehicle.specifications.msrpUsd,seats:x.vehicle.specifications.seats,score:x.score,coverage:x.coverage,annualEnergyUsd:x.cost.annualEnergyUsd,tcoRangeUsd:x.cost.tcoRangeUsd,confidence:x.cost.confidence}))}];}));
fs.writeFileSync('data/demo-results.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));

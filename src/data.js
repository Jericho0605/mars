import fs from 'node:fs';
import crypto from 'node:crypto';
export const EPA='https://www.fueleconomy.gov/feg/epadata/vehicles.csv';
export const fields=['engineHorsepowerHp','motorHorsepowerHp','systemHorsepowerHp','horsepowerHp','powerKw','torqueNm','engineDisplacementL','zeroTo60Sec','topSpeedMph','combinedMpg','cityMpg','highwayMpg','combinedMpge','electricConsumptionKwhPer100Mi','epaRangeMiles','fuelTankGallons','batteryCapacityKwh','usableBatteryCapacityKwh','dcFastChargeKw','charge10To80Min','acChargeKw','lengthMm','widthMm','heightMm','wheelbaseMm','curbWeightKg','groundClearanceMm','seats','cargoVolumeL','maxCargoVolumeL','towingCapacityKg','payloadKg','msrpUsd','nhtsaOverallStars','iihsRating','vehicleWarranty','batteryWarranty','reliabilityScore','driverAssistance'];
fields.push('tailpipeCo2GPerMi');
export function csv(text){let rows=[],row=[],cell='',q=false;for(let i=0;i<text.length;i++){let c=text[i];if(c==='"'){if(q&&text[i+1]==='"'){cell+='"';i++;}else q=!q;}else if(!q&&(c===','||c==='\n')){row.push(cell.replace(/\r$/,''));cell='';if(c==='\n'){rows.push(row);row=[];}}else cell+=c;}if(q)throw Error('Unclosed CSV quote');if(cell||row.length){row.push(cell.replace(/\r$/,''));rows.push(row);}let h=rows.shift();return rows.filter(r=>r.some(Boolean)).map(r=>Object.fromEntries(h.map((k,i)=>[k.replace(/^\uFEFF/,''),r[i]??''])));}
const num=x=>x!==''&&x!=null&&Number.isFinite(+x)&&+x>0?+x:null;
export function normalize(r,at=new Date().toISOString()){
 let pt=r.atvType==='EV'?'EV':r.atvType==='Plug-in Hybrid'?'PHEV':r.atvType==='Hybrid'?'HEV':'Gas';
 // Other fuel technologies are excluded rather than mislabeled as gasoline.
 if(!['EV','PHEV','HEV'].includes(pt)&&!['Regular Gasoline','Premium Gasoline','Midgrade Gasoline'].includes(r.fuelType1))return null;
 let specs=Object.fromEntries(fields.map(f=>[f,null])), provenance={};
 let url=`https://www.fueleconomy.gov/ws/rest/vehicle/${r.id}`;
 function set(f,key){let v=num(r[key]);if(v!==null){specs[f]=v;provenance[f]={url,sourceField:key,retrievedAt:at,confidence:'official'};}}
 set('engineDisplacementL','displ');
 if(r.co2TailpipeGpm!==undefined&&r.co2TailpipeGpm!==''&&Number.isFinite(+r.co2TailpipeGpm)&&+r.co2TailpipeGpm>=0){specs.tailpipeCo2GPerMi=+r.co2TailpipeGpm;provenance.tailpipeCo2GPerMi={url,sourceField:'co2TailpipeGpm',retrievedAt:at,confidence:'official',scope:'EPA test tailpipe only; excludes electricity generation and vehicle manufacture'};}
 if(pt!=='EV'){set('combinedMpg','comb08');set('cityMpg','city08');set('highwayMpg','highway08');}
 if(pt==='EV'||pt==='PHEV'){set('combinedMpge',pt==='EV'?'comb08':'combA08');set('electricConsumptionKwhPer100Mi','combE');set('epaRangeMiles',pt==='EV'?'range':'rangeA');}
 return {id:`epa-${r.id}`,brand:r.make.trim(),model:r.model.trim(),year:+r.year,trim:null,bodyType:null,epaVehicleClass:r.VClass||null,powertrain:pt,fuelType:r.fuelType1,drivetrain:({'Front-Wheel Drive':'FWD','Rear-Wheel Drive':'RWD','All-Wheel Drive':'AWD','4-Wheel Drive':'4WD','Part-time 4-Wheel Drive':'4WD'})[r.drive]??null,transmission:r.trany||null,variant:{engineId:r.engId||null,cylinders:num(r.cylinders),engineDescription:r.eng_dscr||null,transmissionDescription:r.trans_dscr||null},specifications:specs,sources:{epaVehicleId:r.id,epaUrl:url,lastUpdated:at,manufacturerUrl:null,nhtsaUrl:null},fieldSources:provenance};
}
export function validate(v){
 if(!v.id||!v.brand||!v.model||!Number.isInteger(v.year)||v.year<1984||v.year>2100)throw Error('Invalid vehicle identity');
 const textFields=['iihsRating','vehicleWarranty','batteryWarranty','reliabilityScore','driverAssistance'];
 const maxima={horsepowerHp:5000,engineHorsepowerHp:5000,motorHorsepowerHp:5000,systemHorsepowerHp:5000,msrpUsd:10000000,nhtsaOverallStars:5,lengthMm:20000,widthMm:5000,heightMm:6000,seats:100,zeroTo60Sec:120,batteryCapacityKwh:1000};
 for(const[k,x]of Object.entries(v.specifications)){
  if(!fields.includes(k))throw Error(`Unknown specification ${k}`);
  if(x===null)continue;
  if(!textFields.includes(k)&&(typeof x!=='number'||!Number.isFinite(x)||(k==='tailpipeCo2GPerMi'?x<0:x<=0)))throw Error(`Invalid ${k}`);
  if(maxima[k]!==undefined&&x>maxima[k])throw Error(`Out of range ${k}`);
  if(!v.fieldSources[k]?.url)throw Error(`Missing source: ${k}`);
 }
 if(v.specifications.seats!=null&&!Number.isInteger(v.specifications.seats))throw Error('Invalid seats');
 if(v.specifications.nhtsaOverallStars!=null&&!Number.isInteger(v.specifications.nhtsaOverallStars))throw Error('Invalid safety stars');
 if(v.powertrain==='EV'&&v.specifications.combinedMpg!==null)throw Error('EV MPG is MPGe');return v;
}
export function importRows(rows,start=2024,end=2026,retrievedAt=new Date().toISOString()){let seen=new Map();for(let r of rows){if(+r.year<start||+r.year>end)continue;let v=normalize(r,retrievedAt);if(v){validate(v);if(seen.has(v.id)&&JSON.stringify(seen.get(v.id).variant)!==JSON.stringify(v.variant))throw Error('Conflicting EPA ID');seen.set(v.id,v);}}return [...seen.values()];}
export function supplement(vehicles,entries){let copy=structuredClone(vehicles);for(let e of entries){let v=copy.find(v=>v.id===e.id);if(!v)throw Error('Unknown EPA ID');for(let k of ['year','brand','model','trim','drivetrain','powertrain'])if(!(k in e.match)||e.match[k]!==v[k])throw Error(`Identity mismatch: ${k}`);if(!e.source?.url||!e.source?.retrievedAt||!e.source?.evidence)throw Error('Source URL, date and evidence required');let u=new URL(e.source.url);if(u.protocol!=='https:')throw Error('HTTPS source required');for(let [k,x] of Object.entries(e.specifications)){if(!fields.includes(k))throw Error(`Unknown field ${k}`);v.specifications[k]=x;v.fieldSources[k]={...e.source,confidence:'human-verified'};}validate(v);}return copy;}
export async function download(path,refresh=false){if(fs.existsSync(path)&&!refresh)return;let response=await fetch(EPA,{signal:AbortSignal.timeout(120000)});if(!response.ok)throw Error(`EPA HTTP ${response.status}`);let text=await response.text();if(!text.includes('comb08')||!text.includes('fuelType1'))throw Error('Invalid EPA download');fs.writeFileSync(path+'.tmp',text);fs.renameSync(path+'.tmp',path);}
export function report(v){return {generatedAt:new Date().toISOString(),count:v.length,distinctModels:new Set(v.map(x=>`${x.year}/${x.brand}/${x.model}`)).size,powertrains:Object.fromEntries(['Gas','HEV','PHEV','EV'].map(p=>[p,v.filter(x=>x.powertrain===p).length])),missing:Object.fromEntries(fields.map(f=>[f,v.filter(x=>x.specifications[f]===null).length])),sha256:crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex')};}

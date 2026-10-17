// Maintainer-reviewed official facts. This creates explicit EPA-ID-bound import entries,
// never searches by model name or applies a model's starting price to every trim.
import fs from 'node:fs';
const db=JSON.parse(fs.readFileSync('data/vehicles.json'));
const at='2026-10-16T18:00:00Z'; // Original official-source review session; do not refresh without re-review.
const source=(url,evidence,extra={})=>({url,retrievedAt:at,evidence,...extra});
const toyota=(model,year)=>`https://www.buyatoyota.com/home/vehicles/${model}/${year}/`;
const prius24='https://www.toyota.com/content/dam/toyota/brochures/pdf/2024/prius_ebrochure.pdf';
const prime24='https://www.toyota.com/content/dam/toyota/brochures/pdf/2024/priusprime_ebrochure.pdf';
const hatch25='https://www.toyota.com/content/dam/toyota/brochures/pdf/2025/corolla-hb-ebro.pdf';
const prius25Power='https://pressroom.toyota.com/2025-toyota-prius-gets-a-moody-vibe-with-new-nightshade-grade/';
const phev25Power='https://pressroom.toyota.com/electrify-the-road-in-the-2025-toyota-prius-plug-in-hybrid/';
const out=[];
function entry(id,year,model,trim,body,url,price,matchEvidence){
 const v=db.find(v=>v.id===`epa-${id}`);
 if(!v||v.year!==year||v.model!==model||v.trim!==null)throw Error(`Unexpected base identity ${id}; run raw EPA import first`);
 const s=source(url,`${year} ${trim}: base MSRP USD ${price}; excludes destination, taxes and options. Historical published MSRP, not a current dealer quote.`,{accessMethod:'official indexed page reviewed; some live Toyota pages return maintenance/403',priceBasis:'base MSRP excluding destination',effectiveDate:null});
 const e={id:v.id,match:Object.fromEntries(['year','brand','model','trim','drivetrain','powertrain'].map(k=>[k,v[k]])),epaConfiguration:{transmission:v.transmission,variant:v.variant},retailTrim:trim,bodyType:body,matchEvidence,identitySource:s,specifications:{msrpUsd:price},fieldSources:{msrpUsd:s}};
 out.push(e);return e;
}
function add(e,url,description,values,extra={}){for(const[k,v]of Object.entries(values)){e.specifications[k]=v;e.fieldSources[k]=source(url,description,extra);}}
const inches=x=>Math.round(x*25.4*10)/10,litres=x=>Math.round(x*28.316846592*10)/10,nm=x=>Math.round(x*1.3558179483*10)/10;
for(const [id,y,m,t,price] of [
 [47243,2024,'Prius','LE',27950],[47244,2024,'Prius AWD','LE AWD',29350],[47245,2024,'Prius AWD XLE/LTD','XLE AWD',32795],[47246,2024,'Prius XLE/LTD','XLE',31395],
 [48858,2025,'Prius AWD','LE AWD',29750],[48859,2025,'Prius AWD XLE/LTD','XLE AWD',33195],[48860,2025,'Prius XLE/LTD','XLE',31795],[48861,2025,'Prius','LE',28350]]){
 let awd=t.includes('AWD'),le=t.startsWith('LE');
 let e=entry(id,y,m,t,'hatchback',y===2024?'https://www.buyatoyota.com/central/vehicles/prius/2024/':toyota('prius',2025),price,'HEV 2.0L ECVT. LE 17-inch wheel EPA group; XLE 19-inch XLE/LTD EPA group, specifically selecting XLE, not Limited. EPA 4WD label is retained for Toyota e-AWD.');
 if(awd){e.canonicalDrivetrain='AWD';e.drivetrainSource=source(y===2024?prius24:prius25Power,'Toyota explicitly specifies Electronic On-Demand All-Wheel Drive; retain original EPA 4WD as epaDrivetrain, canonicalize to AWD for user filtering.');}
 add(e,y===2024?prius24:toyota('prius',2025),'Model-year seating capacity: five occupants.',{seats:5});
 add(e,y===2024?prius24:prius25Power,'System net output: FWD 194 hp; AWD 196 hp. Not engine output.',{horsepowerHp:awd?196:194,systemHorsepowerHp:awd?196:194});
 if(y===2024){add(e,prius24,'2024 brochure pp. 9–10,15–16: engine 150 hp; seating and capacities by selected LE/XLE column. Inches ×25.4, cu ft ×28.316846592.',{engineHorsepowerHp:150,cargoVolumeL:litres(le?23.8:20.3),lengthMm:inches(181.1),widthMm:inches(70.2),heightMm:inches(le?55.9:56.3),wheelbaseMm:inches(108.3),groundClearanceMm:inches(le?5.6:6),fuelTankGallons:awd?10.5:11.3});}
}
for(const [id,y,m,t,price] of [[47500,2024,'Prius Prime','XSE',35925],[47501,2024,'Prius Prime SE','SE',32675],[49014,2025,'Prius PHEV','XSE',36625],[49015,2025,'Prius PHEV SE','SE',33375]]){
 let url=y===2024?'https://pressroom.toyota.com/unplug-and-play-2024-toyota-prius-prime-redefines-the-daily-drive/':toyota('priuspluginhybrid',2025);
 let e=entry(id,y,m,t,'hatchback',url,price,'PHEV FWD 2.0L ECVT; SE 17-inch EPA group or XSE 19-inch EPA non-SE group, specifically XSE, not XSE Premium. Retain current EPA range; older manufacturer range differs.');
 add(e,y===2024?prime24:toyota('priuspluginhybrid',2025),'Model-year seating capacity: five.',{seats:5});
 add(e,y===2024?prime24:phev25Power,'Combined hybrid system 220 hp, battery nominal capacity 13.6 kWh; not usable capacity.',{horsepowerHp:220,systemHorsepowerHp:220,batteryCapacityKwh:13.6});
 if(y===2024)add(e,prime24,'2024 brochure pp. 3,16: 6.6-second manufacturer 0–60 test; capacities and dimensions by SE/XSE column. Do not use conflicting printed kW conversion.',{zeroTo60Sec:6.6,engineHorsepowerHp:150,cargoVolumeL:litres(20.3),lengthMm:inches(181.1),widthMm:inches(t==='SE'?70.1:70.2),heightMm:inches(t==='SE'?55.9:56.3),wheelbaseMm:inches(108.3),fuelTankGallons:10.6});
}
for(const [id,y,m,t,price]of [[46973,2024,'LEAF','S',28140],[46974,2024,'LEAF SV','SV PLUS',36190],[48400,2025,'LEAF','S',28140],[48401,2025,'LEAF SV','SV PLUS',36190]]){
 const url=`https://usa.nissannews.com/en-US/releases/${y}-nissan-leaf-press-kit`,plus=t==='SV PLUS';
 let e=entry(id,y,m,t,'hatchback',url,price,'FWD single-motor: S 40-kWh/149-mile EPA configuration; SV PLUS 60-kWh/212-mile EPA configuration.');
 add(e,url,'Model-year press-kit specification tables: S vs SV PLUS; seating 5. Motor output 147/214 hp, torque 236/250 lb-ft. Cargo second row upright 23.6 cu ft. Dimensions in inches converted to mm.',{seats:5,horsepowerHp:plus?214:147,motorHorsepowerHp:plus?214:147,torqueNm:nm(plus?250:236),batteryCapacityKwh:plus?60:40,cargoVolumeL:litres(23.6),lengthMm:inches(176.4),widthMm:inches(70.5),heightMm:inches(plus?61.7:61.5),wheelbaseMm:inches(106.3),groundClearanceMm:inches(5.9)});
 // Do not import ambiguous 147-kW typo or 'to 80%' time as a 10–80% time.
}
for(const[id,t,price]of [[47996,'SE',23780],[47997,'XSE',27080]]){
 let e=entry(id,2025,id===47996?'Corolla Hatchback':'Corolla Hatchback XSE',t,'hatchback',toyota('corollahatchback',2025),price,'Gas FWD 2.0L CVT. SE 16-inch 35 combined MPG; XSE 18-inch 33 combined MPG. Excludes optional enhanced-cargo package.');
 add(e,hatch25,'2025 brochure p.15, selected SE/XSE column: engine 169 hp,151 lb-ft, five seats, seats-up cargo 17.8 cu ft, exterior inches.',{seats:5,horsepowerHp:169,engineHorsepowerHp:169,torqueNm:nm(151),cargoVolumeL:litres(17.8),lengthMm:inches(172),widthMm:inches(70.5),heightMm:inches(57.1),wheelbaseMm:inches(103.9),groundClearanceMm:inches(5.1)});
}
let corolla=entry(48493,2025,'Corolla','LE','sedan',toyota('corolla',2025),22325,'Gas FWD 2.0L CVT, EPA 1-mode engine ID 50, 32 city/41 highway/35 combined MPG matches manufacturer LE.');
add(corolla,toyota('corolla',2025),'2025 Corolla seats: 5.',{seats:5});
let maverick=entry(48869,2025,'Maverick HEV FWD','XL Hybrid FWD','pickup','https://www.fromtheroad.ford.com/us/en/articles/2024/hybrid-meets-all-wheel-drive-on-new-tech-packed-2025-ford-maveri',26295,'Standard XL FWD 2.5L Hybrid CVT; no AWD, towing or other option packages. Published launch MSRP.');
add(maverick,'https://www.ford.com/trucks/maverick/2025/?gnav=header-future-veh-segment','XL model table: 2.5L Hybrid FWD, five occupants; minimum running ground clearance 8.1 inches.',{seats:5,groundClearanceMm:inches(8.1)});
for(const[id,model,t,p]of [[48911,'Corolla Cross','L FWD',24135],[48939,'Corolla Cross Hybrid AWD','Hybrid S AWD',28495]]){
 let url=toyota(id===48911?'corollacross':'corollacrosshybrid',2025);
 let e=entry(id,2025,model,t,'suv',url,p,'Gas L FWD 2.0L CVT 32 combined MPG, or Hybrid S standard AWD 2.0L eCVT 42 combined MPG; specifically selected base grade.');
 add(e,url,'2025 model-year seating capacity five occupants.',{seats:5});
}
fs.writeFileSync('data/manufacturer-supplements.json',JSON.stringify(out,null,2));
console.log(`Created ${out.length} explicit manufacturer supplements`);

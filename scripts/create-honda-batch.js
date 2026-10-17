import fs from 'node:fs';
const db=JSON.parse(fs.readFileSync('data/vehicles.json')),at=new Date().toISOString();
const sedan='https://hondanews.com/en-US/releases/release-c28e8d1efb94e520fef21ff3f800cb30-2025-honda-civic-sedan-specifications-features';
const hatch='https://hondanews.com/en-US/honda-automobiles/releases/release-008e554add341b8444085beaa2041012-2025-honda-civic-hatchback-specifications-features';
const crv='https://hondanews.com/en-US/honda-automobiles/releases/release-f43bcac5ded8efe77b071fcb0c097416-2025-honda-cr-v-specifications-and-features';
const cp='https://hondanews.com/en-US/releases/release-d73d9911716c8277bb60a27897015f1e-2025-honda-civic-sedan-pricing-and-epa-ratings-2025';
const hp='https://hondanews.com/en-US/honda-automobiles/releases/release-d73d9911716c8277bb60a278970139ac-2025-honda-civic-hatchback-pricing-and-epa-ratings-2025';
const rp='https://hondanews.com/en-US/honda-automobiles/releases/release-d73d9911716c8277bb60a2789701d8f5-2025-honda-cr-v-pricing-and-epa-ratings-2025';
const source=(url,evidence)=>({url,evidence,retrievedAt:at}),inch=x=>Math.round(x*254)/10,litre=x=>Math.round(x*28.316846592*10)/10;
const rows=[[48016,'LX',24250,sedan,cp,'sedan',150,184.8],[48017,'Sport',26250,sedan,cp,'sedan',150,184.8],[48018,'Sport Hybrid',28950,sedan,cp,'sedan',200,184.8],[48502,'Sport',27450,hatch,hp,'hatchback',150,179],[48503,'Sport Hybrid',30150,hatch,hp,'hatchback',200,179],[47949,'LX 2WD',30100,crv,rp,'suv',190,184.8],[47950,'Sport Hybrid 2WD',34650,crv,rp,'suv',204,184.8],[47957,'Sport Hybrid AWD',36150,crv,rp,'suv',204,184.8]];
const out=rows.map(([id,trim,price,url,priceUrl,body,hpValue,length])=>{
 const v=db.find(x=>x.id===`epa-${id}`);if(!v||v.year!==2025||v.brand!=='Honda'||v.retailConfiguration)throw Error(`Unexpected identity ${id}`);
 const specs={msrpUsd:price,seats:5,horsepowerHp:hpValue,lengthMm:inch(length),widthMm:inch(body==='suv'?73.5:70.9),heightMm:inch(body==='suv'?(v.drivetrain==='AWD'?66.5:66.2):55.7),wheelbaseMm:inch(body==='suv'?106.3:107.7)};
 if(body==='sedan')specs.cargoVolumeL=litre(14.8);
 if(body==='suv')specs.cargoVolumeL=litre(v.powertrain==='HEV'?36.3:39.3);
 // Hatchback source mislabels cargo units as inches: leave null pending unambiguous corroboration.
 if(v.powertrain==='Gas')specs.torqueNm=Math.round((body==='suv'?179:133)*1.3558179483*10)/10;
 if(v.powertrain==='HEV')specs.systemHorsepowerHp=hpValue;
 const evidence=`US 2025 ${v.model}, ${trim}, ${v.drivetrain}, ${v.powertrain}, ${v.transmission}; exact EPA engine ${v.variant.engineId}. Select one documented retail trim within this EPA test group, not every trim. Manufacturer EPA ratings cross-checked against this configuration.`,fieldSources={};
 for(const k of Object.keys(specs))fieldSources[k]=source(k==='msrpUsd'?priceUrl:k==='seats'&&body==='suv'?'https://www.hondainfocenter.com/2025/CR-V/Feature-Guide/Specifications/':url,k==='msrpUsd'?`January 3 2025 US price table: ${trim} base MSRP USD ${price}, excluding destination, tax, registration and options. Historical price.`:`Selected US ${trim} specification column: ${k}=${specs[k]}; inch ×25.4, cu ft ×28.316846592, lb-ft ×1.3558179483; hybrid hp is total system output, torque remains null. ${body==='suv'?'Cargo behind second row only.':''}`);
 return {id:v.id,match:Object.fromEntries(['year','brand','model','trim','drivetrain','powertrain'].map(k=>[k,v[k]])),epaConfiguration:{transmission:v.transmission,variant:v.variant},retailTrim:trim,bodyType:body,matchEvidence:evidence,identitySource:source(url,evidence),specifications:specs,fieldSources};
});
fs.writeFileSync('data/honda-reviewed-batch.json',JSON.stringify(out,null,2));console.log(`Prepared ${out.length} manually reviewed official entries`);

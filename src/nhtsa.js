// Model-level verification only: never propagate VIN/trim specifications to all models.
import fs from 'node:fs';
import crypto from 'node:crypto';
export async function verifyModel(vehicle,{cacheDir='data/nhtsa-cache',refresh=false}={}){
 let url=`https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(vehicle.brand)}/modelyear/${vehicle.year}?format=json`;
 fs.mkdirSync(cacheDir,{recursive:true});let path=`${cacheDir}/${crypto.createHash('sha256').update(url).digest('hex')}.json`,result;
 if(!refresh&&fs.existsSync(path))result=JSON.parse(fs.readFileSync(path,'utf8'));else{let response=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error(`vPIC HTTP ${response.status}`);let data=await response.json();if(!Array.isArray(data.Results))throw Error('Invalid vPIC response');result={url,retrievedAt:new Date().toISOString(),data};fs.writeFileSync(path,JSON.stringify(result,null,2));}
 let matches=result.data.Results.filter(x=>x.Model_Name?.toLowerCase()===vehicle.model.toLowerCase());return {epaId:vehicle.id,url,retrievedAt:result.retrievedAt,status:matches.length===1?'model-name-verified':'unresolved',matches,note:'Only make/model/year verified; no trim, horsepower or safety inference.'};
}
if(process.argv[1]?.endsWith('nhtsa.js')){try{let db=JSON.parse(fs.readFileSync('data/vehicles.json'));let v=db.find(x=>x.id===process.argv[2]);if(!v)throw Error('Usage: node src/nhtsa.js epa-ID');console.log(JSON.stringify(await verifyModel(v),null,2));}catch(e){console.error(e.message);process.exitCode=1;}}

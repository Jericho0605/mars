import fs from 'node:fs';
import {enrichmentAudit,enrichVerified} from '../src/enrichment.js';
import {saveReport} from '../src/coverage.js';
const db=JSON.parse(fs.readFileSync('data/vehicles.json')),file=process.argv[2];
fs.writeFileSync('data/enrichment-queue.json',JSON.stringify(enrichmentAudit(db),null,2));
if(file){
 const current=JSON.parse(fs.readFileSync('data/manufacturer-supplements.json')),incoming=JSON.parse(fs.readFileSync(file));
 if(!Array.isArray(incoming))throw Error('Expected an array of explicit EPA-bound entries');
 const merged=new Map(current.map(e=>[e.id,e]));for(const e of incoming)merged.set(e.id,e);
 const entries=[...merged.values()],result=enrichVerified(db,entries);
 fs.writeFileSync('data/vehicles.json.tmp',JSON.stringify(result,null,2));fs.renameSync('data/vehicles.json.tmp','data/vehicles.json');
 fs.writeFileSync('data/manufacturer-supplements.json',JSON.stringify(entries,null,2));saveReport(result);
 console.log(`Verified ${incoming.length} incoming entries; ${entries.length} curated configurations. Run build to publish locally.`);
}else console.log('Wrote prioritized missing-field queue. Pass a reviewed JSON batch to import. No network requests made.');

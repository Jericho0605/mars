import fs from 'node:fs';
import {csv,download,importRows,report,supplement,validate} from './data.js';
import {applyManufacturerData} from './manufacturer.js';
import {saveReport} from './coverage.js';
const args=process.argv.slice(2),command=args.shift();
try {
 if(command==='import'){
  const positional=args.filter(x=>!x.startsWith('--'));
  let start=+(positional[0]??2024),end=+(positional[1]??2026);
  if(!Number.isInteger(start)||!Number.isInteger(end)||start>end)throw Error('Invalid year range');
  fs.mkdirSync('data',{recursive:true});await download('data/epa.csv',args.includes('--refresh'));
  // Cached data keeps its download-file timestamp, rather than pretending every reimport is a new retrieval.
  let v=importRows(csv(fs.readFileSync('data/epa.csv','utf8')),start,end,fs.statSync('data/epa.csv').mtime.toISOString());
  if(!args.includes('--epa-only')&&fs.existsSync('data/manufacturer-supplements.json')){
   const entries=JSON.parse(fs.readFileSync('data/manufacturer-supplements.json')).filter(e=>e.match.year>=start&&e.match.year<=end);
   v=applyManufacturerData(v,entries);
  }
  const file=args.find(x=>x.startsWith('--supplement='))?.slice('--supplement='.length);
  if(file)v=supplement(v,JSON.parse(fs.readFileSync(file)));
  if(!v.length)throw Error('No vehicles imported');v.forEach(validate);
  fs.writeFileSync('data/vehicles.json.tmp',JSON.stringify(v,null,2));fs.renameSync('data/vehicles.json.tmp','data/vehicles.json');
  const r=saveReport(v);console.log(`Imported ${v.length}; manufacturer supplemented ${r.manufacturerEnrichedCount}`);
 }else if(command==='build'){
  let v=JSON.parse(fs.readFileSync('data/vehicles.json'));v.forEach(validate);
  if(!v.length)throw Error('No offline database');saveReport(v);
  fs.copyFileSync('data/vehicles.json','web/vehicles.json');console.log(`Verified ${v.length} records; offline web database built`);
 }else throw Error('Usage: node src/cli.js import [2024] [2026] [--refresh] [--epa-only] [--supplement=file.json] | build');
}catch(e){console.error(e.message);process.exitCode=1;}

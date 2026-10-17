import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
export class CachedSources{
 constructor(root,{delayMs=1100,retries=2,fetchImpl=fetch,sleep=ms=>new Promise(r=>setTimeout(r,ms))}={}){this.root=root;this.delayMs=delayMs;this.retries=retries;this.fetch=fetchImpl;this.sleep=sleep;this.lastRequest=0;fs.mkdirSync(root,{recursive:true});}
 log(event){fs.appendFileSync(path.join(this.root,'requests.jsonl'),JSON.stringify({at:new Date().toISOString(),...event})+'\n');}
 async get(url,{refresh=false,maxAgeMs=Infinity}={}){
  const parsed=new URL(url);if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.searchParams.has('api_key'))throw Error('Only public HTTPS sources without credentials can be cached');
  const id=sha(url),file=path.join(this.root,id+'.body'),metadata=file+'.json';
  if(!refresh&&fs.existsSync(file)&&fs.existsSync(metadata)){const meta=JSON.parse(fs.readFileSync(metadata)),data=fs.readFileSync(file);if(sha(data)!==meta.sha256)throw Error('Cached source checksum mismatch');if(Date.now()-Date.parse(meta.retrievedAt)<=maxAgeMs){this.log({url,event:'cache-hit'});return {data,meta};}}
  for(let attempt=0;attempt<=this.retries;attempt++){
   const wait=Math.max(0,this.delayMs-(Date.now()-this.lastRequest));if(wait)await this.sleep(wait);this.lastRequest=Date.now();
   try{const response=await this.fetch(url,{signal:AbortSignal.timeout(25000),headers:{'User-Agent':'DriveWise public vehicle data research (cached, sequential)'}});if(response.status===403||response.status===401){this.log({url,status:response.status,event:'access-restricted'});throw Object.assign(Error('Access restriction; no retry or bypass'),{permanent:true,status:response.status});}
    if(!response.ok){if(response.status>=400&&response.status<500&&response.status!==429)throw Object.assign(Error(`Source HTTP ${response.status}`),{permanent:true,status:response.status});const retryAfter=response.headers.get('retry-after');if(response.status===429){const dateMs=Date.parse(retryAfter),retryMs=/^\d+$/.test(retryAfter??'')?+retryAfter*1000:Number.isFinite(dateMs)?Math.max(0,dateMs-Date.now()):30000;this.log({url,event:'rate-limited',retryAfterMs:retryMs});if(retryMs>60000)throw Object.assign(Error('Rate limit requires later resume'),{permanent:true,status:429});await this.sleep(retryMs);}throw Object.assign(Error(`Source HTTP ${response.status}`),{status:response.status});}
    const data=Buffer.from(await response.arrayBuffer()),meta={url,retrievedAt:new Date().toISOString(),status:response.status,contentType:response.headers.get('content-type'),sha256:sha(data),bytes:data.length};fs.writeFileSync(file+'.tmp',data);fs.renameSync(file+'.tmp',file);fs.writeFileSync(metadata,JSON.stringify(meta,null,2));this.log({url,event:'downloaded',bytes:data.length});return {data,meta};
   }catch(error){this.log({url,event:'failure',attempt,message:error.message});if(error.permanent||attempt===this.retries)throw error;await this.sleep(Math.min(10000,1000*2**attempt));}
  }
 }
}
export function mergeBatch(records,entries){
 const next=structuredClone(records),seen=new Set(),audit=[];
 for(const e of entries){const v=next.find(x=>x.id===e.id);if(!v||seen.has(e.id))throw Error('Unknown or repeated batch ID');seen.add(e.id);
  for(const k of ['make','model','year','trim','powertrain','drivetrain','transmission'])if(!Object.hasOwn(e.match,k)||e.match[k]!==v[k])throw Error(`Batch identity mismatch ${k}`);
  for(const[k,value]of Object.entries(e.fields??{})){if(!Object.hasOwn(v,k)||!Object.hasOwn(e.sources??{},k)||['id','make','model','year','powertrain','drivetrain','transmission','epaVehicleId','epaModel','epaBaseModel','market','sources','conflicts','dataCoverage','recommendationReady'].includes(k))throw Error(`Unsupported batch field ${k}`);const p=e.sources[k];if(!p?.evidence||!p.url||!p.retrievedAt||!p.scope)throw Error('Field source evidence and applicability required');
   if(k==='officialLinks'){for(const[name,link]of Object.entries(value)){if(!Object.hasOwn(v.officialLinks,name))throw Error('Unknown official link purpose');if(v.officialLinks[name]===null)v.officialLinks[name]=link;else if(JSON.stringify(v.officialLinks[name])!==JSON.stringify(link)){const conflict={id:v.id,field:`officialLinks.${name}`,existing:v.officialLinks[name],incoming:link,resolution:'existing link retained'};v.conflicts.push(conflict);audit.push(conflict);}}continue;}
   const emptyArray=Array.isArray(v[k])&&v[k].length===0,unknownStatus=['trimStatus','priceStatus','priceType','safetyRatingStatus'].includes(k)&&['Unverified','Unavailable','Data unavailable'].includes(v[k]);
   if(v[k]!==null&&!emptyArray&&!unknownStatus&&JSON.stringify(v[k])!==JSON.stringify(value)){const conflict={id:v.id,field:k,existing:v[k],incoming:value,incomingSource:p,resolution:'existing value retained; explicit human resolution required'};v.conflicts.push(conflict);audit.push(conflict);continue;}if(value===null)continue;v[k]=value;v.sources[k]=p;}
 }
 return {records:next,audit};
}
export function exportCsv(records,fields){const escape=x=>'"'+String(x??'').replaceAll('"','""')+'"';return fields.map(escape).join(',')+'\n'+records.map(v=>fields.map(k=>escape(typeof v[k]==='object'&&v[k]!==null?JSON.stringify(v[k]):v[k])).join(',')).join('\n')+'\n';}

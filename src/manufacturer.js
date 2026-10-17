import {supplement, validate, fields} from './data.js';

const domains=['toyota.com','buyatoyota.com','nissannews.com','nissanusa.com','ford.com','hyundainews.com','hyundaiusa.com','hondanews.com','hondainfocenter.com'];
export function applyManufacturerData(vehicles, entries) {
  let result=structuredClone(vehicles), seen=new Set();
  for (const entry of entries) {
    if(seen.has(entry.id)) throw Error(`Duplicate manufacturer entry ${entry.id}`);
    seen.add(entry.id);
    const index=result.findIndex(v=>v.id===entry.id);
    if(index<0) throw Error(`Unknown EPA ID ${entry.id}`);
    let vehicle=result[index];
    if(!entry.retailTrim?.trim()||!entry.matchEvidence?.trim()) throw Error('Retail trim and match evidence required');
    for(const key of ['transmission','variant']) {
      if(JSON.stringify(vehicle[key])!==JSON.stringify(entry.epaConfiguration?.[key])) throw Error(`EPA configuration mismatch: ${key}`);
    }
    const sources=entry.fieldSources;
    for(const key of Object.keys(entry.specifications)) {
      if(!fields.includes(key)) throw Error(`Unknown specification ${key}`);
      const s=sources?.[key];
      if(!s?.url||!s.evidence||!Number.isFinite(Date.parse(s.retrievedAt))) throw Error(`Missing field evidence ${key}`);
      const url=new URL(s.url);
      if(url.protocol!=='https:'||!domains.some(d=>url.hostname===d||url.hostname.endsWith('.'+d))) throw Error(`Non-manufacturer source ${key}`);
      // Reuse Phase 1 identity, value, and provenance validation.
      vehicle=supplement([vehicle],[{id:entry.id,match:entry.match,source:s,specifications:{[key]:entry.specifications[key]}}])[0];
      vehicle.fieldSources[key]={...s,confidence:'official-manufacturer-manually-reviewed'};
    }
    vehicle.epaTrim=vehicle.trim;
    vehicle.trim=entry.retailTrim;
    vehicle.bodyType=entry.bodyType;
    if(entry.canonicalDrivetrain){
      const source=entry.drivetrainSource,url=new URL(source?.url);
      if(!['FWD','RWD','AWD','4WD'].includes(entry.canonicalDrivetrain)||!source?.evidence||!Number.isFinite(Date.parse(source?.retrievedAt))||url.protocol!=='https:'||!domains.some(d=>url.hostname===d||url.hostname.endsWith('.'+d)))throw Error('Invalid drivetrain correspondence');
      vehicle.epaDrivetrain=vehicle.drivetrain;vehicle.drivetrain=entry.canonicalDrivetrain;vehicle.identitySources={drivetrain:source};
    }
    vehicle.retailConfiguration={scope:'One explicitly reviewed retail trim represented by this EPA test configuration',matchEvidence:entry.matchEvidence,epaConfiguration:entry.epaConfiguration,source:entry.identitySource};
    vehicle.sources.manufacturerUrl=entry.identitySource.url;
    vehicle.sources.lastUpdated=[vehicle.sources.lastUpdated,...Object.values(sources).map(s=>s.retrievedAt)].sort().at(-1);
    result[index]=validate(vehicle);
  }
  return result;
}

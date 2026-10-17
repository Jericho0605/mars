import {applyManufacturerData} from './manufacturer.js';
import {fields} from './data.js';
export function enrichmentAudit(vehicles){
 const priority=['msrpUsd','seats','horsepowerHp','cargoVolumeL'];
 return vehicles.map(v=>({id:v.id,year:v.year,brand:v.brand,model:v.model,trim:Object.hasOwn(v,'epaTrim')?v.epaTrim:v.trim,missing:fields.filter(k=>v.specifications[k]==null),priorityMissing:priority.filter(k=>v.specifications[k]==null)})).sort((a,b)=>b.priorityMissing.length-a.priorityMissing.length||a.id.localeCompare(b.id));
}
export function enrichVerified(vehicles,entries){
 // Replay verified bindings against EPA identity; never infer a retail trim from its name.
 const base=vehicles.map(v=>{const x=structuredClone(v);if(x.retailConfiguration){x.trim=x.epaTrim??null;x.drivetrain=x.epaDrivetrain??x.drivetrain;}return x;});
 return applyManufacturerData(base,entries);
}

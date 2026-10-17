import {recommendV2} from './recommend-v2.js';
export const sensitivityProfiles={
 student:{budgetUsd:25000,minSeats:5,annualMiles:6000,homeCharging:false,publicElectricityUsdPerKwh:.45,priorities:['price','running','efficiency']},
 performance:{budgetUsd:80000,minHorsepowerHp:180,targetHorsepowerHp:300,priorities:['performance','range','price']},
 sevenSeats:{budgetUsd:60000,minSeats:7,priorities:['space','safety','running']},
 city:{budgetUsd:40000,minSeats:4,annualMiles:4000,cityDrivingShare:.9,targetLengthMm:4400,priorities:['price','space','running']},
 highway:{budgetUsd:60000,minSeats:5,annualMiles:25000,cityDrivingShare:.1,longTripsPerYear:12,priorities:['range','running','space']},
 homeEv:{budgetUsd:45000,powertrains:['EV'],homeLevel2:true,homeElectricityUsdPerKwh:.16,annualMiles:20000,priorities:['running','range','environment']},
 publicEv:{budgetUsd:45000,powertrains:['EV'],homeCharging:false,publicElectricityUsdPerKwh:.55,annualMiles:20000,priorities:['running','range','environment']},
 cargo:{budgetUsd:60000,minSeats:5,targetCargoVolumeL:1100,minCargoVolumeL:700,priorities:['space','performance','running']},
 safetyFamily:{budgetUsd:50000,minSeats:5,targetCargoVolumeL:800,priorities:['safety','space','running']},
 lowRunning:{budgetUsd:60000,minSeats:5,annualMiles:18000,homeCharging:false,publicElectricityUsdPerKwh:.5,priorities:['running','efficiency','price']}
};
export function sensitivityReport(db){
 const results=Object.fromEntries(Object.entries(sensitivityProfiles).map(([name,p])=>{const r=recommendV2(db,p);return [name,{profile:p,candidateCount:r.candidateCount,distinctCount:r.matches.length,top10:r.matches.slice(0,10).map(x=>({id:x.vehicle.id,brand:x.vehicle.brand,model:x.vehicle.model,score:x.score,groupScores:x.groupScores,energyUsd:x.cost.annualEnergyUsd})),warnings:r.warnings,unsupported:r.unsupportedDimensions}];}));
 const overlap=[];for(const[a,x]of Object.entries(results))for(const[b,y]of Object.entries(results))if(a<b){const s=new Set(x.top10.map(v=>v.id)),t=new Set(y.top10.map(v=>v.id)),intersection=[...s].filter(id=>t.has(id)).length,union=new Set([...s,...t]).size;overlap.push({a,b,jaccard:union?intersection/union:null});}
 return {results,overlap,explanation:'Shared results reflect the same verified local pool and overlapping requirements. Empty seven-seat results reflect missing seat evidence. Home/public EV can have identical models but different energy costs and convenience scores. No randomness or result cache.'};
}

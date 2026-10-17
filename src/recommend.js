import {normalizeProfile} from './profile.js';
import {energyCost,ownershipCost} from './cost.js';
import {assessConstraints,diverseSelection,modelFamily} from './selection.js';
export {energyCost,ownershipCost};
const clamp=x=>Math.max(0,Math.min(1,x));
const definitions={
 price:{group:'affordability',scale:100000,mode:'lower',label:'购车价格'},
 horsepower:{group:'power',scale:600,mode:'target',label:'动力输出'},
 torque:{group:'power',scale:1000,mode:'target',label:'扭矩'},
 acceleration:{group:'power',scale:15,mode:'lower',label:'加速时间'},
 efficiency:{group:'efficiency',scale:200,mode:'lower',label:'单位里程能耗'},
 range:{group:'range',scale:600,mode:'higher',label:'电动续航'},
 seating:{group:'space',scale:10,mode:'higher',label:'座位'},
 cargo:{group:'space',scale:1500,mode:'higher',label:'后备箱空间'},
 dimensions:{group:'space',scale:6000,mode:'lower',label:'车长'},
 tco:{group:'affordability',scale:150000,mode:'lower',label:'拥有成本情景'},
 charging:{group:'charging',scale:1,mode:'higher',label:'补能便利性'},
 environment:{group:'environment',scale:1000,mode:'lower',label:'尾气 CO₂（不含发电与制造）'},
 safety:{group:'safety',scale:5,mode:'higher',label:'NHTSA 碰撞评级'}
};
function featureWeights(weights){const n={};for(const d of Object.values(definitions))n[d.group]=(n[d.group]??0)+1;return Object.fromEntries(Object.entries(definitions).map(([k,d])=>[k,weights[d.group]/n[d.group]]));}
function targets(u){return {price:(u.budgetUsd??37500)*.8/100000,horsepower:(u.targetHorsepowerHp??(160+340*u.weights.power))/600,torque:(u.targetTorqueNm??(220+450*u.weights.power))/1000,acceleration:(u.targetZeroTo60Sec??8)/15,efficiency:35/200,range:(u.targetRangeMiles??(u.longTripsPerYear?300:200))/600,seating:(u.targetSeats??u.minSeats??5)/10,cargo:(u.targetCargoVolumeL??(400+800*u.weights.space))/1500,dimensions:(u.targetLengthMm??4500)/6000,tco:(u.tcoTargetUsd??35000)/150000,charging:1,environment:0,safety:1};}
function utility(key,value,target){
 const d=definitions[key],scale=Math.max(target,key==='environment' ? .15 : .05);
 // Smooth, needs-scaled utility preserves differences beyond a threshold without rewarding unlimited size/power.
 if(d.mode==='lower')return 1/(1+(value/scale)**2);
 if(d.mode==='higher')return value===0?0:value/(value+scale);
 return 1/(1+((value-target)/scale)**2*4);
}
export function evolveDna(weights,seed=42,{generations=40,populationSize=40,target={}}={}) {
 const initialSeed=seed;
 if(!Number.isInteger(generations)||generations<1||generations>200||!Number.isInteger(populationSize)||populationSize<8||populationSize>200)throw Error('Invalid GA settings');
 let random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
 const keys=Object.keys(weights),sum=Object.values(weights).reduce((a,b)=>a+b,0);
 if(!keys.length||sum<=0||Object.values(weights).some(v=>!Number.isFinite(v)||v<0))throw Error('Invalid GA weights');
 const desired=keys.map(k=>clamp(target[k]??1)),fit=g=>g.reduce((a,x,i)=>a+weights[keys[i]]*(1-(x-desired[i])**2),0)/sum;
 let pop=Array.from({length:populationSize},()=>keys.map(()=>random())),history=[];
 for(let generation=0;generation<=generations;generation++){
  pop.sort((a,b)=>fit(b)-fit(a));history.push({generation,bestFitness:fit(pop[0]),meanFitness:pop.reduce((s,g)=>s+fit(g),0)/pop.length});
  if(generation===generations)break;
  const elite=pop.slice(0,Math.max(2,Math.floor(pop.length*.2))),next=elite.map(g=>[...g]);
  const select=()=>{let a=pop[Math.floor(random()*pop.length)],b=pop[Math.floor(random()*pop.length)];return fit(a)>fit(b)?a:b;};
  while(next.length<populationSize){const a=select(),b=select();next.push(a.map((x,i)=>clamp((random()<.5?x:b[i])+(random()<.18?(random()-.5)*.25:0))));}pop=next;
 }
 return {idealDna:Object.fromEntries(keys.map((k,i)=>[k,pop[0][i]])),history,generations,populationSize,seed:initialSeed,termination:'generation limit',virtual:true};
}
// Backwards-compatible Phase 1 public helper.
export function idealDna(weights,seed=42){return evolveDna(weights,seed).idealDna;}
function measuredDna(v,u,cost){
 const s=v.specifications,electric=['EV','PHEV'].includes(v.powertrain),home=u.homeCharging===true||u.homeLevel1===true||u.homeLevel2===true;
 let charging=electric?(home?1:u.workCharging===true?0.75:u.dependsOnPublicCharging===true?0.3:u.homeCharging===false?0.3:null):1;
 let intensity;
 if(v.powertrain==='EV')intensity=s.electricConsumptionKwhPer100Mi;
 else if(v.powertrain==='PHEV'){let f=u.electricShare;intensity=f===undefined?null:(f===1||s.combinedMpg)&&(f===0||s.electricConsumptionKwhPer100Mi)?(1-f)*(s.combinedMpg?3370/s.combinedMpg:0)+f*(s.electricConsumptionKwhPer100Mi??0):null;}
 else intensity=s.combinedMpg?3370/s.combinedMpg:null;
 const raw={price:s.msrpUsd,horsepower:s.horsepowerHp,torque:s.torqueNm,acceleration:s.zeroTo60Sec,efficiency:intensity??null,range:electric?s.epaRangeMiles:null,seating:s.seats,cargo:s.cargoVolumeL,dimensions:s.lengthMm,tco:cost.tcoRangeUsd?(cost.tcoRangeUsd[0]+cost.tcoRangeUsd[1])/2:null,charging,environment:s.tailpipeCo2GPerMi??null,safety:s.nhtsaOverallStars};
 return {raw,dna:Object.fromEntries(Object.entries(raw).map(([k,x])=>[k,x==null?null:clamp(x/definitions[k].scale)])),notApplicable:electric?[]:['range']};
}
export function recommend(vehicles,input={}) {
 const u=normalizeProfile(input);
 const eligiblePool=vehicles.filter(v=>!assessConstraints(v,u).excluded&&(u.recommendationMode!=='strict'||assessConstraints(v,u).verifiedEligible));
 const supportedGroups=new Set();
 for(const v of eligiblePool){const s=v.specifications;
  if(s.msrpUsd!=null)supportedGroups.add('affordability');
  if([s.horsepowerHp,s.torqueNm,s.zeroTo60Sec].some(x=>x!=null))supportedGroups.add('power');
  if(s.combinedMpg!=null||s.electricConsumptionKwhPer100Mi!=null)supportedGroups.add('efficiency');
  if(s.epaRangeMiles!=null)supportedGroups.add('range');
  if([s.seats,s.cargoVolumeL,s.lengthMm].some(x=>x!=null))supportedGroups.add('space');
  if(!['EV','PHEV'].includes(v.powertrain)||[u.homeCharging,u.homeLevel1,u.homeLevel2,u.workCharging,u.dependsOnPublicCharging].some(x=>x!==undefined))supportedGroups.add('charging');
  if(s.tailpipeCo2GPerMi!=null)supportedGroups.add('environment');
  if(s.nhtsaOverallStars!=null)supportedGroups.add('safety');
 }
 const requestedWeights={...u.weights},unsupportedWeights=Object.keys(u.weights).filter(k=>u.weights[k]>0&&!supportedGroups.has(k));
 const activeSum=Object.entries(u.weights).reduce((a,[k,w])=>a+(supportedGroups.has(k)?w:0),0);
 u.weights=Object.fromEntries(Object.entries(u.weights).map(([k,w])=>[k,activeSum&&supportedGroups.has(k)?w/activeSum:0]));
 // Keep GA usable even when every selected dimension lacks evidence; do not fabricate a vehicle score.
 const weights=featureWeights(u.weights),target=targets(u),evolution=evolveDna(activeSum?weights:{...weights,price:1},u.seed,{target});
 const excluded={unknownRequired:0,failedConstraint:0,nonNegotiable:0},ranked=[],incomplete=[];
 for(const v of vehicles){
  const s=v.specifications,assessment=assessConstraints(v,u);
  if(assessment.violations.length)excluded.failedConstraint++;
  else if(assessment.unknown.length)excluded.unknownRequired++;
  if(assessment.excluded){excluded.nonNegotiable++;continue;}
  if(assessment.unknown.length&&incomplete.length<12)incomplete.push({id:v.id,brand:v.brand,model:v.model,year:v.year,missingRequired:assessment.unknown.map(g=>g.field),verifiedEligible:false});
  if(u.recommendationMode==='strict'&&!assessment.verifiedEligible)continue;
  const cost=ownershipCost(v,{...u,weights:requestedWeights}),{raw,dna,notApplicable}=measuredDna(v,u,cost);
  const applicable=Object.keys(dna).filter(k=>!notApplicable.includes(k)),available=applicable.filter(k=>dna[k]!==null&&weights[k]>0),den=available.reduce((s,k)=>s+weights[k],0),possible=applicable.reduce((s,k)=>s+weights[k],0);
  const comparisons=available.map(k=>({feature:k,label:definitions[k].label,actual:raw[k],ideal:Math.round(evolution.idealDna[k]*definitions[k].scale*100)/100,unitScale:definitions[k].scale,utility:utility(k,dna[k],evolution.idealDna[k]),weight:weights[k]/den}));
  const score=den?100*comparisons.reduce((sum,x)=>sum+x.weight*x.utility,0):null;
  const sorted=[...comparisons].sort((a,b)=>b.utility-a.utility),missingFeatures=applicable.filter(k=>dna[k]===null);
  if(['horsepower','torque','acceleration'].every(k=>dna[k]===null))missingFeatures.push('power');
  const specCount=Object.values(s).filter(x=>x!==null).length;
  const coverage=possible?den/possible:0;
  const groupScores={};
  for(const group of Object.keys(u.weights)){
   const items=comparisons.filter(x=>definitions[x.feature].group===group);
   groupScores[group]=items.length?items.reduce((a,x)=>a+x.utility,0)/items.length:null;
  }
  // Missing preference evidence is uncertain (neutral prior for ordering only), not a zero vehicle specification.
  // Flat eligibility bonuses previously overwhelmed slider changes; replace them with small, explicit gap costs.
  const applicableGroups=Object.entries(u.weights).filter(([group])=>!(group==='range'&&notApplicable.includes('range')));
  const groupWeightSum=applicableGroups.reduce((sum,[,w])=>sum+w,0);
  const preferenceScore=groupWeightSum?100*applicableGroups.reduce((a,[group,w])=>a+w*(groupScores[group]??.35),0)/groupWeightSum:null;
  const rankingScore=activeSum?(preferenceScore??0)-assessment.penalty*.25-5*(1-coverage):-assessment.penalty;
  ranked.push({vehicle:v,score,coverage,rankingScore,groupScores,preferenceScore,matchStatus:assessment.status,verifiedEligible:assessment.verifiedEligible,constraintGaps:assessment.gaps,modelFamily:modelFamily(v),dataCompleteness:specCount/Object.keys(s).length,dna,rawDna:raw,cost,comparisons,reasons:sorted.slice(0,3).map(x=>`${x.label}偏好效用 ${(x.utility*100).toFixed(0)}%（基于已知数据）`),tradeoffs:sorted.filter(x=>x.utility<.95).slice(-3).map(x=>`${x.label}与理想需求存在差距`),missingFeatures,notApplicable,notes:[...(cost.missing.length?['TCO 不完整，未用于成本评分']:['TCO 仅为用户情景估算']),...(missingFeatures.includes('safety')?['无已验证碰撞评分，不能据此宣称安全优势']:[]),...(u.acceptUsed?['目前仅比较新车历史 MSRP，不提供二手估价']:[])]});
 }
 const verified=ranked.filter(x=>x.verifiedEligible),recommendations=diverseSelection(ranked),used=new Set(recommendations.map(x=>x.vehicle.id));
 const alternatives=u.recommendationMode==='strict'?[]:diverseSelection(ranked.filter(x=>!x.verifiedEligible&&!used.has(x.vehicle.id)));
 const brandCount=new Set(recommendations.map(x=>x.vehicle.brand.toLowerCase())).size,familyCount=new Set(ranked.map(x=>x.modelFamily)).size;
 return {recommendations,alternatives,verifiedRecommendations:diverseSelection(verified),incompleteVehicles:incomplete,eligibleCount:verified.length,candidateCount:ranked.length,mode:u.recommendationMode??'balanced',requestedWeights,unsupportedWeights,weightNotice:unsupportedWeights.length?`以下偏好暂无可评分数据，未参与排名：${unsupportedWeights.join(', ')}`:null,diversity:{brands:brandCount,models:recommendations.length,availableModels:familyCount,availableBrands:new Set(ranked.map(x=>x.vehicle.brand.toLowerCase())).size,shortfall:recommendations.length<3?'在不可放宽条件下不足三个不同车系；未重复或编造车型':brandCount<3?'可用候选不足三个品牌；已优先不同车系':null},excluded,idealDna:evolution.idealDna,evolution,normalizedWeights:u.weights,mileage:u.mileage,note:'优先不同品牌和车系。已验证达标、近似匹配和待核实车型分开标注；近似结果不代表满足全部要求。虚拟 DNA 不作为真实车辆。'};
}

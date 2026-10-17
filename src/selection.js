// Selection changes presentation and confidence, never manufactures missing specifications.
export function modelFamily(v){
 let name=v.model.toLowerCase();
 const families=[[/^prius\b/,'prius'],[/^corolla cross\b/,'corolla cross'],[/^corolla hatchback\b/,'corolla hatchback'],[/^corolla\b/,'corolla'],[/^leaf\b/,'leaf'],[/^maverick\b/,'maverick'],[/^model ([3ysx])\b/,'model $1'],[/^ioniq ([569])\b/,'ioniq $1'],[/^f-?150\b/,'f150'],[/^mustang mach-e\b/,'mustang mach-e']];
 for(const[pattern,replacement]of families){const match=name.match(pattern);if(match)return `${v.brand.toLowerCase()}/${replacement.replace('$1',match[1]??'')}`;}
 name=name.replace(/\([^)]*\)/g,'').replace(/\b(awd|fwd|rwd|4wd|2wd|hev|phev|hybrid|electric|long range|standard range|extended range)\b.*$/,'').trim();
 return `${v.brand.toLowerCase()}/${name}`;
}
const checks=[['budgetUsd','msrpUsd','max','购车预算','USD'],['minSeats','seats','min','最少座位','座'],['minHorsepowerHp','horsepowerHp','min','最低马力','hp'],['minRangeMiles','epaRangeMiles','min','最低电动续航','mi'],['maxZeroTo60Sec','zeroTo60Sec','max','最大加速时间','秒'],['minCargoVolumeL','cargoVolumeL','min','最低后备箱空间','L'],['minGroundClearanceMm','groundClearanceMm','min','最低离地间隙','mm'],['minSafetyStars','nhtsaOverallStars','min','最低安全评级','星'],['maxLengthMm','lengthMm','max','最大车长','mm']];
export function assessConstraints(v,u){
 const gaps=[];let excluded=u.willingEv===false&&v.powertrain==='EV';
 for(const[key,field,op,label,unit]of checks){
  if(u[key]===undefined)continue;
  const actual=v.specifications[field];
  if(field==='epaRangeMiles'&&!['EV','PHEV'].includes(v.powertrain)){gaps.push({key,field,label,kind:'not-met',required:u[key],actual:null,unit,relative:1,message:'最低电动续航不适用：该燃油或普通混动车型不提供插电纯电续航'});continue;}
  if(actual==null)gaps.push({key,field,label,kind:'unknown',required:u[key],actual:null,unit,message:`${label}未核实：数据暂缺，不能确认满足 ${u[key]} ${unit}`});
  else if(op==='max'?actual>u[key]:actual<u[key]){
   const delta=Math.abs(actual-u[key]),relative=delta/u[key];
   gaps.push({key,field,label,kind:'not-met',required:u[key],actual,unit,delta,relative,message:`${label}未达标：实际 ${actual} ${unit}，要求${op==='max'?'不超过':'至少'} ${u[key]} ${unit}，${op==='max'?'超出':'少于'} ${Number(delta.toFixed(2))} ${unit}`});
  }
 }
 for(const key of ['bodyType','powertrain','drivetrain'])if(u[key]){
  const label=({bodyType:'车身类型',powertrain:'动力类型',drivetrain:'驱动形式'})[key],actual=v[key]??null;
  if(actual!==u[key])gaps.push({key,field:key,label,kind:actual===null?'unknown':'not-met',actual,required:u[key],message:`${label}${actual===null?'未核实':'不符合偏好'}：实际 ${actual??'未知'}，期望 ${u[key]}`});
 }
 if(gaps.some(g=>u.nonNegotiable.includes(g.key)))excluded=true;
 const unknown=gaps.filter(g=>g.kind==='unknown'),violations=gaps.filter(g=>g.kind==='not-met');
 const severe=violations.some(g=>g.relative!==undefined?g.relative>.25:['powertrain','bodyType'].includes(g.key));
 const status=gaps.length===0?'verified':severe?'comparison':unknown.length?'unverified':'near';
 const penalty=unknown.length*7+violations.reduce((sum,g)=>sum+(g.relative===undefined?12:Math.min(35,5+g.relative*35)),0);
 return {gaps,unknown,violations,excluded,status,penalty,severe,verifiedEligible:gaps.length===0};
}
export function diverseSelection(candidates,count=3){
 const ordered=[...candidates].sort((a,b)=>b.rankingScore-a.rankingScore||(b.score??-1)-(a.score??-1)||b.coverage-a.coverage||a.vehicle.id.localeCompare(b.vehicle.id));
 const selected=[],families=new Set(),brands=new Set();
 // One representative per car family; use distinct brands whenever the pool allows it.
 for(const uniqueBrand of [true,false])for(const item of ordered){
  if(selected.length>=count)break;
  const family=modelFamily(item.vehicle),brand=item.vehicle.brand.toLowerCase();
  if(families.has(family)||(uniqueBrand&&brands.has(brand)))continue;
  selected.push(item);families.add(family);brands.add(brand);
 }
 return selected;
}

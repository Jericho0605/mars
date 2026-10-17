export const weightDefaults={affordability:2,power:1,range:1,space:1,efficiency:3,charging:1,environment:1,safety:1};
export function normalizeWeights(input={}) {
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('weights must be an object');
 for(const[k,v]of Object.entries(input))if(!Object.hasOwn(weightDefaults,k)||typeof v!=='number'||!Number.isFinite(v)||v<0)throw Error(`Invalid weight ${k}`);
 const values={...weightDefaults,...input},sum=Object.values(values).reduce((a,b)=>a+b,0);
 if(sum<=0)throw Error('At least one weight must be positive');
 return Object.fromEntries(Object.entries(values).map(([k,v])=>[k,v/sum]));
}
export function annualMileage(u={}) {
 if(u.annualMiles!==undefined)return {annualMiles:u.annualMiles,source:'manual override'};
 if(u.commuteOneWayMiles!==undefined){let trips=u.commuteRoundTripsPerWeek??5,weeks=u.commuteWeeksPerYear??48,other=u.otherAnnualMiles??0;return {annualMiles:u.commuteOneWayMiles*2*trips*weeks+other,source:'round-trip commute formula',assumptions:{oneWayMiles:u.commuteOneWayMiles,roundTripsPerWeek:trips,weeksPerYear:weeks,otherAnnualMiles:other}};}
 return {annualMiles:12000,source:'editable demonstration assumption; no route measured'};
}
export function normalizeProfile(input={}) {
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Profile must be an object');
 let u={...input};
 if(u.recommendationMode!==undefined&&!['balanced','strict'].includes(u.recommendationMode))throw Error('Invalid recommendationMode');
 const constraintKeys=['budgetUsd','minSeats','minHorsepowerHp','minRangeMiles','maxZeroTo60Sec','minCargoVolumeL','minGroundClearanceMm','minSafetyStars','maxLengthMm','bodyType','powertrain','drivetrain'];
 if(u.nonNegotiable!==undefined&&(!Array.isArray(u.nonNegotiable)||u.nonNegotiable.some(k=>!constraintKeys.includes(k))))throw Error('Invalid nonNegotiable');
 u.nonNegotiable=u.nonNegotiable??[];
 const positive=['budgetUsd','minSeats','minHorsepowerHp','minRangeMiles','maxZeroTo60Sec','minCargoVolumeL','minGroundClearanceMm','minSafetyStars','targetHorsepowerHp','targetTorqueNm','targetZeroTo60Sec','targetRangeMiles','targetCargoVolumeL','targetSeats','maxLengthMm','targetLengthMm','ownershipYears','tcoTargetUsd','longTripsPerYear','seed'];
 for(const key of positive)if(u[key]!==undefined&&(!Number.isFinite(u[key])||u[key]<=0))throw Error(`Invalid ${key}`);
 for(const key of ['annualMiles','commuteOneWayMiles','commuteRoundTripsPerWeek','commuteWeeksPerYear','otherAnnualMiles','gasUsdPerGallon','electricityUsdPerKwh','homeElectricityUsdPerKwh','publicElectricityUsdPerKwh'])if(u[key]!==undefined&&(!Number.isFinite(u[key])||u[key]<0))throw Error(`Invalid ${key}`);
 for(const key of ['electricShare','homeChargingShare','cityDrivingShare','purchaseTaxRate','residualRateLow','residualRateHigh'])if(u[key]!==undefined&&(!Number.isFinite(u[key])||u[key]<0||u[key]>1))throw Error(`Invalid ${key}`);
 for(const key of ['homeCharging','homeLevel1','homeLevel2','canInstallLevel2','workCharging','dependsOnPublicCharging','willingEv','acceptUsed'])if(u[key]!==undefined&&typeof u[key]!=='boolean')throw Error(`Invalid ${key}`);
 if(u.homeCharging===false&&(u.homeLevel1===true||u.homeLevel2===true))throw Error('Home charging conditions contradict each other');
 if(u.drivetrain&&!['FWD','RWD','AWD','4WD'].includes(u.drivetrain))throw Error('Invalid drivetrain');
 if(u.powertrain&&!['Gas','HEV','PHEV','EV'].includes(u.powertrain))throw Error('Invalid powertrain');
 if(u.bodyType&&!['sedan','suv','hatchback','pickup'].includes(u.bodyType))throw Error('Invalid bodyType');
 if(u.minSafetyStars>5||u.commuteWeeksPerYear>53||u.commuteRoundTripsPerWeek>14||u.ownershipYears>30)throw Error('Profile value outside supported range');
 if(u.minSeats!==undefined&&!Number.isInteger(u.minSeats))throw Error('minSeats must be an integer');
 if(u.seed!==undefined&&!Number.isInteger(u.seed))throw Error('seed must be an integer');
 for(const key of ['annualInsuranceUsd','annualMaintenanceUsd','annualRepairsUsd','annualOtherUsd','purchaseFeesUsd','chargingInstallationUsd']){
  if(u[key]===undefined)continue;
  const a=Array.isArray(u[key])?u[key]:[u[key],u[key]];
  if(a.length!==2||a.some(x=>!Number.isFinite(x)||x<0)||a[0]>a[1])throw Error(`Invalid cost range ${key}`);
 }
 if(u.residualRateLow!==undefined&&u.residualRateHigh!==undefined&&u.residualRateLow>u.residualRateHigh)throw Error('Reversed residual scenario');
 const mileage=annualMileage(u);
 return {...u,annualMiles:mileage.annualMiles,mileage,weights:normalizeWeights(u.weights),ownershipYears:u.ownershipYears??5,seed:u.seed??42};
}

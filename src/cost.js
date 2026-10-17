import {annualMileage,normalizeProfile} from './profile.js';
const range=x=>x===undefined||x===null?null:Array.isArray(x)?x:[x,x];
const multiply=(a,k)=>a?.map(x=>x*k)??null;
function weightedMpg(s,u){
 if(u.cityDrivingShare!==undefined&&s.cityMpg&&s.highwayMpg)return 1/(u.cityDrivingShare/s.cityMpg+(1-u.cityDrivingShare)/s.highwayMpg);
 return s.combinedMpg;
}
export function energyCost(v,u={}) {
 u=normalizeProfile(u);
 const s=v.specifications,m=annualMileage(u).annualMiles,gas=u.gasUsdPerGallon??4;
 let electricMilesShare=v.powertrain==='EV'?1:v.powertrain==='PHEV'?(u.electricShare??null):0;
 if(!Number.isFinite(m)||m<0||!Number.isFinite(gas)||gas<0)throw Error('Invalid energy assumptions');
 if(electricMilesShare!==null&&(!Number.isFinite(electricMilesShare)||electricMilesShare<0||electricMilesShare>1))throw Error('electricShare must be 0–1');
 const hasHome=u.homeCharging===true||u.homeLevel1===true||u.homeLevel2===true;
 const homeExplicitlyAbsent=u.homeCharging===false||(u.homeLevel1===false&&u.homeLevel2===false);
 const homeShare=u.homeChargingShare??(homeExplicitlyAbsent||u.dependsOnPublicCharging===true?0:hasHome?1:null);
 if(homeShare!==null&&(!Number.isFinite(homeShare)||homeShare<0||homeShare>1))throw Error('Invalid homeChargingShare');
 if(homeExplicitlyAbsent&&homeShare>0)throw Error('Home charging share conflicts with no home access');
 const homeRate=u.homeElectricityUsdPerKwh??u.electricityUsdPerKwh??null,publicRate=u.publicElectricityUsdPerKwh??null;
 for(const r of [homeRate,publicRate])if(r!==null&&(!Number.isFinite(r)||r<0))throw Error('Invalid electricity rate');
 // The legacy explicit electricityUsdPerKwh represents a user-provided blended rate,
 // except when the user explicitly has no home charging: then public pricing is required.
 const rate=homeShare===null?(u.electricityUsdPerKwh??null):
  (homeShare===0||homeRate!==null)&&(homeShare===1||publicRate!==null)?homeShare*(homeRate??0)+(1-homeShare)*(publicRate??0):null;
 const mpg=weightedMpg(s,u),fuelMiles=electricMilesShare===null?null:m*(1-electricMilesShare),electricMiles=electricMilesShare===null?null:m*electricMilesShare;
 const fuel=fuelMiles===0?0:fuelMiles!==null&&mpg?fuelMiles/mpg*gas:null;
 const charge=electricMiles===0?0:electricMiles!==null&&s.electricConsumptionKwhPer100Mi&&rate!==null?electricMiles/100*s.electricConsumptionKwhPer100Mi*rate:null;
 const missing=[];
 if(electricMilesShare===null)missing.push('electricShare');
 if(fuel===null&&fuelMiles!==null)missing.push('MPG');
 if(charge===null&&electricMiles!==null){if(rate===null)missing.push('charging mix / applicable electricity tariff');if(!s.electricConsumptionKwhPer100Mi)missing.push('electric consumption');}
 return {annualFuelUsd:fuel,annualChargingUsd:charge,annualEnergyUsd:fuel===null||charge===null?null:fuel+charge,fuelMiles,electricMiles,missing,
  reason:v.powertrain==='PHEV'?'PHEV requires electricShare; costs approximate separate electric and fuel miles; blended operation is not simulated.':undefined,
  assumptions:{annualMiles:m,gasUsdPerGallon:gas,gasPriceSource:u.gasUsdPerGallon===undefined?'editable demo assumption':'user input',homeChargingShare:homeShare,homeElectricityUsdPerKwh:homeRate,publicElectricityUsdPerKwh:publicRate,blendedElectricityUsdPerKwh:rate,electricShare:electricMilesShare,mpgUsed:mpg,electricConsumptionBasis:'EPA wall electricity, no extra charging-loss multiplier; PHEV mode split approximate'},fiveYearTcoUsd:null};
}
export function ownershipCost(v,u={}) {
 u=normalizeProfile(u);
 const years=u.ownershipYears??5,energy=energyCost(v,u),price=v.specifications.msrpUsd;
 const tax=price!==null&&u.purchaseTaxRate!==undefined?[price*u.purchaseTaxRate,price*u.purchaseTaxRate]:null;
 const electric=['EV','PHEV'].includes(v.powertrain),installation=electric?range(u.chargingInstallationUsd):[0,0];
 const residual=price!==null&&u.residualRateLow!==undefined&&u.residualRateHigh!==undefined?[price*u.residualRateLow,price*u.residualRateHigh]:null;
 const components={purchasePriceUsd:range(price),purchaseTaxUsd:tax,purchaseFeesUsd:range(u.purchaseFeesUsd),holdingEnergyUsd:multiply(range(energy.annualEnergyUsd),years),holdingInsuranceUsd:multiply(range(u.annualInsuranceUsd),years),holdingMaintenanceUsd:multiply(range(u.annualMaintenanceUsd),years),holdingRepairsUsd:multiply(range(u.annualRepairsUsd),years),holdingOtherUsd:multiply(range(u.annualOtherUsd),years),chargingInstallationUsd:installation,resaleValueUsd:residual};
 const missing=Object.entries(components).filter(([,v])=>v===null).map(([k])=>k),known=Object.entries(components).filter(([k,v])=>k!=='resaleValueUsd'&&v!==null).map(([,v])=>v);
 const subtotal=[0,1].map(i=>known.reduce((sum,a)=>sum+a[i],0));
 const total=missing.length?null:[subtotal[0]-residual[1],subtotal[1]-residual[0]];
 return {...energy,ownershipYears:years,annualInsuranceUsd:range(u.annualInsuranceUsd),annualMaintenanceUsd:range(u.annualMaintenanceUsd),annualRepairsUsd:range(u.annualRepairsUsd),components,knownCostsSubtotalUsd:subtotal,tcoRangeUsd:total,fiveYearTcoUsd:years===5?total:null,missing,confidence:missing.length?'incomplete':'user-scenario-only',assumptions:{...energy.assumptions,purchaseBasis:'historical base MSRP; fees (including destination) entered separately; no incentives or financing assumed',residualRateLow:u.residualRateLow??null,residualRateHigh:u.residualRateHigh??null,note:'Insurance, maintenance, repairs and resale are adjustable user scenarios, not verified model-specific costs. Tax is a simplified user-rate calculation.'}};
}

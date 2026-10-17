const token=x=>String(x??'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const exactSeating=x=>/^\d+$/.test(String(x).trim())&&+x>0?+x:null;
const star=x=>/^[1-5]$/.test(String(x).trim())?+x:null;
const body=x=>({'SUV':'suv','4DR':'sedan','5HB':'hatchback','3HB':'hatchback','SW':'wagon','PURC':'pickup','PUEC':'pickup','PUCC':'pickup','VAN':'van','PV':'van','CV':'van','2DR':'coupe','C':'convertible'})[token(x)]??null;
function modelLabel(v){
 // Only explicit, reviewed aliases or redundant drive suffixes. Never infer trim or drivetrain.
 if(v.make==='Honda'&&v.epaModel==='Civic 4Dr'&&v.trim){return v.trim.startsWith('Si')?'CIVIC SEDAN SI':v.powertrain==='HEV'?'CIVIC SEDAN HYBRID':'CIVIC SEDAN';}
 if(v.make==='Honda'&&v.epaModel==='Civic 5Dr'&&v.trim){return v.trim==='Type R'?'CIVIC HATCHBACK TYPE R':v.powertrain==='HEV'?'CIVIC HATCHBACK HYBRID':'CIVIC HATCHBACK';}
 const clean=v.drivetrain?v.epaModel.replace(/\s+(FWD|RWD|AWD|4WD|2WD)$/i,''):v.epaModel;
 if(v.make==='Honda'&&clean==='CR-V'&&v.powertrain==='HEV')return 'CR-V HYBRID';
 return clean;
}
export function enrichSafety(records,rows,meta){
 const index=new Map();rows.forEach((r,i)=>{if(![2024,2025,2026].includes(+r.MODEL_YR))return;const k=[token(r.MAKE),+r.MODEL_YR,token(r.MODEL),r.DRIVE_TRAIN.trim()].join('|');if(!index.has(k))index.set(k,[]);index.get(k).push({...r,_row:i+2});});
 const log={matched:0,ambiguous:0,missing:0,conflicts:[]};
 for(const v of records){
  const k=[token(v.make),v.year,token(modelLabel(v)),v.drivetrain].join('|');let matches=index.get(k)??[];
  if(v.bodyStyle)matches=matches.filter(r=>body(r.BODY_STYLE)===v.bodyStyle);
  if(!matches.length){log.missing++;continue;}
  const styles=new Set(matches.map(r=>body(r.BODY_STYLE)));if(styles.size!==1||styles.has(null)||matches.some(r=>/EARLY|LATER/i.test(r.BODY_STYLE))){log.ambiguous++;continue;}
  log.matched++;const sameBody=[...styles][0];
  const scope={modelYear:v.year,make:matches[0].MAKE,model:matches[0].MODEL,drivetrain:v.drivetrain,bodyStyle:matches[0].BODY_STYLE,rows:matches.map(r=>r._row),applicability:'Exact make, model/explicit reviewed alias, model year, body and drivetrain. No VIN/retail-trim inference; all published release rows must agree.'};
  const provenance=field=>({url:meta.url,retrievedAt:meta.retrievedAt,provider:'NHTSA NCAP',sourceField:field,rawValue:matches.map(r=>r[field]),...scope});
  if(v.bodyStyle===null){v.bodyStyle=sameBody;v.sources.bodyStyle=provenance('BODY_STYLE');}
  for(const[field,sourceKey,parse]of [['seats','NUM_OF_SEATING',exactSeating],['nhtsaOverallRating','OVERALL_STARS',star],['nhtsaFrontalRating','OVERALL_FRNT_STARS',star],['nhtsaSideRating','OVERALL_SIDE_STARS',star],['nhtsaRolloverRating','ROLLOVER_STARS',star]]){
   const observations=matches.map(r=>parse(r[sourceKey])),values=new Set(observations);
   if(values.size!==1||values.has(null)){if(values.size>1){const conflict={id:v.id,field,type:'NHTSA-release-or-applicability-conflict',observations:matches.map(r=>({row:r._row,release:r.PRODUCTION_RELEASE,value:r[sourceKey]})),resolution:'no field imported; no best-rating selection'};v.conflicts.push(conflict);log.conflicts.push(conflict);}continue;}
   const incoming=observations[0];if(v[field]!==null&&v[field]!==incoming){const conflict={id:v.id,field,type:'cross-source-conflict',existing:v[field],incoming,incomingSource:provenance(sourceKey),resolution:'existing reviewed value retained'};v.conflicts.push(conflict);log.conflicts.push(conflict);continue;}
   if(v[field]===null){v[field]=incoming;v.sources[field]={...provenance(sourceKey),unit:field==='seats'?'count':'stars',rawUnit:field==='seats'?'count':'stars'};}
  }
  v.safetyRatingStatus=v.nhtsaOverallRating!==null?'Rated':matches.every(r=>!star(r.OVERALL_STARS))?'Not Rated':'Applicability unresolved';
  const features={ABS:'Anti-lock braking system',BLIND_SPOT_DETECTION:'Blind-spot detection',ADAPTIVE_CRUISE_CONTROL:'Adaptive cruise control',FRNT_COLLISION_WARNING:'Forward collision warning',LANE_DEPARTURE_WARNING:'Lane departure warning',CRASH_IMMINENT_BRAKE:'Crash imminent braking',DYNAMIC_BRAKE_SUPPORT:'Dynamic brake support',BACKUP_CAMERA:'Backup camera'};
  for(const[status,target]of [['Standard','standardSafetyFeatures'],['Optional','optionalSafetyFeatures']]){const included=Object.keys(features).filter(k=>matches.every(r=>r[k]?.trim()===status));if(included.length){v[target]=included.map(k=>features[k]).join('; ');v.sources[target]={...provenance(included.join(',')),rawValue:Object.fromEntries(included.map(k=>[k,status])),unit:'text',scope:'NHTSA reports these features as '+status+' for all matched release records; not a retail package guarantee'};}}
  v.nhtsaMatch=scope;
 }
 return log;
}

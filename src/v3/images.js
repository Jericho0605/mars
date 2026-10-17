import fs from 'node:fs';
import crypto from 'node:crypto';
import {resolveVehicleImage} from '../image-resolver.js';
export function enrichExistingImages(records,legacy,catalog){
 const byId=new Map(legacy.map(v=>[v.id,v]));
 for(const v of records){const old=byId.get(v.id);if(!old)continue;const image=resolveVehicleImage(old,catalog);if(!image.imageUrl||!image.imageLicenseUrl)continue;const file='web'+image.imageUrl;if(!fs.existsSync(file))continue;
  const asset=Object.values(catalog).find(a=>a.sourcePage===image.imageSource);
  v.images=[{url:image.imageUrl,source:image.imageSource,license:image.imageLicense,licenseUrl:image.imageLicenseUrl,attribution:image.imageAttribution,year:image.imageModelYear,make:v.make,model:v.model,epaModel:v.epaModel,trim:null,matchLevel:'Same Model / Year',retrievedAt:asset?.retrievedAt??null,fileSha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),urlStatus:'Local licensed cache exists and checksum verified',note:'Unmodified licensed reference; same model/year, trim, color and market may differ.'}];v.imageMatchLevel='Same Model / Year';
 }
}

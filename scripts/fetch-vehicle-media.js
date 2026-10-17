import fs from 'node:fs';
const pages={
 leaf:{year:2025,url:'https://usa.nissannews.com/en-US/releases/2025-nissan-leaf-press-kit'},
 maverick:{year:2025,url:'https://www.fromtheroad.ford.com/us/en/articles/2024/hybrid-meets-all-wheel-drive-on-new-tech-packed-2025-ford-maveri'}
};
fs.mkdirSync('web/images',{recursive:true});
const manifest=fs.existsSync('data/vehicle-media.json')?JSON.parse(fs.readFileSync('data/vehicle-media.json')):{};
for(const[key,p]of Object.entries(pages)){
 if(manifest[key]&&fs.existsSync(`web${manifest[key].src}`))continue;
 try{
  const response=await fetch(p.url,{signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error(`Page HTTP ${response.status}`);
  const html=await response.text(),tags=html.match(/<meta\b[^>]*>/gi)??[];
  const tag=tags.find(t=>/property\s*=\s*["']og:image["']/i.test(t));
  const raw=tag?.match(/content\s*=\s*["']([^"']+)/i)?.[1];
  if(!raw)throw Error('No verified OpenGraph image');
  const imageUrl=new URL(raw.replaceAll('&amp;','&'),p.url).href;
  const img=await fetch(imageUrl,{signal:AbortSignal.timeout(30000)});if(!img.ok)throw Error(`Image HTTP ${img.status}`);
  const type=img.headers.get('content-type')?.split(';')[0],ext=({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'})[type];if(!ext)throw Error(`Unsupported image ${type}`);
  const bytes=Buffer.from(await img.arrayBuffer());fs.writeFileSync(`web/images/${key}.${ext}`,bytes);
  manifest[key]={src:`/images/${key}.${ext}`,referenceYear:p.year,sourcePage:p.url,originalUrl:imageUrl,retrievedAt:new Date().toISOString(),credit:'Manufacturer official media image; trademarks and copyright belong to the respective owner',usage:'Reference photograph only; shown trim, paint and model year may differ from the recommended configuration'};
  console.log(`${key}: ${bytes.length} bytes ${imageUrl}`);
 }catch(e){console.error(`${key}: ${e.message}`);}
}
const commons={
 prius:{year:2024,title:'File:2024 Toyota Prius XLE AWD, front right, 06-01-2024.jpg'},
 priusPhev:{year:2024,title:'File:2024 Toyota Prius Prime XSE PHEV in Cutting Edge Metallic, front left.jpg'},
 corolla:{year:2024,title:'File:2024 Toyota Corolla LE in Classic Silver Metallic, front right.jpg'},
 corollaCross:{year:2024,title:'File:2024 Toyota Corolla Cross LE AWD in Wind Chill Pearl, front left.jpg'},
 corollaHatchback:{year:2022,title:'File:2022 Toyota Corolla Hatchback SE in Classic Silver Metallic, Front Right, 09-10-2023.jpg'}
};
const api=new URL('https://commons.wikimedia.org/w/api.php');
for(const[k,v]of Object.entries({action:'query',titles:Object.values(commons).map(p=>p.title).join('|'),prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:960,format:'json'}))api.searchParams.set(k,v);
const response=await fetch(api,{signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error(`Commons HTTP ${response.status}; stop and retry later, respecting service rate limits`);
const data=await response.json();
for(const[key,p]of Object.entries(commons)){
 const info=Object.values(data.query.pages).find(page=>page.title===p.title)?.imageinfo?.[0],meta=info?.extmetadata;
 if(!info||!meta.LicenseUrl?.value||!/^CC BY/.test(meta.LicenseShortName?.value??''))throw Error(`Missing reusable license ${key}`);
 const imageUrl=info.thumburl??info.url,img=await fetch(imageUrl,{signal:AbortSignal.timeout(30000)});if(!img.ok)throw Error(`Commons image HTTP ${img.status}`);
 fs.writeFileSync(`web/images/${key}.jpg`,Buffer.from(await img.arrayBuffer()));
 manifest[key]={src:`/images/${key}.jpg`,referenceYear:p.year,sourcePage:info.descriptionurl,originalUrl:info.url,retrievedAt:new Date().toISOString(),credit:meta.Artist.value.replace(/<[^>]+>/g,''),license:meta.LicenseShortName.value,licenseUrl:meta.LicenseUrl.value,usage:'Unmodified reference photo; image model year, trim, market and color may differ from recommendation',description:meta.ImageDescription?.value.replace(/<[^>]+>/g,'')??p.title};
 fs.writeFileSync('data/vehicle-media.json',JSON.stringify(manifest,null,2));
 console.log(`${key}: ${p.title} (${manifest[key].license})`);
}
fs.writeFileSync('data/vehicle-media.json',JSON.stringify(manifest,null,2));

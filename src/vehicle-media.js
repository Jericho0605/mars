export function mediaKey(v){
 if(v.brand==='Toyota'){
  if(/^Prius(?: |$)/.test(v.model))return v.powertrain==='PHEV'?'priusPhev':'prius';
  if(/^Corolla Cross(?: |$)/.test(v.model))return 'corollaCross';
  if(/^Corolla Hatchback(?: |$)/.test(v.model))return 'corollaHatchback';
  if(/^Corolla(?: Hybrid|$)/.test(v.model))return 'corolla';
 }
 if(v.brand==='Nissan'&&/^LEAF(?: SV)?$/.test(v.model)&&[2024,2025].includes(v.year))return 'leaf';
 if(v.brand==='Ford'&&/^Maverick(?: |$)/.test(v.model))return 'maverick';
 return null;
}
export function vehiclePresentation(v,catalog={}){
 const key=mediaKey(v),candidate=key?catalog[key]:null;
 const photo=candidate&&/^\/images\/[a-zA-Z]+\.(jpg|png|webp)$/.test(candidate.src)?candidate:null;
 const official=({Toyota:'https://www.toyota.com/search-inventory/',Nissan:'https://www.nissanusa.com/shopping-tools/search-inventory',Ford:'https://www.ford.com/inventory/maverick/'})[v.brand];
 const officialUrl=v.brand==='Ford'&&!/^Maverick(?: |$)/.test(v.model)?null:official??null;
 const search=new URL('https://www.google.com/search');search.searchParams.set('q',[v.year,v.brand,v.model,v.trim??'',v.drivetrain??'','for sale'].filter(Boolean).join(' '));
 return {photo:photo?{...photo,alt:`${photo.referenceYear} ${v.brand} ${key==='priusPhev'?'Prius Prime / PHEV':key==='prius'?'Prius':key==='corollaHatchback'?'Corolla Hatchback':key==='corollaCross'?'Corolla Cross':key==='corolla'?'Corolla':key==='leaf'?'LEAF':'Maverick'} 车型参考实拍图`,caption:`${photo.referenceYear} 年款参考图；图片配置、颜色及市场版本可能不同`}:null,purchase:{officialUrl,searchUrl:search.href,note:'链接为库存 / 在售搜索入口，请在目标网站核对年份、配置、价格及库存。'}};
}

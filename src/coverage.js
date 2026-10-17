import fs from 'node:fs';
import {report} from './data.js';
export function saveReport(v){
 const base=report(v),selected=v.filter(x=>x.retailConfiguration),keys=['msrpUsd','seats','horsepowerHp','torqueNm','cargoVolumeL','lengthMm','widthMm','heightMm'];
 base.manufacturerEnrichedCount=selected.length;
 base.coverage=Object.fromEntries(keys.map(k=>{let present=v.filter(x=>x.specifications[k]!==null).length;return [k,{present,total:v.length,percent:100*present/v.length,curatedPercent:selected.length?100*selected.filter(x=>x.specifications[k]!==null).length/selected.length:0}];}));
 base.sources={epa:v.length,manufacturer:selected.length,nhtsa:v.filter(x=>x.sources.nhtsaUrl).length};
 fs.writeFileSync('data/coverage.json',JSON.stringify(base,null,2));
 fs.writeFileSync('data/completeness.md',`# 数据完整度\n\n${v.length} 条 EPA 配置；${selected.length} 条已绑定人工核对的厂商零售配置。\n\n|字段|已知数|全库覆盖率|精选配置覆盖率|\n|---|---:|---:|---:|\n${keys.map(k=>`|${k}|${base.coverage[k].present}|${base.coverage[k].percent.toFixed(2)}%|${base.coverage[k].curatedPercent.toFixed(1)}%|`).join('\n')}\n\n价格为历史发布的 base MSRP，不代表当前成交价或仍有新车库存；不含目的地费、税费及选装。缺失数含不适用字段。\n\nNHTSA/安全评级未补充。全库缺失明细见 coverage.json；每个补充字段的 URL、获取日期、单位换算说明见 manufacturer-supplements.json。\n\n|EPA ID|年份|车型|选定 Trim|MSRP USD|座位|\n|---|---:|---|---|---:|---:|\n${selected.map(x=>`|${x.id}|${x.year}|${x.brand} ${x.model}|${x.trim}|${x.specifications.msrpUsd}|${x.specifications.seats}|`).join('\n')}\n`);
 return base;
}

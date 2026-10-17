import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {recommend} from '../src/recommend.js';
import {scenarios} from '../src/scenarios.js';
const db=JSON.parse(fs.readFileSync('data/vehicles.json'));
const run=(key,value)=>recommend(db.filter(v=>v.brand!=='Honda'),{...scenarios.student,weights:{...scenarios.student.weights,[key]:value}});
const signature=r=>r.recommendations.map(x=>x.vehicle.id).join(',');
test('seven supported sliders change default scenario Top 3 or their order at 0 vs 10',()=>{
 for(const key of ['affordability','power','space','efficiency','charging','environment','range']){
  const low=run(key,0),high=run(key,10);assert.notEqual(signature(low),signature(high),key);
  assert.equal(low.normalizedWeights[key],0);assert.ok(high.normalizedWeights[key]>0);
  for(const r of [low,high]){assert.equal(r.recommendations.length,3);assert.equal(new Set(r.recommendations.map(x=>x.vehicle.brand)).size,3);}
 }
});
test('unsupported safety weight is disclosed and cannot silently change other preferences',()=>{
 const low=run('safety',0),high=run('safety',10);assert.equal(signature(low),signature(high));assert.ok(high.unsupportedWeights.includes('safety'));assert.equal(high.normalizedWeights.safety,0);assert.match(high.weightNotice,/暂无/);
});
test('only unsupported weights produces unknown vehicle scores, not fabricated safety ratings',()=>{
 const weights=Object.fromEntries(['affordability','power','space','efficiency','charging','environment','range','safety'].map(k=>[k,k==='safety'?10:0]));
 const r=recommend(db,{weights});for(const x of r.recommendations){assert.equal(x.score,null);assert.equal(x.vehicle.specifications.nhtsaOverallStars,null);}assert.ok(r.unsupportedWeights.includes('safety'));
});
test('a preference missing for one car remains null rather than being inferred from other vehicles',()=>{
 const r=run('power',10);const candidates=[...r.recommendations,...r.alternatives];for(const x of candidates)if(x.vehicle.specifications.horsepowerHp===null)assert.equal(x.rawDna.horsepower,null);
 assert.deepEqual(signature(r),signature(run('power',10)));
});

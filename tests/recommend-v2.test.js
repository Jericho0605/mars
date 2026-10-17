import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {recommendV2} from '../src/recommend-v2.js';
import {modelFamily} from '../src/selection.js';

const db = JSON.parse(fs.readFileSync('data/vehicles.json'));
const scenarios = {
  student: {budgetUsd: 25000, minSeats: 5, annualMiles: 6000, homeCharging: false, publicElectricityUsdPerKwh: 0.45, priorities: ['price', 'running', 'efficiency']},
  family: {budgetUsd: 50000, minSeats: 7, targetCargoVolumeL: 800, priorities: ['safety', 'space', 'running']},
  performance: {budgetUsd: 60000, minHorsepowerHp: 250, priorities: ['performance']},
  ev: {budgetUsd: 45000, minSeats: 5, powertrains: ['EV'], homeLevel2: true, homeElectricityUsdPerKwh: 0.16, annualMiles: 22000, priorities: ['running', 'range', 'environment']},
  empty: {budgetUsd: 1000, minSeats: 9, minHorsepowerHp: 900}
};

for (const [name, p] of Object.entries(scenarios)) {
  test(`V2 ${name}: only real, verified, distinct matches; no evolution`, () => {
    const r = recommendV2(db, p);
    assert.equal(r.engine, 'rules-v2');
    assert.equal(r.evolution, undefined);
    assert.deepEqual(r, recommendV2(db, p));
    assert.equal(new Set(r.recommendations.map(x => modelFamily(x.vehicle))).size, r.recommendations.length);
    for (const x of r.recommendations) {
      assert.ok(db.some(v => v.id === x.vehicle.id));
      assert.ok(x.vehicle.specifications.msrpUsd <= p.budgetUsd);
      if (p.minSeats) assert.ok(x.vehicle.specifications.seats >= p.minSeats);
      if (p.minHorsepowerHp) assert.ok(x.vehicle.specifications.horsepowerHp >= p.minHorsepowerHp);
      assert.equal(x.constraintGaps.length, 0);
      assert.ok(x.tradeoffs.length);
    }
    if (name === 'empty') {
      assert.equal(r.recommendations.length, 0);
      assert.ok(r.emptyReason);
    } else {
      assert.ok(r.recommendations.length > 0);
    }
  });
}

test('V2 priorities affect scores; mileage changes costs; no home uses public tariff', () => {
  const v = db.find(x => x.id === 'epa-48400'), base = {budgetUsd: 45000, minSeats: 5, homeCharging: false, publicElectricityUsdPerKwh: 0.5, annualMiles: 5000};
  const a = recommendV2([v], {...base, priorities: ['price']}), b = recommendV2([v], {...base, priorities: ['range']});
  assert.notEqual(a.recommendations[0].score, b.recommendations[0].score);
  const c = recommendV2([v], {...base, annualMiles: 10000});
  assert.equal(c.recommendations[0].cost.annualEnergyUsd, a.recommendations[0].cost.annualEnergyUsd * 2);
  assert.equal(c.recommendations[0].cost.assumptions.blendedElectricityUsdPerKwh, 0.5);
});

test('V2 flexible alternatives never violate seat or explicit advanced requirements', () => {
  const r = recommendV2(db, {budgetUsd: 20000, strictBudget: false, minSeats: 5});
  assert.equal(r.recommendations.length, 0);
  assert.ok(r.alternatives.length);
  for (const x of r.alternatives) {
    assert.ok(x.vehicle.specifications.seats >= 5);
    assert.ok(x.constraintGaps.some(g => g.key === 'budgetUsd'));
  }
  assert.equal(recommendV2(db, {minSeats: 9, strictBudget: false}).alternatives.length, 0);
});

test('V2 missing specs stay null and unsupported preferences disclosed', () => {
  const r = recommendV2(db, {budgetUsd: 30000, minSeats: 5, priorities: ['comfort', 'safety']});
  assert.ok(r.warnings.length);
  assert.throws(() => recommendV2(db, {priorities: ['price', 'running', 'safety', 'space']}));
  assert.throws(() => recommendV2(db, {bodyTypes: ['rocket']}));
});

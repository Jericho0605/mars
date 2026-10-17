import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {recommend} from '../src/recommend.js';
import {modelFamily} from '../src/selection.js';
import {scenarios} from '../src/scenarios.js';

const db = JSON.parse(fs.readFileSync('data/vehicles.json'));

test('each default scenario offers three brands and three different car families', () => {
  for (const u of Object.values(scenarios)) {
    const r = recommend(db, u);
    assert.equal(r.recommendations.length, 3);
    assert.equal(new Set(r.recommendations.map(x => modelFamily(x.vehicle))).size, 3);
    assert.equal(new Set(r.recommendations.map(x => x.vehicle.brand)).size, 3);
    for (const x of r.recommendations) assert.ok(db.some(v => v.id === x.vehicle.id));
  }
});

test('year, drivetrain, trim and wheels never fill three slots with the same family', () => {
  for (const family of [['Prius', 'Prius AWD XLE/LTD', 'Prius Prime SE'], ['LEAF', 'LEAF SV'], ['Model Y Long Range AWD', 'Model Y Performance AWD'], ['Ioniq 5 AWD (19 inch Wheels)', 'Ioniq 5 RWD']]) {
    assert.equal(new Set(family.map(model => modelFamily({brand: 'Test', model}))).size, 1);
  }
  const only = db.filter(v => v.brand === 'Toyota' && v.model.startsWith('Prius'));
  const r = recommend(only, {});
  assert.equal(r.recommendations.length, 1);
  assert.ok(r.diversity.shortfall);
});

test('known near matches report exact budget excess without claiming eligibility', () => {
  const r = recommend(db, scenarios.student), near = r.alternatives.filter(x => x.matchStatus === 'near');
  assert.ok(near.length);
  for (const x of near) {
    assert.equal(x.verifiedEligible, false);
    for (const gap of x.constraintGaps.filter(g => g.key === 'budgetUsd' && g.kind === 'not-met')) {
      assert.equal(gap.delta, x.vehicle.specifications.msrpUsd - scenarios.student.budgetUsd);
      assert.match(gap.message, /超出/);
    }
  }
});

test('unknown prices are never zero or certified as affordable', () => {
  const r = recommend(db, {budgetUsd: 30000, minSeats: 5});
  assert.ok(r.incompleteVehicles.length > 0 || r.alternatives.length > 0);
  for (const x of [...r.recommendations, ...r.alternatives]) {
    if (x.vehicle.specifications.msrpUsd === null) {
      assert.equal(x.verifiedEligible, false);
      assert.ok(x.constraintGaps.some(g => g.key === 'budgetUsd' && g.kind === 'unknown'));
      assert.equal(x.cost.tcoRangeUsd, null);
    }
  }
});

test('flexible fallback supplies three genuine choices even when no vehicle verifies eight seats', () => {
  const r = recommend(db, {budgetUsd: 30000, minSeats: 8});
  assert.equal(r.recommendations.length, 3);
  assert.equal(r.verifiedRecommendations.length, 0);
  for (const x of r.recommendations) {
    assert.equal(x.verifiedEligible, false);
    assert.ok(x.constraintGaps.some(g => g.key === 'minSeats'));
  }
});

test('non-negotiable constraints and explicit EV refusal are never relaxed', () => {
  let r = recommend(db, {minSeats: 10, nonNegotiable: ['minSeats']});
  assert.equal(r.recommendations.length, 0);
  assert.ok(r.diversity.shortfall);
  r = recommend(db, {budgetUsd: 1000, nonNegotiable: ['budgetUsd']});
  assert.equal(r.recommendations.length, 0);
  r = recommend(db, {willingEv: false});
  for (const x of [...r.recommendations, ...r.alternatives]) {
    assert.notEqual(x.vehicle.powertrain, 'EV');
  }
});

test('no selection mutates vehicle data and seeded results remain repeatable', () => {
  const before = JSON.stringify(db), a = recommend(db, scenarios.student), b = recommend(db, scenarios.student);
  assert.deepEqual(a.recommendations.map(x => [x.vehicle.id, x.rankingScore]), b.recommendations.map(x => [x.vehicle.id, x.rankingScore]));
  assert.equal(JSON.stringify(db), before);
});

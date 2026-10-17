import {normalizeProfile} from './profile.js';
import {ownershipCost} from './cost.js';
import {assessConstraints,diverseSelection,modelFamily} from './selection.js';

export const dimensions = ['affordability', 'runningCost', 'performance', 'practicality', 'rangeConvenience', 'safety', 'environment'];

const dimensionNames = {
  affordability: 'Affordability',
  runningCost: 'Running cost',
  performance: 'Performance',
  practicality: 'Practicality',
  rangeConvenience: 'Range & convenience',
  safety: 'Safety',
  environment: 'Tailpipe emissions'
};

const priorityMap = {
  price: 'affordability',
  running: 'runningCost',
  performance: 'performance',
  efficiency: 'runningCost',
  range: 'rangeConvenience',
  space: 'practicality',
  safety: 'safety',
  environment: 'environment',
  comfort: null
};

const hardKeys = ['minSeats', 'minHorsepowerHp', 'minRangeMiles', 'maxZeroTo60Sec', 'minCargoVolumeL', 'maxLengthMm', 'minSafetyStars', 'drivetrain'];

const finite = x => typeof x === 'number' && Number.isFinite(x);

function scoreAffordability(msrp, budget) {
  if (!finite(msrp)) return null;
  const b = budget ?? 40000;
  if (msrp <= b * 0.85) {
    return Math.min(100, 90 + 10 * Math.max(0, 1 - msrp / (b * 0.85)));
  } else if (msrp <= b) {
    return 75 + 15 * ((b - msrp) / (b * 0.15));
  } else {
    const over = (msrp - b) / b;
    return Math.max(0, 75 * Math.exp(-6 * over));
  }
}

function scorePerformance(s, u, hasPerformancePriority) {
  const targetHp = u.targetHorsepowerHp ?? (hasPerformancePriority ? 300 : 200);
  const targetAccel = u.maxZeroTo60Sec ?? (hasPerformancePriority ? 5.5 : 7.8);
  let hpScore = null;
  if (finite(s.horsepowerHp)) {
    // Diminishing returns: more hp is always rewarded or sustained, never penalized
    hpScore = 100 * (1 - Math.exp(-1.8 * (s.horsepowerHp / targetHp)));
  }
  let accelScore = null;
  if (finite(s.zeroTo60Sec)) {
    accelScore = 100 / (1 + (s.zeroTo60Sec / targetAccel) ** 2);
  }
  if (hpScore !== null && accelScore !== null) {
    return hpScore * 0.5 + accelScore * 0.5;
  }
  return hpScore ?? accelScore;
}

function scoreRunningCost(annualEnergyUsd, annualMiles) {
  if (!finite(annualEnergyUsd)) return null;
  const targetCost = Math.max(600, (annualMiles ?? 12000) * 0.12);
  return 100 / (1 + (annualEnergyUsd / targetCost) ** 1.3);
}

function scorePracticality(s, u) {
  const minSeats = u.minSeats ?? 5;
  let seatScore = null;
  if (finite(s.seats)) {
    seatScore = s.seats >= minSeats ? 100 : Math.max(0, 100 - (minSeats - s.seats) * 35);
  }
  let cargoScore = null;
  if (finite(s.cargoVolumeL)) {
    const targetCargo = u.targetCargoVolumeL ?? 450;
    const ratio = s.cargoVolumeL / targetCargo;
    cargoScore = ratio >= 1 ? 100 : 100 * (ratio ** 0.75);
  }
  const parts = [seatScore, cargoScore].filter(finite);
  return parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : null;
}

function scoreRangeConvenience(v, u, input) {
  const electric = ['EV', 'PHEV'].includes(v.powertrain);
  if (!electric) return 95;
  const home = u.homeCharging || u.homeLevel1 || u.homeLevel2;
  const convenience = home ? 98 : u.workCharging ? 80 : (input.publicCharging === false ? 25 : 55);
  const targetRange = u.targetRangeMiles ?? (u.longTripsPerYear > 5 ? 300 : 220);
  const rangeScore = finite(v.specifications.epaRangeMiles) ? 100 * Math.min(1.15, v.specifications.epaRangeMiles / targetRange) : null;
  return rangeScore !== null ? (rangeScore * 0.4 + convenience * 0.6) : convenience;
}

function scoreEnvironment(tailpipeCo2) {
  if (!finite(tailpipeCo2)) return null;
  return 100 / (1 + tailpipeCo2 / 220);
}

function scoreSafety(nhtsaStars) {
  if (!finite(nhtsaStars)) return null;
  return Math.min(100, Math.max(20, nhtsaStars * 20));
}

export function recommendV2(vehicles, input = {}) {
  if (input.priorities !== undefined && (!Array.isArray(input.priorities) || input.priorities.length > 3 || new Set(input.priorities).size !== input.priorities.length || input.priorities.some(k => !Object.hasOwn(priorityMap, k)))) {
    throw Error('Choose up to three different priorities');
  }
  for (const k of ['strictBudget', 'strictBodyTypes', 'strictPowertrains']) {
    if (input[k] !== undefined && typeof input[k] !== 'boolean') throw Error(`Invalid ${k}`);
  }
  for (const [k, allowed] of [['bodyTypes', ['sedan', 'hatchback', 'suv', 'minivan', 'pickup', 'sports']], ['powertrains', ['Gas', 'HEV', 'PHEV', 'EV']]]) {
    if (input[k] !== undefined && (!Array.isArray(input[k]) || input[k].some(x => !allowed.includes(x)))) throw Error(`Invalid ${k}`);
  }

  const u = normalizeProfile({...input, weights: undefined});
  const weights = Object.fromEntries(dimensions.map(k => [k, 1]));

  // Priority bonus allocation (fixes drop bug when multiple priorities map to same category)
  const bonuses = [6, 4, 2];
  for (const [i, p] of (input.priorities ?? ['price', 'running', 'space']).entries()) {
    const bonus = bonuses[i] ?? 2;
    if (p === 'efficiency') {
      weights['runningCost'] += bonus * 0.6;
      weights['environment'] += bonus * 0.4;
    } else {
      const group = priorityMap[p];
      if (group && dimensions.includes(group)) {
        weights[group] += bonus;
      }
    }
  }

  // Lifestyle integration
  const lifestyles = input.lifestyles ?? [];
  if (lifestyles.includes('family')) { weights['practicality'] += 2.5; weights['safety'] += 1.5; }
  if (lifestyles.includes('commute')) { weights['runningCost'] += 2.0; weights['affordability'] += 1.0; }
  if (lifestyles.includes('fun')) { weights['performance'] += 3.0; }
  if (lifestyles.includes('roadtrip')) { weights['rangeConvenience'] += 2.5; weights['practicality'] += 1.0; }
  if (lifestyles.includes('outdoor')) { weights['practicality'] += 1.5; weights['performance'] += 1.0; }
  if (lifestyles.includes('cargo')) { weights['practicality'] += 3.0; }

  if (input.advancedWeights !== undefined) {
    if (!input.advancedWeights || typeof input.advancedWeights !== 'object' || Array.isArray(input.advancedWeights)) throw Error('Invalid advanced weights');
    for (const [k, v] of Object.entries(input.advancedWeights)) {
      if (!dimensions.includes(k) || !finite(v) || v < 0 || v > 10) throw Error('Invalid advanced weight');
      weights[k] = v;
    }
  }

  if (!Object.values(weights).some(x => x > 0)) throw Error('At least one priority weight must be positive');
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  for (const k of dimensions) weights[k] /= totalWeight;

  const unknown = [];
  const excluded = {};
  const candidates = [];
  const isPerformancePriority = (input.priorities ?? []).includes('performance');

  for (const v of vehicles) {
    const a = assessConstraints(v, {...u, nonNegotiable: []});
    const hard = a.gaps.filter(g => hardKeys.includes(g.key) || (g.key === 'budgetUsd' && input.strictBudget !== false) || ['powertrain', 'bodyType'].includes(g.key));

    const mismatch = (key, list, strict) => {
      if (list?.length && !list.includes(v[key])) {
        const gap = {key, message: `${key} does not match your selected types.`, kind: v[key] == null ? 'unknown' : 'not-met'};
        if (strict) hard.push(gap); else a.gaps.push(gap);
      }
    };
    mismatch('bodyType', input.bodyTypes, input.strictBodyTypes === true);
    mismatch('powertrain', input.powertrains, input.strictPowertrains !== false);

    if (u.willingEv === false && v.powertrain === 'EV') {
      hard.push({key: 'willingEv', kind: 'not-met', message: 'Electric vehicles excluded by preference.'});
    }

    if (hard.length) {
      for (const g of hard) excluded[g.key] = (excluded[g.key] ?? 0) + 1;
      if (hard.some(g => g.kind === 'unknown')) unknown.push({vehicle: v, gaps: hard});
      continue;
    }

    const s = v.specifications;
    const cost = ownershipCost(v, u);

    const groups = {
      affordability: scoreAffordability(s.msrpUsd, u.budgetUsd),
      runningCost: scoreRunningCost(cost.annualEnergyUsd, u.annualMiles),
      performance: scorePerformance(s, u, isPerformancePriority),
      practicality: scorePracticality(s, u),
      rangeConvenience: scoreRangeConvenience(v, u, input),
      safety: scoreSafety(s.nhtsaOverallStars),
      environment: scoreEnvironment(s.tailpipeCo2GPerMi)
    };

    const known = dimensions.filter(k => finite(groups[k]));
    const coverage = known.reduce((n, k) => n + weights[k], 0);
    const score = coverage ? known.reduce((n, k) => n + groups[k] * weights[k], 0) / coverage : null;

    const gaps = [...a.gaps];
    const reasons = [];
    const tradeoffs = [];

    if (finite(s.msrpUsd) && u.budgetUsd && s.msrpUsd <= u.budgetUsd) {
      const savings = u.budgetUsd - s.msrpUsd;
      if (savings > 4000) {
        reasons.push(`Priced at $${s.msrpUsd.toLocaleString()}, saving $${savings.toLocaleString()} under your budget.`);
      } else {
        reasons.push('Verified MSRP fits comfortably within your budget.');
      }
    }
    if (finite(s.seats) && u.minSeats && s.seats >= u.minSeats) {
      reasons.push(`Offers ${s.seats} seats, fully meeting your seating requirement.`);
    }

    for (const k of known.filter(k => groups[k] >= 70).sort((a, b) => weights[b] - weights[a]).slice(0, 2)) {
      reasons.push(({
        affordability: 'A highly competitive purchase price for your budget.',
        runningCost: `Estimated energy cost is just $${Math.round(cost.annualEnergyUsd).toLocaleString()}/year.`,
        performance: `Responsive ${s.horsepowerHp ? s.horsepowerHp + ' hp' : 'power delivery'} tailored to your driving style.`,
        practicality: 'Generous passenger and cargo space for daily life and trips.',
        rangeConvenience: 'Refueling and driving range align smoothly with your daily commute.',
        safety: `${s.nhtsaOverallStars ? s.nhtsaOverallStars + '-star' : 'Official'} safety rating provides peace of mind.`,
        environment: 'Low tailpipe emissions minimize your environmental footprint.'
      })[k]);
    }

    const electric = ['EV', 'PHEV'].includes(v.powertrain);
    const home = u.homeCharging || u.homeLevel1 || u.homeLevel2;
    if (electric && !home) tradeoffs.push('No home charging: public charging can take extra time and incur higher rates.');
    if (groups.safety === null) tradeoffs.push('Safety rating unavailable; safety cannot be verified.');
    tradeoffs.push('Environmental score covers EPA tailpipe emissions only, not power generation or vehicle production.');
    if (cost.tcoRangeUsd === null) tradeoffs.push('Full 5-year ownership cost is unavailable without personalized insurance and resale quotes.');
    if (gaps.length) tradeoffs.push(...gaps.map(g => g.message));

    candidates.push({
      vehicle: v,
      cost,
      score,
      groupScores: groups,
      coverage,
      rankingScore: (score ?? 0),
      matchStatus: gaps.length ? 'near' : 'verified',
      constraintGaps: gaps,
      reasons,
      tradeoffs
    });
  }

  const supported = dimensions.filter(k => candidates.some(r => finite(r.groupScores[k])));
  const supportedWeight = supported.reduce((n, k) => n + weights[k], 0);

  for (const r of candidates) {
    const normCoverage = supportedWeight ? r.coverage / supportedWeight : 0;
    // Balanced ranking: High product match with light penalty for soft gaps, no crushing multipliers
    r.coverage = normCoverage;
    r.rankingScore = (r.score ?? 0) * r.coverage - r.constraintGaps.length * 4;
  }

  const exactEligible = candidates.filter(x => !x.constraintGaps.length);
  let matches = diverseSelection(exactEligible, 20);

  // Progressive relaxation if exact matches are scarce
  let relaxedAlternatives = [];
  if (matches.length < 3) {
    const nearPool = candidates.filter(x => x.constraintGaps.length && !x.constraintGaps.some(g => g.key === 'willingEv'));
    relaxedAlternatives = diverseSelection(nearPool, 3);
  }

  const recommendations = matches.slice(0, 3);
  const moreMatches = matches.slice(3);
  const families = new Set(matches.map(x => modelFamily(x.vehicle)));

  const alternatives = relaxedAlternatives.length > 0 
    ? relaxedAlternatives 
    : diverseSelection(candidates.filter(x => x.constraintGaps.length && !families.has(modelFamily(x.vehicle))), 3);

  return {
    engine: 'rules-v2',
    recommendations,
    moreMatches,
    matches,
    candidateCount: exactEligible.length,
    alternatives,
    incompleteVehicles: unknown.slice(0, 12),
    eligibleCount: candidates.length,
    excluded,
    weights,
    unsupportedDimensions: dimensions.filter(k => !supported.includes(k)),
    warnings: [
      ...(input.priorities?.includes('safety') && !supported.includes('safety') ? ['Official safety ratings are unavailable for these candidates; safety cannot differentiate these matches.'] : []),
      ...(input.priorities?.includes('comfort') ? ['Comfort has no verified data and does not contribute to the score.'] : []),
      ...(input.acceptUsed ? ['Only historical new-car MSRP data is supported; used prices are unavailable.'] : [])
    ],
    profileSummary: {
      budgetUsd: u.budgetUsd,
      annualMiles: u.annualMiles,
      minSeats: u.minSeats,
      bodyTypes: input.bodyTypes ?? [],
      priorities: input.priorities ?? []
    },
    emptyReason: recommendations.length < 3 ? 'Fewer than three distinct verified car families satisfy your strict requirements. Try expanding your budget or vehicle style preferences.' : null
  };
}

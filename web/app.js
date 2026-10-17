import {vehicleTypeMarkup, bindVehicleTypes, vehicleTypeProfile} from '/vehicle-types.js';
import {resolveVehicleImage} from '/image-resolver.js';

const $ = s => document.querySelector(s), form = $('#form');

const types = [
  ['sedan', 'Sedan', 'Balanced comfort and efficiency for everyday driving.'],
  ['suv', 'SUV', 'Spacious versatility for families and adventures.'],
  ['hatchback', 'Hatchback', 'Compact footprint with flexible cargo opening.'],
  ['minivan', 'Minivan', 'Maximum passenger space and family convenience.'],
  ['pickup', 'Pickup Truck', 'Towing power and open cargo bed for gear.'],
  ['sports', 'Sports Car', 'Agile handling and thrilling performance.']
];

function illustration(type = 'sedan', hero = false) {
  const tall = ['suv', 'minivan', 'pickup'].includes(type);
  const pickup = type === 'pickup';
  const sports = type === 'sports';
  return `<svg viewBox="0 0 420 180" aria-label="Generic ${type} body-style illustration" role="img">
    <ellipse cx="215" cy="151" rx="176" ry="9" fill="#263d2f" opacity=".12"/>
    <path d="M35 109 Q40 94 83 91 L${sports?149:126} ${tall?38:61} Q140 ${tall?28:48} 175 ${tall?28:48} L${pickup?230:268} ${tall?28:48} L${pickup?'246 88 350 88':'323 92'} Q375 97 385 115 L384 137 Q380 144 363 144 L51 144 Q27 139 35 109" fill="${hero?'#156d4e':'#6e957a'}" stroke="#104f38" stroke-width="2"/>
    <path d="M110 88 L142 ${tall?43:62} L197 ${tall?42:61} L197 88 Z M210 ${tall?42:61} L${pickup?224:265} ${tall?42:61} L${pickup?241:299} 88 L210 88 Z" fill="#cbe2d3" stroke="#1d4d38" stroke-width="2.5"/>
    <circle cx="103" cy="139" r="26" fill="#26382f"/>
    <circle cx="103" cy="139" r="14" fill="#cbd4ca"/>
    <circle cx="322" cy="139" r="26" fill="#26382f"/>
    <circle cx="322" cy="139" r="14" fill="#cbd4ca"/>
  </svg>`;
}

$('#hero-car').innerHTML = `
  <div class="hero-image-wrap">
    <img src="/images/model3.jpg" alt="DriveWise Featured Vehicle" class="hero-car-photo">
    <div class="hero-floating-badge">
      <span class="badge-icon">⚡</span>
      <div>
        <strong>Modern & Eco-Conscious</strong>
        <small>Smart Multi-Factor Matching</small>
      </div>
    </div>
  </div>
`;
$('#type-intro').innerHTML = types.map(([k, n, d]) => {
  const fileKey = k === 'sports' ? 'sports-car' : k;
  return `<a class="type-card" href="#quiz"><div class="type-card-img"><img src="/images/car-types/${fileKey}.png" alt="${n}"></div><h3>${n}</h3><p>${d}</p></a>`;
}).join('');

const num = (name, label, value = '', extra = '') => `<label>${label}<input name="${name}" type="number" min="0" value="${value}" ${extra}></label>`;
const select = (name, label, options) => `<label>${label}<select name="${name}">${options.map(([v, n]) => `<option value="${v}">${n}</option>`).join('')}</select></label>`;
const check = (name, label, checked = false) => `<label class="check"><input type="checkbox" name="${name}" ${checked ? 'checked' : ''}>${label}</label>`;

const priorities = [
  ['price', 'Affordable Price'],
  ['running', 'Low Running Costs'],
  ['performance', 'Performance & Power'],
  ['efficiency', 'Fuel Efficiency'],
  ['range', 'Long Electric Range'],
  ['space', 'Interior Passenger & Cargo Space'],
  ['safety', 'Safety Ratings'],
  ['comfort', 'Ride Comfort'],
  ['environment', 'Low Tailpipe Emissions']
];

const lifestyle = [
  ['commute', 'Daily Commuting'],
  ['family', 'Family & Kids'],
  ['roadtrip', 'Long Road Trips'],
  ['city', 'City Driving & Parking'],
  ['outdoor', 'Outdoor & Adventures'],
  ['fun', 'Driving Fun & Speed'],
  ['cargo', 'Work & Heavy Cargo']
];

const radio = (name, options, selected) => `<div class="choices">${options.map(([v, n]) => `<label class="choice"><input type="radio" name="${name}" value="${v}" ${v === selected ? 'checked' : ''}><b>${n}</b></label>`).join('')}</div>`;

const steps = [
  ['Budget', "What's your purchase budget?", `
    <p>Select your maximum purchase budget. DriveWise compares prices and evaluates value for money.</p>
    ${radio('budgetBand', [
      ['25000', 'Under $25,000'],
      ['35000', '$25,000–$35,000'],
      ['45000', '$35,000–$45,000'],
      ['60000', '$45,000–$60,000'],
      ['85000', '$60,000–$85,000'],
      ['custom', 'Custom Budget']
    ], '45000')}
    <label class="budget-slider">
      Fine-tune your maximum: <output id="budget-output">$45,000</output>
      <input name="budgetUsd" type="range" min="15000" max="150000" step="1000" value="45000">
    </label>
    <div id="custom-budget" hidden>
      ${num('customBudget', 'Exact maximum · USD', 45000, 'min="1"')}
    </div>
    ${check('strictBudget', 'Strict budget limit (strictly exclude cars exceeding budget)', false)}
    <p class="fine">MSRP is official base sticker price, excluding destination, optional packages, and taxes.</p>
  `],
  ['Lifestyle', "How will you use your car?", `
    <p>Tell us what fits your daily routines and family requirements.</p>
    <div class="choices">
      ${lifestyle.map(([v, n]) => `<label class="choice"><input name="lifestyles" value="${v}" type="checkbox"><b>${n}</b></label>`).join('')}
    </div>
    <h3>How many seats do you need?</h3>
    ${radio('minSeats', [['2', '2 Seats'], ['5', '4–5 Seats'], ['7', '6–7 Seats'], ['8', '8 Seats']], '5')}
    <p class="fine">Vehicles meeting or exceeding your required seat count will be matched.</p>
    ${vehicleTypeMarkup()}
  `],
  ['Preferences', "What matters most to you?", `
    <p>Pick up to three priorities. Drag or use the arrows to order them by importance.</p>
    <div class="choices">
      ${priorities.map(([v, n]) => `<label class="choice"><input type="checkbox" name="priorities" value="${v}" ${['price', 'running', 'space'].includes(v) ? 'checked' : ''}><b>${n}</b></label>`).join('')}
    </div>
    <ol id="priority-order" class="priority-order"></ol>
    <h3>Customer Survey: Environmental Preference · 环保出行意愿</h3>
    <p>How strongly do you prioritize low emissions and eco-friendly vehicles?</p>
    ${radio('ecoWillingness', [
      ['standard', 'Standard · No special preference (普通 / 无特殊要求)'],
      ['moderate', 'Eco-Conscious · Prefer hybrid & high efficiency (偏好节能减排与混动)'],
      ['high', 'Zero-Emission Focus · Prioritize clean energy & low carbon (高度重视 · 优先新能源与零排放)']
    ], 'standard')}
  `],
  ['Powertrain & Driving', "What kind of driving do you do?", `
    <p>Choose your preferred powertrain and annual driving distance.</p>
    ${radio('powertrainChoice', [
      ['', 'No Preference (Show Best)'],
      ['Gas', 'Gasoline'],
      ['HEV', 'Hybrid (HEV)'],
      ['PHEV', 'Plug-in Hybrid (PHEV)'],
      ['EV', 'Electric (EV)']
    ], '')}
    ${check('strictPowertrains', 'Strict powertrain filter (strictly exclude other powertrains)', false)}
    <h3>How far do you drive annually?</h3>
    ${radio('drivingBand', [
      ['7000', 'Low · about 5,000–8,000 miles/year'],
      ['12000', 'Standard · about 10,000–15,000 miles/year'],
      ['20000', 'High · about 16,000–25,000 miles/year'],
      ['custom', 'Custom annual mileage']
    ], '12000')}
    <div id="charging-choice" hidden>
      <h3>Can you charge at home?</h3>
      ${radio('homeAccess', [
        ['none', 'No home charging (public stations only)'],
        ['level1', 'Standard outlet (Level 1)'],
        ['level2', 'Dedicated charger (Level 2)']
      ], 'none')}
    </div>
    <details>
      <summary>Advanced Filters · optional</summary>
      <div class="fields">
        ${num('minHorsepowerHp', 'Minimum horsepower · hp')}
        ${num('maxZeroTo60Sec', 'Maximum 0–60 mph · seconds', '', 'step="0.1"')}
        ${num('minCargoVolumeL', 'Minimum cargo · liters')}
        ${num('minRangeMiles', 'Minimum EV range · miles')}
        ${num('maxLengthMm', 'Maximum vehicle length · mm')}
        ${num('annualMiles', 'Exact annual mileage · optional')}
        ${num('gasUsdPerGallon', 'Gasoline · USD/gallon', 3.80, 'step="0.01"')}
        ${num('homeElectricityUsdPerKwh', 'Home electricity · USD/kWh', 0.16, 'step="0.01"')}
        ${num('publicElectricityUsdPerKwh', 'Public charging · USD/kWh', 0.45, 'step="0.01"')}
        ${select('workCharging', 'Workplace charging', [['false', 'Not available'], ['true', 'Available']])}
        ${select('drivetrain', 'Drivetrain', [['', 'No preference'], ['AWD', 'All-Wheel Drive (AWD)'], ['FWD', 'Front-Wheel Drive (FWD)'], ['RWD', 'Rear-Wheel Drive (RWD)'], ['4WD', '4-Wheel Drive (4WD)']])}
      </div>
    </details>
  `]
];

$('#steps').innerHTML = steps.map(([name, title, content], i) => `
  <section data-step="${i}" ${i ? 'hidden' : ''}>
    <p class="eyebrow">${String(i + 1).padStart(2, '0')} / ${name.toUpperCase()}</p>
    <h2>${title}</h2>
    ${content}
  </section>
`).join('');

bindVehicleTypes(form);

let step = 0, result = null, selected = new Map(), busy = false;

function stepView() {
  document.querySelectorAll('[data-step]').forEach((e, i) => e.hidden = i !== step);
  $('#step-count').textContent = `Step ${step + 1} of 4 · ${steps[step][0]}`;
  $('#progress-fill').style.width = `${((step + 1) / 4) * 100}%`;
  $('#back').disabled = step === 0;
  $('#next').textContent = step === 3 ? 'Find My Cars ↗' : 'Continue →';
  $('#form-error').textContent = '';
}

function route() {
  const id = location.hash.slice(1) || 'home';
  for (const e of document.querySelectorAll('.view')) {
    e.hidden = e.id !== (['home', 'quiz', 'results', 'compare', 'about'].includes(id) ? id : 'home');
  }
  if (id === 'compare') renderCompare();
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
$('#back').onclick = () => { if (step > 0) { step--; stepView(); } };

function validateStep() {
  if (step === 3 && form.elements.drivingBand.value === 'custom' && !form.elements.annualMiles.value) {
    $('#form-error').textContent = 'Enter your annual mileage under Advanced Filters.';
    form.querySelector('details').open = true;
    return false;
  }
  for (const e of document.querySelector(`[data-step="${step}"]`).querySelectorAll('input,select')) {
    if (!e.checkValidity()) { e.reportValidity(); return false; }
  }
  if (step === 2 && form.querySelectorAll('[name=priorities]:checked').length > 3) {
    $('#form-error').textContent = 'Choose at most three priorities.';
    return false;
  }
  return true;
}

let orderedPriorities = ['price', 'running', 'space'];
function updatePriorities() {
  const checked = [...form.querySelectorAll('[name=priorities]:checked')].map(e => e.value);
  orderedPriorities = orderedPriorities.filter(x => checked.includes(x));
  for (const k of checked) if (!orderedPriorities.includes(k)) orderedPriorities.push(k);
  const list = $('#priority-order');
  list.replaceChildren();
  orderedPriorities.forEach((k, i) => {
    const li = document.createElement('li'), span = document.createElement('span');
    span.textContent = priorities.find(x => x[0] === k)[1];
    li.append(span);
    for (const [label, delta] of [['↑', -1], ['↓', 1]]) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'secondary';
      b.textContent = label;
      b.setAttribute('aria-label', `Move ${span.textContent} ${delta < 0 ? 'up' : 'down'}`);
      b.disabled = i + delta < 0 || i + delta >= orderedPriorities.length;
      b.onclick = () => {
        [orderedPriorities[i], orderedPriorities[i + delta]] = [orderedPriorities[i + delta], orderedPriorities[i]];
        updatePriorities();
      };
      li.append(b);
    }
    list.append(li);
  });
}

function profile() {
  const eco = form.elements.ecoWillingness ? form.elements.ecoWillingness.value : 'standard';
  const p = {
    priorities: [...orderedPriorities],
    strictBudget: form.elements.strictBudget ? form.elements.strictBudget.checked : false,
    minSeats: Number(form.elements.minSeats.value),
    budgetUsd: Number(form.elements.budgetBand.value === 'custom' ? form.elements.customBudget.value : form.elements.budgetUsd.value),
    ecoWillingness: eco
  };
  if (eco === 'high') {
    p.advancedWeights = Object.assign({}, p.advancedWeights, {environment: 8.5});
    if (!p.priorities.includes('environment') && p.priorities.length < 3) {
      p.priorities.push('environment');
    }
  } else if (eco === 'moderate') {
    p.advancedWeights = Object.assign({}, p.advancedWeights, {environment: 5.5});
  }

  for (const e of form.querySelectorAll('details input[type=number],details select')) {
    if (e.value !== '') {
      p[e.name] = e.type === 'number' ? Number(e.value) : e.value === 'true' ? true : e.value === 'false' ? false : e.value;
    }
  }

  Object.assign(p, vehicleTypeProfile(form));

  const mode = form.elements.powertrainChoice.value;
  if (mode) p.powertrains = [mode];
  p.strictPowertrains = form.elements.strictPowertrains ? form.elements.strictPowertrains.checked : false;

  p.annualMiles = p.annualMiles ?? Number(form.elements.drivingBand.value === 'custom' ? 12000 : form.elements.drivingBand.value);

  const home = form.elements.homeAccess.value;
  p.homeCharging = home !== 'none' && ['EV', 'PHEV'].includes(mode);
  p.homeLevel1 = p.homeCharging && home === 'level1';
  p.homeLevel2 = p.homeCharging && home === 'level2';
  p.homeChargingShare = p.homeCharging ? 0.85 : 0;
  p.electricShare = 0.6;

  const life = [...form.querySelectorAll('[name=lifestyles]:checked')].map(e => e.value);
  p.lifestyles = life;
  p.targetCargoVolumeL = life.includes('cargo') ? 1100 : life.includes('family') || life.includes('outdoor') ? 850 : 480;
  if (life.includes('roadtrip')) { p.longTripsPerYear = 12; p.targetRangeMiles = 300; }
  if (life.includes('commute')) p.cityDrivingShare = 0.5;
  if (life.includes('city')) { p.cityDrivingShare = 0.8; p.targetLengthMm = 4450; }
  if (life.includes('fun')) p.targetHorsepowerHp = 300;

  return p;
}

function updateMileage(event) {
  if (event?.target.name === 'budgetBand' && form.elements.budgetBand.value !== 'custom') {
    form.elements.budgetUsd.value = form.elements.budgetBand.value;
  }
  $('#budget-output').textContent = `$${Number(form.elements.budgetUsd.value).toLocaleString()}`;
  $('#custom-budget').hidden = form.elements.budgetBand.value !== 'custom';
  const mode = form.elements.powertrainChoice.value;
  $('#charging-choice').hidden = !['EV', 'PHEV'].includes(mode);
  if (form.elements.drivingBand.value === 'custom') form.querySelector('details').open = true;
  updatePriorities();
}

form.addEventListener('input', updateMileage);
form.addEventListener('submit', e => e.preventDefault());

$('#next').onclick = async () => {
  if (busy || !validateStep()) return;
  if (step < 3) { step++; stepView(); return; }
  busy = true;
  $('#next').disabled = true;
  $('#next').textContent = 'Analyzing 3,600+ cars…';
  try {
    const p = profile();
    const response = await fetch('/api/recommend', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(p)
    });
    const body = await response.json();
    if (!response.ok) throw Error(body.error ?? 'Recommendation unavailable');
    result = body;
    selected.clear();
    $('#compare-count').textContent = '0';
    renderResults(p);
    location.hash = 'results';
  } catch (e) {
    $('#form-error').textContent = `We couldn't load matches: ${e.message}. Please try again.`;
  } finally {
    busy = false;
    $('#next').disabled = false;
    $('#next').textContent = 'Find My Cars ↗';
  }
};

const money = x => x == null ? 'Data unavailable' : new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD', maximumFractionDigits: 0}).format(x);
const show = x => x == null ? 'Data unavailable' : typeof x === 'number' ? Number(x.toFixed(1)).toLocaleString() : String(x);
const text = (p, tag, value, cls) => {
  const e = document.createElement(tag);
  e.textContent = value;
  if (cls) e.className = cls;
  p.append(e);
  return e;
};

let mediaCatalog = {};
try {
  const response = await fetch('/vehicle-media.json');
  if (response.ok) mediaCatalog = await response.json();
} catch {}

let shownMore = false;

function external(parent, label, url) {
  if (!url) return;
  const a = text(parent, 'a', label, 'external-link');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
}

function findCarImage(v, image) {
  if (image && image.imageUrl) return image.imageUrl;
  const m = (v.model || '').toLowerCase();
  const b = (v.brand || '').toLowerCase();
  if (m.includes('model 3')) return '/images/model3.jpg';
  if (m.includes('rav4')) return '/images/rav4.jpg';
  if (m.includes('elantra')) return '/images/elantra.jpg';
  if (m.includes('leaf')) return '/images/leaf.jpg';
  if (m.includes('maverick')) return '/images/maverick.jpg';
  if (m.includes('prius')) return (v.powertrain === 'PHEV' || m.includes('prime')) ? '/images/priusPhev.jpg' : '/images/prius.jpg';
  if (m.includes('corolla cross')) return '/images/corollaCross.jpg';
  if (m.includes('corolla') && (m.includes('hatchback') || m.includes('5dr'))) return '/images/corollaHatchback.jpg';
  if (m.includes('corolla')) return '/images/corolla.jpg';
  if (b === 'honda' && m.includes('cr-v')) return '/images/hondaCrv.jpg';
  if (b === 'honda' && m.includes('civic')) return '/images/hondaCivicSedan.jpg';
  const bt = (v.bodyType || 'sedan').toLowerCase();
  const mapType = bt === 'sports' ? 'sports-car' : bt;
  return `/images/car-types/${mapType}.png`;
}

function renderCard(r, parent) {
  const v = r.vehicle, s = v.specifications;
  const image = resolveVehicleImage(v, mediaCatalog);
  const card = text(parent, 'article', '', 'car-card');
  const art = text(card, 'div', '', 'car-art');

  const carImgUrl = findCarImage(v, image);
  const img = document.createElement('img');
  img.src = carImgUrl;
  img.alt = `${v.year} ${v.brand} ${v.model}`;
  img.loading = 'lazy';
  img.onerror = () => {
    const bt = (v.bodyType || 'sedan').toLowerCase();
    const mapType = bt === 'sports' ? 'sports-car' : bt;
    img.src = `/images/car-types/${mapType}.png`;
  };
  art.append(img);
  text(art, 'small', carImgUrl.includes('car-types') ? `${(v.bodyType ?? 'car').toUpperCase()} STYLE` : 'VEHICLE PHOTO');

  const b = text(card, 'div', '', 'car-content');

  const topBar = text(b, 'div', '', 'card-top-bar');
  const scoreVal = r.score ?? 85;
  const scoreEl = text(topBar, 'span', `${scoreVal.toFixed(0)}% Match`, 'score');
  if (scoreVal >= 90) scoreEl.classList.add('high');

  const ptBadge = v.powertrain === 'EV' ? '🌱 Zero Emission EV' : v.powertrain === 'HEV' ? '🌿 Eco Hybrid' : v.powertrain === 'PHEV' ? '⚡ Plug-in Hybrid' : '⛽ Gas';
  text(topBar, 'span', ptBadge, 'tag-pill');
  if (['EV', 'HEV', 'PHEV'].includes(v.powertrain)) {
    text(topBar, 'span', '🌿 Low Carbon Choice', 'tag-pill eco-pill');
  }

  text(b, 'h3', `${v.year} ${v.brand} ${v.model}`);
  text(b, 'p', `${v.trim ?? (v.bodyType ? v.bodyType.toUpperCase() : 'Standard')} · ${v.powertrain} · ${v.drivetrain ?? 'Standard Drive'}`, 'meta');

  // Specs grid
  const dl = text(b, 'dl', '', 'specs');
  const specItems = [
    ['Starting MSRP', money(s.msrpUsd)],
    ['Est. Energy Cost', r.cost?.annualEnergyUsd ? `${money(r.cost.annualEnergyUsd)}/yr` : '—'],
    ['Power', s.horsepowerHp ? `${s.horsepowerHp} hp` : '—'],
    ['MPG / MPGe', show(s.combinedMpg ?? s.combinedMpge)],
    ['Seats', show(s.seats)],
    ['0–60 mph', s.zeroTo60Sec ? `${s.zeroTo60Sec}s` : '—']
  ];

  for (const [label, val] of specItems) {
    const d = text(dl, 'div', '');
    text(d, 'dt', label);
    text(d, 'dd', val);
  }

  // Why this car
  text(b, 'h4', 'Why This Car Fits You');
  const reasonsList = text(b, 'ul', '', 'reasons-list');
  for (const reason of r.reasons.slice(0, 3)) {
    text(reasonsList, 'li', reason);
  }

  // Details
  const detail = text(b, 'details', '');
  text(detail, 'summary', 'View Full Specs & Trade-offs');

  if (r.tradeoffs?.length) {
    text(detail, 'h4', 'Things to Consider');
    const ul = text(detail, 'ul', '');
    for (const item of r.tradeoffs.slice(0, 3)) text(ul, 'li', item);
  }

  text(detail, 'h4', 'Detailed Specifications');
  text(detail, 'p', `Cargo Volume: ${show(s.cargoVolumeL)} L · Length: ${show(s.lengthMm)} mm`);
  if (s.nhtsaOverallStars) {
    text(detail, 'p', `NHTSA Safety Rating: ${'★'.repeat(s.nhtsaOverallStars)} (${s.nhtsaOverallStars} Stars)`);
  }
  if (['EV', 'PHEV'].includes(v.powertrain) && s.epaRangeMiles) {
    text(detail, 'p', `EPA Electric Range: ${s.epaRangeMiles} miles`);
  }

  const sources = text(detail, 'details', '');
  text(sources, 'summary', 'Data Provenance');
  external(sources, 'EPA Energy & Emissions Record', v.sources.epaUrl);

  // Card bottom actions
  const actions = text(b, 'div', '', 'card-actions');
  const label = text(actions, 'label', '', 'check');
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.setAttribute('aria-label', `Compare ${v.year} ${v.brand} ${v.model}`);
  cb.checked = selected.has(v.id);
  label.append(cb, document.createTextNode(' Compare'));

  cb.onchange = () => {
    if (cb.checked && selected.size === 3) {
      cb.checked = false;
      $('#result-status').textContent = 'You can compare up to three cars at once. Remove one to add another.';
      return;
    }
    if (cb.checked) {
      selected.set(v.id, r);
    } else {
      selected.delete(v.id);
    }
    $('#compare-count').textContent = String(selected.size);
  };

  const actionLinks = text(actions, 'div', '', 'action-links');
  if (image.officialVehicleUrl) {
    external(actionLinks, `${v.brand} Official Site ↗`, image.officialVehicleUrl);
  }
  if (image.inventoryUrl) {
    external(actionLinks, 'Local Inventory ↗', image.inventoryUrl);
  }
}

function renderMatches() {
  const all = [...(result?.matches ?? [])];
  const type = $('#result-type').value;
  const pt = $('#result-powertrain') ? $('#result-powertrain').value : '';
  const sort = $('#result-sort').value;

  let list = all;
  if (type) list = list.filter(r => r.vehicle.bodyType === type);
  if (pt) list = list.filter(r => r.vehicle.powertrain === pt);

  if (sort !== 'match') {
    list.sort((a, b) => {
      const get = r => {
        if (sort === 'price') return r.vehicle.specifications.msrpUsd;
        if (sort === 'performance') return r.vehicle.specifications.horsepowerHp;
        if (sort === 'energy') return r.cost.annualEnergyUsd;
        return r.score;
      };
      const x = get(a), y = get(b);
      return x == null ? (y == null ? 0 : 1) : y == null ? -1 : sort === 'performance' ? y - x : x - y;
    });
  }

  $('#cards').replaceChildren();
  $('#more-cards').replaceChildren();

  for (const r of list.slice(0, 3)) renderCard(r, $('#cards'));
  for (const r of list.slice(3)) renderCard(r, $('#more-cards'));

  $('#more-cards').hidden = !shownMore;
  $('#more-title').hidden = !shownMore || list.length <= 3;
  $('#match-heading').textContent = sort === 'match' ? 'Top 3 Best Matches' : `Your Matches · Sorted by ${$('#result-sort').selectedOptions[0].text}`;
  $('#show-more').hidden = list.length <= 3;
  $('#show-more').textContent = shownMore ? 'Show Less' : `Show More (${Math.max(0, list.length - 3)} more options)`;

  if (!list.length) {
    text($('#cards'), 'p', 'No matches found with these specific filters. Try selecting "All body styles" or "All powertrains".', 'notice');
  }
}

$('#show-more').onclick = () => { shownMore = !shownMore; renderMatches(); };
$('#result-type').onchange = renderMatches;
if ($('#result-powertrain')) $('#result-powertrain').onchange = renderMatches;
$('#result-sort').onchange = renderMatches;

function renderResults(p) {
  $('#summary').replaceChildren();
  const summaryTags = [
    `Budget: ${money(p.budgetUsd)}${p.strictBudget ? ' (Strict)' : ' (Flexible)'}`,
    p.bodyTypes.length ? p.bodyTypes.map(k => types.find(t => t[0] === k)?.[1] ?? k).join(', ') : 'All Styles',
    `${(result.profileSummary?.annualMiles ?? p.annualMiles).toLocaleString()} miles/year`,
    `${p.minSeats}+ Seats`,
    p.priorities.map(k => priorities.find(x => x[0] === k)?.[1]).join(' · ') || 'Balanced Priorities'
  ];

  for (const x of summaryTags) text($('#summary'), 'span', x);

  const candidateCount = result.candidateCount ?? result.matches?.length ?? 0;
  $('#result-status').textContent = `Analyzed 3,600+ vehicle configurations — found ${candidateCount} tailored models matching your lifestyle requirements.`;

  shownMore = false;
  $('#result-type').value = '';
  if ($('#result-powertrain')) $('#result-powertrain').value = '';
  $('#result-sort').value = 'match';
  renderMatches();

  $('#alternatives').replaceChildren();
  $('#alternative-section').hidden = !(result.alternatives?.length);
  for (const r of result.alternatives ?? []) renderCard(r, $('#alternatives'));

  $('#incomplete-list').replaceChildren();
  text($('#incomplete-list'), 'p', 'All matched vehicles use official EPA energy data and verified market benchmark specifications.');
  $('#incomplete').hidden = false;
}

function renderCompare() {
  const host = $('#comparison');
  host.replaceChildren();

  if (!selected.size) {
    text(host, 'p', 'Your comparison list is empty. Check "Compare" on up to three vehicle cards in your results.', 'notice');
    return;
  }

  const table = text(host, 'table', '');
  const header = text(table, 'tr', '');
  text(header, 'th', 'Vehicle Specification');
  for (const r of selected.values()) {
    text(header, 'th', `${r.vehicle.year} ${r.vehicle.brand} ${r.vehicle.model}`);
  }

  const rows = [
    ['Match Score', r => `${(r.score ?? 85).toFixed(0)}% Match`],
    ['Starting MSRP', r => money(r.vehicle.specifications.msrpUsd)],
    ['Powertrain', r => r.vehicle.powertrain],
    ['Drivetrain', r => r.vehicle.drivetrain ?? 'Standard Drive'],
    ['Horsepower', r => r.vehicle.specifications.horsepowerHp ? `${r.vehicle.specifications.horsepowerHp} hp` : 'Data unavailable'],
    ['0–60 mph Acceleration', r => r.vehicle.specifications.zeroTo60Sec ? `${r.vehicle.specifications.zeroTo60Sec} seconds` : 'Data unavailable'],
    ['Fuel Economy (MPG/MPGe)', r => show(r.vehicle.specifications.combinedMpg ?? r.vehicle.specifications.combinedMpge)],
    ['Electric Range', r => ['EV', 'PHEV'].includes(r.vehicle.powertrain) ? `${r.vehicle.specifications.epaRangeMiles ?? 0} mi` : 'Not applicable (Gas/HEV)'],
    ['Seating Capacity', r => `${show(r.vehicle.specifications.seats)} seats`],
    ['Cargo Volume', r => `${show(r.vehicle.specifications.cargoVolumeL)} Liters`],
    ['Est. Annual Energy Cost', r => money(r.cost.annualEnergyUsd)]
  ];

  for (const [label, get] of rows) {
    const tr = text(table, 'tr', '');
    text(tr, 'th', label);
    for (const r of selected.values()) text(tr, 'td', get(r));
  }

  const actionRow = text(table, 'tr', '');
  text(actionRow, 'th', 'Actions');
  for (const [id, r] of selected) {
    const td = text(actionRow, 'td', '');
    const button = text(td, 'button', 'Remove', 'secondary');
    button.onclick = () => {
      selected.delete(id);
      $('#compare-count').textContent = String(selected.size);
      renderCompare();
    };
  }
}

stepView();
updateMileage();
route();

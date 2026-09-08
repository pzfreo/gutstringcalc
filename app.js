import {
  INSTRUMENTS, DEFAULT_DENSITY, DEFAULT_ANGLE,
  frequencies, targetTensions, tensionForGauge, gaugeForTension, downforce,
} from './strings.js';

const $ = (id) => document.getElementById(id);

const defaults = () => ({
  inst: 'violin', pitch: 415, temperament: 'pure', mode: 'tension', n: 0.33,
  solve: 'gauge', per: {},
});

// Per-instrument settings, created from the presets on first use so that
// switching instrument and back keeps your edits.
function per(state, id = state.inst) {
  if (!state.per[id]) {
    const inst = INSTRUMENTS[id];
    state.per[id] = {
      length: inst.length,
      density: DEFAULT_DENSITY,
      target: inst.tension,
      angles: inst.strings.map(() => DEFAULT_ANGLE),
      gauges: null,
    };
  }
  return state.per[id];
}

let state = load();

function load() {
  const s = defaults();
  try {
    const raw = location.hash.slice(1);
    if (raw) Object.assign(s, JSON.parse(decodeURIComponent(raw)));
  } catch { /* a malformed link just falls back to the defaults */ }
  if (!INSTRUMENTS[s.inst]) s.inst = 'violin';
  return s;
}

function save() {
  history.replaceState(null, '', '#' + encodeURIComponent(JSON.stringify(state)));
}

// Everything the table needs, for the current settings.
function compute() {
  const inst = INSTRUMENTS[state.inst];
  const p = per(state);
  const freqs = frequencies(inst, state.pitch, state.temperament);
  const targets = targetTensions(freqs, p.target, state.mode, state.n);

  // Gauge-entry mode starts from whatever the tension scheme just produced.
  if (state.solve === 'tension' && !p.gauges) {
    p.gauges = targets.map((t, i) => +gaugeForTension(t, p.length, freqs[i], p.density).toFixed(2));
  }

  return inst.strings.map(([name], i) => {
    const fromGauge = state.solve === 'tension' && p.gauges?.[i] > 0;
    const gauge = fromGauge ? p.gauges[i] : gaugeForTension(targets[i], p.length, freqs[i], p.density);
    const tension = fromGauge ? tensionForGauge(gauge, p.length, freqs[i], p.density) : targets[i];
    return { name, freq: freqs[i], gauge, tension, angle: p.angles[i], down: downforce(tension, p.angles[i]) };
  });
}

// The table structure only changes with the instrument or the solve direction, so
// build it once and patch the numbers afterwards. Rebuilding it on every keystroke
// would take the focus out of whichever box is being typed into.
let builtFor = null;
let cells = [];

function buildTable() {
  const inst = INSTRUMENTS[state.inst];
  const editGauge = state.solve === 'tension';
  const tbody = $('rows');
  tbody.innerHTML = inst.strings.map(([name], i) => `
    <tr>
      <td class="note">${name}<small>string ${i + 1}</small></td>
      <td data-label="Hz"></td>
      <td data-label="Gauge mm">${editGauge
        ? `<input type="number" class="wide" data-k="gauges" data-i="${i}" min="0.1" max="6" step="0.01" inputmode="decimal">`
        : '<span class="big calc"></span>'}</td>
      <td data-label="Tension kg" class="big${editGauge ? ' calc' : ''}"></td>
      <td data-label="Angle °"><input type="number" data-k="angles" data-i="${i}" min="90" max="180" step="0.5" inputmode="decimal"></td>
      <td data-label="Down kg"></td>
    </tr>`).join('');

  cells = [...tbody.rows].map((tr) => ({
    freq: tr.cells[1],
    gauge: tr.cells[2].firstElementChild,
    tension: tr.cells[3],
    angle: tr.cells[4].firstElementChild,
    down: tr.cells[5],
  }));
  builtFor = `${state.inst}|${state.solve}`;
}

// Leave the focused field alone: writing a rounded value back mid-edit swallows a
// half-typed decimal point and jumps the caret.
const setValue = (el, v) => { if (el !== document.activeElement) el.value = v; };

function render() {
  const inst = INSTRUMENTS[state.inst];
  const p = per(state);

  $('inst').value = state.inst;
  setValue($('length'), p.length);
  setValue($('density'), p.density);
  setValue($('pitch'), state.pitch);
  setValue($('target'), p.target);
  setValue($('n'), state.n);
  $('nOut').textContent = Number(state.n).toFixed(2);
  $('feelField').hidden = state.mode !== 'feel';
  $('targetLabel').textContent = state.mode === 'feel' ? 'Mean tension (kg)' : 'Target tension (kg)';
  for (const group of ['temperament', 'mode', 'solve']) {
    for (const b of $(group).children) b.setAttribute('aria-pressed', b.dataset.v === state[group]);
  }
  $('tableTitle').textContent = `${inst.label} · ${state.solve === 'gauge' ? 'gauges from tension' : 'tensions from gauge'}`;

  if (builtFor !== `${state.inst}|${state.solve}`) buildTable();

  const rows = compute();
  rows.forEach((r, i) => {
    const c = cells[i];
    c.freq.textContent = r.freq.toFixed(1);
    if (c.gauge.tagName === 'INPUT') setValue(c.gauge, r.gauge.toFixed(2));
    else c.gauge.textContent = r.gauge.toFixed(2);
    c.tension.textContent = r.tension.toFixed(2);
    setValue(c.angle, r.angle);
    c.down.textContent = r.down.toFixed(2);
  });

  $('totalT').textContent = rows.reduce((a, r) => a + r.tension, 0).toFixed(2) + ' kg';
  $('totalD').textContent = rows.reduce((a, r) => a + r.down, 0).toFixed(2) + ' kg';
  save();
}

function say(msg) {
  $('status').textContent = msg;
  clearTimeout(say.t);
  say.t = setTimeout(() => { $('status').textContent = ''; }, 3000);
}

// --- wiring ---

$('inst').innerHTML = Object.entries(INSTRUMENTS)
  .map(([id, i]) => `<option value="${id}">${i.label}</option>`).join('');

$('inst').addEventListener('change', (e) => { state.inst = e.target.value; render(); });

const num = (id, apply) => {
  $(id).addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    if (Number.isFinite(v) && v > 0) { apply(v); render(); }
  });
  $(id).addEventListener('blur', render);
};
num('pitch', (v) => { state.pitch = v; });
num('length', (v) => { per(state).length = v; });
num('density', (v) => { per(state).density = v; });
num('target', (v) => { per(state).target = v; });

$('n').addEventListener('input', (e) => { state.n = parseFloat(e.target.value); render(); });

for (const group of ['temperament', 'mode', 'solve']) {
  $(group).addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    state[group] = b.dataset.v;
    render();
  });
}

// Per-string inputs: break angle always, gauge in tension-from-gauge mode.
$('rows').addEventListener('input', (e) => {
  const el = e.target;
  if (!el.dataset.k) return;
  const v = parseFloat(el.value);
  if (!Number.isFinite(v) || v <= 0) return;
  const p = per(state);
  if (el.dataset.k === 'gauges') (p.gauges ??= [])[+el.dataset.i] = v;
  else p.angles[+el.dataset.i] = v;
  render();
});

$('rows').addEventListener('focusout', () => render());

$('copyLink').addEventListener('click', async () => {
  save();
  try {
    await navigator.clipboard.writeText(location.href);
    say('Link copied.');
  } catch {
    say('Copy failed — the address bar now holds this setup.');
  }
});

$('export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${state.inst}-${state.pitch}hz.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

$('import').addEventListener('click', () => $('file').click());
$('file').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    const loaded = JSON.parse(await f.text());
    if (!INSTRUMENTS[loaded.inst]) throw new Error('unknown instrument');
    state = Object.assign(defaults(), loaded);
    builtFor = null;
    render();
    say(`Loaded ${f.name}.`);
  } catch (err) {
    say(`Could not read that file: ${err.message}`);
  }
  e.target.value = '';
});

$('reset').addEventListener('click', () => {
  delete state.per[state.inst];
  builtFor = null;
  render();
  say(`${INSTRUMENTS[state.inst].label} back to presets.`);
});

render();

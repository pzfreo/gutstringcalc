// node test.js
import {
  INSTRUMENTS, frequencies, targetTensions, tensionForGauge, gaugeForTension, downforce,
} from './strings.js';

let failed = 0;
const near = (a, b, tol, what) => {
  const ok = Math.abs(a - b) <= tol;
  if (!ok) failed++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}: ${a.toFixed(4)} vs ${b.toFixed(4)} (+/-${tol})`);
};

// A real gut violin a': 0.74 mm, 325 mm, 440 Hz -> about 4.7 kgf.
near(tensionForGauge(0.74, 325, 440, 1.30), 4.66, 0.02, 'tension of 0.74mm a-string');

// Round trip.
const g = gaugeForTension(4.5, 328, 415, 1.30);
near(g, 0.7638, 0.001, 'gauge for 4.5 kg violin a at 415');
near(tensionForGauge(g, 328, 415, 1.30), 4.5, 1e-9, 'round trip back to tension');

// Halving the length doubles the frequency at the same gauge and tension.
near(gaugeForTension(4.5, 164, 830, 1.30), g, 1e-9, 'scaling invariance');

// Pure vs equal temperament on the violin at 415.
const fp = frequencies(INSTRUMENTS.violin, 415, 'pure');
const fe = frequencies(INSTRUMENTS.violin, 415, 'equal');
near(fp[2], 415, 1e-9, 'pure anchors a on the reference');
near(fp[1], 415 * 2 / 3, 1e-9, "pure d' is a just fifth below");
near(fp[0], 415 * 4 / 9, 1e-9, 'pure g is two just fifths below');
near(fe[1], 415 * Math.pow(2, -7 / 12), 1e-9, "equal d'");

// Viols have a major third between the middle strings.
const fb = frequencies(INSTRUMENTS.bass, 415, 'pure');
near(fb[3] / fb[2], 5 / 4, 1e-9, 'bass viol c-e is a just major third');
near(fb[5], 415 * Math.pow(2, -7 / 12) * 0 + fb[4] * 4 / 3, 1e-9, "bass viol a-d' is a just fourth");
near(frequencies(INSTRUMENTS.bass7, 415, 'pure')[5], fb[4], 1e-9, '7-string anchors identically');

// Equal feel: mean tension matches the preset, basses are lighter.
const T = targetTensions(fb, 4.2, 'feel', 1 / 3);
near(T.reduce((a, b) => a + b, 0) / T.length, 4.2, 1e-9, 'equal feel mean tension');
console.log(`${T[0] < T[5] ? 'ok  ' : 'FAIL'} equal feel puts less tension on the low string`);
if (!(T[0] < T[5])) failed++;
const Te = targetTensions(fb, 4.2, 'tension', 1 / 3);
near(Math.min(...Te), Math.max(...Te), 1e-12, 'equal tension is flat');
near(targetTensions(fb, 4.2, 'feel', 0)[0], 4.2, 1e-9, 'n=0 collapses to equal tension');

// Bridge downbearing.
near(downforce(5, 158), 2 * 5 * Math.cos(79 * Math.PI / 180), 1e-12, 'downforce at 158 deg');
near(downforce(5, 180), 0, 1e-12, 'a straight string presses on nothing');

// Every tuning must contain an A to anchor on, and only intervals we have ratios for.
for (const [id, inst] of Object.entries(INSTRUMENTS)) {
  const off = inst.strings.map((s) => s[1]);
  const hasA = off.some((n) => ((n % 12) + 12) % 12 === 0);
  const steps = off.slice(1).map((n, i) => n - off[i]);
  const known = steps.every((s) => [4, 5, 7, 12].includes(s));
  const rising = steps.every((s) => s > 0);
  const ok = hasA && known && rising;
  if (!ok) failed++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${id}: anchor=${hasA} intervals=${steps.join(',')}`);
}

console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exit(failed ? 1 : 0);

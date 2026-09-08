// Physics and instrument data for the gut string calculator.
// Pure ES module: imported by the browser app and by test.js under node.

export const G = 9.80665;            // m/s^2, for kgf <-> newton
export const DEFAULT_DENSITY = 1.30; // g/cm^3, plain gut

// Included angle over the bridge, in degrees. Viols carry a flatter break than
// the violin family, so each instrument names its own default.

// Semitone offsets from a' (A4). Helmholtz names as used by players.
export const INSTRUMENTS = {
  violin: {
    label: 'Violin', family: 'violin', length: 328, tension: 5.0, angle: 158,
    strings: [['g', -14], ["d'", -7], ["a'", 0], ["e''", 7]],
  },
  viola: {
    label: 'Viola', family: 'violin', length: 375, tension: 4.8, angle: 158,
    strings: [['c', -21], ['g', -14], ["d'", -7], ["a'", 0]],
  },
  cello: {
    label: 'Cello', family: 'violin', length: 690, tension: 7.0, angle: 158,
    strings: [['C', -33], ['G', -26], ['d', -19], ['a', -12]],
  },
  treble: {
    label: 'Treble viol', family: 'viol', length: 325, tension: 3.2, angle: 152,
    strings: [['d', -19], ['g', -14], ["c'", -9], ["e'", -5], ["a'", 0], ["d''", 5]],
  },
  tenor: {
    label: 'Tenor viol', family: 'viol', length: 450, tension: 3.8, angle: 152,
    strings: [['G', -26], ['c', -21], ['f', -16], ['a', -12], ["d'", -7], ["g'", -2]],
  },
  bass: {
    label: 'Bass viol', family: 'viol', length: 690, tension: 4.2, angle: 152,
    strings: [['D', -31], ['G', -26], ['c', -21], ['e', -17], ['a', -12], ["d'", -7]],
  },
  bass7: {
    label: 'Bass viol, 7-string', family: 'viol', length: 690, tension: 4.2, angle: 152,
    strings: [['A,', -36], ['D', -31], ['G', -26], ['c', -21], ['e', -17], ['a', -12], ["d'", -7]],
  },
};

// Just ratios for the intervals that occur between adjacent open strings.
const PURE = { 4: 5 / 4, 5: 4 / 3, 7: 3 / 2, 12: 2 };

// Frequencies of the open strings.
// Equal: straight 2^(n/12) from the reference pitch.
// Pure: exact intervals between adjacent strings, anchored on the A nearest
// the reference (so a chain of pure fifths/fourths, not a tempered one).
export function frequencies(inst, pitch, temperament) {
  const offsets = inst.strings.map((s) => s[1]);
  if (temperament === 'equal') return offsets.map((n) => pitch * Math.pow(2, n / 12));

  let anchor = 0;
  offsets.forEach((n, i) => {
    if (((n % 12) + 12) % 12 === 0 && Math.abs(n) < Math.abs(offsets[anchor])) anchor = i;
  });
  const f = new Array(offsets.length);
  f[anchor] = pitch * Math.pow(2, offsets[anchor] / 12); // exact octave of the reference
  for (let i = anchor + 1; i < offsets.length; i++) f[i] = f[i - 1] * PURE[offsets[i] - offsets[i - 1]];
  for (let i = anchor - 1; i >= 0; i--) f[i] = f[i + 1] / PURE[offsets[i + 1] - offsets[i]];
  return f;
}

// Target tension per string (kgf).
// Equal tension: every string on the preset.
// Equal feel: T proportional to f^n, scaled so the mean matches the preset. n = 0
// collapses to equal tension; larger n lightens the basses and firms the trebles,
// which is how scaled/graded sets are actually strung.
export function targetTensions(freqs, tension, mode, n) {
  if (mode === 'tension') return freqs.map(() => tension);
  const w = freqs.map((f) => Math.pow(f, n));
  const mean = w.reduce((a, b) => a + b, 0) / w.length;
  return w.map((x) => tension * x / mean);
}

// Mersenne-Taylor. Lengths mm, diameters mm, density g/cm^3, tension kgf.
export function tensionForGauge(gauge, length, freq, density) {
  const mu = (density * 1000) * Math.PI * Math.pow(gauge / 1000, 2) / 4; // kg/m
  return mu * Math.pow(2 * (length / 1000) * freq, 2) / G;
}

export function gaugeForTension(tension, length, freq, density) {
  const mu = tension * G / Math.pow(2 * (length / 1000) * freq, 2); // kg/m
  return 1000 * Math.sqrt(4 * mu / (Math.PI * density * 1000));
}

// Downbearing on the bridge from the included angle between the two segments.
export function downforce(tension, angleDeg) {
  return 2 * tension * Math.cos((angleDeg * Math.PI / 180) / 2);
}

# gutstringcalc

Gut string calculator for the violin family and the viols — works out gauges from
a target tension, or tensions from gauges you already have, and shows the
resulting downbearing on the bridge.

Static site, no build step. Open `index.html`, or serve the directory and browse to it.

## What it does

- **Instruments** — violin, viola, cello, treble/tenor/bass viol, and 7-string bass viol.
  Vibrating length and gut density are editable per instrument and remembered when you switch.
- **Name** — an optional label for a particular instrument, kept per instrument. It appears
  on the printed sheet and in the export filename, not on screen.
- **Pitch** — reference a′ defaults to 415 Hz; type any value.
- **Open-string intervals** — pure (just fifths, fourths and thirds chained outwards from
  the A nearest the reference) or equal temperament.
- **Equal tension** — every string on the target.
- **Equal feel** — tension graded as *T* ∝ *f*ⁿ, with the mean held on the target.
  *n* = 0 is flat; larger *n* lightens the basses and firms the trebles.
- **Bridge** — an editable break angle per string (the included angle between the two
  string segments), with per-string and total downbearing.
- **Print** — a clean sheet with the settings restated at the top, since the controls are
  hidden. Suitable for sending to a stringmaker or keeping with the instrument.
- **Save** — the full setup lives in the URL, so a bookmark or a copied link restores it.
  JSON export/import for keeping sets on disk.

## The maths

Tension from the Mersenne–Taylor law:

    T = ¼ π d² ρ (2 L f)²

with *d* the diameter, ρ the density (1.30 g/cm³ for plain gut), *L* the vibrating
length and *f* the frequency. Downbearing on the bridge is `2T·cos(θ/2)` for an
included angle θ.

Gauges are plain-gut diameters. For a wound or loaded string, read the figure as the
*equivalent gut gauge* — the plain-gut diameter with the same mass per unit length.

Pure intervals are exact, so a long chain of just fifths drifts away from equal
temperament. On the 7-string bass viol the bottom A′ sits a syntonic comma off a true
octave below the anchor A. That is what pure intervals do; it is not a rounding error.

## Presets

| | Length | Tension | Break angle |
|---|---|---|---|
| Violin | 328 mm | 5.0 kg | 158° |
| Viola | 375 mm | 4.8 kg | 158° |
| Cello | 690 mm | 7.0 kg | 158° |
| Treble viol | 325 mm | 3.2 kg | 152° |
| Tenor viol | 450 mm | 3.8 kg | 152° |
| Bass viol | 690 mm | 4.2 kg | 152° |
| Bass viol, 7-string | 690 mm | 4.2 kg | 152° |

Viols carry a flatter break over the bridge than the violin family. All of it is
editable; **Reset instrument** puts the presets back.

## Tests

    node test.js

Covers the string physics against known gauges, the round trip between the two solve
directions, pure vs equal frequencies, and the equal-feel normalisation.

## Hosting

Settings → Pages → deploy from the `main` branch, root folder. No build step, so the
site is the repository.

# Correctness review — 2026-11-06

Reviewed local commit `6ae04f8`. Scope: transit geometry, disk overlap and limb-darkening
integration, Kepler and wobble inversions, light-curve sampling and folding, period search,
composition guides, and screen model transitions. The findings below were corrected in the follow-up on 2026-11-06; see the resolution at the end.

## Findings

### T1 — P2: coarse light-curve observations reduce noise without averaging brightness

`src/light-curve/model/LightCurveModel.ts:187–196` caps the wide chart at 3,000 points and
reduces each point's noise by the square root of the exposures per bin. It still evaluates
the noise-free flux at a single midpoint. A transit shorter than a bin can therefore be
displayed at full depth or missed, while receiving the uncertainty of many averaged exposures.

Reproduce with the default Sun-like star and 11.2-Earth-radius planet, distance 2 AU,
and zero noise. The bin containing the first transit spans 26.86 hours, versus a 20.23-hour
transit. Its reported brightness is 0.9894802; integrating the flux across the bin gives
0.9928223, a 3,342 ppm discrepancy. This is a deterministic change to the apparent dip,
not measurement noise. The existing code explicitly describes the points as averages.

Recommended correction: average/integrate the underlying exposures' model flux across each
coarse bin before applying its reduced noise. Check the zoomed chart's analogous binning too.

### T2 — P2: the pure-iron guide extrapolates a fit outside its composition range

`src/composition/view/MassRadiusDiagramNode.ts:117` uses `rockyRadius(m, 1)` for the pure-iron
curve. The [cited fit](https://arxiv.org/abs/1512.08827) is calibrated for CMF 0–0.4 and
1–8 Earth masses, not pure iron. At 28.0181 Earth masses, the function returns 2.11689 Earth
radii, compared with 1.7747 in the author's
[numerical pure-iron table](https://lweb.cfa.harvard.edu/~lzeng/tables/massradiusFe.txt): a
19.3% radius error. ExoplanetsDatabase contains the same implementation.

Recommended correction: use a numerical pure-iron relation covering the drawn mass range.

## Validation

- Node `v26.13.0`; lint, app/scripts/tests type checks, build, and 114 existing tests passed.
- Pointer and keyboard fuzz, 10 seconds each with assertions, passed.
- All five production screens initialized and Reset All worked at desktop and phone sizes,
  with assertions and randomized listener order; no browser errors observed.
- Local compliance passed with warnings; remote security settings were skipped (`gh`
  unavailable). Template drift: Vitest declaration `^5.1.0` versus template `^5.0.5`.
- Two independent review probes failed; their source follows. Temporary test files were
  removed after recording the results.

The circular-orbit transit geometry, overlap equation, duration expression, Kepler relations,
and wobble inversion are consistent with the documented assumptions. Existing real-data tests
passed. This review did not re-download the light curves or establish full accessibility.

## Historical reproduction probes

The following code records the original probes against the reviewed commit, before correction.
Some APIs have since changed; use the permanent regression tests named below for the corrected code.
The original command was
`npm test -- tests/review-probes.test.ts`. Both assertions fail on the reviewed commit.

```typescript
import { expect, it } from "vitest";
import { LightCurveModel, MAX_WIDE_POINTS, WIDE_ORBITS } from "../src/light-curve/model/LightCurveModel.js";
import { relativeFlux } from "../src/common/model/transitPhysics.js";
import { rockyRadius } from "../src/common/model/composition.js";

it("review: a coarse observation averages the flux of its constituent exposures", () => {
  const model = new LightCurveModel();
  model.distanceProperty.value = 2;
  const observations = model.wideObservations();
  const span = WIDE_ORBITS * model.periodProperty.value;
  const index = Math.floor(0.5 / WIDE_ORBITS * MAX_WIDE_POINTS);
  const point = observations[index]!;
  const geometry = model.geometryProperty.value;
  const left = span * index / MAX_WIDE_POINTS;
  const width = span / MAX_WIDE_POINTS;
  let total = 0;
  for (let i = 0; i < 2000; i++) total += relativeFlux((left + width * (i + 0.5) / 2000) / model.periodProperty.value - 0.5, geometry);
  const expected = total / 2000;
  console.log("WIDE_BIN", { point, expected, differencePpm: (point.y - expected) * 1e6, widthHours: width * 24, durationHours: model.durationProperty.value });
  expect(point.y).toBeCloseTo(expected, 5);
});

it("review: pure-iron guide agrees within 5 percent with the author's numerical table", () => {
  const expected = 1.7747;
  const actual = rockyRadius(28.0181, 1);
  console.log("IRON", { actual, expected, relativeError: actual / expected - 1 });
  expect(Math.abs(actual / expected - 1)).toBeLessThan(0.05);
});
```

## Resolution — 2026-11-06

T1–T2 are corrected. Both wide and zoomed coarse observations average their model brightness
before receiving the reduced noise. The pure-iron guide interpolates the author's numerical
interior-model table, without extrapolating the rocky CMF fit to iron.

Permanent regressions are in `tests/LightCurveModel.test.ts`, `tests/composition.test.ts`,
and `tests/ironRadius.test.ts`. Documentation, handout notes, screenshots and Word versions were
updated. Lint, all type checks, 118 tests and build passed on Node 26.

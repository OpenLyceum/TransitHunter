# Transit Hunter — model

Physics and data behind the five screens. Code: `src/common/model/`.

## Transit geometry (`transitPhysics.ts`)

Lengths are in star radii: k = R<sub>p</sub>/R★, z = centre-to-centre distance on the sky,
a/R★ = orbit size, b = (a/R★) cos i = impact parameter. Orbits are circular with mid-transit at
phase 0; the sky position at θ = 2π·phase is x = (a/R★) sin θ, y = (a/R★) cos i cos θ, with the planet
in front of the star when cos θ > 0.

- **Uniform disk.** The blocked fraction is the lens-shaped overlap of two disks divided by π. A
  central transit is k² deep: Jupiter in front of the Sun 1.06 %, Earth 84 ppm.
- **Limb darkening.** Quadratic law I(μ)/I(1) = 1 − u₁(1 − μ) − u₂(1 − μ)², μ = √(1 − r²), with
  u₁ = 0.40, u₂ = 0.26 (typical visible/Kepler-band values for a Sun-like star, used for every star).
  The blocked light is integrated over 200 rings of the stellar disk between |z − k| and z + k; each
  ring contributes I(r) × (arc inside the planet) × dr, normalised by π(1 − u₁/3 − u₂/6). A tiny u₁
  reproduces the exact overlap to 10⁻⁴ (tested).
- **Durations** (Seager & Mallén-Ornelas 2003, circular):
  T₁₄ = (P/π) asin(√((1 + k)² − b²) / ((a/R★) sin i)); T₂₃ uses (1 − k)² and is 0 when grazing.
- **Transit probability** for random orientations (cos i uniform): (1 + k)/(a/R★). Earth: 0.47 %.
- **Radius from depth:** R<sub>p</sub> = R★ √δ.

## Orbits and masses (`orbitPhysics.ts`)

Kepler's third law, P = 2π √(a³/G(M★ + M<sub>p</sub>)), both ways. The wobble amplitude
K = (2πG/P)^{1/3} M<sub>p</sub> sin i / (M★ + M<sub>p</sub>)^{2/3} is inverted by fixed-point iteration
for M<sub>p</sub> at any inclination: at i = 90° it gives the minimum mass M sin i; with the transit's
inclination it gives the true mass. For the seven Rock or Gas? planets this reproduces the archive
masses to better than 1 %.

## Noise and folding (`lightCurveTools.ts`)

Gaussian scatter σ per measurement; averaging n measurements gives σ/√n. Folding maps a time t to
the phase (t − t₀)/P − round(·), in [−0.5, 0.5). On the Light Curve screen measurements come every
10 minutes; the signal-to-noise ratio is δ / (σ/√n) with n the measurements inside the dip over all
folded transits. Below 3 the dip is "lost", 3–7 "a hint", above 7 "a clear detection".

**Period from marked dips** (`ephemerisFromMarks`). The shortest spacing between neighbouring marks
is a first guess P₀; each mark is numbered by round((t − t₀)/P) and a least-squares line
t = t<sub>ref</sub> + nP gives the period and reference time, repeated once with the refined P.
This allows for dips missed between marks (lost in data gaps): plain averaging,
(last − first)/(count − 1), gave 2.54 days instead of 2.22 for HD 189733 (one transit in the TESS
mid-sector gap) and 5.58 instead of 4.89 for Kepler-7. Marks closer than 0.15 day count as one.

**Period search** (`hunt/model/boxSearch.ts`). Box least squares (Kovács, Zucker & Mazeh 2002): for
each trial period the light curve is folded into phase bins a third of the shortest box wide, and
boxes of durations from max(1 h, 1.5 data bins) up to 16 h (×1.5 steps, at most 12 % of the period)
slide round the fold. A period's power is the best dimming box's signal-to-noise,
depth / (σ √(1/n + 1/(N − n))). Trial periods run from the shortest whose central transit across a
Sun-like star lasts the shortest box (13 h × (P/1 yr)<sup>1/3</sup>) to half the data span (at most
500 days), spaced so neighbouring trials drift by 1.5 grid durations over the run (the grid duration
is the shortest box, or half a Sun-like central transit at that period if longer); the chosen peak
is re-searched finely between its neighbours. The search runs in 12 ms slices per frame: under
0.2 s for the TESS and single-quarter stars, about 1 s for Kepler-11 and 2.5 s for four years of
Kepler-22. It finds the archive period of HD 189733 b, HD 209458 b, HAT-P-7 b, Kepler-7 b and
Kepler-22 b, Kepler-10 c (b is the next peak) and Kepler-11 d.

**Far side.** Folding with the reference moved by half a period centres the chart on the planet's
passage behind its star. HAT-P-7 b's eclipse (about 70 ppm, Borucki et al. 2009) shows in the
averages of the bundled Kepler Q2 data at about 10σ.

## Composition (`composition.ts`)

Density ρ = 5.514 g/cm³ × M/R³ (Earth units). Rocky radius R = (1.07 − 0.21 CMF) M^{1/3.7}
(Zeng, Sasselov & Jacobsen 2016; CMF 0.325 Earth-like, 1 pure iron), drawn up to 30 M⊕. A planet is
"rocky" if R ≤ 1.1 × the pure-rock (CMF 0) radius, a "giant" above 6 R⊕, otherwise "in between".
The water line is a constant-density guide (ρ = 1), labelled as a guide.

## Screen models

- **Dimming:** edge-on orbit drawn at a/R★ = 2.2 (not to scale, labelled), uniform disk, 12 s per
  orbit. The chart is a two-orbit sweep that restarts half an orbit before a transit.
- **Lining Up:** Sun-like star; a/R★ from the distance; each orbit spends 6 s in a window 1.6 edge-on
  durations wide around mid-transit and 3 s fast-forwarding round the rest of the orbit. The 100
  random systems draw cos i uniform.
- **Light Curve:** the wide chart spans 3.25 orbits with at most 3000 points (coarser bins have
  correspondingly smaller scatter); the zoomed chart spans 2.4 durations, scatter σ/√(N × points per
  bin), with points per bin at least 1 (a transit under 1.7 h is drawn with more points than were
  measured, each with one measurement's scatter). Random numbers are drawn once (and with "New
  observations") so sliders change the data smoothly. The planet is at most 0.6 of the star's radius
  and the orbit at least 2 star radii (Dimming's custom planet too): without these, a 25 R⊕ planet
  hid the 0.2 R☉ red dwarf completely, and the big star at 0.01 AU had the planet inside it with a
  "transit" half an orbit long. Choosing a smaller star pulls the sliders inside the limits.
- **Planet Hunt:** see Data below. Trial period 0.3–500 days (log, arrow step 0.00001 decade),
  reference time as a fraction of the period (step 0.0002), depth line 0.001–5 % (log). NumberControl
  rounds every value to its step, so the steps set the finest fold: one period click moves Kepler-22
  b's transits by under an hour over four years. Folded averages use 90 bins across the shown window.
- **Rock or Gas?:** archive radius, inclination, K, period and star mass; mass computed as above
  (TRAPPIST-1 e: archive mass from transit-timing variations, no measurable wobble).

## Data (`scripts/lightcurves/fetch_lightcurves.py`)

Light curves from MAST via lightkurve: Kepler long cadence PDCSAP (quality mask "hard"), TESS SPOC
2-min PDCSAP. Per target:

1. Normalise each quarter or sector; drop NaNs, flagged cadences, and the first day (Kepler) /
   quarter-day (TESS) after each gap (thermal settling).
2. Flatten each gap-free chunk separately with a Savitzky–Golay filter (window 0.75–3 days, much
   longer than a transit), with every known planet's transits masked using the archive ephemeris
   and no sigma clipping inside the fit (clipping stopped the trend following multi-day wiggles in
   Kepler-22's data).
3. Clip upward outliers only (5σ); average onto a uniform grid (10 min TESS, 30 min Kepler, 1 h
   Kepler-11, 2 h Kepler-22); store whole ppm with null for empty bins.

| Target | Data | Bins | Scatter per bin |
|---|---|---|---|
| HD 189733 | TESS S41 | 10 min | 125 ppm |
| HD 209458 | TESS S56 | 10 min | 160 ppm |
| HAT-P-7 | Kepler Q2 | 30 min | 59 ppm |
| Kepler-7 | Kepler Q2 | 30 min | 101 ppm |
| Kepler-10 | Kepler Q3–Q4 | 30 min | 58 ppm |
| Kepler-22 | Kepler Q1–Q17 | 2 h | 34 ppm |
| Kepler-11 | Kepler Q1–Q6 | 1 h | 120 ppm |

TRAPPIST-1 (K2 C12, EVEREST) was tried and dropped: about 1100 ppm per 30-min bin, so its short
transits barely show even folded. Planet parameters: NASA Exoplanet Archive, Planetary Systems
Composite Parameters, retrieved 2026-11-05. `tests/realData.test.ts` checks that folding each light
curve at the archive period gives back the archive radius within 15 %.

The composite table takes each column from its own paper, so a wobble amplitude K can belong to a
different solution than the mass. The pipeline drops K (and its reference) when the mass it implies
(circular orbit, as the sim computes it) differs from the archive mass by more than 5 %: Kepler-11
b, c, d, f, g (K from Weiss et al. 2024 beside Lissauer et al. 2013's transit-timing masses, off by
factors of 0.004 to 9) and Kepler-22 b (e = 0.72). None of these is a Rock or Gas? planet, but a K
there would otherwise give a wrong mass.

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

## Composition (`composition.ts`)

Density ρ = 5.514 g/cm³ × M/R³ (Earth units). Rocky radius R = (1.07 − 0.21 CMF) M^{1/3.7}
(Zeng, Sasselov & Jacobsen 2016; CMF 0.325 Earth-like, 1 pure iron), drawn up to 30 M⊕. A planet is
"rocky" if R ≤ 1.1 × the pure-rock (CMF 0) radius, a "giant" above 6 R⊕, otherwise "in between".
The water line is a constant-density guide (ρ = 1), labelled as a guide.

## Screen models

- **Dimming:** edge-on orbit drawn at a/R★ = 2.2 (not to scale, labelled), uniform disk, 12 s per
  orbit. The chart is a two-orbit sweep that restarts half an orbit before a transit.
- **Lining Up:** Sun-like star; a/R★ from the distance; the clock loops over a window 1.6 edge-on
  durations wide around mid-transit. The 100 random systems draw cos i uniform.
- **Light Curve:** the wide chart spans 3.25 orbits with at most 3000 points (coarser bins have
  correspondingly smaller scatter); the zoomed chart spans 2.4 durations, scatter σ/√(N × points per bin).
  Random numbers are drawn once (and with "New observations") so sliders change the data smoothly.
- **Planet Hunt:** see Data below. Trial period 0.3–500 days (log), reference time as a fraction of
  the period, depth line 0.001–5 % (log). Folded averages use 90 bins across the shown window.
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

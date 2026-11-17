# AGENTS.md — Transit Hunter

Sim-specific context for AI assistants. General SceneryStack guidance: [OpenLyceum/.github/AGENTS.md](https://github.com/OpenLyceum/.github/blob/main/AGENTS.md).

## Project

This sim teaches exoplanet detection by the **transit method**, from a middle/high-school start to
introductory astronomy, using **real Kepler and TESS light curves**. It is original work, not a port,
forked from `SceneryStackTemplate` on 5 Nov 2026 as the companion to `StellarWobble` (radial
velocity). `ExtrasolarPlanets` (a NAAP port) also has a Transit screen, with no real data. Five
screens:

| Screen | Folder | Content |
|---|---|---|
| Dimming | `src/dimming/` | Side view + view from Earth at one horizontal scale; live light curve; planet/star presets; readouts in words; draggable planet; telescope view |
| Lining Up | `src/lining-up/` | Rotatable 3-D orbit with a To Earth arrow; path across the star; dip vs edge-on ghost; tilt limit, probability; 100 random systems |
| Light Curve | `src/light-curve/` | Noisy single measurements (period mark) + folded zoom (depth, duration marks); radius and distance readouts; limb darkening; noise and stacking with an S/N verdict |
| Planet Hunt | `src/hunt/` | Real light curves of seven stars; zoom/scroll, mark dips (gap-tolerant period), BLS period search, fold with binned averages (or on the far side), depth line → radius, reveal archive planets |
| Rock or Gas? | `src/composition/` | Transit radius + wobble mass (true mass via the transit's inclination) → density scale and mass–radius diagram |

Physics and data: [`doc/model.md`](doc/model.md). Architecture and decisions:
[`doc/implementation-notes.md`](doc/implementation-notes.md).

### Things to know first

- **Real data are generated offline.** `scripts/lightcurves/fetch_lightcurves.py` (Python venv in
  `scripts/lightcurves/.venv`, gitignored) writes `src/hunt/model/data/*.json` and
  `src/common/model/data/archive.json`. Both are committed and excluded from Biome (it would
  reformat them one number per line). Run it with `.venv/bin/python -I fetch_lightcurves.py --preview <dir>`.
- **Light curves load lazily** (`LightCurveData.loadLightCurve`, one chunk per star). A load that
  finishes after the user has picked another star is ignored (`PlanetHuntModel.loadToken`).
- **Sky geometry convention:** transit at phase 0; the planet's sky position is
  x = (a/R★) sin θ, y = (a/R★) cos i cos θ, in front when cos θ > 0 (`transitPhysics.skyPosition`).
  On Lining Up, Earth is in the direction (sin i, 0, cos i) of the orbit frame.
- **Pure-iron guide** uses `src/common/model/ironRadius.ts` and the numerical Zeng table
  `src/common/model/data/pureIron.json`; the rocky CMF fit is not valid for CMF=1.
- **Orbits are circular** everywhere. The archive's eccentricities are ignored.
- **Exaggerations are always labelled:** the Dimming orbit ("Not to scale"), small planets drawn
  bigger (×N, 1-2-5 factors from `drawnPlanet`), zoomed brightness axes ("the axis shows only the top
  N %").
- **Planets behind the star** are covered by a glow-less copy of the star's disc instead of moving
  the planet node between layers, which would drop keyboard focus.
- **Node >=26** is required. Run `source ~/.nvm/nvm.sh && nvm use 26` before npm or a git commit
  (the pre-commit hook runs npm).

## Key files

| File | Purpose |
|---|---|
| `src/common/model/transitPhysics.ts` | Disk overlap, limb-darkened flux (ring integration), sky position, impact parameter, durations, probability |
| `src/common/model/orbitPhysics.ts` | Kepler's third law both ways; planet mass from the wobble (any inclination) |
| `src/common/model/lightCurveTools.ts` | Noise, folding, binning, σ/√n, period from marks with missed dips |
| `src/common/model/composition.ts` | Density, Zeng 2016 rocky radius, planet kind, Solar System table |
| `src/common/model/archive.ts` | Typed access to `data/archive.json` |
| `src/hunt/model/LightCurveData.ts` | Light-curve file format, unpacking, lazy loaders |
| `src/hunt/model/boxSearch.ts` | Box-least-squares period search, run in slices from `PlanetHuntModel.step` |
| `src/hunt/view/HuntChartNode.ts` | Planet Hunt chart: zoom/scroll, marks, fold + averages (far side too), depth line, reveal ticks |
| `src/hunt/view/PeriodSearchNode.ts` | Period-search chart drawn in place of the light curve; click a peak or fold on the strongest dip |
| `src/hunt/view/PointCloudNode.ts` | Canvas painting of up to ~18 000 points |
| `src/common/view/PlanetNode.ts` | Planet disc in its preset colour, silhouette against the star, `drawnPlanet` magnification |
| `src/common/view/controls.ts` | Number controls (log scale), checkboxes, push buttons, explanation dialog, equation node |
| `src/preferences/TransitHunterPreferencesModel.ts` | `transitHunterPreferences` singleton: Show equations (`?showEquations`) |

## Accessibility

Standard fleet pattern:

- Per-screen a11y strings live under `a11y.<screenKey>` in each locale JSON, reached via
  `StringManager.get<Screen>A11yStrings()`. Visible strings are reached via `get<Screen>Strings()` and
  `getCommonStrings()`.
- Every screen has a live `*ScreenSummaryContent`, a wrapper `Node` with `pdomOrder` (Reset All
  last), and a `*KeyboardHelpContent` wired through the Screen.
- Custom keyboard interactions, each documented in its keyboard-help dialog: the Dimming planet
  (left/right arrows), the Lining Up 3-D view (arrows rotate), the Planet Hunt depth line (up/down).
  Dip marks have a keyboard path: zoom/scroll a dip to the middle and press "Mark the middle".
- Spoken responses: transit start/end when the planet is moved by hand (Dimming); transit
  starts/stops when a slider changes it (Lining Up).
- Numbers in descriptions go through `toPlainText` (no rich-text markup).

## Compliance carve-outs

- **Hardcoded colors (transparent hit areas).** The Planet Hunt chart's drag area and depth-line
  handle are `rgba(0,0,0,0)` rectangles: invisible input regions, not theme colours. StellarWobble's
  Observatory chart does the same.

## Commands

```bash
npm run lint && npm run check && npm run build && npm test
```

For screenshots, run the dev server with `npx vite --port <free port>`. Screen models are reachable
from the console as `phet.joist.sim.screens[i].model` (with `?screens=n`, at index 0).

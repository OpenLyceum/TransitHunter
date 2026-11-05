# Transit Hunter — implementation notes

This note covers architecture and decisions; the physics and data are in [model.md](model.md).

## Layout

```
src/
  TransitHunter{Colors,Constants,Namespace}.ts   colours (default + projector), constants (SI), namespace
  common/
    model/transitPhysics.ts     overlap, limb darkening, sky geometry, durations, probability (pure)
    model/orbitPhysics.ts       Kepler's third law, mass from the wobble (pure)
    model/lightCurveTools.ts    noise, folding, binning (pure)
    model/composition.ts        density, rocky radius, planet kind, Solar System
    model/archive.ts + data/archive.json   NASA Exoplanet Archive parameters
    model/PlanetPreset.ts, StarPreset.ts   enumerations shared by Dimming and Light Curve
    view/ChartFrameNode.ts, chartUtils.ts  bamboo chart frame (from StellarWobble / RelativisticDynamics)
    view/controls.ts            number controls, checkboxes, push buttons, explanation dialog, equations
    view/StarNode.ts, PlanetNode.ts, planetName.ts, formatters.ts
  dimming/        DimmingModel, DimmingViews (side view + view from Earth), DimmingChartNode
  lining-up/      LiningUpModel, Orbit3DViewNode, SkyViewNode, LiningUpChartNode, RandomSkyNode
  light-curve/    LightCurveModel, LightCurveChartNode
  hunt/           PlanetHuntModel, HuntTarget, LightCurveData + data/*.json, HuntChartNode, PointCloudNode, timeWindow
  composition/    RockOrGasModel, CompositionPlanet, DensityScaleNode, MassRadiusDiagramNode
  preferences/    Show equations (?showEquations), a module-level singleton
scripts/lightcurves/  offline Python data pipeline (venv and cache gitignored)
```

## Decisions

- **Separate from ExtrasolarPlanets.** That sim is a faithful NAAP port (uniform disks, eccentric
  orbits). This one teaches the method from the beginning and ends with real data, so it keeps
  orbits circular and adds limb darkening, folding and real light curves.
- **Real photometry, not curves made from parameters.** The user asked for actual measurements, so
  Planet Hunt uses pipeline light curves from MAST. They are small after binning (216 KB for seven
  stars) and load lazily, so the first screens do not wait for them.
- **Compact data format.** A uniform time grid (start, step) and whole-ppm values with null for gaps:
  four years of Kepler-22 data is 63 KB.
- **Canvas for Planet Hunt points.** A bamboo ScatterPlot builds one Shape from every point; with
  17 500 points that is too slow to redraw while scrolling. `PointCloudNode` paints squares on a
  CanvasNode and skips points outside the ranges.
- **Clicks mark dips, drags scroll.** A press on the Planet Hunt chart that moves less than 4 px
  marks a dip at that time. "Mark the middle" gives keyboard users the same action.
- **The brightness axis of Planet Hunt** ignores only the two most extreme points at each end. A
  fraction-based clip removed Kepler-22's transits, which are only a few points in 17 500.
- **Dimming draws both views at one horizontal scale** so the planet lines up between them. The
  orbit is tiny (a/R★ = 2.2) so that a transit takes a visible part of each orbit; it says so.
- **Lining Up loops a transit-centred window** instead of whole orbits, because at real orbit sizes a
  transit is a few per cent of an orbit and would flash by.
- **Rock or Gas? recomputes the mass** from K, P, M★ and i rather than displaying the archive mass,
  so the steps on screen are the real ones.
- **Number readouts** have a minimum width (100 px): NumberDisplay sizes its box from the range's
  end values, which shrank "0.8375 days" and similar values.

## Testing

- `transitPhysics`, `orbitPhysics`, `lightCurveTools`, `composition`: known systems and limits.
- `realData.test.ts`: every bundled light curve, folded at the archive period, gives the archive
  radius within 15 %; densities of the Rock or Gas? planets.
- One model test per screen (`DimmingModel`, `LiningUpModel`, `LightCurveModel`, `PlanetHuntModel`,
  `RockOrGasModel`), plus `timeWindow` and `TimeModel`.
- `memory-leak.test.ts` covers the shared nodes and the chart nodes.

Fuzz with `npm run test:fuzz`. In the dev console the screen models are
`phet.joist.sim.screens[i].model`, at index 0 when the URL has `?screens=n`.

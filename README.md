# Transit Hunter

[![CI](../../actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)

Find exoplanets by the shadows they cast, with the transit method. Start with why a star gets
dimmer when a planet crosses it, see why only lined-up orbits show transits, learn to read a
planet's size and distance from a light curve, then hunt for planets in **real Kepler and TESS
measurements** and combine the transit with the star's wobble to tell rock from gas. The planet
itself is never seen: everything comes from the star's light. It starts at middle and high school
level and builds up to introductory astronomy. Companion to
[Stellar Wobble](https://github.com/OpenLyceum/StellarWobble) (the radial-velocity method). Built with
[SceneryStack](https://scenerystack.org/); runs offline as a Progressive Web App.

## Features

- **Dimming.** A planet orbits its star, seen from the side and from Earth (zoomed in) at the same
  horizontal scale. A brightness readout and a live light curve show the dip. Choose an Earth-,
  Neptune- or Jupiter-sized planet (around a distant star) or any size, and a Sun-like star, a red
  dwarf or a big hot star. Readouts say in words how
  much light is blocked ("about 1 part in 95"). Drag the planet across the star, or use the arrow
  keys. **Telescope view** turns the star into a point of light.
- **Lining Up.** The orbit in 3D with an arrow toward Earth that tilts with the inclination. The
  planet's path across the star, as Earth sees it. The dip against the edge-on dip: shorter, then
  V-shaped (grazing), then gone. Readouts give the tilt limit and the chance that a random orbit
  lines up, and 100 randomly tilted systems show how few transit.
- **Light Curve.** Single noisy measurements over several orbits with the period marked, and one
  transit zoomed in from many folded transits, with the depth and duration marked. Readouts turn the
  depth into the planet's radius and the period into its distance (Kepler's third law). A limb
  darkening option, and a signal-to-noise verdict as you add noise and fold more transits.
- **Planet Hunt.** Real light curves of seven stars, easiest first: HD 189733 and HD 209458 (TESS),
  HAT-P-7, Kepler-7, Kepler-10, Kepler-22 and Kepler-11 (Kepler). Zoom and scroll, mark dips (a dip
  lost in a data gap is allowed for), use their spacing as a trial period or run a box-least-squares
  period search, fold, and drag a depth line to get the planet's size. Folding reveals Kepler-10 b,
  invisible in the raw data, and centring the fold on the far side shows HAT-P-7 b's eclipse behind
  its star. Then reveal the planets in the NASA Exoplanet Archive.
- **Rock or Gas?** For seven real planets, the transit gives the radius and an edge-on orbit, so the
  star's wobble gives the true mass. The resulting density is placed on a scale of familiar
  materials ("it would float!") and on a mass–radius diagram with rocky and iron curves and the
  Solar System.
- **Accessible:**
  - Every control works from the keyboard.
  - Each screen has a live screen summary and a keyboard-help dialog.
  - Each screen has a "How does it work?" explanation.
  - English, French and Spanish.
  - Default and projector colour profiles.
  - Installable PWA.
  - A preference (or `?showEquations`) shows the equations beside the readouts.

## Quick Start

```bash
npm install
npm start        # dev server → http://localhost:5173
```

## Scripts

| Command | Description |
|---|---|
| `npm start` / `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run Vitest unit tests (includes memory-leak suite) |
| `npm run test:fuzz` | Optional Playwright fuzz smoke: pointer (`?fuzz`) + keyboard (`?fuzzBoard`), with `?ea`, 30s each |
| `npm run test:fuzz -- 90` | Same fuzz for 90 seconds (`--duration 90` or `FUZZ_DURATION=90` also work) |
| `npm run test:fuzz:quick` | Shorter fuzz smoke (10s) |
| `npm run test:fuzz:long` | Longer fuzz smoke (300s) |
| `npm run check` | TypeScript type check |
| `npm run lint` | Biome lint check |
| `npm run format` | Auto-format all files |
| `npm run fix` | Lint + auto-fix |
| `npm run icons` | Regenerate PNG icons from `public/icons/icon.svg` |
| `npm run release` | `check && lint && build && test`, then version patch + push tags |
| `npm run clean` | Remove `dist/` |

The real data come from an offline Python pipeline, `scripts/lightcurves/fetch_lightcurves.py`
(lightkurve + the NASA Exoplanet Archive). Its outputs are committed, so you only run it to
change the targets; see the script's header.

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| [SceneryStack](https://scenerystack.org/) | ^3.0.0 | Simulation framework |
| [Vite](https://vitejs.dev/) | ^8 | Build tool + dev server |
| [TypeScript](https://www.typescriptlang.org/) | ^7 | Type-safe JavaScript |
| [Biome](https://biomejs.dev/) | ^2.6 | Linting + formatting |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | ^2 | PWA + service worker |
| [lightkurve](https://lightkurve.github.io/lightkurve/) | ≥2.5 | Offline data pipeline (Python) |

## License

GNU Affero General Public License v3.0 — see [OpenLyceum org license](https://github.com/OpenLyceum/.github/blob/main/LICENSE).
The Kepler, K2 and TESS data are public domain; see [CREDITS.md](CREDITS.md) for data credits.

## Contributing

See [OpenLyceum contributing guidelines](https://github.com/OpenLyceum/.github/blob/main/CONTRIBUTING.md).
Report bugs via GitHub Issues; use org issue templates.

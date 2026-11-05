# Credits — Transit Hunter

Original simulation on finding exoplanets with the transit method, written for the
[OpenLyceum](https://github.com/OpenLyceum) fleet with [SceneryStack](https://scenerystack.org/).

## License

GNU Affero General Public License v3.0 or later — see [org LICENSE](https://github.com/OpenLyceum/.github/blob/main/LICENSE).

## Data

- **Light curves.** This simulation includes data collected by the Kepler mission and obtained from
  the MAST data archive at the Space Telescope Science Institute (STScI). Funding for the Kepler
  mission is provided by the NASA Science Mission Directorate. STScI is operated by the Association
  of Universities for Research in Astronomy, Inc., under NASA contract NAS 5–26555.
- This simulation includes data collected with the TESS mission, obtained from the MAST data archive
  at STScI. Funding for the TESS mission is provided by the NASA Explorer Program.
- The light curves are the missions' pipeline products (Kepler PDCSAP, TESS SPOC PDCSAP), cleaned
  and binned as described in `scripts/lightcurves/fetch_lightcurves.py`. Kepler and TESS data are
  in the public domain.
- **Planet parameters.** This research has made use of the NASA Exoplanet Archive, which is operated
  by the California Institute of Technology, under contract with the National Aeronautics and Space
  Administration under the Exoplanet Exploration Program (Planetary Systems Composite Parameters
  table, retrieved November 2026). Each planet's parameters carry their references in
  `src/common/model/data/archive.json`.
- **Software.** Lightkurve Collaboration (2018), *Lightkurve: Kepler and TESS time series analysis in
  Python*, Astrophysics Source Code Library, ascl:1812.013.
- **Mass–radius curves.** Zeng, L., Sasselov, D. D. & Jacobsen, S. B. (2016), *Mass–Radius Relation
  for Rocky Planets Based on PREM*, ApJ 819, 127.
- **Solar System values.** NASA Planetary Fact Sheet.
- **Transit durations.** Seager, S. & Mallén-Ornelas, G. (2003), ApJ 585, 1038.

## Acknowledgments

Companion to [Stellar Wobble](https://github.com/OpenLyceum/StellarWobble), whose charts,
controls, 3-D orbit view and Observatory zoom tools it adapts.

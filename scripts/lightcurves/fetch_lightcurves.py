"""
fetch_lightcurves.py

Offline data pipeline for Transit Hunter. Not run in CI. It writes:

  src/hunt/model/data/<id>.json      real Kepler / K2 / TESS light curves for the Planet Hunt screen
  src/common/model/data/archive.json  NASA Exoplanet Archive parameters (Planet Hunt reveal, Rock or Gas?)

For each target it downloads the pipeline light curve (PDCSAP for Kepler and TESS SPOC, EVEREST
for K2) from MAST, drops quality-flagged and NaN points, removes slow stellar and instrumental
trends with the transits masked (using the archive ephemeris of every known planet of the star),
clips upward outliers only, and averages the result onto a uniform time grid. Each output stores
the grid start and step and the flux in whole ppm, with null for empty bins, so a year of Kepler
data stays under about 100 KB.

Usage (from this folder):

  uv venv .venv && uv pip install --python .venv/bin/python -r requirements.txt
  .venv/bin/python -I fetch_lightcurves.py [--preview DIR] [--only ID ...]

Downloads are cached in ./cache (gitignored). Kepler, K2 and TESS data are public domain
(NASA / MAST); see CREDITS.md for the acknowledgements.
"""

from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import re
import sys
import warnings
from pathlib import Path

import numpy as np
import requests

warnings.filterwarnings("ignore")

import lightkurve as lk  # noqa: E402  (after the warnings filter: lightkurve warns on import)

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
CACHE = HERE / "cache"
HUNT_DATA = ROOT / "src" / "hunt" / "model" / "data"
ARCHIVE_JSON = ROOT / "src" / "common" / "model" / "data" / "archive.json"

TAP_URL = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"

# Kepler times are BJD − 2454833 (BKJD); TESS times are BJD − 2457000 (BTJD).
TIME_OFFSETS = {"Kepler": 2454833.0, "K2": 2454833.0, "TESS": 2457000.0}

# The Planet Hunt targets, easy → hard.
#   search:   lightkurve search arguments
#   segments: which quarters / sectors / campaigns to stitch (None = all found)
#   bin_hours: width of the uniform output bins
#   window_days: flatten window (must be several transit durations long)
TARGETS = [
    {
        "id": "hd189733",
        "star": "HD 189733",
        "planets": ["HD 189733 b"],
        "search": {"mission": "TESS", "author": "SPOC", "exptime": 120},
        "segments": [41],
        "bin_hours": 1 / 6,
        "window_days": 1.0,
    },
    {
        "id": "hd209458",
        "star": "HD 209458",
        "planets": ["HD 209458 b"],
        "search": {"mission": "TESS", "author": "SPOC", "exptime": 120},
        "segments": [56],
        "bin_hours": 1 / 6,
        "window_days": 1.5,
    },
    {
        "id": "hatp7",
        "star": "HAT-P-7",
        "planets": ["HAT-P-7 b"],
        "search": {"mission": "Kepler", "author": "Kepler", "cadence": "long"},
        "segments": [2],
        "bin_hours": 0.5,
        "window_days": 1.5,
    },
    {
        "id": "kepler7",
        "star": "Kepler-7",
        "planets": ["Kepler-7 b"],
        "search": {"mission": "Kepler", "author": "Kepler", "cadence": "long"},
        "segments": [2],
        "bin_hours": 0.5,
        "window_days": 2.0,
    },
    {
        "id": "kepler10",
        "star": "Kepler-10",
        "planets": ["Kepler-10 b", "Kepler-10 c"],
        "search": {"mission": "Kepler", "author": "Kepler", "cadence": "long"},
        "segments": [3, 4],
        "bin_hours": 0.5,
        "window_days": 1.5,
    },
    {
        "id": "kepler22",
        "star": "Kepler-22",
        "planets": ["Kepler-22 b"],
        "search": {"mission": "Kepler", "author": "Kepler", "cadence": "long"},
        "segments": list(range(1, 18)),
        "bin_hours": 2.0,
        # Short window: PDC leaves day-long dips in some quarters, longer than the 7.4 h transit;
        # the filter follows them (the real transits are masked from the fit).
        "window_days": 1.0,
    },
    {
        "id": "kepler11",
        "star": "Kepler-11",
        "planets": ["Kepler-11 b", "Kepler-11 c", "Kepler-11 d", "Kepler-11 e", "Kepler-11 f", "Kepler-11 g"],
        "search": {"mission": "Kepler", "author": "Kepler", "cadence": "long"},
        "segments": [1, 2, 3, 4, 5, 6],
        "bin_hours": 1.0,
        "window_days": 2.5,
    },
]

# Planets for the Rock or Gas? screen that are not Planet Hunt targets (archive parameters only).
# TRAPPIST-1 was tried as a hunt target (K2 Campaign 12, EVEREST): at about 1100 ppm per 30-min bin
# its short transits barely show even when folded, so it is a Rock or Gas? planet only.
EXTRA_PLANETS = ["GJ 1214 b", "55 Cnc e", "TRAPPIST-1 e"]

ARCHIVE_COLUMNS = [
    "pl_name", "hostname", "pl_orbper", "pl_tranmid", "pl_rade", "pl_radeerr1", "pl_radeerr2",
    "pl_bmasse", "pl_bmasseerr1", "pl_bmasseerr2", "pl_bmassprov", "pl_orbsmax", "pl_orbincl",
    "pl_imppar", "pl_trandep", "pl_trandur", "pl_rvamp", "pl_orbeccen", "st_rad", "st_mass",
    "st_teff", "sy_dist", "disc_year", "disc_method", "disc_facility", "pl_rade_reflink",
    "pl_bmasse_reflink", "pl_rvamp_reflink",
]


def reference_text(link: str | None) -> str | None:
    """'<a refstr=... href=...>Author et al. 2020</a>' → 'Author et al. 2020'."""
    if not link:
        return None
    text = re.sub(r"<[^>]+>", "", link)
    return html.unescape(text).strip() or None


def query_archive(names: list[str]) -> dict[str, dict]:
    """Composite parameters (pscomppars) of the named planets, keyed by planet name."""
    query = "select " + ",".join(ARCHIVE_COLUMNS) + " from pscomppars where pl_name in (" + ",".join(
        "'" + n + "'" for n in names) + ")"
    response = requests.get(TAP_URL, params={"query": query, "format": "json"}, timeout=120)
    if response.status_code != 200:
        sys.exit("Archive query failed:\n" + response.text[:800])
    rows = {row["pl_name"]: row for row in response.json()}
    missing = sorted(set(names) - set(rows))
    if missing:
        sys.exit("Not in the archive: " + ", ".join(missing))
    return rows


def segment_of(search_row) -> int | None:
    """Quarter / sector / campaign number from a search-result mission string."""
    match = re.search(r"(\d+)\s*$", str(search_row["mission"]))
    return int(match.group(1)) if match else None


def download(target: dict) -> lk.LightCurve:
    search = lk.search_lightcurve(target["star"], **target["search"])
    if target["segments"] is not None:
        keep = [i for i, row in enumerate(search.table) if segment_of(row) in target["segments"]]
        search = search[keep]
    if len(search) == 0:
        sys.exit(f"No light curves found for {target['star']}")
    # "hard" also drops cadences next to reaction-wheel desaturations and other flagged events.
    bitmask = "hard" if target["search"]["mission"] == "Kepler" else "default"
    collection = search.download_all(download_dir=str(CACHE), quality_bitmask=bitmask)
    products = [str(lc.meta.get("FILENAME") or lc.meta.get("OBJECT")) for lc in collection]
    target["_products"] = sorted(set(products))
    target["_segments"] = sorted({segment_of(row) for row in search.table} - {None})
    target["_mission"] = str(collection[0].meta.get("MISSION") or target["search"]["mission"])

    # Normalize each segment separately before stitching (different quarters have different gains).
    parts = []
    for lc in collection:
        if target["search"]["mission"] in ("Kepler", "TESS") and "pdcsap_flux" in lc.columns:
            lc = lc.select_flux("pdcsap_flux")
        lc = lc.remove_nans()
        lc = lc[~settling_mask(plain(lc.time.value), SETTLING_DAYS[target["search"]["mission"]])]
        parts.append(lc.normalize())
    return lk.LightCurveCollection(parts).stitch()


def plain(values) -> np.ndarray:
    """A float array with masked entries as NaN (lightkurve may return masked arrays)."""
    return np.ma.filled(np.ma.asarray(values, dtype=float), np.nan)


# After each data gap (downlinks, safe modes) the spacecraft warms up and the photometry drifts
# for a while; the first cadences after a gap are dropped. Kepler needs about a day.
SETTLING_DAYS = {"Kepler": 1.0, "K2": 0.5, "TESS": 0.25}
GAP_DAYS = 0.5


def settling_mask(time_days: np.ndarray, settling_days: float) -> np.ndarray:
    """True for the cadences within settling_days after the segment start or after a gap."""
    starts = np.concatenate([[time_days[0]], time_days[1:][np.diff(time_days) > GAP_DAYS]])
    mask = np.zeros(time_days.shape, dtype=bool)
    for t in starts:
        mask |= (time_days >= t) & (time_days < t + settling_days)
    return mask


def transit_mask(time_bjd: np.ndarray, planets: list[dict]) -> np.ndarray:
    """True inside any known transit (1.5 × the total duration, centred on mid-transit)."""
    mask = np.zeros(time_bjd.shape, dtype=bool)
    for p in planets:
        period, t0, duration_days = p["pl_orbper"], p["pl_tranmid"], p["pl_trandur"] / 24
        phase = ((time_bjd - t0 + 0.5 * period) % period) - 0.5 * period
        mask |= np.abs(phase) < 0.75 * duration_days
    return mask


def to_uniform_grid(time_days: np.ndarray, flux: np.ndarray, bin_days: float) -> tuple[float, list]:
    """Average onto bins of width bin_days; empty bins become None."""
    start = float(np.floor(time_days.min() / bin_days) * bin_days)
    index = np.floor((time_days - start) / bin_days).astype(int)
    count = np.bincount(index)
    total = np.bincount(index, weights=flux)
    with np.errstate(invalid="ignore", divide="ignore"):
        mean = total / count
    values = [None if c == 0 else int(round(m)) for c, m in zip(count, mean, strict=True)]
    return start, values


def process(target: dict, archive: dict[str, dict], preview_dir: Path | None) -> dict:
    planets = [archive[name] for name in target["planets"]]
    offset = TIME_OFFSETS[target["search"]["mission"]]
    lc = download(target)

    time_bjd = plain(lc.time.value) + offset
    mask = transit_mask(time_bjd, planets)

    # Flatten: a Savitzky–Golay filter whose window covers several transit durations, with the
    # transits masked so the filter does not eat them. Each continuous chunk between gaps is
    # flattened on its own (lightkurve's own gap splitting on a long stitched series left
    # multi-day wiggles in place). niters=1: no iterative sigma clipping inside the fit, which
    # would drop the points of slow wiggles so the trend could not follow them.
    time_days = plain(lc.time.value)
    cadence_days = float(np.nanmedian(np.diff(time_days)))
    window = max(int(target["window_days"] / cadence_days) | 1, 5)
    edges = np.concatenate([[0], np.nonzero(np.diff(time_days) > GAP_DAYS)[0] + 1, [len(time_days)]])
    rel = np.full(len(time_days), np.nan)
    for a, b in zip(edges[:-1], edges[1:], strict=True):
        n = b - a
        if n < 5 or np.all(mask[a:b]):
            continue  # too short to detrend; drop
        w = min(window, n if n % 2 else n - 1)
        chunk = lc[a:b].flatten(window_length=max(w, 5), mask=mask[a:b], polyorder=min(2, max(w, 5) - 1), niters=1)
        rel[a:b] = plain(chunk.flux.value) - 1.0

    # Clip upward outliers only (flares, cosmic rays); transits are downward.
    out = rel[~mask]
    sigma_point = 1.4826 * np.nanmedian(np.abs(out - np.nanmedian(out)))
    keep = np.isfinite(rel) & (rel < 5 * sigma_point)
    time_days = (time_bjd - offset)[keep]
    flux_ppm = rel[keep] * 1e6

    bin_days = target["bin_hours"] / 24
    start, values = to_uniform_grid(time_days, flux_ppm, bin_days)

    # Per-bin noise from the out-of-transit binned values.
    grid_time = start + bin_days * (np.arange(len(values)) + 0.5)
    grid_mask = transit_mask(grid_time + offset, planets)
    out_vals = np.array([v for v, m in zip(values, grid_mask, strict=True) if v is not None and not m], dtype=float)
    sigma = float(1.4826 * np.median(np.abs(out_vals - np.median(out_vals))))

    result = {
        "id": target["id"],
        "star": target["star"],
        "planets": target["planets"],
        "mission": target["_mission"],
        "segments": target["_segments"],
        "pipeline": target["search"]["author"],
        "timeSystem": "BKJD" if offset == 2454833.0 else "BTJD",
        "timeOffsetBjd": offset,
        "start": round(start, 5),
        "step": round(bin_days, 6),
        "noisePpm": round(sigma, 1),
        "flux": values,
        "products": target["_products"],
        "retrieved": dt.date.today().isoformat(),
    }

    if preview_dir is not None:
        render_preview(result, planets, preview_dir)
    return result


def render_preview(data: dict, planets: list[dict], preview_dir: Path) -> None:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    t = data["start"] + data["step"] * np.arange(len(data["flux"]))
    f = np.array([np.nan if v is None else v for v in data["flux"]], dtype=float)
    p0 = planets[0]
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(11, 6.5))
    ax1.plot(t - t[0], f, ".", ms=1.5, color="k")
    ax1.set_xlabel("days since start")
    ax1.set_ylabel("flux − 1 (ppm)")
    ax1.set_title(f"{data['star']} — {data['mission']} {data['segments']} ({data['pipeline']}), "
                  f"{len(f)} bins of {data['step'] * 24:.2f} h, σ = {data['noisePpm']} ppm")
    phase = ((t + data["timeOffsetBjd"] - p0["pl_tranmid"] + 0.5 * p0["pl_orbper"]) % p0["pl_orbper"]) - 0.5 * p0["pl_orbper"]
    ax2.plot(phase * 24, f, ".", ms=1.5, color="k", alpha=0.4)
    ax2.axhline(-p0["pl_trandep"] * 1e4, color="r", lw=0.8, label=f"archive depth {p0['pl_trandep']} %")
    ax2.set_xlim(-3 * p0["pl_trandur"], 3 * p0["pl_trandur"])
    ax2.set_xlabel(f"hours from mid-transit of {p0['pl_name']} (P = {p0['pl_orbper']:.4f} d)")
    ax2.set_ylabel("flux − 1 (ppm)")
    ax2.legend(loc="lower right")
    fig.tight_layout()
    fig.savefig(preview_dir / f"{data['id']}.png", dpi=90)
    plt.close(fig)


def archive_entry(row: dict) -> dict:
    keys = {
        "name": "pl_name", "host": "hostname", "periodDays": "pl_orbper", "transitMidBjd": "pl_tranmid",
        "radiusEarth": "pl_rade", "radiusEarthErrPlus": "pl_radeerr1", "radiusEarthErrMinus": "pl_radeerr2",
        "massEarth": "pl_bmasse", "massEarthErrPlus": "pl_bmasseerr1", "massEarthErrMinus": "pl_bmasseerr2",
        "massProvenance": "pl_bmassprov", "semiMajorAxisAu": "pl_orbsmax", "inclinationDeg": "pl_orbincl",
        "impactParameter": "pl_imppar", "depthPercent": "pl_trandep", "durationHours": "pl_trandur",
        "rvAmplitude": "pl_rvamp", "eccentricity": "pl_orbeccen", "starRadiusSun": "st_rad",
        "starMassSun": "st_mass", "starTeffK": "st_teff", "distancePc": "sy_dist", "discoveryYear": "disc_year",
        "discoveryMethod": "disc_method", "discoveryFacility": "disc_facility",
    }
    entry = {k: row[v] for k, v in keys.items()}
    entry["radiusReference"] = reference_text(row["pl_rade_reflink"])
    entry["massReference"] = reference_text(row["pl_bmasse_reflink"])
    entry["rvAmplitudeReference"] = reference_text(row["pl_rvamp_reflink"])
    return entry


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--preview", type=Path, help="write a preview PNG per target into this folder")
    parser.add_argument("--only", nargs="*", help="process only these target ids")
    args = parser.parse_args()

    CACHE.mkdir(exist_ok=True)
    HUNT_DATA.mkdir(parents=True, exist_ok=True)
    ARCHIVE_JSON.parent.mkdir(parents=True, exist_ok=True)
    if args.preview:
        args.preview.mkdir(parents=True, exist_ok=True)

    names = [p for t in TARGETS for p in t["planets"]] + EXTRA_PLANETS
    archive = query_archive(names)

    ARCHIVE_JSON.write_text(json.dumps({
        "source": "NASA Exoplanet Archive, Planetary Systems Composite Parameters (pscomppars)",
        "url": "https://exoplanetarchive.ipac.caltech.edu/",
        "retrieved": dt.date.today().isoformat(),
        "planets": [archive_entry(archive[n]) for n in names],
    }, indent=1, ensure_ascii=False) + "\n")
    print(f"wrote {ARCHIVE_JSON.relative_to(ROOT)} ({len(names)} planets)")

    for target in TARGETS:
        if args.only and target["id"] not in args.only:
            continue
        data = process(target, archive, args.preview)
        path = HUNT_DATA / f"{target['id']}.json"
        path.write_text(json.dumps(data, separators=(",", ":")) + "\n")
        print(f"wrote {path.relative_to(ROOT)}: {len(data['flux'])} bins, σ = {data['noisePpm']} ppm, "
              f"{path.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()

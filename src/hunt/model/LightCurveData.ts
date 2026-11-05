/**
 * LightCurveData.ts
 *
 * A real light curve of one Planet Hunt target, as stored in data/<id>.json by
 * scripts/lightcurves/fetch_lightcurves.py: the pipeline flux (Kepler or TESS
 * PDCSAP), detrended and averaged onto a uniform time grid, in whole ppm
 * relative to the star's normal brightness, with null for empty bins (data gaps).
 *
 * Each file is loaded on demand with a dynamic import(), so the data of the
 * targets nobody opens is never downloaded.
 */

/** The JSON shape written by the pipeline. */
export type LightCurveFile = {
  readonly id: string;
  readonly star: string;
  /** Archive names of the star's known planets. */
  readonly planets: readonly string[];
  readonly mission: string;
  /** Kepler quarters or TESS sectors. */
  readonly segments: readonly number[];
  readonly pipeline: string;
  readonly timeSystem: "BKJD" | "BTJD";
  /** Add to the mission time to get the barycentric Julian date. */
  readonly timeOffsetBjd: number;
  /** Mission time of the first bin's start, days. */
  readonly start: number;
  /** Bin width, days. */
  readonly step: number;
  /** Robust scatter of one bin out of transit, ppm. */
  readonly noisePpm: number;
  /** Brightness − 1 per bin, ppm (null = no data). */
  readonly flux: readonly (number | null)[];
  readonly products: readonly string[];
  readonly retrieved: string;
};

/** A light curve ready to plot: only the bins with data. */
export type LightCurve = {
  readonly file: LightCurveFile;
  /** Days since the start of the data (bin centres). */
  readonly times: Float64Array;
  /** Brightness relative to normal (1 = unblocked). */
  readonly brightness: Float64Array;
  /** Days spanned from the first to the last bin. */
  readonly spanDays: number;
  /** Barycentric Julian date of time 0. */
  readonly zeroBjd: number;
};

/** Unpacks the uniform grid into (time, brightness) pairs, dropping empty bins. */
export function unpackLightCurve(file: LightCurveFile): LightCurve {
  const times: number[] = [];
  const brightness: number[] = [];
  file.flux.forEach((ppm, i) => {
    if (ppm !== null) {
      times.push((i + 0.5) * file.step);
      brightness.push(1 + ppm * 1e-6);
    }
  });
  return {
    file: file,
    times: Float64Array.from(times),
    brightness: Float64Array.from(brightness),
    spanDays: file.flux.length * file.step,
    zeroBjd: file.start + file.timeOffsetBjd,
  };
}

/** Loads the light curve of a target by id (code-split: one chunk per target). */
export async function loadLightCurve(id: string): Promise<LightCurve> {
  const module = (await LOADERS[id]?.()) as { default: LightCurveFile } | undefined;
  if (!module) {
    throw new Error(`No light curve for ${id}`);
  }
  return unpackLightCurve(module.default);
}

const LOADERS: Record<string, () => Promise<unknown>> = {
  hd189733: () => import("./data/hd189733.json"),
  hd209458: () => import("./data/hd209458.json"),
  hatp7: () => import("./data/hatp7.json"),
  kepler7: () => import("./data/kepler7.json"),
  kepler10: () => import("./data/kepler10.json"),
  kepler22: () => import("./data/kepler22.json"),
  kepler11: () => import("./data/kepler11.json"),
};

/** Ids of the light curves bundled with the sim. */
export const LIGHT_CURVE_IDS: readonly string[] = Object.keys(LOADERS);

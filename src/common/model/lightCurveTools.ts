/**
 * lightCurveTools.ts
 *
 * What an observer does with a light curve: add measurement noise, fold it on
 * a trial period, and average the folded points into bins. Pure functions; the
 * noise takes its random numbers from a supplied Gaussian source so tests can
 * seed it (the sim passes dotRandom).
 */

/** Source of standard-normal random numbers. */
export type GaussianSource = () => number;

/** Adds Gaussian noise of standard deviation σ to each value. */
export function addNoise(values: readonly number[], sigma: number, gaussian: GaussianSource): number[] {
  return values.map((value) => value + sigma * gaussian());
}

/**
 * Phase of time t on a trial period P and reference transit time t₀, in
 * [−0.5, 0.5): 0 at each predicted transit.
 */
export function foldedPhase(time: number, period: number, referenceTime: number): number {
  const cycles = (time - referenceTime) / period;
  return cycles - Math.floor(cycles + 0.5);
}

/** One bin of a binned light curve. */
export type LightCurveBin = {
  /** Centre of the bin (same unit as the input x). */
  readonly x: number;
  /** Mean of the values in the bin. */
  readonly mean: number;
  /** Number of values averaged. */
  readonly count: number;
};

/**
 * Averages (x, y) points into `binCount` equal bins over [min, max). Empty bins
 * are left out. Non-finite y values are skipped.
 */
export function binPoints(
  xs: readonly number[],
  ys: readonly number[],
  min: number,
  max: number,
  binCount: number,
): LightCurveBin[] {
  const sums = new Array<number>(binCount).fill(0);
  const counts = new Array<number>(binCount).fill(0);
  const width = (max - min) / binCount;
  xs.forEach((x, i) => {
    const y = ys[i];
    if (y === undefined || !Number.isFinite(y)) {
      return;
    }
    const index = Math.floor((x - min) / width);
    if (index >= 0 && index < binCount) {
      sums[index] = (sums[index] ?? 0) + y;
      counts[index] = (counts[index] ?? 0) + 1;
    }
  });
  const bins: LightCurveBin[] = [];
  counts.forEach((count, i) => {
    if (count > 0) {
      bins.push({ x: min + (i + 0.5) * width, mean: (sums[i] ?? 0) / count, count: count });
    }
  });
  return bins;
}

/** Noise after averaging n independent measurements: σ / √n. */
export function averagedNoise(sigma: number, count: number): number {
  return count > 0 ? sigma / Math.sqrt(count) : sigma;
}

/** A period and a reference transit time fitted to a set of transit times. */
export type Ephemeris = {
  /** Period, same unit as the times. */
  readonly period: number;
  /** Time of the transit numbered 0 (near the earliest mark). */
  readonly referenceTime: number;
};

/**
 * The period of transits marked at these times, allowing for transits that were
 * missed (lost in a data gap, or not marked) between the marks.
 *
 * The shortest spacing between neighbouring marks is a first guess P₀. Each mark
 * is then numbered by the whole number of orbits n since the first mark,
 * round((t − t₀) / P), and a least-squares line t = t_ref + n·P through the
 * marks gives the period; this is repeated once with the refined P. Plain
 * averaging, (last − first) / (count − 1), is wrong as soon as one transit is
 * missing: dips at 0, 1 and 3 orbits would give 1.5 orbits.
 *
 * Marks closer together than `minSeparation` count as one (a dip marked twice).
 * Returns null with fewer than two distinct marks.
 */
export function ephemerisFromMarks(times: readonly number[], minSeparation: number): Ephemeris | null {
  const sorted = [...times].sort((a, b) => a - b);
  const distinct: number[] = [];
  for (const time of sorted) {
    const last = distinct[distinct.length - 1];
    if (last === undefined || time - last >= minSeparation) {
      distinct.push(time);
    }
  }
  if (distinct.length < 2) {
    return null;
  }
  const first = distinct[0] ?? 0;
  let period = Number.POSITIVE_INFINITY;
  for (let i = 1; i < distinct.length; i++) {
    period = Math.min(period, (distinct[i] ?? 0) - (distinct[i - 1] ?? 0));
  }
  let referenceTime = first;
  for (let iteration = 0; iteration < 2; iteration++) {
    const cycles = distinct.map((time) => Math.round((time - first) / period));
    const count = distinct.length;
    const meanN = cycles.reduce((sum, n) => sum + n, 0) / count;
    const meanT = distinct.reduce((sum, t) => sum + t, 0) / count;
    let numerator = 0;
    let denominator = 0;
    distinct.forEach((time, i) => {
      const dn = (cycles[i] ?? 0) - meanN;
      numerator += dn * (time - meanT);
      denominator += dn * dn;
    });
    if (denominator === 0) {
      break;
    }
    period = numerator / denominator;
    referenceTime = meanT - period * meanN;
  }
  return { period, referenceTime };
}

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

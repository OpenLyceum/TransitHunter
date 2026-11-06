/**
 * boxSearch.ts
 *
 * A box-least-squares (BLS) transit search (Kovács, Zucker & Mazeh 2002): for
 * each trial period, fold the light curve, slide boxes of several durations
 * round the folded orbit, and keep the box where the light drops the most
 * significantly. The "power" of a period is that box's signal-to-noise,
 * depth / (σ / √n_in), with σ the scatter of one point.
 *
 * Grids:
 *  - Durations run from `minDuration` (at least 1.5 bins of the data, so a dip
 *    always covers a point) in steps of ×1.5 up to MAX_DURATION_HOURS, and never
 *    more than MAX_DURATION_FRACTION of the period.
 *  - Periods run from minPeriod to maxPeriod, spaced so that over the whole run
 *    a neighbouring trial drifts by at most 1.5 durations (the shortest box, or
 *    half a Sun-like central transit at that period if longer).
 *    The shortest period is the one whose central transit across a Sun-like
 *    star would last `minDuration`: a shorter one could not be seen in the data.
 *  - The folded orbit is split into phase bins a third of the shortest duration wide.
 *
 * The search runs in chunks ({@link BoxSearch.advance}) so the sim can spread it
 * over animation frames; {@link refinePeak} re-searches finely around a peak.
 * Pure TypeScript on typed arrays, so it is easy to unit-test.
 */

/** Longest box tried, hours (Kepler-11 g's transit lasts 9.5 h). */
export const MAX_DURATION_HOURS = 16;

/** Longest box tried, as a fraction of the period. */
export const MAX_DURATION_FRACTION = 0.12;

/** Shortest box tried, hours, whatever the cadence. */
export const MIN_DURATION_HOURS = 1;

/** A transit across the Sun seen from 1 AU (central, P = 1 yr) lasts about this long, hours. */
const SUN_TRANSIT_HOURS_AT_ONE_YEAR = 13;

/** Duration of a central transit across a Sun-like star at this period, days (D ∝ P^⅓). */
function sunTransitDays(period: number): number {
  return (SUN_TRANSIT_HOURS_AT_ONE_YEAR / 24) * (period / 365.25) ** (1 / 3);
}

/** Most phase bins of one fold (long periods get wider bins). */
const MAX_PHASE_BINS = 30_000;

/**
 * Largest drift between neighbouring trial periods over the run, in grid durations. A transit
 * smeared by this much still shows (with somewhat less signal); the peak is then refined.
 */
const GRID_DRIFT = 1.5;

/** Elementary steps between clock checks in {@link BoxSearch.advanceFor}. */
const OPERATIONS_PER_CHUNK = 200_000;

/** Steps of the fine search either side of a peak in {@link BoxSearch.refinePeak}. */
const REFINE_STEPS = 40;

export type BoxSearchOptions = {
  /** Data cadence (bin width), days. */
  readonly step: number;
  /** Shortest and longest period to try, days (the shortest is raised if the cadence cannot show it). */
  readonly minPeriod: number;
  readonly maxPeriod: number;
};

/** The best box at one trial period. */
export type BoxFit = {
  /** Period, days. */
  readonly period: number;
  /** Signal-to-noise of the dip. */
  readonly power: number;
  /** Mid-transit time of the transit numbered 0, days (same zero as the input times), 0 ≤ t < period. */
  readonly epoch: number;
  /** Fractional depth (0.01 = 1 %). */
  readonly depth: number;
  /** Box duration, days. */
  readonly duration: number;
};

export class BoxSearch {
  /** Trial periods, days, increasing. */
  public readonly periods: Float64Array;

  /** Signal-to-noise of the best box at each period (filled as the search advances). */
  public readonly power: Float64Array;

  private readonly epochs: Float64Array;
  private readonly depths: Float64Array;
  private readonly durationsFound: Float64Array;

  /** Days the stored times are shifted by (0 unless some times were negative). */
  private readonly timeOffset: number;
  private readonly times: Float64Array;
  /** Brightness minus its mean. */
  private readonly residuals: Float64Array;
  /** Scatter of one point. */
  private readonly sigma: number;
  /** Box durations to try, days, increasing. */
  private readonly durations: number[];
  private readonly binWidth: number;
  private readonly span: number;

  /** Index of the next period to search. */
  private next = 0;

  // Work arrays for one fold, reused.
  private binSums: Float64Array;
  private binCounts: Int32Array;

  /**
   * @param times - days (normally since the start of the data)
   * @param brightness - relative brightness at each time
   */
  public constructor(times: Float64Array, brightness: Float64Array, options: BoxSearchOptions) {
    const n = times.length;
    // The fold floors with `| 0`, which needs times ≥ 0: shift any earlier data, and shift epochs back.
    let earliest = 0;
    for (const t of times) {
      earliest = Math.min(earliest, t);
    }
    this.timeOffset = earliest;
    this.times = earliest < 0 ? times.map((t) => t - earliest) : times;
    let mean = 0;
    for (const b of brightness) {
      mean += b;
    }
    mean /= Math.max(1, n);
    this.residuals = brightness.map((b) => b - mean);
    let squares = 0;
    for (const r of this.residuals) {
      squares += r * r;
    }
    this.sigma = Math.sqrt(squares / Math.max(1, n - 1)) || 1;

    let first = Number.POSITIVE_INFINITY;
    let last = Number.NEGATIVE_INFINITY;
    for (const t of this.times) {
      first = Math.min(first, t);
      last = Math.max(last, t);
    }
    this.span = Math.max(last - first, options.step);

    const minDuration = Math.max(MIN_DURATION_HOURS / 24, 1.5 * options.step);
    this.durations = [];
    for (let d = minDuration; d <= MAX_DURATION_HOURS / 24 + 1e-9; d *= 1.5) {
      this.durations.push(d);
    }
    this.binWidth = minDuration / 3;

    // Shortest period whose central transit across a Sun-like star lasts minDuration (P ∝ D³).
    const shortestVisible = 365.25 * (minDuration / sunTransitDays(365.25)) ** 3;
    const minPeriod = Math.max(options.minPeriod, shortestVisible);
    const maxPeriod = Math.max(minPeriod, options.maxPeriod);
    // Neighbouring trials drift apart by GRID_DRIFT grid durations over the run. The grid duration
    // is the shortest box, or half the central transit time across a Sun-like star if longer (long
    // periods have long transits). refinePeak() then searches finely round the chosen peak.
    const periods: number[] = [];
    for (let period = minPeriod; period <= maxPeriod; ) {
      periods.push(period);
      const gridDuration = Math.max(minDuration, 0.5 * sunTransitDays(period));
      period *= 1 + (GRID_DRIFT * gridDuration) / this.span;
    }
    this.periods = Float64Array.from(periods.length > 0 ? periods : [minPeriod]);
    const count = this.periods.length;
    this.power = new Float64Array(count);
    this.epochs = new Float64Array(count);
    this.depths = new Float64Array(count);
    this.durationsFound = new Float64Array(count);
    this.binSums = new Float64Array(0);
    this.binCounts = new Int32Array(0);
  }

  /** Fraction of the periods searched so far, 0–1. */
  public get progress(): number {
    return this.next / this.periods.length;
  }

  public get done(): boolean {
    return this.next >= this.periods.length;
  }

  /**
   * Searches more periods, stopping once about `operations` elementary steps
   * (points folded plus boxes tried) have been spent. Returns true when done.
   */
  public advance(operations: number): boolean {
    let spent = 0;
    while (!this.done && spent < operations) {
      const k = this.next;
      const fit = this.searchPeriod(this.periods[k] ?? 1);
      this.power[k] = fit.power;
      this.epochs[k] = fit.epoch;
      this.depths[k] = fit.depth;
      this.durationsFound[k] = fit.duration;
      spent += this.times.length + this.binSums.length * this.durations.length;
      this.next++;
    }
    return this.done;
  }

  /** Searches more periods for about `milliseconds` of wall-clock time. Returns true when done. */
  public advanceFor(milliseconds: number): boolean {
    const end = performance.now() + milliseconds;
    // Small chunks, so the clock is checked often.
    while (!this.done && performance.now() < end) {
      this.advance(OPERATIONS_PER_CHUNK);
    }
    return this.done;
  }

  /** Runs the whole search at once (tests, or small data sets). */
  public runToEnd(): void {
    while (!this.advance(Number.POSITIVE_INFINITY)) {
      // advance() does everything in one call with an unlimited budget.
    }
  }

  /** The best box at grid index k (searched periods only). */
  public fitAt(k: number): BoxFit {
    return {
      period: this.periods[k] ?? 1,
      power: this.power[k] ?? 0,
      epoch: this.epochs[k] ?? 0,
      depth: this.depths[k] ?? 0,
      duration: this.durationsFound[k] ?? 0,
    };
  }

  /** Index of the highest power among searched periods in [minPeriod, maxPeriod], or −1. */
  public peakIndex(minPeriod = 0, maxPeriod = Number.POSITIVE_INFINITY): number {
    let best = -1;
    let bestPower = 0;
    for (let k = 0; k < this.next; k++) {
      const period = this.periods[k] ?? 0;
      const power = this.power[k] ?? 0;
      if (period >= minPeriod && period <= maxPeriod && power > bestPower) {
        bestPower = power;
        best = k;
      }
    }
    return best;
  }

  /**
   * Re-searches finely between the neighbours of grid index k and returns the
   * best box found (the grid alone lets the fold drift by up to one duration over the run).
   */
  public refinePeak(k: number): BoxFit {
    const low = this.periods[Math.max(0, k - 1)] ?? 1;
    const high = this.periods[Math.min(this.periods.length - 1, k + 1)] ?? 1;
    let best = this.fitAt(k);
    for (let i = 0; i <= 2 * REFINE_STEPS; i++) {
      const period = low * (high / low) ** (i / (2 * REFINE_STEPS));
      const fit = this.searchPeriod(period);
      if (fit.power > best.power) {
        best = fit;
      }
    }
    return best;
  }

  /** Folds the light curve on a period into binCount phase bins (summed residuals and counts). */
  private fold(period: number, binCount: number): void {
    if (this.binSums.length !== binCount) {
      this.binSums = new Float64Array(binCount);
      this.binCounts = new Int32Array(binCount);
    } else {
      this.binSums.fill(0);
      this.binCounts.fill(0);
    }
    const sums = this.binSums;
    const counts = this.binCounts;
    const times = this.times;
    const residuals = this.residuals;
    const inversePeriod = 1 / period;
    for (let i = 0; i < times.length; i++) {
      // Phase in bins, frac(t / P) × binCount, with no division per point. The times are not
      // negative, so `| 0` floors (several times faster than Math.floor in this loop).
      const cycles = (times[i] as number) * inversePeriod;
      let bin = ((cycles - (cycles | 0)) * binCount) | 0;
      if (bin >= binCount) {
        bin = binCount - 1;
      }
      sums[bin] = (sums[bin] as number) + (residuals[i] as number);
      counts[bin] = (counts[bin] as number) + 1;
    }
  }

  /** The best dimming box at one period. */
  private searchPeriod(period: number): BoxFit {
    const binCount = Math.max(3, Math.min(MAX_PHASE_BINS, Math.ceil(period / this.binWidth)));
    this.fold(period, binCount);
    const sums = this.binSums;
    const counts = this.binCounts;
    const total = this.times.length;
    const binTime = period / binCount;
    // Maximise depth²/σ_depth² ∝ s²(N − n)/n (s = summed residuals in the box), with no square root per box.
    let bestScore = 0;
    let bestStart = 0;
    let bestWidth = 1;
    let bestN = 1;
    let bestS = 0;
    for (const duration of this.durations) {
      if (duration > MAX_DURATION_FRACTION * period) {
        break;
      }
      const width = Math.max(1, Math.round(duration / binTime));
      // Sliding window round the circular fold.
      let s = 0;
      let n = 0;
      for (let j = 0; j < width; j++) {
        s += sums[j % binCount] ?? 0;
        n += counts[j % binCount] ?? 0;
      }
      for (let start = 0; start < binCount; start++) {
        if (s < 0 && n > 0 && n < total) {
          const score = (s * s * (total - n)) / n;
          if (score > bestScore) {
            bestScore = score;
            bestStart = start;
            bestWidth = width;
            bestN = n;
            bestS = s;
          }
        }
        let into = start + width;
        if (into >= binCount) {
          into -= binCount;
        }
        s += (sums[into] as number) - (sums[start] as number);
        n += (counts[into] as number) - (counts[start] as number);
      }
    }
    // Depth = −s/n; its noise is σ √(1/n + 1/(N − n)), so S/N = √(score / N) / σ.
    const bestDepth = -bestS / bestN;
    const bestPower = bestScore > 0 ? Math.sqrt(bestScore / total) / this.sigma : 0;
    const epoch = ((((bestStart + bestWidth / 2) * binTime + this.timeOffset) % period) + period) % period;
    return { period, power: bestPower, epoch, depth: bestDepth, duration: bestWidth * binTime };
  }
}

/**
 * huntChartMath.ts
 *
 * Pure helpers for the Planet Hunt chart: folded time axis, the default zoom
 * window when folding (or opening the far side), and brightness ranges that
 * clip a few outlier points. The chart node calls these; binning stays in
 * common/model/lightCurveTools.
 */

import { Range } from "scenerystack/dot";

/** Full folded time axis in hours from mid-transit (or far-side centre). */
export function foldedFullRangeHours(periodDays: number): Range {
  const halfPeriodHours = periodDays * 12;
  return new Range(-halfPeriodHours, halfPeriodHours);
}

/** Unfolded time axis covering the light-curve span, days from the start. */
export function unfoldedFullRangeDays(spanDays: number): Range {
  return new Range(0, spanDays > 0 ? spanDays : 1);
}

/**
 * Window the folded chart opens on. Far side: ±min(fixed hours, fraction of the
 * period) so the transit stays off-screen. Null means show the whole period.
 */
export function initialFoldWindow(
  periodDays: number,
  farSide: boolean,
  foldedHalfWindowHours: number,
  farSideHalfWindowFraction: number,
): Range | null {
  const halfPeriodHours = periodDays * 12;
  const half = farSide
    ? Math.min(foldedHalfWindowHours, 2 * farSideHalfWindowFraction * halfPeriodHours)
    : foldedHalfWindowHours;
  return halfPeriodHours > half ? new Range(-half, half) : null;
}

/**
 * Brightness % axis from a set of values: drop `clipPoints` at each end (stray
 * outliers), then add an 8 % margin of the remaining span.
 */
export function clippedBrightnessRange(
  percents: ArrayLike<number>,
  clipPoints: number,
  fallback = new Range(99, 100),
): Range {
  const length = percents.length;
  if (length === 0) {
    return fallback;
  }
  const sorted = Float64Array.from(percents as ArrayLike<number>).sort();
  const low = sorted[Math.min(clipPoints, length - 1)] ?? fallback.min;
  const high = sorted[Math.max(0, length - 1 - clipPoints)] ?? fallback.max;
  const margin = 0.08 * (high - low);
  return new Range(low - margin, high + margin);
}

/**
 * Brightness % axis of the folded points inside `xRange`. Falls back when too
 * few points remain after clipping (far-side view of a shallow eclipse).
 */
export function windowBrightnessRange(
  xs: ArrayLike<number>,
  percents: ArrayLike<number>,
  xRange: Range,
  clipPoints: number,
  fallback: Range,
): Range {
  const shown: number[] = [];
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i];
    if (x !== undefined && x >= xRange.min && x <= xRange.max) {
      shown.push(percents[i] ?? 100);
    }
  }
  if (shown.length < 2 * clipPoints + 2) {
    return fallback;
  }
  return clippedBrightnessRange(shown, clipPoints, fallback);
}

/**
 * Hours from mid-transit (or far-side centre) for each sample: phase × period
 * in hours. `phaseOf` is the model's folded phase (−0.5 … 0.5).
 */
export function foldedTimesHours(
  times: ArrayLike<number>,
  periodHours: number,
  phaseOf: (time: number) => number,
): Float64Array<ArrayBuffer> {
  const out = new Float64Array(times.length);
  for (let i = 0; i < times.length; i++) {
    out[i] = phaseOf(times[i] ?? 0) * periodHours;
  }
  return out;
}

/** Whole-number transit indices whose mid-times fall in [xMin, xMax]. */
export function revealTransitIndexRange(
  reference: number,
  periodDays: number,
  xMin: number,
  xMax: number,
): { first: number; last: number } {
  return {
    first: Math.ceil((xMin - reference) / periodDays),
    last: Math.floor((xMax - reference) / periodDays),
  };
}

/**
 * Checks for boxSearch.ts: the box-least-squares period search finds a box-shaped
 * dip in noise, gives its depth, duration and mid-transit time, and refines the period.
 */

import { dotRandom } from "scenerystack/dot";
import { describe, expect, it } from "vitest";
import { BoxSearch } from "../src/hunt/model/boxSearch.js";

/** A light curve on a 30-minute grid with box transits of the given depth, duration (days) and period. */
function boxLightCurve(period: number, epoch: number, depth: number, duration: number, sigma: number, days: number) {
  const step = 1 / 48;
  const times: number[] = [];
  const brightness: number[] = [];
  for (let t = step / 2; t < days; t += step) {
    const phase = (((((t - epoch) / period) % 1) + 1.5) % 1) - 0.5;
    const inTransit = Math.abs(phase * period) < duration / 2;
    times.push(t);
    brightness.push(1 - (inTransit ? depth : 0) + sigma * dotRandom.nextGaussian());
  }
  return { times: Float64Array.from(times), brightness: Float64Array.from(brightness), step };
}

describe("BoxSearch", () => {
  it("finds a shallow box-shaped dip in noise, with its depth, duration and transit time", () => {
    dotRandom.setSeed(11);
    const data = boxLightCurve(3.7, 1.3, 0.001, 0.12, 0.0006, 60);
    const search = new BoxSearch(data.times, data.brightness, { step: data.step, minPeriod: 0.3, maxPeriod: 30 });
    expect(search.done).toBe(false);
    search.runToEnd();
    expect(search.progress).toBe(1);
    const fit = search.refinePeak(search.peakIndex());
    expect(fit.period).toBeCloseTo(3.7, 2);
    expect(fit.depth).toBeCloseTo(0.001, 3);
    expect(fit.duration).toBeGreaterThan(0.06);
    expect(fit.duration).toBeLessThan(0.2);
    expect(Math.abs(fit.epoch - 1.3)).toBeLessThan(0.05);
    expect(fit.power).toBeGreaterThan(10);
  });

  it("finds nothing strong in pure noise", () => {
    dotRandom.setSeed(12);
    const data = boxLightCurve(5, 0, 0, 0.1, 0.0006, 40);
    const search = new BoxSearch(data.times, data.brightness, { step: data.step, minPeriod: 0.3, maxPeriod: 20 });
    search.runToEnd();
    expect(search.fitAt(search.peakIndex()).power).toBeLessThan(7);
  });

  it("advances in chunks and limits a peak search to a period range", () => {
    dotRandom.setSeed(13);
    const data = boxLightCurve(2.5, 0.4, 0.002, 0.1, 0.0005, 30);
    const search = new BoxSearch(data.times, data.brightness, { step: data.step, minPeriod: 0.3, maxPeriod: 15 });
    search.advance(1);
    expect(search.progress).toBeGreaterThan(0);
    expect(search.progress).toBeLessThan(1);
    search.runToEnd();
    // Folding on twice the period still stacks every other transit: an echo peak.
    const echo = search.peakIndex(4.5, 5.5);
    expect(search.fitAt(echo).period).toBeCloseTo(5, 1);
    expect(search.fitAt(echo).power).toBeLessThan(search.fitAt(search.peakIndex()).power);
  });

  it("shifts epochs back when given times before zero", () => {
    dotRandom.setSeed(14);
    const data = boxLightCurve(3, 1, 0.003, 0.1, 0.0003, 30);
    const shifted = data.times.map((t) => t - 10);
    const search = new BoxSearch(shifted, data.brightness, { step: data.step, minPeriod: 0.3, maxPeriod: 10 });
    search.runToEnd();
    const fit = search.refinePeak(search.peakIndex());
    // Transits at 1 + 3n − 10, i.e. at 0 modulo 3.
    const offset = Math.min(fit.epoch, 3 - fit.epoch);
    expect(offset).toBeLessThan(0.05);
  });
});

/**
 * Checks for lightCurveTools.ts: folding, binning and noise averaging.
 */

import { describe, expect, it } from "vitest";
import {
  addNoise,
  averagedNoise,
  binPoints,
  ephemerisFromMarks,
  foldedPhase,
} from "../src/common/model/lightCurveTools.js";

describe("lightCurveTools", () => {
  it("folds times onto [−0.5, 0.5) with 0 at each transit", () => {
    expect(foldedPhase(10, 2, 0)).toBeCloseTo(0, 12);
    expect(foldedPhase(11, 2, 0)).toBeCloseTo(-0.5, 12);
    expect(foldedPhase(10.5, 2, 0.5)).toBeCloseTo(0, 12);
    expect(foldedPhase(9.6, 2, 0)).toBeCloseTo(-0.2, 12);
  });

  it("averages points into bins, skipping empty bins and non-finite values", () => {
    const bins = binPoints([0.1, 0.2, 0.6, 0.7, 0.65], [1, 3, 5, Number.NaN, 7], 0, 1, 4);
    expect(bins.map((b) => b.x)).toEqual([0.125, 0.625]);
    expect(bins.map((b) => b.mean)).toEqual([2, 6]);
    expect(bins.map((b) => b.count)).toEqual([2, 2]);
  });

  it("noise drops as 1/√n when measurements are averaged", () => {
    expect(averagedNoise(100, 25)).toBeCloseTo(20, 12);
    let seed = 0;
    const alternating = (): number => (seed++ % 2 === 0 ? 1 : -1);
    expect(addNoise([0, 0, 0, 0], 3, alternating)).toEqual([3, -3, 3, -3]);
  });

  it("finds the period from marks even when a dip is missing between them", () => {
    // Dips at 0, 1 and 3 orbits of 2.2 days: plain averaging would give 3.3 days.
    const ephemeris = ephemerisFromMarks([5, 7.2, 11.6], 0.15);
    expect(ephemeris?.period).toBeCloseTo(2.2, 9);
    expect(ephemeris?.referenceTime).toBeCloseTo(5, 9);
  });

  it("gives Kepler-7 b's period from its visible dips (three lost in data gaps)", () => {
    // Mid-transit times of the Kepler-7 b dips with data in the bundled quarter, days.
    const visible = [2.61, 7.5, 17.27, 22.15, 27.04, 31.92, 36.81, 41.69];
    const ephemeris = ephemerisFromMarks(visible, 0.15);
    expect(ephemeris?.period).toBeCloseTo(4.885, 2);
  });

  it("averages out the error of each mark and ignores a dip marked twice", () => {
    const marks = [1.02, 3.18, 3.2, 5.43, 9.81];
    const ephemeris = ephemerisFromMarks(marks, 0.15);
    expect(ephemeris?.period).toBeCloseTo(2.2, 1);
    expect(ephemerisFromMarks([4, 4.05], 0.15)).toBeNull();
    expect(ephemerisFromMarks([4], 0.15)).toBeNull();
  });
});

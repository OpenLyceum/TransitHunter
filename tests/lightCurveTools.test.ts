/**
 * Checks for lightCurveTools.ts: folding, binning and noise averaging.
 */

import { describe, expect, it } from "vitest";
import { addNoise, averagedNoise, binPoints, foldedPhase } from "../src/common/model/lightCurveTools.js";

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
});

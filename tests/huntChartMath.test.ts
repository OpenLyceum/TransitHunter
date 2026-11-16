/**
 * Tests for Planet Hunt chart fold-window and brightness-range helpers.
 */

import { Range } from "scenerystack/dot";
import { describe, expect, it } from "vitest";
import {
  clippedBrightnessRange,
  foldedFullRangeHours,
  foldedTimesHours,
  initialFoldWindow,
  revealTransitIndexRange,
  unfoldedFullRangeDays,
  windowBrightnessRange,
} from "../src/hunt/model/huntChartMath.js";

describe("foldedFullRangeHours", () => {
  it("spans ±half a period in hours", () => {
    const range = foldedFullRangeHours(2);
    expect(range.min).toBe(-24);
    expect(range.max).toBe(24);
  });
});

describe("unfoldedFullRangeDays", () => {
  it("covers the light-curve span from day 0", () => {
    expect(unfoldedFullRangeDays(10)).toEqual(new Range(0, 10));
  });

  it("falls back to unit length when the span is missing", () => {
    expect(unfoldedFullRangeDays(0)).toEqual(new Range(0, 1));
  });
});

describe("initialFoldWindow", () => {
  it("opens on ±foldedHalfWindowHours when the period is longer", () => {
    const window = initialFoldWindow(10, false, 30, 0.35);
    expect(window?.min).toBe(-30);
    expect(window?.max).toBe(30);
  });

  it("returns null when the period fits inside the half window", () => {
    expect(initialFoldWindow(2, false, 30, 0.35)).toBeNull();
  });

  it("narrows the far-side window to a fraction of the period", () => {
    // halfPeriodHours = 120; 2 * 0.35 * 120 = 84; min(30, 84) = 30 → still 30
    const long = initialFoldWindow(10, true, 30, 0.35);
    expect(long?.getLength()).toBe(60);
    // halfPeriodHours = 48; 2 * 0.35 * 48 = 33.6; min(40, 33.6) = 33.6
    const short = initialFoldWindow(4, true, 40, 0.35);
    expect(short?.max).toBeCloseTo(33.6);
  });
});

describe("clippedBrightnessRange", () => {
  it("drops clipPoints at each end and adds an 8% margin", () => {
    const percents = [90, 99, 99.5, 100, 100.5, 110];
    const range = clippedBrightnessRange(percents, 1);
    // after clip: 99 … 100.5 → margin 0.08 * 1.5 = 0.12
    expect(range.min).toBeCloseTo(98.88);
    expect(range.max).toBeCloseTo(100.62);
  });
});

describe("windowBrightnessRange", () => {
  it("falls back when too few points lie in the window", () => {
    const fallback = new Range(99, 100);
    const range = windowBrightnessRange([0, 1], [99.5, 99.6], new Range(0, 1), 2, fallback);
    expect(range).toBe(fallback);
  });

  it("clips only the points inside the window", () => {
    const xs = [-10, -1, 0, 1, 10];
    const ys = [50, 99, 99.5, 100, 150];
    const range = windowBrightnessRange(xs, ys, new Range(-2, 2), 0, new Range(99, 100));
    // shown: 99, 99.5, 100 → margin 0.08
    expect(range.min).toBeCloseTo(98.92);
    expect(range.max).toBeCloseTo(100.08);
  });
});

describe("foldedTimesHours", () => {
  it("multiplies each phase by the period in hours", () => {
    const times = [0, 1, 2];
    const out = foldedTimesHours(times, 24, (t) => t / 10);
    expect(out[0]).toBeCloseTo(0);
    expect(out[1]).toBeCloseTo(2.4);
    expect(out[2]).toBeCloseTo(4.8);
  });
});

describe("revealTransitIndexRange", () => {
  it("lists whole-number transits whose mid-times fall in the window", () => {
    const { first, last } = revealTransitIndexRange(1, 2, 0, 10);
    // times at 1, 3, 5, 7, 9 → n = 0 … 4
    expect(first).toBeCloseTo(0);
    expect(last).toBe(4);
  });
});

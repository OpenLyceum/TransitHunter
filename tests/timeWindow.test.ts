/**
 * Tests for the Planet Hunt chart's time-window helpers (zoom and scroll).
 */

import { Range } from "scenerystack/dot";
import { describe, expect, it } from "vitest";
import { panTimeWindow, zoomTimeWindow } from "../src/hunt/view/timeWindow.js";

const LIMITS = new Range(0, 100);

describe("zoomTimeWindow", () => {
  it("keeps the anchor time at the same place on screen", () => {
    const window = zoomTimeWindow(new Range(0, 100), 0.5, 25, LIMITS, 1);
    expect(window?.min).toBeCloseTo(12.5);
    expect(window?.max).toBeCloseTo(62.5);
  });

  it("stops at the minimum span", () => {
    const window = zoomTimeWindow(new Range(10, 12), 0.01, 11, LIMITS, 1);
    expect(window?.getLength()).toBeCloseTo(1);
    expect(window?.getCenter()).toBeCloseTo(11);
  });

  it("returns null (show all) when zoomed out to the limits", () => {
    expect(zoomTimeWindow(new Range(20, 80), 2, 50, LIMITS, 1)).toBeNull();
  });

  it("slides a zoomed-out window back inside the limits", () => {
    const window = zoomTimeWindow(new Range(80, 100), 2, 100, LIMITS, 1);
    expect(window?.min).toBeCloseTo(60);
    expect(window?.max).toBeCloseTo(100);
  });
});

describe("panTimeWindow", () => {
  it("moves the window without changing its span", () => {
    const window = panTimeWindow(new Range(10, 30), 5, LIMITS);
    expect(window.min).toBeCloseTo(15);
    expect(window.max).toBeCloseTo(35);
  });

  it("stops at either end of the run", () => {
    expect(panTimeWindow(new Range(10, 30), -50, LIMITS).min).toBe(0);
    expect(panTimeWindow(new Range(70, 90), 50, LIMITS).max).toBe(100);
  });
});

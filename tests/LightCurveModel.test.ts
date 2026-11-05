/**
 * Checks for LightCurveModel: reading depth and period, limb darkening, and the
 * signal-to-noise ratio of stacked transits.
 */

import { describe, expect, it } from "vitest";
import { StarPreset } from "../src/common/model/StarPreset.js";
import { LightCurveModel, MAX_WIDE_POINTS, WIDE_ORBITS } from "../src/light-curve/model/LightCurveModel.js";

describe("LightCurveModel", () => {
  it("reads back the planet radius from the depth (uniform disk)", () => {
    const model = new LightCurveModel();
    expect(model.inferredRadiusProperty.value).toBeCloseTo(model.planetRadiusProperty.value, 6);
    model.starPresetProperty.value = StarPreset.RED_DWARF;
    expect(model.inferredRadiusProperty.value).toBeCloseTo(model.planetRadiusProperty.value, 6);
  });

  it("limb darkening deepens the dip, so the naive radius comes out too big", () => {
    const model = new LightCurveModel();
    model.limbDarkeningProperty.value = true;
    expect(model.inferredRadiusProperty.value).toBeGreaterThan(model.planetRadiusProperty.value);
    expect(model.inferredRadiusProperty.value / model.planetRadiusProperty.value).toBeLessThan(1.15);
  });

  it("a lighter star means a longer period at the same distance", () => {
    const model = new LightCurveModel();
    const sun = model.periodProperty.value;
    model.starPresetProperty.value = StarPreset.RED_DWARF;
    expect(model.periodProperty.value / sun).toBeCloseTo(Math.sqrt(5), 6);
  });

  it("signal to noise grows as the square root of the transits stacked", () => {
    const model = new LightCurveModel();
    expect(model.signalToNoiseProperty.value).toBe(Number.POSITIVE_INFINITY);
    model.planetRadiusProperty.value = 1;
    model.noiseProperty.value = 300;
    const one = model.signalToNoiseProperty.value;
    model.stackProperty.value = 100;
    expect(model.signalToNoiseProperty.value / one).toBeCloseTo(10, 6);
  });

  it("caps the wide chart at MAX_WIDE_POINTS and spans WIDE_ORBITS orbits", () => {
    const model = new LightCurveModel();
    model.distanceProperty.value = 1;
    const points = model.wideObservations();
    expect(points.length).toBeLessThanOrEqual(MAX_WIDE_POINTS);
    expect(points[points.length - 1]!.x).toBeLessThan(WIDE_ORBITS * model.periodProperty.value);
    model.reset();
    expect(model.planetRadiusProperty.value).toBe(11.2);
  });
});

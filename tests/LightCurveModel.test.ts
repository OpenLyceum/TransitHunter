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

  it("keeps the planet smaller than the star and the orbit outside it", () => {
    const model = new LightCurveModel();
    model.planetRadiusProperty.value = 25;
    model.distanceProperty.value = 0.01;
    model.starPresetProperty.value = StarPreset.RED_DWARF;
    expect(model.planetRadiusProperty.value).toBeCloseTo(StarPreset.RED_DWARF.maxPlanetRadiusEarth, 9);
    expect(model.geometryProperty.value.radiusRatio).toBeLessThanOrEqual(0.6 + 1e-9);
    model.starPresetProperty.value = StarPreset.BIG_STAR;
    expect(model.distanceProperty.value).toBeCloseTo(StarPreset.BIG_STAR.minDistanceAu, 9);
    expect(model.geometryProperty.value.orbitInStarRadii).toBeGreaterThanOrEqual(2 - 1e-9);
    // Without that limit the "transit" lasted half the orbit; now it is a sensible fraction.
    expect(model.durationProperty.value / (model.periodProperty.value * 24)).toBeLessThan(0.25);
  });

  it("never gives a zoomed point more scatter than one measurement per transit", () => {
    const model = new LightCurveModel();
    model.starPresetProperty.value = StarPreset.RED_DWARF;
    model.planetRadiusProperty.value = 1;
    model.distanceProperty.value = 0.01;
    model.noiseProperty.value = 1000;
    // A transit under an hour: fewer real measurements than the 10 points drawn.
    expect(model.durationProperty.value).toBeLessThan(1);
    const points = model.zoomObservations();
    const model0 = model.zoomModelCurve(points.length - 1);
    const residuals = points.map(
      (point) => point.y - (model0.find((m) => Math.abs(m.x - point.x) < 1e-9)?.y ?? point.y),
    );
    expect(points.length).toBeGreaterThanOrEqual(10);
    const rms = Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length);
    expect(rms).toBeLessThan(1000e-6 * 1.8);
  });
});

/**
 * Checks for LiningUpModel: the tilt limit, durations, the transit window and
 * the random sample.
 */

import { describe, expect, it } from "vitest";
import { PlanetPreset } from "../src/common/model/PlanetPreset.js";
import { LiningUpModel, SAMPLE_SIZE } from "../src/lining-up/model/LiningUpModel.js";

describe("LiningUpModel", () => {
  it("a hot Jupiter at 0.05 AU has a 4-day period and transits within about 6° of edge-on", () => {
    const model = new LiningUpModel();
    expect(model.periodProperty.value).toBeCloseTo(4.08, 1);
    expect(model.tiltLimitProperty.value).toBeCloseTo(5.9, 0);
    expect(model.probabilityProperty.value).toBeCloseTo(0.102, 2);
    expect(model.transitsProperty.value).toBe(true);
  });

  it("tilting shortens the transit, then it vanishes", () => {
    const model = new LiningUpModel();
    const edgeOn = model.durationProperty.value;
    model.inclinationProperty.value = 86;
    expect(model.durationProperty.value).toBeLessThan(edgeOn);
    expect(model.durationProperty.value).toBeGreaterThan(0);
    model.inclinationProperty.value = 80;
    expect(model.transitsProperty.value).toBe(false);
    expect(model.durationProperty.value).toBe(0);
    expect(model.brightnessProperty.value).toBe(1);
  });

  it("Earth at 1 AU transits for about 1 observer in 200", () => {
    const model = new LiningUpModel();
    model.planetPresetProperty.value = PlanetPreset.EARTH;
    model.distanceProperty.value = 1;
    expect(1 / model.probabilityProperty.value).toBeCloseTo(214, -1);
  });

  it("the window clock wraps, and the sample count matches the transit test", () => {
    const model = new LiningUpModel();
    model.advance(0.75);
    expect(model.windowTimeProperty.value).toBeCloseTo(0.25, 12);
    model.advance(0.5);
    expect(model.windowTimeProperty.value).toBeCloseTo(-0.25, 12);
    expect(model.sample).toHaveLength(SAMPLE_SIZE);
    const manual = model.sample.filter((s) => model.sampleTransits(s)).length;
    expect(model.transitingCount()).toBe(manual);
    model.distanceProperty.value = 0.01;
    expect(model.transitingCount()).toBeGreaterThanOrEqual(manual);
  });
});

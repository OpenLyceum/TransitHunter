/**
 * Checks for LiningUpModel: the tilt limit, durations, the clock (transit window
 * plus fast-forward) and the random sample.
 */

import { describe, expect, it } from "vitest";
import { PlanetPreset } from "../src/common/model/PlanetPreset.js";
import {
  LINING_UP_SECONDS_PER_REST,
  LINING_UP_SECONDS_PER_WINDOW,
  LiningUpModel,
  SAMPLE_SIZE,
} from "../src/lining-up/model/LiningUpModel.js";

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

  it("the clock crosses the window, fast-forwards round the orbit, and wraps", () => {
    const model = new LiningUpModel();
    const h = model.windowHalfWidthProperty.value;
    expect(model.phase()).toBeCloseTo(-h, 12);
    model.advance(LINING_UP_SECONDS_PER_WINDOW / 2);
    expect(model.windowTimeProperty.value).toBeCloseTo(0, 12);
    expect(model.phase()).toBeCloseTo(0, 12);
    expect(model.fastForwardingProperty.value).toBe(false);
    model.advance(LINING_UP_SECONDS_PER_WINDOW / 2 + LINING_UP_SECONDS_PER_REST / 2);
    expect(model.fastForwardingProperty.value).toBe(true);
    expect(model.windowTimeProperty.value).toBe(0.5);
    expect(model.phase()).toBeCloseTo(0.5, 12); // behind the star, half-way round
    expect(model.brightnessProperty.value).toBe(1);
    model.advance(LINING_UP_SECONDS_PER_REST / 2 + 1e-9); // past rounding at the wrap
    expect(model.fastForwardingProperty.value).toBe(false);
    expect(model.phase()).toBeCloseTo(-h, 6);
  });

  it("the orbital phase is continuous and increasing over a whole cycle", () => {
    for (const h of [0.005, 0.03, 0.2]) {
      let previous = LiningUpModel.orbitalPhase(0, h);
      for (let i = 1; i < 2000; i++) {
        const phase = LiningUpModel.orbitalPhase(i / 2000, h);
        expect(phase).toBeGreaterThan(previous);
        expect(phase - previous).toBeLessThan(0.01);
        previous = phase;
      }
      expect(previous).toBeCloseTo(1 - h, 2);
    }
  });

  it("the sample count matches the transit test", () => {
    const model = new LiningUpModel();
    expect(model.sample).toHaveLength(SAMPLE_SIZE);
    const manual = model.sample.filter((s) => model.sampleTransits(s)).length;
    expect(model.transitingCount()).toBe(manual);
    model.distanceProperty.value = 0.01;
    expect(model.transitingCount()).toBeGreaterThanOrEqual(manual);
  });
});

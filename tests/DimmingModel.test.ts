/**
 * Checks for DimmingModel: depths of the presets, the light-curve sweep, and
 * moving the planet by hand.
 */

import { describe, expect, it } from "vitest";
import { PlanetPreset } from "../src/common/model/PlanetPreset.js";
import { StarPreset } from "../src/common/model/StarPreset.js";
import { DimmingModel, TRACE_ORBITS } from "../src/dimming/model/DimmingModel.js";

describe("DimmingModel", () => {
  it("Jupiter blocks about 1.06 % of a Sun-like star; Earth 25 × more of a red dwarf than of the Sun", () => {
    const model = new DimmingModel();
    expect(model.maxBlockedFractionProperty.value).toBeCloseTo(0.0106, 3);
    model.planetPresetProperty.value = PlanetPreset.EARTH;
    const sun = model.maxBlockedFractionProperty.value;
    model.starPresetProperty.value = StarPreset.RED_DWARF;
    expect(model.maxBlockedFractionProperty.value / sun).toBeCloseTo(25, 6);
  });

  it("dims only while the planet is in front, and drags keep the orbit count", () => {
    const model = new DimmingModel();
    model.advance(3); // phase 2.75
    model.setSkyX(0);
    expect(model.phaseProperty.value).toBeCloseTo(3, 12);
    expect(model.brightnessProperty.value).toBeCloseTo(1 - model.maxBlockedFractionProperty.value, 12);
    model.setSkyX(2);
    expect(model.brightnessProperty.value).toBe(1);
  });

  it("the sweep restarts half an orbit before a transit and never scrolls", () => {
    const model = new DimmingModel();
    expect(model.sweepStartProperty.value).toBe(-0.5);
    model.advance(TRACE_ORBITS + 0.1);
    expect(model.sweepStartProperty.value).toBe(1.5);
    const samples = model.traceSamples();
    expect(samples[0]?.x).toBe(0);
    expect(samples[samples.length - 1]?.x).toBeCloseTo(model.phaseProperty.value - 1.5, 12);
  });

  it("does not advance while paused or dragged, and resets", () => {
    const model = new DimmingModel();
    model.step(1);
    const phase = model.phaseProperty.value;
    model.isDraggingProperty.value = true;
    model.step(1);
    expect(model.phaseProperty.value).toBe(phase);
    model.reset();
    expect(model.phaseProperty.value).toBe(-0.25);
    expect(model.planetPresetProperty.value).toBe(PlanetPreset.JUPITER);
  });
});

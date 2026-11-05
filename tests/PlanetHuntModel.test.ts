/**
 * Checks for PlanetHuntModel: loading real light curves, marks → period, the
 * archive ephemeris, and the radius from the depth line.
 */

import { describe, expect, it } from "vitest";
import { HuntTarget } from "../src/hunt/model/HuntTarget.js";
import { MAX_MARKS, PlanetHuntModel } from "../src/hunt/model/PlanetHuntModel.js";

/** Waits until the model's light curve has loaded. */
async function loaded(model: PlanetHuntModel): Promise<void> {
  for (let i = 0; i < 200 && !model.lightCurveProperty.value; i++) {
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  expect(model.lightCurveProperty.value).not.toBeNull();
}

describe("PlanetHuntModel", () => {
  it("loads the selected star and ignores a load overtaken by another choice", async () => {
    const model = new PlanetHuntModel();
    model.targetProperty.value = HuntTarget.KEPLER_22;
    model.targetProperty.value = HuntTarget.KEPLER_10;
    await loaded(model);
    expect(model.lightCurveProperty.value?.file.id).toBe("kepler10");
    expect(model.planetsProperty.value.map((p) => p.name)).toEqual(["Kepler-10 b", "Kepler-10 c"]);
  });

  it("turns mark spacing into a period, keeping the first mark as the reference transit", () => {
    const model = new PlanetHuntModel();
    model.addMark(5.2);
    expect(model.markSpacing()).toBeNull();
    model.addMark(9.6);
    model.addMark(7.4);
    expect(model.markSpacing()).toBeCloseTo(2.2, 12);
    model.useMarkSpacing();
    expect(model.periodProperty.value).toBeCloseTo(2.2, 12);
    expect(model.phaseOf(5.2)).toBeCloseTo(0, 12);
    for (let i = 0; i < MAX_MARKS + 3; i++) {
      model.addMark(i);
    }
    expect(model.marks.length).toBe(MAX_MARKS);
  });

  it("the archive ephemeris puts HD 189733 b's transits at phase 0", async () => {
    const model = new PlanetHuntModel();
    await loaded(model);
    const planet = model.planetsProperty.value[0]!;
    model.useArchiveEphemeris(planet);
    const curve = model.lightCurveProperty.value!;
    const predicted = planet.transitMidBjd - curve.zeroBjd + 3 * planet.periodDays;
    expect(Math.abs(model.phaseOf(predicted))).toBeLessThan(1e-9);
  });

  it("a 2.4 % depth line around HD 189733 (0.75 R☉) means a planet of about 12.7 R⊕", async () => {
    const model = new PlanetHuntModel();
    await loaded(model);
    model.depthProperty.value = 2.4;
    expect(model.inferredRadiusProperty.value).toBeCloseTo(12.7, 0);
    model.foldProperty.value = true;
    model.reset();
    expect(model.foldProperty.value).toBe(false);
    expect(model.targetProperty.value).toBe(HuntTarget.HD_189733);
  });
});

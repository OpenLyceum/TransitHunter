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

  it("turns mark spacing into a period, with the marks' fitted transit as the reference", () => {
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

  it("allows for HD 189733 b's transit lost in the TESS mid-sector gap", () => {
    // The visible dips (days since the start of the data); the one at 12.95 d falls in the gap.
    const model = new PlanetHuntModel();
    for (const time of [4.07, 6.29, 8.51, 10.73, 15.16, 17.38, 19.6, 21.82]) {
      model.addMark(time);
    }
    // Plain averaging gave 2.54 days here.
    expect(model.markSpacing()).toBeCloseTo(2.2186, 2);
  });

  it("the period search finds HD 189733 b and folds on it", async () => {
    const model = new PlanetHuntModel();
    await loaded(model);
    expect(model.search).toBeNull();
    model.showSearchProperty.value = true;
    expect(model.search).not.toBeNull();
    for (let i = 0; i < 1000 && !model.search?.done; i++) {
      model.step(1 / 60);
    }
    expect(model.searchProgressProperty.value).toBe(1);
    model.useSearchPeak();
    const planet = model.planetsProperty.value[0]!;
    expect(model.periodProperty.value).toBeCloseTo(planet.periodDays, 2);
    expect(model.foldProperty.value).toBe(true);
    expect(model.showSearchProperty.value).toBe(false);
    // The fold is centred on the transits: a transit the archive predicts inside the data lands near
    // phase 0. (The archive's reference transit is from 2006; carried over ~2250 orbits with the search's
    // period it would drift, so take the first predicted transit of the data.)
    const curve = model.lightCurveProperty.value!;
    const firstTransit =
      (((planet.transitMidBjd - curve.zeroBjd) % planet.periodDays) + planet.periodDays) % planet.periodDays;
    const predicted = firstTransit + 5 * planet.periodDays;
    expect(Math.abs(model.phaseOf(predicted))).toBeLessThan(0.01);
    // The far side is half an orbit away.
    model.farSideProperty.value = true;
    expect(Math.abs(Math.abs(model.phaseOf(predicted)) - 0.5)).toBeLessThan(0.01);
  });

  it("drops the period search when the star changes", async () => {
    const model = new PlanetHuntModel();
    await loaded(model);
    model.startSearch();
    expect(model.search).not.toBeNull();
    model.targetProperty.value = HuntTarget.KEPLER_7;
    expect(model.search).toBeNull();
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

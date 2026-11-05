/**
 * Checks for orbitPhysics.ts: Kepler's third law and masses from the wobble.
 */

import { describe, expect, it } from "vitest";
import {
  orbitalPeriod,
  planetMassFromWobble,
  semiAmplitudeFromPeriod,
  semiMajorAxis,
} from "../src/common/model/orbitPhysics.js";
import { AU_M, DAY_S, EARTH_MASS_KG, JUPITER_MASS_KG, SUN_MASS_KG } from "../src/TransitHunterConstants.js";

const EDGE_ON = Math.PI / 2;

describe("orbitPhysics", () => {
  it("Kepler's third law both ways: Earth has a one-year period at 1 AU", () => {
    const year = orbitalPeriod(SUN_MASS_KG, EARTH_MASS_KG, AU_M);
    expect(year / (365.25 * DAY_S)).toBeCloseTo(1, 2);
    expect(semiMajorAxis(SUN_MASS_KG, EARTH_MASS_KG, year) / AU_M).toBeCloseTo(1, 10);
  });

  it("inverts K: the wobble of Jupiter gives back Jupiter's mass", () => {
    const period = 4332.6 * DAY_S;
    const k = semiAmplitudeFromPeriod(SUN_MASS_KG, JUPITER_MASS_KG, period, EDGE_ON);
    expect(k).toBeCloseTo(12.5, 0);
    expect(planetMassFromWobble(k, period, SUN_MASS_KG) / JUPITER_MASS_KG).toBeCloseTo(1, 6);
  });

  it("a tilted orbit needs a heavier planet for the same wobble", () => {
    const period = 3.5 * DAY_S;
    const edgeOn = planetMassFromWobble(85, period, 1.2 * SUN_MASS_KG);
    const tilted = planetMassFromWobble(85, period, 1.2 * SUN_MASS_KG, Math.PI / 6);
    expect(tilted / edgeOn).toBeCloseTo(2, 2);
    expect(planetMassFromWobble(0, period, SUN_MASS_KG)).toBe(0);
  });

  it("HD 209458 b: K = 84.7 m/s, P = 3.525 d, M★ = 1.23 M☉, i = 86.7° gives about 0.73 M_J", () => {
    const mass = planetMassFromWobble(84.7, 3.52474859 * DAY_S, 1.23 * SUN_MASS_KG, (86.71 * Math.PI) / 180);
    expect(mass / JUPITER_MASS_KG).toBeCloseTo(0.73, 1);
  });
});

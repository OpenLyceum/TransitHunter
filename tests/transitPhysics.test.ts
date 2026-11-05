/**
 * Physics checks for transitPhysics.ts against known systems and limiting cases.
 */

import { describe, expect, it } from "vitest";
import {
  blockedFraction,
  circleOverlapArea,
  fullDurationFraction,
  impactParameter,
  radiusFromDepth,
  relativeFlux,
  SUN_LIKE_LIMB_DARKENING,
  skyPosition,
  type TransitGeometry,
  totalDiskFlux,
  totalDurationFraction,
  transitProbability,
  transits,
  UNIFORM_DISK,
  uniformDepth,
} from "../src/common/model/transitPhysics.js";
import { AU_M, EARTH_RADIUS_M, JUPITER_RADIUS_M, SUN_RADIUS_M } from "../src/TransitHunterConstants.js";

const EDGE_ON = Math.PI / 2;
const DEG = Math.PI / 180;

describe("circleOverlapArea", () => {
  it("is zero apart, the small disk's area when nested, and symmetric", () => {
    expect(circleOverlapArea(1, 0.1, 1.2)).toBe(0);
    expect(circleOverlapArea(1, 0.1, 0.5)).toBeCloseTo(Math.PI * 0.01, 12);
    expect(circleOverlapArea(1, 0.3, 1.1)).toBeCloseTo(circleOverlapArea(0.3, 1, 1.1), 12);
  });

  it("gives half the small disk when its centre sits on a much larger disk's edge", () => {
    expect(circleOverlapArea(1000, 1, 1000) / Math.PI).toBeCloseTo(0.5, 3);
  });
});

describe("blockedFraction", () => {
  it("Jupiter in front of the Sun blocks about 1 %, Earth about 84 ppm", () => {
    expect(uniformDepth(JUPITER_RADIUS_M / SUN_RADIUS_M)).toBeCloseTo(0.01056, 4);
    expect(uniformDepth(EARTH_RADIUS_M / SUN_RADIUS_M) * 1e6).toBeCloseTo(83.9, 0);
  });

  it("the ring integration matches the exact overlap for a uniform disk", () => {
    const uniformByRings = (k: number, z: number): number => {
      // Integrate with a tiny limb darkening and compare against the exact formula.
      const tiny = { u1: 1e-9, u2: 0 };
      return blockedFraction(k, z, tiny);
    };
    for (const [k, z] of [
      [0.1, 0],
      [0.1, 0.5],
      [0.1, 0.95],
      [0.1, 1.05],
      [0.3, 0.8],
    ] as const) {
      expect(uniformByRings(k, z)).toBeCloseTo(blockedFraction(k, z, UNIFORM_DISK), 4);
    }
  });

  it("limb darkening makes a central transit deeper and an edge transit shallower", () => {
    const k = 0.1;
    expect(blockedFraction(k, 0, SUN_LIKE_LIMB_DARKENING)).toBeGreaterThan(uniformDepth(k));
    expect(blockedFraction(k, 0.9, SUN_LIKE_LIMB_DARKENING)).toBeLessThan(blockedFraction(k, 0.9, UNIFORM_DISK));
  });

  it("a planet as large as the star centred on it blocks all the light", () => {
    expect(blockedFraction(1, 0, SUN_LIKE_LIMB_DARKENING)).toBeCloseTo(1, 3);
    expect(totalDiskFlux(UNIFORM_DISK)).toBeCloseTo(Math.PI, 12);
  });
});

describe("transit geometry", () => {
  const hotJupiter: TransitGeometry = {
    radiusRatio: 0.1,
    orbitInStarRadii: 10,
    inclinationRad: EDGE_ON,
    limbDarkening: UNIFORM_DISK,
  };

  it("dims only while the planet is in front", () => {
    expect(relativeFlux(0, hotJupiter)).toBeCloseTo(0.99, 10);
    expect(relativeFlux(0.5, hotJupiter)).toBe(1);
    expect(relativeFlux(0.25, hotJupiter)).toBe(1);
    expect(skyPosition(0.5, hotJupiter).inFront).toBe(false);
  });

  it("misses the star once b exceeds 1 + k", () => {
    const missI = Math.acos(1.2 / hotJupiter.orbitInStarRadii);
    const missing = { ...hotJupiter, inclinationRad: missI };
    expect(impactParameter(10, missI)).toBeCloseTo(1.2, 10);
    expect(transits(missing)).toBe(false);
    expect(relativeFlux(0, missing)).toBe(1);
    expect(totalDurationFraction(missing)).toBe(0);
  });

  it("a grazing transit has no flat bottom", () => {
    const grazing = { ...hotJupiter, inclinationRad: Math.acos(1.0 / 10) };
    expect(transits(grazing)).toBe(true);
    expect(totalDurationFraction(grazing)).toBeGreaterThan(0);
    expect(fullDurationFraction(grazing)).toBe(0);
  });

  it("HD 209458 b lasts about 3 hours", () => {
    // Archive: P = 3.5247 d, a = 0.04707 AU, R★ = 1.19 R☉, Rp = 15.58 R⊕, i = 86.71°, T14 = 3.07 h.
    const geometry = {
      radiusRatio: (15.58 * EARTH_RADIUS_M) / (1.19 * SUN_RADIUS_M),
      orbitInStarRadii: (0.04707 * AU_M) / (1.19 * SUN_RADIUS_M),
      inclinationRad: 86.71 * DEG,
    };
    const hours = totalDurationFraction(geometry) * 3.52474859 * 24;
    expect(hours).toBeGreaterThan(2.9);
    expect(hours).toBeLessThan(3.3);
  });

  it("Earth transits for 0.47 % of random observers and its transit lasts about 13 hours", () => {
    const k = EARTH_RADIUS_M / SUN_RADIUS_M;
    const aR = AU_M / SUN_RADIUS_M;
    expect(transitProbability(k, aR) * 100).toBeCloseTo(0.47, 2);
    const hours =
      totalDurationFraction({ radiusRatio: k, orbitInStarRadii: aR, inclinationRad: EDGE_ON }) * 365.25 * 24;
    expect(hours).toBeCloseTo(13, 0);
  });

  it("recovers the radius from the depth", () => {
    expect(radiusFromDepth(0.01, 1)).toBeCloseTo(0.1, 12);
    expect(radiusFromDepth(-1, 1)).toBe(0);
  });
});

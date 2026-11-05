/**
 * Checks the bundled real data: every Planet Hunt light curve, folded at the
 * archive period, shows a dip whose depth gives back the archive radius; and
 * the Rock or Gas? planets have the densities their kinds imply.
 */

import { describe, expect, it } from "vitest";
import { archivePlanet } from "../src/common/model/archive.js";
import { density, planetKind } from "../src/common/model/composition.js";
import { foldedPhase } from "../src/common/model/lightCurveTools.js";
import { radiusFromDepth } from "../src/common/model/transitPhysics.js";
import { LIGHT_CURVE_IDS, loadLightCurve } from "../src/hunt/model/LightCurveData.js";

const SUN_RADIUS_IN_EARTH_RADII = 109.1;

/** Median of the brightness within ±(fraction × duration) of mid-transit. */
function centralDepth(
  times: Float64Array,
  brightness: Float64Array,
  zeroBjd: number,
  name: string,
  fraction: number,
): number {
  const planet = archivePlanet(name);
  const halfWindow = (fraction * planet.durationHours!) / 24 / planet.periodDays;
  const reference = planet.transitMidBjd - zeroBjd;
  const inTransit: number[] = [];
  times.forEach((t, i) => {
    if (Math.abs(foldedPhase(t, planet.periodDays, reference)) < halfWindow) {
      inTransit.push(brightness[i]!);
    }
  });
  inTransit.sort((a, b) => a - b);
  return 1 - inTransit[Math.floor(inTransit.length / 2)]!;
}

describe("real light curves", () => {
  it("bundles seven targets", () => {
    expect(LIGHT_CURVE_IDS).toHaveLength(7);
  });

  for (const id of LIGHT_CURVE_IDS) {
    it(`${id}: folding at the archive period recovers the archive radius within 15 %`, async () => {
      const curve = await loadLightCurve(id);
      const name = curve.file.planets[0]!;
      const planet = archivePlanet(name);
      const depth = centralDepth(curve.times, curve.brightness, curve.zeroBjd, name, 0.2);
      const radius = radiusFromDepth(depth, planet.starRadiusSun * SUN_RADIUS_IN_EARTH_RADII);
      expect(radius / planet.radiusEarth).toBeGreaterThan(0.85);
      expect(radius / planet.radiusEarth).toBeLessThan(1.15);
    });
  }
});

describe("Rock or Gas? planets", () => {
  it("Kepler-10 b is dense and rocky, Kepler-7 b is puffier than Saturn", () => {
    const k10 = archivePlanet("Kepler-10 b");
    const k7 = archivePlanet("Kepler-7 b");
    expect(density(k10.massEarth, k10.radiusEarth)).toBeGreaterThan(5);
    expect(density(k10.massEarth, k10.radiusEarth)).toBeLessThan(9);
    expect(planetKind(k10.massEarth, k10.radiusEarth)).toBe("rocky");
    expect(density(k7.massEarth, k7.radiusEarth)).toBeLessThan(0.3);
    expect(planetKind(k7.massEarth, k7.radiusEarth)).toBe("giant");
  });

  it("GJ 1214 b is in between", () => {
    const p = archivePlanet("GJ 1214 b");
    expect(planetKind(p.massEarth, p.radiusEarth)).toBe("inBetween");
  });
});

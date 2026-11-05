/**
 * Checks for composition.ts: densities and the rocky mass–radius relation.
 */

import { describe, expect, it } from "vitest";
import {
  constantDensityRadius,
  density,
  planetKind,
  rockyRadius,
  SOLAR_SYSTEM_PLANETS,
} from "../src/common/model/composition.js";

describe("composition", () => {
  it("gives the Solar System densities (Saturn floats on water)", () => {
    const rho = (key: string): number => {
      const p = SOLAR_SYSTEM_PLANETS.find((q) => q.key === key)!;
      return density(p.massEarth, p.radiusEarth);
    };
    expect(rho("earth")).toBeCloseTo(5.51, 2);
    expect(rho("jupiter")).toBeCloseTo(1.25, 1);
    expect(rho("saturn")).toBeLessThan(1);
  });

  it("an Earth-like rocky planet of 1 M⊕ is 1 R⊕; iron is smaller, pure rock larger", () => {
    expect(rockyRadius(1)).toBeCloseTo(1.0, 2);
    expect(rockyRadius(5, 1)).toBeLessThan(rockyRadius(5));
    expect(rockyRadius(5, 0)).toBeGreaterThan(rockyRadius(5));
  });

  it("constant-density radius inverts density()", () => {
    expect(density(10, constantDensityRadius(10, 2))).toBeCloseTo(2, 10);
  });

  it("classifies Earth, Neptune and Jupiter", () => {
    expect(planetKind(1, 1)).toBe("rocky");
    expect(planetKind(17.1, 3.88)).toBe("inBetween");
    expect(planetKind(317.8, 11.21)).toBe("giant");
  });
});

import { describe, expect, it } from "vitest";
import { ironRadius } from "../src/common/model/composition.js";

describe("pure-iron numerical radius", () => {
  it("matches independent published interior-model rows", () => {
    expect(ironRadius(1.0371)).toBeCloseTo(0.831, 10);
    expect(ironRadius(28.0181)).toBeCloseTo(1.7747, 10);
    expect(ironRadius(127.3145)).toBeCloseTo(2.2361, 10);
  });
  it("interpolates continuously in log space without extrapolating", () => {
    expect(ironRadius(Math.sqrt(0.8212 * 1.0371))).toBeCloseTo(Math.sqrt(0.7789 * 0.831), 10);
    expect(Number.isNaN(ironRadius(0))).toBe(true);
    expect(Number.isNaN(ironRadius(200))).toBe(true);
  });
});

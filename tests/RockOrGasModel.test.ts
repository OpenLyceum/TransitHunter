/**
 * Checks for RockOrGasModel: true masses from the wobble agree with the archive,
 * and each planet lands in the expected kind.
 */

import { describe, expect, it } from "vitest";
import { archivePlanet } from "../src/common/model/archive.js";
import { CompositionPlanet } from "../src/composition/model/CompositionPlanet.js";
import { RockOrGasModel, wobbleMass } from "../src/composition/model/RockOrGasModel.js";

describe("RockOrGasModel", () => {
  it("the wobble gives each planet's archive mass within 1 %, and the minimum mass is a little smaller", () => {
    for (const value of CompositionPlanet.enumeration.values) {
      const planet = archivePlanet(value.archiveName);
      const mass = wobbleMass(planet);
      expect(Math.abs(mass.trueMass / planet.massEarth - 1)).toBeLessThan(0.01);
      if (mass.fromWobble) {
        expect(mass.minimum!).toBeLessThan(mass.trueMass);
        expect(mass.minimum! / mass.trueMass).toBeGreaterThan(0.99);
      }
    }
  });

  it("TRAPPIST-1 e's mass comes from transit timing, not the wobble", () => {
    expect(wobbleMass(archivePlanet("TRAPPIST-1 e")).fromWobble).toBe(false);
  });

  it("classifies the planets: giants float or nearly, Kepler-10 b is rocky, GJ 1214 b in between", () => {
    const model = new RockOrGasModel();
    const kindOf = (planet: CompositionPlanet): string => {
      model.planetProperty.value = planet;
      return model.kindProperty.value;
    };
    expect(kindOf(CompositionPlanet.KEPLER_7_B)).toBe("giant");
    expect(model.densityProperty.value).toBeLessThan(0.2);
    expect(kindOf(CompositionPlanet.KEPLER_10_B)).toBe("rocky");
    expect(kindOf(CompositionPlanet.CANCRI_55_E)).toBe("rocky");
    expect(kindOf(CompositionPlanet.GJ_1214_B)).toBe("inBetween");
    expect(kindOf(CompositionPlanet.TRAPPIST_1_E)).toBe("rocky");
    model.reset();
    expect(model.planetProperty.value).toBe(CompositionPlanet.HD_209458_B);
  });
});

/**
 * RockOrGasModel.ts
 *
 * The Rock or Gas? screen: the transit gives a planet's radius and tells us the
 * orbit is seen edge-on; the star's wobble then gives the planet's true mass,
 * not just a minimum. Mass and radius together give the density, which says
 * whether the planet is rock, gas, or something in between.
 *
 * The mass is computed here from the archive's wobble amplitude K, period, star
 * mass and inclination (as an astronomer would), so the steps on screen are the
 * real ones; it agrees with the archive's mass to better than 1 %.
 */

import { DerivedProperty, EnumerationProperty, type TReadOnlyProperty } from "scenerystack/axon";
import type { TModel } from "scenerystack/joist";
import { type ArchivePlanet, archivePlanet } from "../../common/model/archive.js";
import { density, type PlanetKind, planetKind } from "../../common/model/composition.js";
import { planetMassFromWobble } from "../../common/model/orbitPhysics.js";
import { DAY_S, EARTH_MASS_KG, SUN_MASS_KG } from "../../TransitHunterConstants.js";
import { CompositionPlanet } from "./CompositionPlanet.js";

const DEG = Math.PI / 180;

/** What the wobble says about a planet's mass, Earth masses. */
export type WobbleMass = {
  /** Minimum mass M sin i (radial velocity alone), or null without a measured wobble. */
  readonly minimum: number | null;
  /** True mass, using the transit's inclination (or the archive's mass without a wobble). */
  readonly trueMass: number;
  /** Whether the mass comes from the wobble (false: transit-timing variations). */
  readonly fromWobble: boolean;
};

/** The mass a planet's wobble implies, Earth masses. */
export function wobbleMass(planet: ArchivePlanet): WobbleMass {
  if (planet.rvAmplitude === null) {
    return { minimum: null, trueMass: planet.massEarth, fromWobble: false };
  }
  const period = planet.periodDays * DAY_S;
  const starMass = planet.starMassSun * SUN_MASS_KG;
  const inclination = (planet.inclinationDeg ?? 90) * DEG;
  return {
    minimum: planetMassFromWobble(planet.rvAmplitude, period, starMass) / EARTH_MASS_KG,
    trueMass: planetMassFromWobble(planet.rvAmplitude, period, starMass, inclination) / EARTH_MASS_KG,
    fromWobble: true,
  };
}

export class RockOrGasModel implements TModel {
  public readonly planetProperty = new EnumerationProperty(CompositionPlanet.HD_209458_B);

  /** The selected planet's archive entry. */
  public readonly archiveProperty: TReadOnlyProperty<ArchivePlanet>;

  public readonly massProperty: TReadOnlyProperty<WobbleMass>;

  /** Mean density, g/cm³. */
  public readonly densityProperty: TReadOnlyProperty<number>;

  public readonly kindProperty: TReadOnlyProperty<PlanetKind>;

  public constructor() {
    this.archiveProperty = new DerivedProperty([this.planetProperty], (planet) => archivePlanet(planet.archiveName));
    this.massProperty = new DerivedProperty([this.archiveProperty], wobbleMass);
    this.densityProperty = new DerivedProperty([this.massProperty, this.archiveProperty], (mass, planet) =>
      density(mass.trueMass, planet.radiusEarth),
    );
    this.kindProperty = new DerivedProperty([this.massProperty, this.archiveProperty], (mass, planet) =>
      planetKind(mass.trueMass, planet.radiusEarth),
    );
  }

  public reset(): void {
    this.planetProperty.reset();
  }

  public step(_dt: number): void {
    // Nothing moves on this screen.
  }
}

/**
 * composition.ts
 *
 * Turning a planet's mass and radius into a density and a rough idea of what it
 * is made of, plus the Solar System planets for comparison. Masses and radii
 * are in Earth units.
 */

import { EARTH_DENSITY_G_CM3 } from "../../TransitHunterConstants.js";

/** Mean density, g/cm³: ρ = ρ⊕ · M / R³ (Earth units). */
export function density(massEarth: number, radiusEarth: number): number {
  return (EARTH_DENSITY_G_CM3 * massEarth) / radiusEarth ** 3;
}

/** Radius (Earth radii) of a ball of this mass (Earth masses) and constant density (g/cm³). */
export function constantDensityRadius(massEarth: number, densityGcm3: number): number {
  return ((EARTH_DENSITY_G_CM3 * massEarth) / densityGcm3) ** (1 / 3);
}

/** Core mass fraction of an Earth-like rocky planet (Zeng, Sasselov & Jacobsen 2016). */
export const EARTH_LIKE_CORE_MASS_FRACTION = 0.325;

/**
 * Radius (Earth radii) of a rocky planet of this mass (Earth masses) and core
 * mass fraction: R = (1.07 − 0.21 CMF) M^{1/3.7} (Zeng, Sasselov & Jacobsen
 * 2016, ApJ 819, 127; fitted for about 1–8 M⊕ and still close up to ~20 M⊕).
 * CMF = 0 is pure rock, 0.325 Earth-like, 1 pure iron.
 */
export function rockyRadius(massEarth: number, coreMassFraction = EARTH_LIKE_CORE_MASS_FRACTION): number {
  return (1.07 - 0.21 * coreMassFraction) * massEarth ** (1 / 3.7);
}

/** Broad kinds of planet a beginner can place a mass and radius into. */
export type PlanetKind = "rocky" | "inBetween" | "giant";

/** Radius above which a planet is called a giant, Earth radii (about 0.5 R_J). */
export const GIANT_RADIUS_EARTH = 6;

/**
 * Classifies a planet: "rocky" if it is no bigger than a rocky planet of its mass
 * would be (10 % margin for measurement error), "giant" above ~6 R⊕, otherwise
 * "in between" (rock with a thick layer of water or gas, like a sub-Neptune).
 */
export function planetKind(massEarth: number, radiusEarth: number): PlanetKind {
  if (radiusEarth >= GIANT_RADIUS_EARTH) {
    return "giant";
  }
  return radiusEarth <= 1.1 * rockyRadius(massEarth, 0) ? "rocky" : "inBetween";
}

/** A Solar System planet, Earth units (NASA planetary fact sheet). */
export type SolarSystemPlanet = {
  readonly key: "mercury" | "venus" | "earth" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune";
  readonly massEarth: number;
  readonly radiusEarth: number;
};

export const SOLAR_SYSTEM_PLANETS: readonly SolarSystemPlanet[] = [
  { key: "mercury", massEarth: 0.0553, radiusEarth: 0.383 },
  { key: "venus", massEarth: 0.815, radiusEarth: 0.949 },
  { key: "earth", massEarth: 1, radiusEarth: 1 },
  { key: "mars", massEarth: 0.107, radiusEarth: 0.532 },
  { key: "jupiter", massEarth: 317.8, radiusEarth: 11.21 },
  { key: "saturn", massEarth: 95.2, radiusEarth: 9.45 },
  { key: "uranus", massEarth: 14.5, radiusEarth: 4.01 },
  { key: "neptune", massEarth: 17.1, radiusEarth: 3.88 },
];

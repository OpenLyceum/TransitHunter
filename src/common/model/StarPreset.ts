/**
 * StarPreset.ts
 *
 * The stars a beginner can choose: one like the Sun, a small cool red dwarf
 * (about the size of Proxima Centauri or GJ 1214), and a big hot star (about
 * the size and temperature of HAT-P-7, a Planet Hunt target).
 */

import { Range } from "scenerystack/dot";
import { Enumeration, EnumerationValue } from "scenerystack/phet-core";
import {
  AU_M,
  EARTH_RADIUS_M,
  MAX_RADIUS_RATIO,
  MIN_ORBIT_IN_STAR_RADII,
  SUN_RADIUS_M,
  SUN_TEMPERATURE_K,
} from "../../TransitHunterConstants.js";

export class StarPreset extends EnumerationValue {
  public static readonly SUN_LIKE = new StarPreset(1, 1, SUN_TEMPERATURE_K);
  public static readonly RED_DWARF = new StarPreset(0.2, 0.2, 3100);
  public static readonly BIG_STAR = new StarPreset(2, 1.5, 6400);

  public static readonly enumeration = new Enumeration(StarPreset);

  /** Radius, solar radii. */
  public readonly radiusSun: number;

  /** Mass, solar masses (sets the period at a given distance). */
  public readonly massSun: number;

  /** Effective temperature, K (sets the colour). */
  public readonly temperatureK: number;

  /** Largest planet allowed around this star, Earth radii (MAX_RADIUS_RATIO of its radius). */
  public readonly maxPlanetRadiusEarth: number;

  /** Closest orbit allowed around this star, AU (MIN_ORBIT_IN_STAR_RADII of its radius). */
  public readonly minDistanceAu: number;

  public constructor(radiusSun: number, massSun: number, temperatureK: number) {
    super();
    this.radiusSun = radiusSun;
    this.massSun = massSun;
    this.temperatureK = temperatureK;
    this.maxPlanetRadiusEarth = (MAX_RADIUS_RATIO * radiusSun * SUN_RADIUS_M) / EARTH_RADIUS_M;
    this.minDistanceAu = (MIN_ORBIT_IN_STAR_RADII * radiusSun * SUN_RADIUS_M) / AU_M;
  }

  /** The part of a planet-radius range (Earth radii) allowed around this star. */
  public planetRadiusRange(range: Range): Range {
    return new Range(range.min, Math.max(range.min, Math.min(range.max, this.maxPlanetRadiusEarth)));
  }

  /** The part of a distance range (AU) allowed around this star. */
  public distanceRange(range: Range): Range {
    return new Range(Math.min(range.max, Math.max(range.min, this.minDistanceAu)), range.max);
  }
}

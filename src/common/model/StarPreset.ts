/**
 * StarPreset.ts
 *
 * The stars a beginner can choose: one like the Sun, a small cool red dwarf
 * (about the size of Proxima Centauri or GJ 1214), and a big hot star (about
 * the size and temperature of HAT-P-7, a Planet Hunt target).
 */

import { Enumeration, EnumerationValue } from "scenerystack/phet-core";
import { SUN_TEMPERATURE_K } from "../../TransitHunterConstants.js";

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

  public constructor(radiusSun: number, massSun: number, temperatureK: number) {
    super();
    this.radiusSun = radiusSun;
    this.massSun = massSun;
    this.temperatureK = temperatureK;
  }
}

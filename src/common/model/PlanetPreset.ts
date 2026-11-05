/**
 * PlanetPreset.ts
 *
 * The planets a beginner can choose: Earth, Neptune and Jupiter (radii from the
 * NASA planetary fact sheet), or a planet of any size.
 */

import { Enumeration, EnumerationValue } from "scenerystack/phet-core";

export class PlanetPreset extends EnumerationValue {
  public static readonly EARTH = new PlanetPreset(1);
  public static readonly NEPTUNE = new PlanetPreset(3.883);
  public static readonly JUPITER = new PlanetPreset(11.21);
  /** Any size, set with a slider (the radius here is the slider's starting value). */
  public static readonly CUSTOM = new PlanetPreset(5);

  public static readonly enumeration = new Enumeration(PlanetPreset);

  /** Radius, Earth radii. */
  public readonly radiusEarth: number;

  public constructor(radiusEarth: number) {
    super();
    this.radiusEarth = radiusEarth;
  }
}

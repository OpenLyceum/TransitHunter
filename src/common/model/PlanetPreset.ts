/**
 * PlanetPreset.ts
 *
 * The planet sizes a beginner can choose: planets around a distant star the size
 * of Earth, Neptune or Jupiter (radii from the NASA planetary fact sheet), or any
 * size. The views call them "Earth-sized" etc., never "Earth": the observer is on
 * Earth, and Jupiter is never seen to transit.
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

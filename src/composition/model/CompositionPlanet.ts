/**
 * CompositionPlanet.ts
 *
 * The real planets of the Rock or Gas? screen: each has a radius from its
 * transit and a mass, from the star's wobble (radial velocity) except for
 * TRAPPIST-1 e, whose wobble is too small to measure and whose mass comes from
 * transit-timing variations (its neighbours tug on it). Names are archive names
 * (proper nouns, not localized).
 */

import { Enumeration, EnumerationValue } from "scenerystack/phet-core";

export class CompositionPlanet extends EnumerationValue {
  /** A puffy hot Jupiter: the first planet seen to transit (2000). Also a StellarWobble target. */
  public static readonly HD_209458_B = new CompositionPlanet("HD 209458 b", true);

  /** A hot Jupiter about as dense as water. Also a StellarWobble target. */
  public static readonly HD_189733_B = new CompositionPlanet("HD 189733 b", true);

  /** One of the least dense planets known: like polystyrene foam. */
  public static readonly KEPLER_7_B = new CompositionPlanet("Kepler-7 b");

  /** A water world or mini-Neptune around a red dwarf. */
  public static readonly GJ_1214_B = new CompositionPlanet("GJ 1214 b");

  /** Kepler's first rocky planet. */
  public static readonly KEPLER_10_B = new CompositionPlanet("Kepler-10 b");

  /** A hot super-Earth around a nearby star visible to the naked eye. */
  public static readonly CANCRI_55_E = new CompositionPlanet("55 Cnc e");

  /** An Earth-sized planet in its red dwarf's habitable zone. */
  public static readonly TRAPPIST_1_E = new CompositionPlanet("TRAPPIST-1 e");

  public static readonly enumeration = new Enumeration(CompositionPlanet);

  /** NASA Exoplanet Archive name. */
  public readonly archiveName: string;

  /** Whether the star's wobble is also an Observatory target in the Stellar Wobble sim. */
  public readonly inStellarWobble: boolean;

  public constructor(archiveName: string, inStellarWobble = false) {
    super();
    this.archiveName = archiveName;
    this.inStellarWobble = inStellarWobble;
  }
}

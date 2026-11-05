/**
 * HuntTarget.ts
 *
 * The real stars of the Planet Hunt screen, easiest first. Each has a light
 * curve in data/<id>.json (Kepler or TESS) and its known planets in the archive
 * table.
 */

import { Enumeration, EnumerationValue } from "scenerystack/phet-core";

export type Difficulty = "easy" | "medium" | "hard" | "challenge";

export class HuntTarget extends EnumerationValue {
  /** A hot Jupiter around a nearby orange star: 2.4 % dips every 2.2 days (TESS). */
  public static readonly HD_189733 = new HuntTarget("hd189733", "HD 189733", "easy");

  /** The first planet seen to transit (2000): 1.5 % dips every 3.5 days (TESS). */
  public static readonly HD_209458 = new HuntTarget("hd209458", "HD 209458", "easy");

  /** A hot Jupiter around a big hot star: 0.6 % dips every 2.2 days (Kepler). */
  public static readonly HAT_P_7 = new HuntTarget("hatp7", "HAT-P-7", "easy");

  /** A puffy giant: 0.75 % dips every 4.9 days (Kepler). */
  public static readonly KEPLER_7 = new HuntTarget("kepler7", "Kepler-7", "medium");

  /** Kepler's first rocky planet, hidden in the noise until folded, plus a larger planet every 45 days. */
  public static readonly KEPLER_10 = new HuntTarget("kepler10", "Kepler-10", "hard");

  /** A planet in its star's habitable zone: only four dips in four years. */
  public static readonly KEPLER_22 = new HuntTarget("kepler22", "Kepler-22", "hard");

  /** Six planets crossing the same star. */
  public static readonly KEPLER_11 = new HuntTarget("kepler11", "Kepler-11", "challenge");

  public static readonly enumeration = new Enumeration(HuntTarget);

  /** Light-curve file id. */
  public readonly id: string;

  /** Star name (a proper noun, not localized). */
  public readonly starName: string;

  public readonly difficulty: Difficulty;

  public constructor(id: string, starName: string, difficulty: Difficulty) {
    super();
    this.id = id;
    this.starName = starName;
    this.difficulty = difficulty;
  }
}

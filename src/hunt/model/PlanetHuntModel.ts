/**
 * PlanetHuntModel.ts
 *
 * The Planet Hunt screen: find planets in real Kepler and TESS light curves.
 *
 * The user marks dips (their spacing suggests a period), folds the data on a
 * trial period and reference time, sets a depth line on the folded dip (which
 * gives the planet's size from the star's known radius), and can then reveal
 * the archive's answer.
 *
 * Light curves load on demand. While one loads `lightCurveProperty` is null;
 * a slow load that finishes after the user has picked another star is ignored.
 */

import {
  BooleanProperty,
  createObservableArray,
  DerivedProperty,
  EnumerationProperty,
  NumberProperty,
  type ObservableArray,
  Property,
  type TReadOnlyProperty,
} from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import { type ArchivePlanet, archivePlanet } from "../../common/model/archive.js";
import { foldedPhase } from "../../common/model/lightCurveTools.js";
import { radiusFromDepth } from "../../common/model/transitPhysics.js";
import { EARTH_RADIUS_M, SUN_RADIUS_M } from "../../TransitHunterConstants.js";
import { HuntTarget } from "./HuntTarget.js";
import { type LightCurve, loadLightCurve } from "./LightCurveData.js";

/** Trial-period range, days. */
export const HUNT_PERIOD_RANGE = new Range(0.3, 500);

/** Depth-line range, percent of the light. */
export const HUNT_DEPTH_RANGE = new Range(0.001, 5);

/** Most dip marks kept. */
export const MAX_MARKS = 8;

const DEFAULT_PERIOD = 2;
const DEFAULT_DEPTH = 0.5;

export class PlanetHuntModel implements TModel {
  public readonly targetProperty = new EnumerationProperty(HuntTarget.HD_189733);

  /** The selected star's light curve, or null while it loads. */
  public readonly lightCurveProperty = new Property<LightCurve | null>(null);

  /** Trial period, days. */
  public readonly periodProperty = new NumberProperty(DEFAULT_PERIOD, { range: HUNT_PERIOD_RANGE });

  /** Reference transit time as a fraction of the period, from the start of the data. */
  public readonly shiftProperty = new NumberProperty(0, { range: new Range(0, 1) });

  public readonly foldProperty = new BooleanProperty(false);

  /** The depth line on the folded chart, percent of the light. */
  public readonly depthProperty = new NumberProperty(DEFAULT_DEPTH, { range: HUNT_DEPTH_RANGE });

  /** Times of the user's dip marks, days since the start of the data. */
  public readonly marks: ObservableArray<number> = createObservableArray();

  /** Whether the archive's answer is shown. */
  public readonly revealProperty = new BooleanProperty(false);

  /** The selected star's known planets, from the archive. */
  public readonly planetsProperty: TReadOnlyProperty<readonly ArchivePlanet[]>;

  /** Planet radius implied by the depth line and the star's archive radius, Earth radii. */
  public readonly inferredRadiusProperty: TReadOnlyProperty<number>;

  private loadToken = 0;

  public constructor() {
    this.planetsProperty = new DerivedProperty([this.lightCurveProperty], (curve) =>
      curve ? curve.file.planets.map(archivePlanet) : [],
    );
    this.inferredRadiusProperty = new DerivedProperty([this.depthProperty, this.planetsProperty], (depth, planets) => {
      const star = planets[0];
      return star ? radiusFromDepth(depth / 100, (star.starRadiusSun * SUN_RADIUS_M) / EARTH_RADIUS_M) : 0;
    });
    this.targetProperty.link((target) => this.load(target));
  }

  /** Reference transit time, days since the start of the data. */
  public referenceTime(): number {
    return this.shiftProperty.value * this.periodProperty.value;
  }

  /** Folded phase (−0.5 … 0.5) of a time, days. */
  public phaseOf(time: number): number {
    return foldedPhase(time, this.periodProperty.value, this.referenceTime());
  }

  /** Adds a dip mark (the oldest goes once there are MAX_MARKS). */
  public addMark(time: number): void {
    if (this.marks.length >= MAX_MARKS) {
      this.marks.shift();
    }
    this.marks.push(time);
  }

  /**
   * Average spacing between neighbouring marks, days (null with fewer than two).
   * Marks a whole number of orbits apart with missed dips between them still
   * give the right period if the user marks every dip they see.
   */
  public markSpacing(): number | null {
    if (this.marks.length < 2) {
      return null;
    }
    const sorted = [...this.marks].sort((a, b) => a - b);
    return ((sorted[sorted.length - 1] ?? 0) - (sorted[0] ?? 0)) / (sorted.length - 1);
  }

  /** Uses the mark spacing as the trial period, with the first mark as the reference time. */
  public useMarkSpacing(): void {
    const spacing = this.markSpacing();
    if (spacing === null) {
      return;
    }
    const period = HUNT_PERIOD_RANGE.constrainValue(spacing);
    const first = Math.min(...this.marks);
    this.periodProperty.value = period;
    this.shiftProperty.value = (((first / period) % 1) + 1) % 1;
  }

  /** The archive's period and reference time for a planet of the selected star, in the sim's terms. */
  public useArchiveEphemeris(planet: ArchivePlanet): void {
    const curve = this.lightCurveProperty.value;
    if (!curve) {
      return;
    }
    this.periodProperty.value = HUNT_PERIOD_RANGE.constrainValue(planet.periodDays);
    const reference = planet.transitMidBjd - curve.zeroBjd;
    this.shiftProperty.value = (((reference / planet.periodDays) % 1) + 1) % 1;
  }

  private load(target: HuntTarget): void {
    const token = ++this.loadToken;
    this.lightCurveProperty.value = null;
    this.resetSearch();
    loadLightCurve(target.id)
      .then((curve) => {
        if (token === this.loadToken) {
          this.lightCurveProperty.value = curve;
        }
      })
      .catch((error: unknown) => {
        // A missing data file is a build error; surface it outside the promise so it is not swallowed.
        queueMicrotask(() => {
          throw error;
        });
      });
  }

  /** Clears the user's search (marks, fold, depth line, reveal) but keeps the star. */
  public resetSearch(): void {
    this.marks.clear();
    this.periodProperty.reset();
    this.shiftProperty.reset();
    this.foldProperty.reset();
    this.depthProperty.reset();
    this.revealProperty.reset();
  }

  public reset(): void {
    if (this.targetProperty.value === HuntTarget.HD_189733) {
      this.resetSearch();
    } else {
      this.targetProperty.reset();
    }
  }

  public step(_dt: number): void {
    // Nothing moves on this screen.
  }
}

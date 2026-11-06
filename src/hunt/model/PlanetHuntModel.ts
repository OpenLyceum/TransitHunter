/**
 * PlanetHuntModel.ts
 *
 * The Planet Hunt screen: find planets in real Kepler and TESS light curves.
 *
 * The user marks dips (their spacing suggests a period), or runs a
 * box-least-squares period search, folds the data on a trial period and
 * reference time, sets a depth line on the folded dip (which gives the planet's
 * size from the star's known radius), and can then reveal the archive's answer.
 * Folded data can also be centred on the far side of the orbit, half a period
 * after the transit, where a hot Jupiter's eclipse behind its star shows.
 *
 * Light curves load on demand. While one loads `lightCurveProperty` is null;
 * a slow load that finishes after the user has picked another star is ignored.
 * The period search runs in chunks in step(), so a long Kepler light curve does
 * not freeze the sim; its result is kept until the star changes.
 */

import {
  BooleanProperty,
  createObservableArray,
  DerivedProperty,
  Emitter,
  EnumerationProperty,
  NumberProperty,
  type ObservableArray,
  Property,
  type TReadOnlyProperty,
} from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import { type ArchivePlanet, archivePlanet } from "../../common/model/archive.js";
import { type Ephemeris, ephemerisFromMarks, foldedPhase } from "../../common/model/lightCurveTools.js";
import { radiusFromDepth } from "../../common/model/transitPhysics.js";
import { EARTH_RADIUS_M, SUN_RADIUS_M } from "../../TransitHunterConstants.js";
import { BoxSearch } from "./boxSearch.js";
import { HuntTarget } from "./HuntTarget.js";
import { type LightCurve, loadLightCurve } from "./LightCurveData.js";

/** Trial-period range, days. */
export const HUNT_PERIOD_RANGE = new Range(0.3, 500);

/** Depth-line range, percent of the light. */
export const HUNT_DEPTH_RANGE = new Range(0.001, 5);

/** Most dip marks kept. */
export const MAX_MARKS = 8;

/** Marks closer than this, days, are the same dip marked twice (half the shortest trial period). */
export const MIN_MARK_SEPARATION = HUNT_PERIOD_RANGE.min / 2;

/**
 * Wall-clock time the period search may use per animation frame, ms. The longest
 * light curve (four years of Kepler-22) takes a few seconds in all.
 */
export const SEARCH_MILLISECONDS_PER_STEP = 12;

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

  /** Centre the folded chart on the far side of the orbit (half a period after the transit). */
  public readonly farSideProperty = new BooleanProperty(false);

  /** Show the period search in place of the light curve. */
  public readonly showSearchProperty = new BooleanProperty(false);

  /** Progress of the period search, 0–1 (0 before it starts). */
  public readonly searchProgressProperty = new NumberProperty(0, { range: new Range(0, 1) });

  /** Fires as the period search advances (and when it is cleared). */
  public readonly searchChangedEmitter = new Emitter();

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

  /** The period search of the current light curve (null before it starts). */
  private boxSearch: BoxSearch | null = null;

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

    // Showing the search starts it (once per light curve).
    const startIfShown = (): void => {
      if (this.showSearchProperty.value && this.lightCurveProperty.value && !this.boxSearch) {
        this.startSearch();
      }
    };
    this.showSearchProperty.lazyLink(startIfShown);
    this.lightCurveProperty.lazyLink(startIfShown);
  }

  /** Reference transit time, days since the start of the data. */
  public referenceTime(): number {
    return this.shiftProperty.value * this.periodProperty.value;
  }

  /** Folded phase (−0.5 … 0.5) of a time, days: 0 at the transit, or at the far side when farSide is on. */
  public phaseOf(time: number): number {
    const offset = this.farSideProperty.value ? 0.5 * this.periodProperty.value : 0;
    return foldedPhase(time, this.periodProperty.value, this.referenceTime() + offset);
  }

  /** Adds a dip mark (the oldest goes once there are MAX_MARKS). */
  public addMark(time: number): void {
    if (this.marks.length >= MAX_MARKS) {
      this.marks.shift();
    }
    this.marks.push(time);
  }

  /** The period and reference time the marks imply, allowing for missed dips (null with fewer than two). */
  public markEphemeris(): Ephemeris | null {
    return ephemerisFromMarks([...this.marks], MIN_MARK_SEPARATION);
  }

  /**
   * Period the marks imply, days (null with fewer than two distinct marks). Dips
   * missed between the marks (in a data gap) are allowed for: see {@link ephemerisFromMarks}.
   */
  public markSpacing(): number | null {
    return this.markEphemeris()?.period ?? null;
  }

  /** Uses the marks' period as the trial period, with their fitted transit as the reference time. */
  public useMarkSpacing(): void {
    const ephemeris = this.markEphemeris();
    if (ephemeris === null) {
      return;
    }
    this.setEphemeris(ephemeris.period, ephemeris.referenceTime);
  }

  /** The archive's period and reference time for a planet of the selected star, in the sim's terms. */
  public useArchiveEphemeris(planet: ArchivePlanet): void {
    const curve = this.lightCurveProperty.value;
    if (!curve) {
      return;
    }
    this.setEphemeris(planet.periodDays, planet.transitMidBjd - curve.zeroBjd);
  }

  /** The period search, or null before it has started. */
  public get search(): BoxSearch | null {
    return this.boxSearch;
  }

  /** Starts (or restarts) the period search of the current light curve. */
  public startSearch(): void {
    const curve = this.lightCurveProperty.value;
    if (!curve) {
      return;
    }
    this.boxSearch = new BoxSearch(curve.times, curve.brightness, {
      step: curve.file.step,
      minPeriod: HUNT_PERIOD_RANGE.min,
      maxPeriod: Math.min(HUNT_PERIOD_RANGE.max, curve.spanDays / 2),
    });
    this.searchProgressProperty.value = 0;
    this.searchChangedEmitter.emit();
  }

  /**
   * Folds on the strongest dip the search found among periods in [minPeriod,
   * maxPeriod] (all by default), refined, and shows the folded chart.
   */
  public useSearchPeak(minPeriod?: number, maxPeriod?: number): void {
    const search = this.boxSearch;
    if (!search) {
      return;
    }
    const index = search.peakIndex(minPeriod, maxPeriod);
    if (index < 0) {
      return;
    }
    const fit = search.refinePeak(index);
    this.setEphemeris(fit.period, fit.epoch);
    this.farSideProperty.value = false;
    this.foldProperty.value = true;
    this.showSearchProperty.value = false;
  }

  /** Sets the trial period and the reference transit time (days since the start of the data). */
  private setEphemeris(period: number, referenceTime: number): void {
    const constrained = HUNT_PERIOD_RANGE.constrainValue(period);
    this.periodProperty.value = constrained;
    this.shiftProperty.value = (((referenceTime / constrained) % 1) + 1) % 1;
  }

  private load(target: HuntTarget): void {
    const token = ++this.loadToken;
    this.lightCurveProperty.value = null;
    this.clearSearch();
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

  private clearSearch(): void {
    this.boxSearch = null;
    this.searchProgressProperty.value = 0;
    this.searchChangedEmitter.emit();
  }

  /** Clears the user's search (marks, fold, depth line, reveal) but keeps the star and its period search. */
  public resetSearch(): void {
    this.marks.clear();
    this.periodProperty.reset();
    this.shiftProperty.reset();
    this.foldProperty.reset();
    this.farSideProperty.reset();
    this.showSearchProperty.reset();
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
    const search = this.boxSearch;
    if (search && !search.done) {
      search.advanceFor(SEARCH_MILLISECONDS_PER_STEP);
      this.searchProgressProperty.value = search.progress;
      this.searchChangedEmitter.emit();
    }
  }
}

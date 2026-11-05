/**
 * LiningUpModel.ts
 *
 * The Lining Up screen: a planet transits only if its orbit is seen almost
 * exactly edge-on. The orbit is real-sized here (a Sun-like star; the distance
 * sets a/R★ and, by Kepler's third law, the period), and Earth's direction makes
 * an angle i with the orbit's axis (i = 90° is edge-on).
 *
 * The clock runs over whole orbits, but not at a steady rate: the planet takes
 * LINING_UP_SECONDS_PER_WINDOW to cross a window centred on mid-transit (wide
 * enough for an edge-on transit), then fast-forwards round the rest of the orbit
 * in LINING_UP_SECONDS_PER_REST. At real orbit sizes a transit is a few per cent
 * of an orbit and would flash by at a steady rate; the fast part is labelled.
 *
 * A "many stars" sample shows 100 systems like this one oriented at random
 * (directions uniform on the sky, so cos i is uniform): only about (R★+Rp)/a of
 * them transit.
 */

import {
  DerivedProperty,
  Emitter,
  EnumerationProperty,
  NumberProperty,
  type TReadOnlyProperty,
} from "scenerystack/axon";
import { dotRandom } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import { TimeSpeed } from "scenerystack/scenery-phet";
import { orbitalPeriod } from "../../common/model/orbitPhysics.js";
import { PlanetPreset } from "../../common/model/PlanetPreset.js";
import {
  impactParameter,
  relativeFlux,
  type TransitGeometry,
  totalDurationFraction,
  transitProbability,
  transits,
  UNIFORM_DISK,
} from "../../common/model/transitPhysics.js";
import { TimeModel } from "../../common/TimeModel.js";
import {
  AU_M,
  DAY_S,
  DISTANCE_RANGE,
  EARTH_RADIUS_M,
  FAST_SPEED_FACTOR,
  INCLINATION_RANGE,
  SLOW_SPEED_FACTOR,
  SUN_MASS_KG,
  SUN_RADIUS_M,
} from "../../TransitHunterConstants.js";

/** Wall-clock seconds for one pass through the transit window at normal speed. */
export const LINING_UP_SECONDS_PER_WINDOW = 6;

/** Wall-clock seconds for the fast-forward round the rest of the orbit at normal speed. */
export const LINING_UP_SECONDS_PER_REST = 3;

/** Wall-clock seconds per orbit at normal speed. */
const SECONDS_PER_CYCLE = LINING_UP_SECONDS_PER_WINDOW + LINING_UP_SECONDS_PER_REST;

/** The share of each orbit's wall-clock time spent in the transit window. */
const WINDOW_SHARE = LINING_UP_SECONDS_PER_WINDOW / SECONDS_PER_CYCLE;

/** Largest end slope of the fast-forward's Hermite curve that keeps it monotonic. */
const MAX_HERMITE_SLOPE = 3;

/** The window is this many edge-on transit durations wide. */
export const WINDOW_IN_DURATIONS = 1.6;

/** Systems in the random sample. */
export const SAMPLE_SIZE = 100;

/** One randomly oriented system of the sample. */
export type SampleSystem = {
  /** cos i, uniform in [0, 1). */
  readonly cosInclination: number;
  /** Orientation of the orbit's projected ellipse on the sky, rad (drawing only). */
  readonly skyAngle: number;
};

const DEG = Math.PI / 180;

export class LiningUpModel implements TModel {
  public readonly planetPresetProperty = new EnumerationProperty(PlanetPreset.JUPITER, {
    validValues: [PlanetPreset.EARTH, PlanetPreset.NEPTUNE, PlanetPreset.JUPITER],
  });

  /** Star–planet distance, AU. */
  public readonly distanceProperty = new NumberProperty(0.05, { range: DISTANCE_RANGE });

  /** Inclination, degrees (90 = edge-on). */
  public readonly inclinationProperty = new NumberProperty(90, { range: INCLINATION_RANGE });

  /**
   * Position in the current orbit's wall-clock cycle, 0 … 1: the transit window
   * for the first WINDOW_SHARE, the fast-forward after.
   */
  public readonly cycleTimeProperty = new NumberProperty(0);

  /** Time from mid-transit as a fraction of the window, −0.5 … 0.5 (0.5 while fast-forwarding). */
  public readonly windowTimeProperty: TReadOnlyProperty<number>;

  /** Whether the planet is fast-forwarding round the rest of the orbit, outside the transit window. */
  public readonly fastForwardingProperty: TReadOnlyProperty<boolean>;

  public readonly geometryProperty: TReadOnlyProperty<TransitGeometry>;
  public readonly edgeOnGeometryProperty: TReadOnlyProperty<TransitGeometry>;

  /** Orbital period, days. */
  public readonly periodProperty: TReadOnlyProperty<number>;

  /** Impact parameter b (star radii). */
  public readonly impactParameterProperty: TReadOnlyProperty<number>;

  public readonly transitsProperty: TReadOnlyProperty<boolean>;

  /** Transit duration, hours (0 when the planet misses). */
  public readonly durationProperty: TReadOnlyProperty<number>;

  /** Largest tilt away from edge-on that still gives a transit, degrees. */
  public readonly tiltLimitProperty: TReadOnlyProperty<number>;

  /** Chance that a randomly oriented system like this one transits. */
  public readonly probabilityProperty: TReadOnlyProperty<number>;

  /** Half-width of the time window, as a fraction of the period. */
  public readonly windowHalfWidthProperty: TReadOnlyProperty<number>;

  /** Brightness now. */
  public readonly brightnessProperty: TReadOnlyProperty<number>;

  /** The random sample, redrawn by {@link newSample}. */
  public sample: readonly SampleSystem[];
  public readonly sampleChangedEmitter = new Emitter();

  public readonly timer = new TimeModel(true);
  public readonly timeSpeedProperty = new EnumerationProperty(TimeSpeed.NORMAL);

  public constructor() {
    this.geometryProperty = new DerivedProperty(
      [this.planetPresetProperty, this.distanceProperty, this.inclinationProperty],
      (preset, distance, inclination) => ({
        radiusRatio: (preset.radiusEarth * EARTH_RADIUS_M) / SUN_RADIUS_M,
        orbitInStarRadii: (distance * AU_M) / SUN_RADIUS_M,
        inclinationRad: inclination * DEG,
        limbDarkening: UNIFORM_DISK,
      }),
    );
    this.edgeOnGeometryProperty = new DerivedProperty([this.geometryProperty], (geometry) => ({
      ...geometry,
      inclinationRad: Math.PI / 2,
    }));
    this.periodProperty = new DerivedProperty(
      [this.distanceProperty],
      (distance) => orbitalPeriod(SUN_MASS_KG, 0, distance * AU_M) / DAY_S,
    );
    this.impactParameterProperty = new DerivedProperty([this.geometryProperty], (g) =>
      impactParameter(g.orbitInStarRadii, g.inclinationRad),
    );
    this.transitsProperty = new DerivedProperty([this.geometryProperty], (g) => transits(g));
    this.durationProperty = new DerivedProperty(
      [this.geometryProperty, this.periodProperty],
      (g, period) => totalDurationFraction(g) * period * 24,
    );
    this.tiltLimitProperty = new DerivedProperty(
      [this.geometryProperty],
      (g) => 90 - Math.acos(Math.min(1, (1 + g.radiusRatio) / g.orbitInStarRadii)) / DEG,
    );
    this.probabilityProperty = new DerivedProperty([this.geometryProperty], (g) =>
      transitProbability(g.radiusRatio, g.orbitInStarRadii),
    );
    this.windowHalfWidthProperty = new DerivedProperty(
      [this.edgeOnGeometryProperty],
      (g) => (WINDOW_IN_DURATIONS * totalDurationFraction(g)) / 2,
    );
    this.windowTimeProperty = new DerivedProperty([this.cycleTimeProperty], (u) =>
      u < WINDOW_SHARE ? -0.5 + u / WINDOW_SHARE : 0.5,
    );
    this.fastForwardingProperty = new DerivedProperty([this.cycleTimeProperty], (u) => u >= WINDOW_SHARE);
    this.brightnessProperty = new DerivedProperty(
      [this.cycleTimeProperty, this.geometryProperty, this.windowHalfWidthProperty],
      (u, g, halfWidth) => relativeFlux(LiningUpModel.orbitalPhase(u, halfWidth), g),
    );
    this.sample = LiningUpModel.drawSample();
  }

  /** Orbital phase now, −0.5 … 1 (0 = mid-transit; whole orbits are not removed). */
  public phase(): number {
    return LiningUpModel.orbitalPhase(this.cycleTimeProperty.value, this.windowHalfWidthProperty.value);
  }

  /**
   * Orbital phase at cycle time u for a window of half-width h (fraction of the
   * period). In the window the phase runs steadily from −h to h. The fast-forward
   * then covers h … 1 − h on a cubic Hermite curve whose end slopes match the
   * window's rate, so the planet speeds up and slows down smoothly.
   */
  public static orbitalPhase(u: number, h: number): number {
    if (u < WINDOW_SHARE) {
      return 2 * h * (-0.5 + u / WINDOW_SHARE);
    }
    const rest = Math.max(0, 1 - 2 * h);
    if (rest === 0) {
      return h;
    }
    const s = (u - WINDOW_SHARE) / (1 - WINDOW_SHARE);
    // Window rate (phase per unit of s) in units of the fast-forward's span.
    const m = Math.min(MAX_HERMITE_SLOPE, ((2 * h) / WINDOW_SHARE) * ((1 - WINDOW_SHARE) / rest));
    const s2 = s * s;
    const s3 = s2 * s;
    const hermite = -2 * s3 + 3 * s2 + m * (s3 - 2 * s2 + s) + m * (s3 - s2);
    return h + rest * hermite;
  }

  /** How many systems of the sample transit, for the current planet and distance. */
  public transitingCount(): number {
    return this.sample.filter((system) => this.sampleTransits(system)).length;
  }

  /** Whether a sample system, with this planet and distance, transits. */
  public sampleTransits(system: SampleSystem): boolean {
    const g = this.geometryProperty.value;
    return g.orbitInStarRadii * system.cosInclination < 1 + g.radiusRatio;
  }

  /** Draws a fresh random sample. */
  public newSample(): void {
    this.sample = LiningUpModel.drawSample();
    this.sampleChangedEmitter.emit();
  }

  private static drawSample(): SampleSystem[] {
    return Array.from({ length: SAMPLE_SIZE }, () => ({
      cosInclination: dotRandom.nextDouble(),
      skyAngle: Math.PI * dotRandom.nextDouble(),
    }));
  }

  public reset(): void {
    this.planetPresetProperty.reset();
    this.distanceProperty.reset();
    this.inclinationProperty.reset();
    this.cycleTimeProperty.reset();
    this.timer.reset();
    this.timeSpeedProperty.reset();
  }

  /** Advances the clock by this many wall-clock seconds at normal speed (wraps each orbit). */
  public advance(seconds: number): void {
    const u = this.cycleTimeProperty.value + seconds / SECONDS_PER_CYCLE;
    this.cycleTimeProperty.value = u - Math.floor(u);
  }

  public step(dt: number): void {
    if (!this.timer.isPlayingProperty.value) {
      return;
    }
    const speed = this.timeSpeedProperty.value;
    const factor = speed === TimeSpeed.SLOW ? SLOW_SPEED_FACTOR : speed === TimeSpeed.FAST ? FAST_SPEED_FACTOR : 1;
    this.advance(dt * factor);
  }
}

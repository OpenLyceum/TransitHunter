/**
 * LiningUpModel.ts
 *
 * The Lining Up screen: a planet transits only if its orbit is seen almost
 * exactly edge-on. The orbit is real-sized here (a Sun-like star; the distance
 * sets a/R★ and, by Kepler's third law, the period), and Earth's direction makes
 * an angle i with the orbit's axis (i = 90° is edge-on).
 *
 * The clock loops through a window centred on mid-transit, wide enough for an
 * edge-on transit, so the planet keeps crossing (or missing) the star.
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

  /** Time from mid-transit as a fraction of the window, −0.5 … 0.5. */
  public readonly windowTimeProperty = new NumberProperty(-0.5);

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
    this.brightnessProperty = new DerivedProperty(
      [this.windowTimeProperty, this.geometryProperty, this.windowHalfWidthProperty],
      (t, g, halfWidth) => relativeFlux(2 * t * halfWidth, g),
    );
    this.sample = LiningUpModel.drawSample();
  }

  /** Orbital phase now (0 = mid-transit). */
  public phase(): number {
    return 2 * this.windowTimeProperty.value * this.windowHalfWidthProperty.value;
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
    this.windowTimeProperty.reset();
    this.timer.reset();
    this.timeSpeedProperty.reset();
  }

  /** Advances the window clock by a fraction of the window (wraps). */
  public advance(fraction: number): void {
    const t = this.windowTimeProperty.value + fraction;
    this.windowTimeProperty.value = t - Math.floor(t + 0.5);
  }

  public step(dt: number): void {
    if (!this.timer.isPlayingProperty.value) {
      return;
    }
    const speed = this.timeSpeedProperty.value;
    const factor = speed === TimeSpeed.SLOW ? SLOW_SPEED_FACTOR : speed === TimeSpeed.FAST ? FAST_SPEED_FACTOR : 1;
    this.advance((dt * factor) / LINING_UP_SECONDS_PER_WINDOW);
  }
}

/**
 * LightCurveModel.ts
 *
 * The Light Curve screen: what an astronomer reads from the dips (depth, period,
 * duration) and what each tells about the planet (its size, its distance), and
 * how stacking many transits pulls a small planet out of the noise.
 *
 * The orbit is circular and edge-on. Measurements come every CADENCE_MINUTES
 * with Gaussian scatter σ. The wide chart shows single observations; the zoomed
 * chart shows N transits folded together, so its scatter is σ/√N. The random
 * numbers are drawn once (and again with "New observations"), so moving a
 * slider changes the data smoothly instead of re-rolling it.
 */

import {
  BooleanProperty,
  DerivedProperty,
  Emitter,
  EnumerationProperty,
  NumberProperty,
  type TReadOnlyProperty,
} from "scenerystack/axon";
import { dotRandom } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import { averagedNoise } from "../../common/model/lightCurveTools.js";
import { orbitalPeriod } from "../../common/model/orbitPhysics.js";
import { StarPreset } from "../../common/model/StarPreset.js";
import {
  radiusFromDepth,
  relativeFlux,
  SUN_LIKE_LIMB_DARKENING,
  type TransitGeometry,
  totalDurationFraction,
  UNIFORM_DISK,
} from "../../common/model/transitPhysics.js";
import {
  AU_M,
  CADENCE_MINUTES,
  DAY_S,
  DISTANCE_RANGE,
  EARTH_RADIUS_M,
  NOISE_RANGE_PPM,
  PLANET_RADIUS_RANGE,
  STACK_RANGE,
  SUN_MASS_KG,
  SUN_RADIUS_M,
} from "../../TransitHunterConstants.js";

/** The wide chart spans this many orbits, with dips at ½, 1½, 2½ … orbits. */
export const WIDE_ORBITS = 3.25;

/** Most points drawn on the wide chart (coarser bins beyond this). */
export const MAX_WIDE_POINTS = 3000;

/** The zoomed chart spans this many transit durations, centred on mid-transit. */
export const ZOOM_IN_DURATIONS = 2.4;

/** Most points drawn on the zoomed chart. */
export const MAX_ZOOM_POINTS = 400;

/** A point of a light curve: x in days (wide) or hours (zoomed), brightness relative to normal. */
export type LightCurvePoint = { readonly x: number; readonly y: number };

export class LightCurveModel implements TModel {
  /** Planet radius, Earth radii. */
  public readonly planetRadiusProperty = new NumberProperty(11.2, { range: PLANET_RADIUS_RANGE });

  /** Star–planet distance, AU. */
  public readonly distanceProperty = new NumberProperty(0.05, { range: DISTANCE_RANGE });

  public readonly starPresetProperty = new EnumerationProperty(StarPreset.SUN_LIKE);

  /** Whether the star is darker at its edge (as real stars are). */
  public readonly limbDarkeningProperty = new BooleanProperty(false);

  /** Scatter of one measurement, ppm. */
  public readonly noiseProperty = new NumberProperty(0, { range: NOISE_RANGE_PPM });

  /** Transits folded together on the zoomed chart. */
  public readonly stackProperty = new NumberProperty(1, { range: STACK_RANGE, numberType: "Integer" });

  public readonly geometryProperty: TReadOnlyProperty<TransitGeometry>;

  /** Orbital period, days. */
  public readonly periodProperty: TReadOnlyProperty<number>;

  /** Transit duration (first to last contact), hours. */
  public readonly durationProperty: TReadOnlyProperty<number>;

  /** Depth of the dip at mid-transit (fraction of the light). */
  public readonly depthProperty: TReadOnlyProperty<number>;

  /** Planet radius an astronomer infers from the depth, R★√δ, Earth radii. */
  public readonly inferredRadiusProperty: TReadOnlyProperty<number>;

  /** Measurements inside the dip, over all stacked transits. */
  public readonly pointsInTransitProperty: TReadOnlyProperty<number>;

  /** Depth ÷ its uncertainty (∞ without noise). */
  public readonly signalToNoiseProperty: TReadOnlyProperty<number>;

  /** Fires when new random observations are drawn. */
  public readonly observationsChangedEmitter = new Emitter();

  private wideNoise: number[] = [];
  private zoomNoise: number[] = [];

  public constructor() {
    this.geometryProperty = new DerivedProperty(
      [this.planetRadiusProperty, this.distanceProperty, this.starPresetProperty, this.limbDarkeningProperty],
      (radius, distance, star, limbDarkening) => ({
        radiusRatio: (radius * EARTH_RADIUS_M) / (star.radiusSun * SUN_RADIUS_M),
        orbitInStarRadii: (distance * AU_M) / (star.radiusSun * SUN_RADIUS_M),
        inclinationRad: Math.PI / 2,
        limbDarkening: limbDarkening ? SUN_LIKE_LIMB_DARKENING : UNIFORM_DISK,
      }),
    );
    this.periodProperty = new DerivedProperty(
      [this.distanceProperty, this.starPresetProperty],
      (distance, star) => orbitalPeriod(star.massSun * SUN_MASS_KG, 0, distance * AU_M) / DAY_S,
    );
    this.durationProperty = new DerivedProperty(
      [this.geometryProperty, this.periodProperty],
      (g, period) => totalDurationFraction(g) * period * 24,
    );
    this.depthProperty = new DerivedProperty([this.geometryProperty], (g) => 1 - relativeFlux(0, g));
    this.inferredRadiusProperty = new DerivedProperty([this.depthProperty, this.starPresetProperty], (depth, star) =>
      radiusFromDepth(depth, (star.radiusSun * SUN_RADIUS_M) / EARTH_RADIUS_M),
    );
    this.pointsInTransitProperty = new DerivedProperty(
      [this.durationProperty, this.stackProperty],
      (hours, stack) => Math.floor((hours * 60) / CADENCE_MINUTES) * stack,
    );
    this.signalToNoiseProperty = new DerivedProperty(
      [this.depthProperty, this.noiseProperty, this.pointsInTransitProperty],
      (depth, noise, points) =>
        noise === 0 ? Number.POSITIVE_INFINITY : depth / averagedNoise(noise * 1e-6, Math.max(1, points)),
    );
    this.drawNoise();
  }

  /** Draws new random measurement errors. */
  public newObservations(): void {
    this.drawNoise();
    this.observationsChangedEmitter.emit();
  }

  private drawNoise(): void {
    this.wideNoise = Array.from({ length: MAX_WIDE_POINTS + 1 }, () => dotRandom.nextGaussian());
    this.zoomNoise = Array.from({ length: MAX_ZOOM_POINTS + 1 }, () => dotRandom.nextGaussian());
  }

  /** The noise-free curve over the wide chart (days), finely sampled. */
  public wideModelCurve(samples: number): LightCurvePoint[] {
    const period = this.periodProperty.value;
    const g = this.geometryProperty.value;
    return Array.from({ length: samples + 1 }, (_, i) => {
      const orbits = (WIDE_ORBITS * i) / samples;
      return { x: orbits * period, y: relativeFlux(orbits - 0.5, g) };
    });
  }

  /**
   * Single observations over the wide chart (days). Above MAX_WIDE_POINTS
   * measurements they are averaged into coarser bins, whose scatter drops to match.
   */
  public wideObservations(): LightCurvePoint[] {
    const period = this.periodProperty.value;
    const g = this.geometryProperty.value;
    const spanMinutes = WIDE_ORBITS * period * 24 * 60;
    const count = Math.min(MAX_WIDE_POINTS, Math.floor(spanMinutes / CADENCE_MINUTES));
    const perBin = spanMinutes / CADENCE_MINUTES / count;
    const sigma = averagedNoise(this.noiseProperty.value * 1e-6, perBin);
    return Array.from({ length: count }, (_, i) => {
      const orbits = (WIDE_ORBITS * (i + 0.5)) / count;
      return { x: orbits * period, y: relativeFlux(orbits - 0.5, g) + sigma * (this.wideNoise[i] ?? 0) };
    });
  }

  /** Half-width of the zoomed chart, hours. */
  public zoomHalfWidthHours(): number {
    return (ZOOM_IN_DURATIONS * Math.max(this.durationProperty.value, 0.5)) / 2;
  }

  /** The noise-free curve on the zoomed chart (hours from mid-transit). */
  public zoomModelCurve(samples: number): LightCurvePoint[] {
    const halfWidth = this.zoomHalfWidthHours();
    const periodHours = this.periodProperty.value * 24;
    const g = this.geometryProperty.value;
    return Array.from({ length: samples + 1 }, (_, i) => {
      const hours = -halfWidth + (2 * halfWidth * i) / samples;
      return { x: hours, y: relativeFlux(hours / periodHours, g) };
    });
  }

  /** N transits folded together on the zoomed chart (hours from mid-transit), scatter σ/√N. */
  public zoomObservations(): LightCurvePoint[] {
    const halfWidth = this.zoomHalfWidthHours();
    const periodHours = this.periodProperty.value * 24;
    const g = this.geometryProperty.value;
    const count = Math.min(MAX_ZOOM_POINTS, Math.max(10, Math.floor((2 * halfWidth * 60) / CADENCE_MINUTES)));
    const perBin = (2 * halfWidth * 60) / CADENCE_MINUTES / count;
    const sigma = averagedNoise(this.noiseProperty.value * 1e-6, perBin * this.stackProperty.value);
    return Array.from({ length: count }, (_, i) => {
      const hours = -halfWidth + (2 * halfWidth * (i + 0.5)) / count;
      return { x: hours, y: relativeFlux(hours / periodHours, g) + sigma * (this.zoomNoise[i] ?? 0) };
    });
  }

  public reset(): void {
    this.planetRadiusProperty.reset();
    this.distanceProperty.reset();
    this.starPresetProperty.reset();
    this.limbDarkeningProperty.reset();
    this.noiseProperty.reset();
    this.stackProperty.reset();
  }

  public step(_dt: number): void {
    // Nothing moves on this screen.
  }
}

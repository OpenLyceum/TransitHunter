/**
 * DimmingModel.ts
 *
 * The Dimming screen: a planet orbits its star, and each time it passes between
 * the star and Earth it blocks a little of the star's light.
 *
 * The orbit is edge-on (the planet crosses the middle of the star) and drawn far
 * smaller than any real orbit, so a transit takes a sizeable part of each orbit;
 * the view says so. The brightness uses the real planet-to-star size ratio, with
 * a uniformly bright star (limb darkening comes on the Light Curve screen), so
 * the fraction blocked equals the fraction of the disk covered.
 *
 * The clock runs in orbits. Phase 0 is mid-transit; the integer part of the
 * phase counts orbits. The light-curve chart is a sweep over TRACE_ORBITS
 * orbits that restarts from the left, so its ranges never scroll.
 */

import {
  BooleanProperty,
  DerivedProperty,
  EnumerationProperty,
  NumberProperty,
  type TReadOnlyProperty,
} from "scenerystack/axon";
import type { TModel } from "scenerystack/joist";
import { TimeSpeed } from "scenerystack/scenery-phet";
import { PlanetPreset } from "../../common/model/PlanetPreset.js";
import { StarPreset } from "../../common/model/StarPreset.js";
import { relativeFlux, skyPosition, type TransitGeometry, UNIFORM_DISK } from "../../common/model/transitPhysics.js";
import { TimeModel } from "../../common/TimeModel.js";
import {
  EARTH_RADIUS_M,
  FAST_SPEED_FACTOR,
  PLANET_RADIUS_RANGE,
  SLOW_SPEED_FACTOR,
  SUN_RADIUS_M,
} from "../../TransitHunterConstants.js";

/** Orbit radius in star radii as drawn on this screen (real orbits are tens to hundreds). */
export const DIMMING_ORBIT_IN_STAR_RADII = 2.2;

/** Wall-clock seconds per orbit at normal speed. */
export const DIMMING_SECONDS_PER_ORBIT = 12;

/** Orbits shown across the light-curve chart before the sweep restarts. */
export const TRACE_ORBITS = 2;

/** Light-curve samples per orbit. */
const SAMPLES_PER_ORBIT = 400;

/** Phase at start-up and after Reset All: a quarter orbit before the first transit. */
const INITIAL_PHASE = -0.25;

/** Sweeps start half an orbit before a transit, so the dips sit at ½, 1½, … orbits across the chart. */
function sweepStartFor(phase: number): number {
  return Math.floor(phase + 0.5) - 0.5;
}

export class DimmingModel implements TModel {
  public readonly planetPresetProperty = new EnumerationProperty(PlanetPreset.JUPITER);

  /** Radius of the custom planet, Earth radii. */
  public readonly customRadiusProperty = new NumberProperty(PlanetPreset.CUSTOM.radiusEarth, {
    range: PLANET_RADIUS_RANGE,
  });

  public readonly starPresetProperty = new EnumerationProperty(StarPreset.SUN_LIKE);

  /** Planet radius, Earth radii. */
  public readonly planetRadiusProperty: TReadOnlyProperty<number>;

  /** Planet radius ÷ star radius. */
  public readonly radiusRatioProperty: TReadOnlyProperty<number>;

  /** Largest fraction of the star's light the planet blocks (when it crosses the middle). */
  public readonly maxBlockedFractionProperty: TReadOnlyProperty<number>;

  /** Orbital phase: 0 = mid-transit, integer part = orbits completed. */
  public readonly phaseProperty = new NumberProperty(INITIAL_PHASE);

  /** Phase at the left edge of the light-curve sweep. */
  public readonly sweepStartProperty = new NumberProperty(sweepStartFor(INITIAL_PHASE));

  /** Brightness of the star now (1 = nothing blocked). */
  public readonly brightnessProperty: TReadOnlyProperty<number>;

  /** True while the user drags the planet (the clock waits). */
  public readonly isDraggingProperty = new BooleanProperty(false);

  public readonly timer = new TimeModel(true);
  public readonly timeSpeedProperty = new EnumerationProperty(TimeSpeed.NORMAL);

  public constructor() {
    this.planetRadiusProperty = new DerivedProperty(
      [this.planetPresetProperty, this.customRadiusProperty],
      (preset, custom) => (preset === PlanetPreset.CUSTOM ? custom : preset.radiusEarth),
    );
    this.radiusRatioProperty = new DerivedProperty(
      [this.planetRadiusProperty, this.starPresetProperty],
      (planetRadius, star) => (planetRadius * EARTH_RADIUS_M) / (star.radiusSun * SUN_RADIUS_M),
    );
    this.maxBlockedFractionProperty = new DerivedProperty([this.radiusRatioProperty], (k) => this.blockedAt(0, k));
    this.brightnessProperty = new DerivedProperty([this.phaseProperty, this.radiusRatioProperty], (phase, k) =>
      relativeFlux(phase, this.geometry(k)),
    );
  }

  /** The transit geometry for a radius ratio. */
  public geometry(radiusRatio: number): TransitGeometry {
    return {
      radiusRatio: radiusRatio,
      orbitInStarRadii: DIMMING_ORBIT_IN_STAR_RADII,
      inclinationRad: Math.PI / 2,
      limbDarkening: UNIFORM_DISK,
    };
  }

  /** Fraction of the light blocked at a phase. */
  private blockedAt(phase: number, radiusRatio: number): number {
    return 1 - relativeFlux(phase, this.geometry(radiusRatio));
  }

  /** Planet position on the sky, star radii (x to the right; y is 0 for this edge-on orbit). */
  public skyX(): number {
    return skyPosition(this.phaseProperty.value, this.geometry(this.radiusRatioProperty.value)).x;
  }

  /**
   * Moves the planet (from a drag) so it sits at sky position x, on the near
   * side of its orbit, keeping the current orbit count.
   */
  public setSkyX(x: number): void {
    const sine = Math.max(-1, Math.min(1, x / DIMMING_ORBIT_IN_STAR_RADII));
    const orbit = Math.round(this.phaseProperty.value);
    this.setPhase(orbit + Math.asin(sine) / (2 * Math.PI));
  }

  /** The light curve from the start of the sweep up to now: phases (orbits since sweep start) and brightness. */
  public traceSamples(): { x: number; y: number }[] {
    const start = this.sweepStartProperty.value;
    const end = this.phaseProperty.value;
    const geometry = this.geometry(this.radiusRatioProperty.value);
    const samples: { x: number; y: number }[] = [];
    const count = Math.max(0, Math.floor((end - start) * SAMPLES_PER_ORBIT));
    for (let i = 0; i <= count; i++) {
      const phase = start + i / SAMPLES_PER_ORBIT;
      samples.push({ x: phase - start, y: relativeFlux(phase, geometry) });
    }
    samples.push({ x: end - start, y: relativeFlux(end, geometry) });
    return samples;
  }

  /** Advances the clock by `orbits` orbits (also used by the step button). */
  public advance(orbits: number): void {
    this.setPhase(this.phaseProperty.value + orbits);
  }

  private setPhase(phase: number): void {
    const start = this.sweepStartProperty.value;
    if (phase >= start + TRACE_ORBITS || phase < start) {
      this.sweepStartProperty.value = sweepStartFor(phase);
    }
    this.phaseProperty.value = phase;
  }

  public reset(): void {
    this.planetPresetProperty.reset();
    this.customRadiusProperty.reset();
    this.starPresetProperty.reset();
    this.phaseProperty.reset();
    this.sweepStartProperty.reset();
    this.isDraggingProperty.reset();
    this.timer.reset();
    this.timeSpeedProperty.reset();
  }

  public step(dt: number): void {
    if (!this.timer.isPlayingProperty.value || this.isDraggingProperty.value) {
      return;
    }
    const speed = this.timeSpeedProperty.value;
    const factor = speed === TimeSpeed.SLOW ? SLOW_SPEED_FACTOR : speed === TimeSpeed.FAST ? FAST_SPEED_FACTOR : 1;
    this.advance((dt * factor) / DIMMING_SECONDS_PER_ORBIT);
  }
}

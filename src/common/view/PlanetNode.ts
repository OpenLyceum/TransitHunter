/**
 * PlanetNode.ts
 *
 * A planet disc in the colour of its preset (Earth, Neptune, Jupiter, or a
 * neutral colour for a custom planet). Seen against its star it is drawn as a
 * dark silhouette with a thin coloured rim: from Earth we see its night side.
 */

import { Circle, type CircleOptions, type ProfileColorProperty } from "scenerystack/scenery";
import TransitHunterColors from "../../TransitHunterColors.js";
import { PlanetPreset } from "../model/PlanetPreset.js";
import { drawingMagnification } from "./formatters.js";

/** Smallest drawn planet radius, px. */
const MIN_PLANET_RADIUS = 4;

/**
 * Drawn planet radius (px) for a star drawn `starRadius` px: true size, unless that
 * is under MIN_PLANET_RADIUS, in which case it is magnified by a 1-2-5 factor
 * (returned so the view can label it).
 */
export function drawnPlanet(radiusRatio: number, starRadius: number): { radius: number; factor: number } {
  const truePixels = radiusRatio * starRadius;
  const factor = drawingMagnification(truePixels, MIN_PLANET_RADIUS);
  return { radius: truePixels * factor, factor: factor };
}

/** The colour of a planet preset. */
export function planetColor(preset: PlanetPreset): ProfileColorProperty {
  if (preset === PlanetPreset.EARTH) {
    return TransitHunterColors.earthPlanetColorProperty;
  }
  if (preset === PlanetPreset.NEPTUNE) {
    return TransitHunterColors.neptunePlanetColorProperty;
  }
  if (preset === PlanetPreset.JUPITER) {
    return TransitHunterColors.jupiterPlanetColorProperty;
  }
  return TransitHunterColors.planetColorProperty;
}

export class PlanetNode extends Circle {
  private preset: PlanetPreset = PlanetPreset.JUPITER;
  private silhouette = false;

  public constructor(options?: CircleOptions) {
    super(5, options);
    this.applyColors();
  }

  /** Sets the drawn radius (px), the preset colour, and whether it is seen against the star. */
  public setAppearance(radius: number, preset: PlanetPreset, silhouette: boolean): void {
    if (this.radius !== radius) {
      this.radius = radius;
    }
    if (preset !== this.preset || silhouette !== this.silhouette) {
      this.preset = preset;
      this.silhouette = silhouette;
      this.applyColors();
    }
  }

  private applyColors(): void {
    const color = planetColor(this.preset);
    this.fill = this.silhouette ? TransitHunterColors.planetSilhouetteColorProperty : color;
    this.stroke = this.silhouette ? color : null;
    this.lineWidth = 1.2;
  }
}

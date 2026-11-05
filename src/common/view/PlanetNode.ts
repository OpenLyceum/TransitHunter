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

/**
 * StarNode.ts
 *
 * A glowing star disc whose colour follows the star's temperature, brighter at
 * the centre than at the edge (as real stars are: limb darkening). The radius
 * is a display radius in pixels.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { optionize } from "scenerystack/phet-core";
import { Circle, Color, Node, type NodeOptions, RadialGradient } from "scenerystack/scenery";
import { blackbodyColor } from "../model/starAppearance.js";

type SelfOptions = {
  /** Draw the soft glow around the disc (off for a copy that only hides what is behind the star). */
  glow?: boolean;
  /** Glow radius as a multiple of the disc radius. */
  glowScale?: number;
};

export type StarNodeOptions = SelfOptions & NodeOptions;

export class StarNode extends Node {
  private readonly disposeStarNode: () => void;

  /**
   * @param temperatureProperty - effective temperature, K (sets the colour); a fixed number for a fixed star
   * @param radius - display radius, px
   */
  public constructor(
    temperatureProperty: TReadOnlyProperty<number> | number,
    radius: number,
    providedOptions?: StarNodeOptions,
  ) {
    const options = optionize<StarNodeOptions, SelfOptions, NodeOptions>()(
      { glow: true, glowScale: 1.9 },
      providedOptions,
    );
    const glowRadius = radius * options.glowScale;
    const glow = new Circle(glowRadius, { visible: options.glow });
    // A thin darker rim keeps the pale disc visible on the light projector background.
    const disc = new Circle(radius, { lineWidth: radius * 0.08 });
    super(options);
    this.children = [glow, disc];

    const update = (temperature: number): void => {
      const color = blackbodyColor(temperature);
      disc.fill = new RadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius)
        .addColorStop(0, Color.WHITE)
        .addColorStop(0.45, color.colorUtilsBrighter(0.25))
        .addColorStop(1, color);
      disc.stroke = color.colorUtilsDarker(0.4);
      glow.fill = new RadialGradient(0, 0, radius * 0.8, 0, 0, glowRadius)
        .addColorStop(0, color.withAlpha(0.45))
        .addColorStop(1, color.withAlpha(0));
    };

    if (typeof temperatureProperty === "number") {
      update(temperatureProperty);
      this.disposeStarNode = () => undefined;
    } else {
      temperatureProperty.link(update);
      this.disposeStarNode = () => temperatureProperty.unlink(update);
    }
  }

  public override dispose(): void {
    this.disposeStarNode();
    super.dispose();
  }
}

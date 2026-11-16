import { DENSITY_SCALE_NODE_SETTINGS } from "../../TransitHunterConstants.js";
/**
 * DensityScaleNode.ts
 *
 * A density scale from 0 to 9 g/cm³ with familiar references above it (Saturn,
 * water, Jupiter, Earth, iron) and the selected planet marked below.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import { Line, Node, Path, Rectangle, Text } from "scenerystack/scenery";
import { density, SOLAR_SYSTEM_PLANETS } from "../../common/model/composition.js";
import { formatSignificant } from "../../common/view/chartUtils.js";
import { StringManager } from "../../i18n/StringManager.js";
import TransitHunterColors from "../../TransitHunterColors.js";
import { EARTH_DENSITY_G_CM3, FONTS, WATER_DENSITY_G_CM3 } from "../../TransitHunterConstants.js";

/** Largest density on the scale, g/cm³. */
const MAX_DENSITY: number = DENSITY_SCALE_NODE_SETTINGS.MAX_DENSITY;

/** Density of iron, g/cm³ (uncompressed). */
const IRON_DENSITY: number = DENSITY_SCALE_NODE_SETTINGS.IRON_DENSITY;

const BAR_HEIGHT: number = DENSITY_SCALE_NODE_SETTINGS.BAR_HEIGHT;

export class DensityScaleNode extends Node {
  public constructor(densityProperty: TReadOnlyProperty<number>, width: number) {
    super();
    const strings = StringManager.getInstance().getCompositionStrings();
    const common = StringManager.getInstance().getCommonStrings();
    const x = (rho: number): number => (Math.min(rho, MAX_DENSITY) / MAX_DENSITY) * width;
    const solarDensity = (key: string): number => {
      const planet = SOLAR_SYSTEM_PLANETS.find((p) => p.key === key);
      return planet ? density(planet.massEarth, planet.radiusEarth) : 1;
    };

    const bar = new Rectangle(
      0,
      0,
      width,
      BAR_HEIGHT,
      DENSITY_SCALE_NODE_SETTINGS.BAR_CORNER_X,
      DENSITY_SCALE_NODE_SETTINGS.BAR_CORNER_Y,
      {
        fill: TransitHunterColors.chartBackgroundColorProperty,
        stroke: TransitHunterColors.chartAxisColorProperty,
      },
    );
    const floatZone = new Rectangle(
      0,
      0,
      x(WATER_DENSITY_G_CM3),
      BAR_HEIGHT,
      DENSITY_SCALE_NODE_SETTINGS.FLOAT_ZONE_CORNER_X,
      DENSITY_SCALE_NODE_SETTINGS.FLOAT_ZONE_CORNER_Y,
      {
        fill: TransitHunterColors.neptunePlanetColorProperty,
        opacity: DENSITY_SCALE_NODE_SETTINGS.FLOAT_ZONE_OPACITY,
      },
    );
    const ticks = new Node();
    for (let rho = 0; rho <= MAX_DENSITY; rho++) {
      ticks.addChild(
        new Line(x(rho), BAR_HEIGHT, x(rho), BAR_HEIGHT + 4, { stroke: TransitHunterColors.chartAxisColorProperty }),
      );
      ticks.addChild(
        new Text(String(rho), {
          font: FONTS.TICK_LABEL,
          fill: TransitHunterColors.textColorProperty,
          centerX: x(rho),
          top: BAR_HEIGHT + DENSITY_SCALE_NODE_SETTINGS.TOP_OFFSET,
        }),
      );
    }

    // References above the bar, on two rows so the close ones (Saturn, water, Jupiter) do not collide.
    const references = new Node();
    const reference = (labelProperty: TReadOnlyProperty<string>, rho: number, row: number): void => {
      const top = -4 - 14 * row;
      references.addChild(new Line(x(rho), 0, x(rho), top, { stroke: TransitHunterColors.mutedTextColorProperty }));
      references.addChild(
        new Text(labelProperty, {
          font: FONTS.SMALL,
          fill: TransitHunterColors.mutedTextColorProperty,
          maxWidth: DENSITY_SCALE_NODE_SETTINGS.REFERENCE_MAX_WIDTH,
          centerX: x(rho),
          bottom: top - 1,
        }),
      );
    };
    reference(strings.saturnStringProperty, solarDensity("saturn"), 0);
    reference(strings.waterStringProperty, WATER_DENSITY_G_CM3, 2);
    reference(common.jupiterStringProperty, solarDensity("jupiter"), 1);
    reference(common.earthStringProperty, EARTH_DENSITY_G_CM3, 0);
    reference(strings.ironStringProperty, IRON_DENSITY, 1);

    const marker = new Path(
      new Shape()
        .moveTo(0, 0)
        .lineTo(DENSITY_SCALE_NODE_SETTINGS.MARKER_X, DENSITY_SCALE_NODE_SETTINGS.MARKER_Y)
        .lineTo(DENSITY_SCALE_NODE_SETTINGS.MARKER_X_SEGMENT_2, DENSITY_SCALE_NODE_SETTINGS.MARKER_Y)
        .close(),
      {
        fill: TransitHunterColors.cursorColorProperty,
        y: BAR_HEIGHT + DENSITY_SCALE_NODE_SETTINGS.MARKER_Y_OFFSET,
      },
    );
    const markerLabel = new Text("", { font: FONTS.LABEL, fill: TransitHunterColors.cursorColorProperty });

    this.children = [bar, floatZone, ticks, references, marker, markerLabel];

    const update = (rho: number): void => {
      marker.x = x(rho);
      markerLabel.string = formatSignificant(rho, DENSITY_SCALE_NODE_SETTINGS.MARKER_LABEL_DIGITS);
      markerLabel.centerX = Math.max(markerLabel.width / 2, Math.min(width - markerLabel.width / 2, marker.x));
      markerLabel.top = marker.bottom + 1;
    };
    densityProperty.link(update);
    this.disposeEmitter.addListener(() => densityProperty.unlink(update));
  }
}

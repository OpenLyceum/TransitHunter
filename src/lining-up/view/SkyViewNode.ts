import { SKY_VIEW_NODE_SETTINGS } from "../../TransitHunterConstants.js";
/**
 * SkyViewNode.ts
 *
 * The star as Earth would see it, zoomed in, with the planet's path across (or
 * past) it: a dashed line at height b star radii above the centre. When the path
 * is out of the frame an arrow says how far above the star the planet passes.
 */

import { DerivedProperty, Multilink, PatternStringProperty } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import { StringUtils } from "scenerystack/phetcommon";
import { Line, Node, Rectangle, RichText, Text } from "scenerystack/scenery";
import { ArrowNode } from "scenerystack/scenery-phet";
import { skyPosition } from "../../common/model/transitPhysics.js";
import { formatSignificant } from "../../common/view/chartUtils.js";
import { linkUntilDisposed } from "../../common/view/linkUntilDisposed.js";
import { drawnPlanet, PlanetNode } from "../../common/view/PlanetNode.js";
import { StarNode } from "../../common/view/StarNode.js";
import { StringManager } from "../../i18n/StringManager.js";
import TransitHunterColors from "../../TransitHunterColors.js";
import { FONTS, SUN_TEMPERATURE_K } from "../../TransitHunterConstants.js";
import type { LiningUpModel } from "../model/LiningUpModel.js";

export class SkyViewNode extends Node {
  public constructor(model: LiningUpModel, width: number, height: number, starRadius: number) {
    super();
    const strings = StringManager.getInstance().getLiningUpStrings();
    const common = StringManager.getInstance().getCommonStrings();
    const cx = width / 2;
    const cy = height / 2 + 6;

    const background = new Rectangle(
      0,
      0,
      width,
      height,
      SKY_VIEW_NODE_SETTINGS.BACKGROUND_CORNER_X,
      SKY_VIEW_NODE_SETTINGS.BACKGROUND_CORNER_Y,
      {
        fill: TransitHunterColors.spaceColorProperty,
        stroke: TransitHunterColors.spaceBorderColorProperty,
      },
    );
    const title = new Text(strings.skyViewTitleStringProperty, {
      font: FONTS.TITLE,
      fill: TransitHunterColors.textColorProperty,
      maxWidth: width,
      left: 0,
      bottom: SKY_VIEW_NODE_SETTINGS.TITLE_BOTTOM,
    });

    const star = new StarNode(SUN_TEMPERATURE_K, starRadius, { x: cx, y: cy, glowScale: 1.25 });
    const occluder = new StarNode(SUN_TEMPERATURE_K, starRadius, { x: cx, y: cy, glow: false });
    const chord = new Line(0, 0, width, 0, {
      stroke: TransitHunterColors.chordColorProperty,
      lineDash: [SKY_VIEW_NODE_SETTINGS.CHORD_LINE_DASH_DASH, SKY_VIEW_NODE_SETTINGS.CONSTRUCTOR_CHORD_LINE_DASH_DASH],
      lineWidth: SKY_VIEW_NODE_SETTINGS.CHORD_LINE_WIDTH,
    });
    const planet = new PlanetNode();

    const farAbove = new Node({
      children: [
        new ArrowNode(cx, SKY_VIEW_NODE_SETTINGS.FAR_ABOVE_START_Y, cx, SKY_VIEW_NODE_SETTINGS.FAR_ABOVE_END_Y, {
          fill: TransitHunterColors.planetColorProperty,
          stroke: null,
          headHeight: SKY_VIEW_NODE_SETTINGS.FAR_ABOVE_HEAD_HEIGHT,
          headWidth: SKY_VIEW_NODE_SETTINGS.FAR_ABOVE_HEAD_WIDTH,
          tailWidth: SKY_VIEW_NODE_SETTINGS.FAR_ABOVE_TAIL_WIDTH,
        }),
      ],
    });
    const farAboveText = new RichText(
      new PatternStringProperty(strings.passesAbovePatternStringProperty, {
        value: new DerivedProperty([model.impactParameterProperty], (b) =>
          formatSignificant(b, SKY_VIEW_NODE_SETTINGS.FAR_ABOVE_TEXT_DIGITS),
        ),
      }),
      {
        font: FONTS.SMALL,
        fill: TransitHunterColors.textColorProperty,
        maxWidth: width / 2 - SKY_VIEW_NODE_SETTINGS.FAR_ABOVE_TEXT_MAX_WIDTH_OFFSET,
      },
    );
    linkUntilDisposed(this, farAboveText.boundsProperty, () => {
      farAboveText.left = cx + SKY_VIEW_NODE_SETTINGS.CONSTRUCTOR_LEFT_OFFSET;
      farAboveText.centerY = SKY_VIEW_NODE_SETTINGS.CENTER_Y_CENTER_Y;
    });
    farAbove.addChild(farAboveText);

    const magnificationText = new RichText("", {
      font: FONTS.SMALL,
      fill: TransitHunterColors.mutedTextColorProperty,
      maxWidth: width - SKY_VIEW_NODE_SETTINGS.MAGNIFICATION_TEXT_MAX_WIDTH_OFFSET,
    });

    const scene = new Node({
      children: [star, chord, planet, occluder, farAbove, magnificationText],
      clipArea: Shape.roundRect(
        0,
        0,
        width,
        height,
        SKY_VIEW_NODE_SETTINGS.SCENE_CORNER_X,
        SKY_VIEW_NODE_SETTINGS.SCENE_CORNER_Y,
      ),
    });
    this.children = [background, scene, title];

    const multilink = Multilink.multilinkAny(
      [
        model.cycleTimeProperty,
        model.geometryProperty,
        model.windowHalfWidthProperty,
        model.planetPresetProperty,
        common.planetMagnifiedPatternStringProperty,
        common.planetToScaleStringProperty,
      ],
      () => {
        const g = model.geometryProperty.value;
        const sky = skyPosition(model.phase(), g);
        const drawn = drawnPlanet(g.radiusRatio, starRadius);
        const overStar = sky.inFront && Math.hypot(sky.x, sky.y) < 1 + g.radiusRatio;
        planet.setAppearance(drawn.radius, model.planetPresetProperty.value, overStar);
        planet.x = cx + sky.x * starRadius;
        planet.y = cy - sky.y * starRadius;
        occluder.visible = !sky.inFront;

        const chordY = cy - model.impactParameterProperty.value * starRadius;
        const inFrame = chordY > drawn.radius;
        chord.visible = inFrame;
        chord.y1 = chordY;
        chord.y2 = chordY;
        farAbove.visible = !inFrame;

        magnificationText.string =
          drawn.factor > 1
            ? StringUtils.fillIn(common.planetMagnifiedPatternStringProperty.value, { factor: drawn.factor })
            : common.planetToScaleStringProperty.value;
        magnificationText.left = SKY_VIEW_NODE_SETTINGS.LEFT_LEFT;
        magnificationText.bottom = height - SKY_VIEW_NODE_SETTINGS.MULTILINK_BOTTOM_OFFSET;
      },
    );
    this.disposeEmitter.addListener(() => {
      multilink.dispose();
      star.dispose();
      occluder.dispose();
    });
  }
}

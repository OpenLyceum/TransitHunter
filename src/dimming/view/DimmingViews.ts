/**
 * DimmingViews.ts
 *
 * The two pictures of the Dimming screen, drawn at the same horizontal scale and
 * centred one above the other, so the planet sits at the same x in both:
 *
 *  - {@link SideViewNode}: the orbit seen from the side and a little above, with
 *    Earth toward the viewer (bottom). The planet passes in front of the star on
 *    the near half of its orbit and behind it on the far half.
 *  - {@link EarthViewNode}: what Earth would see through an impossibly sharp
 *    telescope, zoomed in on the star. The planet can be dragged (or moved with
 *    the arrow keys) along its orbit. In telescope view the star becomes a point.
 *
 * The orbit is far smaller than any real one (labelled). The planet keeps its
 * true size relative to the star unless that is under MIN_PLANET_RADIUS px, in
 * which case it is magnified by a labelled 1-2-5 factor.
 */

import { DerivedProperty, Multilink, PatternStringProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import { DragListener, KeyboardListener, Node, Path, Rectangle, RichText, Text } from "scenerystack/scenery";
import { ArrowNode } from "scenerystack/scenery-phet";
import { skyPosition } from "../../common/model/transitPhysics.js";
import { drawingMagnification } from "../../common/view/formatters.js";
import { PlanetNode } from "../../common/view/PlanetNode.js";
import { StarNode } from "../../common/view/StarNode.js";
import { StringManager } from "../../i18n/StringManager.js";
import TransitHunterColors from "../../TransitHunterColors.js";
import { FONTS } from "../../TransitHunterConstants.js";
import { DIMMING_ORBIT_IN_STAR_RADII, type DimmingModel } from "../model/DimmingModel.js";

/** Smallest drawn planet radius, px. */
const MIN_PLANET_RADIUS = 4;

/** Vertical squash of the orbit in the side view (seen from slightly above). */
const SIDE_VIEW_SQUASH = 0.28;

/** Glow of the zoomed-in stars, as a multiple of their radius. */
const GLOW_SCALE = 1.25;

/** Phase step of one arrow-key press, orbits. */
const KEYBOARD_PHASE_STEP = 0.005;

/** Drawn planet radius (px) and the magnification used, for a star drawn `starRadius` px. */
function drawnPlanet(radiusRatio: number, starRadius: number): { radius: number; factor: number } {
  const truePixels = radiusRatio * starRadius;
  const factor = drawingMagnification(truePixels, MIN_PLANET_RADIUS);
  return { radius: truePixels * factor, factor: factor };
}

/** A framed dark panel with a title above it. */
function framedScene(width: number, height: number, titleProperty: TReadOnlyProperty<string>) {
  const background = new Rectangle(0, 0, width, height, 6, 6, {
    fill: TransitHunterColors.spaceColorProperty,
    stroke: TransitHunterColors.spaceBorderColorProperty,
  });
  const title = new Text(titleProperty, {
    font: FONTS.TITLE,
    fill: TransitHunterColors.textColorProperty,
    maxWidth: width,
    left: 0,
    bottom: -4,
  });
  const scene = new Node({ clipArea: Shape.roundRect(0, 0, width, height, 6, 6) });
  return { background, title, scene };
}

export class SideViewNode extends Node {
  public constructor(
    model: DimmingModel,
    telescopeViewProperty: TReadOnlyProperty<boolean>,
    width: number,
    height: number,
    starRadius: number,
  ) {
    super();
    const strings = StringManager.getInstance().getDimmingStrings();
    const common = StringManager.getInstance().getCommonStrings();
    const { background, title, scene } = framedScene(width, height, strings.sideViewTitleStringProperty);

    const cx = width / 2;
    const cy = height / 2 - 8;
    const orbitRadius = DIMMING_ORBIT_IN_STAR_RADII * starRadius;

    const temperatureProperty = new DerivedProperty([model.starPresetProperty], (preset) => preset.temperatureK);
    const star = new StarNode(temperatureProperty, starRadius, { x: cx, y: cy, glowScale: GLOW_SCALE });

    // Far half of the orbit (behind the star) and near half (in front of it).
    const halfEllipse = (near: boolean): Shape =>
      new Shape().ellipticalArc(cx, cy, orbitRadius, orbitRadius * SIDE_VIEW_SQUASH, 0, 0, Math.PI, !near);
    const orbitStyle = { stroke: TransitHunterColors.orbitPathColorProperty, lineWidth: 1.5, lineDash: [5, 4] };
    const farOrbit = new Path(halfEllipse(false), orbitStyle);
    const nearOrbit = new Path(halfEllipse(true), orbitStyle);

    // The planet stays in one layer above the star; a glow-less copy of the star's disc covers it
    // while it is behind the star.
    const planet = new PlanetNode();
    const occluder = new StarNode(temperatureProperty, starRadius, { x: cx, y: cy, glow: false });

    const toEarth = new ArrowNode(cx, cy + orbitRadius * SIDE_VIEW_SQUASH + 8, cx, height - 22, {
      fill: TransitHunterColors.earthColorProperty,
      stroke: null,
      headHeight: 9,
      headWidth: 12,
      tailWidth: 3,
    });
    const toEarthLabel = new Text(common.toEarthStringProperty, {
      font: FONTS.SMALL,
      fill: TransitHunterColors.earthColorProperty,
      maxWidth: 120,
    });
    toEarthLabel.boundsProperty.link(() => {
      toEarthLabel.left = toEarth.right + 6;
      toEarthLabel.bottom = height - 8;
    });
    const notToScale = new RichText(strings.orbitNotToScaleStringProperty, {
      font: FONTS.SMALL,
      fill: TransitHunterColors.mutedTextColorProperty,
      lineWrap: 105,
      left: 8,
      top: 6,
    });

    scene.children = [farOrbit, star, planet, occluder, nearOrbit, toEarth, toEarthLabel, notToScale];

    const telescopeCaption = new RichText(common.telescopeCaptionStringProperty, {
      font: FONTS.LABEL,
      fill: TransitHunterColors.mutedTextColorProperty,
      lineWrap: width - 40,
    });
    telescopeCaption.boundsProperty.link(() => {
      telescopeCaption.center = background.center;
    });

    this.children = [background, scene, telescopeCaption, title];

    const multilink = Multilink.multilink(
      [model.phaseProperty, model.radiusRatioProperty, model.planetPresetProperty, telescopeViewProperty],
      (phase, k, preset, telescope) => {
        scene.visible = !telescope;
        telescopeCaption.visible = telescope;
        const theta = 2 * Math.PI * phase;
        const inFront = Math.cos(theta) > 0;
        planet.setAppearance(drawnPlanet(k, starRadius).radius, preset, false);
        planet.x = cx + orbitRadius * Math.sin(theta);
        planet.y = cy + orbitRadius * SIDE_VIEW_SQUASH * Math.cos(theta);
        occluder.visible = !inFront;
      },
    );
    this.disposeEmitter.addListener(() => {
      multilink.dispose();
      star.dispose();
      occluder.dispose();
      temperatureProperty.dispose();
    });
  }
}

export class EarthViewNode extends Node {
  /** The draggable, focusable planet (for the screen's pdomOrder). */
  public readonly planet: PlanetNode;

  public constructor(
    model: DimmingModel,
    telescopeViewProperty: TReadOnlyProperty<boolean>,
    width: number,
    height: number,
    starRadius: number,
  ) {
    super();
    const stringManager = StringManager.getInstance();
    const strings = stringManager.getDimmingStrings();
    const common = stringManager.getCommonStrings();
    const a11y = stringManager.getDimmingA11yStrings();
    const titleProperty = new DerivedProperty(
      [telescopeViewProperty, strings.earthViewTitleStringProperty, strings.telescopeViewTitleStringProperty],
      (telescope, zoomed, throughTelescope) => (telescope ? throughTelescope : zoomed),
    );
    const { background, title, scene } = framedScene(width, height, titleProperty);

    const cx = width / 2;
    const cy = height / 2;
    const temperatureProperty = new DerivedProperty([model.starPresetProperty], (preset) => preset.temperatureK);
    const star = new StarNode(temperatureProperty, starRadius, { x: cx, y: cy, glowScale: GLOW_SCALE });
    const pointStar = new StarNode(temperatureProperty, 5, { x: cx, y: cy });

    this.planet = new PlanetNode({ cursor: "pointer" });
    const planet = this.planet;
    // As in the side view: one planet layer, and a glow-less copy of the disc covers the planet behind the star.
    const occluder = new StarNode(temperatureProperty, starRadius, { x: cx, y: cy, glow: false });

    // ── Drag the planet along its orbit, or move it with the arrow keys ────────
    planet.addInputListener(
      new DragListener({
        start: () => {
          model.isDraggingProperty.value = true;
        },
        drag: (event) => {
          const local = scene.globalToLocalPoint(event.pointer.point);
          model.setSkyX((local.x - cx) / starRadius);
        },
        end: () => {
          model.isDraggingProperty.value = false;
        },
      }),
    );
    planet.tagName = "div";
    planet.focusable = true;
    planet.accessibleName = a11y.controls.movePlanetStringProperty;
    planet.addInputListener(
      new KeyboardListener({
        keys: ["arrowLeft", "arrowRight"],
        fireOnHold: true,
        fire: (_event, keysPressed) => {
          // On the near side the planet moves left to right as the phase grows.
          model.advance(keysPressed === "arrowRight" ? KEYBOARD_PHASE_STEP : -KEYBOARD_PHASE_STEP);
        },
      }),
    );

    const magnifiedProperty = new DerivedProperty(
      [model.radiusRatioProperty],
      (k) => drawnPlanet(k, starRadius).factor,
    );
    const magnificationText = new RichText(
      new DerivedProperty(
        [
          magnifiedProperty,
          new PatternStringProperty(common.planetMagnifiedPatternStringProperty, { factor: magnifiedProperty }),
          common.planetToScaleStringProperty,
        ],
        (factor, magnified, toScale) => (factor > 1 ? magnified : toScale),
      ),
      { font: FONTS.SMALL, fill: TransitHunterColors.mutedTextColorProperty, maxWidth: width - 16 },
    );
    magnificationText.boundsProperty.link(() => {
      magnificationText.left = 8;
      magnificationText.bottom = height - 6;
    });
    const dragHint = new Text(strings.dragHintStringProperty, {
      font: FONTS.SMALL,
      fill: TransitHunterColors.mutedTextColorProperty,
      maxWidth: width - 16,
    });
    dragHint.boundsProperty.link(() => {
      dragHint.left = 8;
      dragHint.top = 6;
    });

    const detail = new Node({ children: [star, planet, occluder, magnificationText, dragHint] });
    scene.children = [detail, pointStar];

    this.children = [background, scene, title];

    const multilink = Multilink.multilink(
      [model.phaseProperty, model.radiusRatioProperty, model.planetPresetProperty, telescopeViewProperty],
      (phase, k, preset, telescope) => {
        detail.visible = !telescope;
        pointStar.visible = telescope;
        planet.pickable = !telescope;
        planet.focusable = !telescope;
        const sky = skyPosition(phase, model.geometry(k));
        const overStar = sky.inFront && Math.abs(sky.x) < 1 + k;
        planet.setAppearance(drawnPlanet(k, starRadius).radius, preset, overStar);
        planet.x = cx + sky.x * starRadius;
        planet.y = cy - sky.y * starRadius;
        occluder.visible = !sky.inFront;
      },
    );
    this.disposeEmitter.addListener(() => {
      multilink.dispose();
      star.dispose();
      occluder.dispose();
      pointStar.dispose();
      magnifiedProperty.dispose();
      temperatureProperty.dispose();
      titleProperty.dispose();
    });
  }
}

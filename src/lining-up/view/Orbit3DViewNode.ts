import { ORBIT3_D_VIEW_NODE_SETTINGS } from "../../TransitHunterConstants.js";
/**
 * Orbit3DViewNode.ts
 *
 * The orbit drawn in 3-D (orthographic projection, plain scenery Paths), seen by
 * a camera the user rotates by dragging or with the arrow keys. The orbit is
 * fixed; the "To Earth" arrow tilts with the inclination, because what changes
 * is where we stand. The arrow is green when Earth sees transits, grey when it
 * does not. Adapted from StellarWobble's Orbit3DViewNode.
 *
 * Geometry: the orbit lies in the model x–y plane; Earth is in the direction
 * (sin i, 0, cos i), so at phase 0 (θ = 0, the +x side) the planet is nearest
 * Earth: mid-transit when it transits.
 *
 * Not to scale: the orbit has a fixed drawn size and the star and planet are
 * drawn much larger than they would be.
 *
 * Near transit the planet sits on the Earth arrow, so it gets a dark halo that
 * separates it from the arrow and a "Planet" label just below it. Between
 * transits it goes round the orbit fast-forwarded, which a note says.
 */

import { Multilink, NumberProperty } from "scenerystack/axon";
import { Range, Vector2, Vector3 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Circle, DragListener, KeyboardListener, Line, Node, Path, Rectangle, Text } from "scenerystack/scenery";
import { ArrowNode } from "scenerystack/scenery-phet";
import { linkUntilDisposed } from "../../common/view/linkUntilDisposed.js";
import { PlanetNode } from "../../common/view/PlanetNode.js";
import { StarNode } from "../../common/view/StarNode.js";
import { StringManager } from "../../i18n/StringManager.js";
import TransitHunterColors from "../../TransitHunterColors.js";
import { FONTS, SUN_TEMPERATURE_K } from "../../TransitHunterConstants.js";
import type { LiningUpModel } from "../model/LiningUpModel.js";

const DEG = Math.PI / 180;

/** Drawn orbit radius, star radius and planet radius, px. */
const ORBIT_RADIUS: number = ORBIT3_D_VIEW_NODE_SETTINGS.ORBIT_RADIUS;
const STAR_RADIUS: number = ORBIT3_D_VIEW_NODE_SETTINGS.STAR_RADIUS;
const PLANET_RADIUS: number = ORBIT3_D_VIEW_NODE_SETTINGS.PLANET_RADIUS;

/** Width of the dark ring around the planet that separates it from the Earth arrow, px. */
const PLANET_HALO_WIDTH: number = ORBIT3_D_VIEW_NODE_SETTINGS.PLANET_HALO_WIDTH;

/** Gap between the planet and its label, px. */
const PLANET_LABEL_GAP: number = ORBIT3_D_VIEW_NODE_SETTINGS.PLANET_LABEL_GAP;

/** Length of the Earth arrow, px. */
const EARTH_ARROW_LENGTH: number = ORBIT3_D_VIEW_NODE_SETTINGS.EARTH_ARROW_LENGTH;

const ORBIT_SAMPLES: number = ORBIT3_D_VIEW_NODE_SETTINGS.ORBIT_SAMPLES;

/** Camera elevation range (degrees above the orbital plane) and keyboard step. */
const ELEVATION_RANGE = new Range(
  ORBIT3_D_VIEW_NODE_SETTINGS.ELEVATION_RANGE_MIN,
  ORBIT3_D_VIEW_NODE_SETTINGS.ELEVATION_RANGE_MAX,
);
const KEYBOARD_STEP_DEG: number = ORBIT3_D_VIEW_NODE_SETTINGS.KEYBOARD_STEP_DEG;
const DRAG_DEG_PER_PX: number = ORBIT3_D_VIEW_NODE_SETTINGS.DRAG_DEG_PER_PX;

/** Initial camera: 20° above the orbital plane, side-on to the edge-on Earth direction (+x). */
const INITIAL_ELEVATION: number = ORBIT3_D_VIEW_NODE_SETTINGS.INITIAL_ELEVATION;
const INITIAL_AZIMUTH = 0;

/** Projected point: screen offset from the view centre (y down) and depth (toward the camera > 0). */
type Projected = { point: Vector2; depth: number };

export class Orbit3DViewNode extends Node {
  /** Camera elevation above the orbital plane, degrees. */
  public readonly cameraElevationProperty = new NumberProperty(INITIAL_ELEVATION, { range: ELEVATION_RANGE });

  /** Camera azimuth about the orbit normal, degrees. */
  public readonly cameraAzimuthProperty = new NumberProperty(INITIAL_AZIMUTH);

  public constructor(model: LiningUpModel, width: number, height: number) {
    super();
    const stringManager = StringManager.getInstance();
    const strings = stringManager.getLiningUpStrings();
    const common = stringManager.getCommonStrings();
    const a11y = stringManager.getLiningUpA11yStrings();
    const center = new Vector2(width / 2, height / 2 + 10);

    const background = new Rectangle(
      0,
      0,
      width,
      height,
      ORBIT3_D_VIEW_NODE_SETTINGS.BACKGROUND_CORNER_X,
      ORBIT3_D_VIEW_NODE_SETTINGS.BACKGROUND_CORNER_Y,
      {
        fill: TransitHunterColors.spaceColorProperty,
        stroke: TransitHunterColors.spaceBorderColorProperty,
        cursor: "grab",
      },
    );
    const title = new Text(strings.view3DTitleStringProperty, {
      font: FONTS.TITLE,
      fill: TransitHunterColors.textColorProperty,
      maxWidth: width,
      left: 0,
      bottom: ORBIT3_D_VIEW_NODE_SETTINGS.TITLE_BOTTOM,
    });
    const notToScale = new Text(common.notToScaleStringProperty, {
      font: FONTS.SMALL,
      fill: TransitHunterColors.mutedTextColorProperty,
      maxWidth: width / 2,
      left: ORBIT3_D_VIEW_NODE_SETTINGS.NOT_TO_SCALE_LEFT,
      top: ORBIT3_D_VIEW_NODE_SETTINGS.NOT_TO_SCALE_TOP,
    });
    const rotateHint = new Text(strings.rotateHintStringProperty, {
      font: FONTS.SMALL,
      fill: TransitHunterColors.mutedTextColorProperty,
      maxWidth: width - ORBIT3_D_VIEW_NODE_SETTINGS.ROTATE_HINT_MAX_WIDTH_OFFSET,
    });
    linkUntilDisposed(this, rotateHint.boundsProperty, () => {
      rotateHint.left = ORBIT3_D_VIEW_NODE_SETTINGS.LEFT_LEFT;
      rotateHint.bottom = height - ORBIT3_D_VIEW_NODE_SETTINGS.CONSTRUCTOR_BOTTOM_OFFSET;
    });
    const spedUpNote = new Text(strings.spedUpBetweenTransitsStringProperty, {
      font: FONTS.SMALL,
      fill: TransitHunterColors.mutedTextColorProperty,
      maxWidth: width / 2 - ORBIT3_D_VIEW_NODE_SETTINGS.SPED_UP_NOTE_MAX_WIDTH_OFFSET,
    });
    linkUntilDisposed(this, spedUpNote.boundsProperty, () => {
      spedUpNote.right = width - ORBIT3_D_VIEW_NODE_SETTINGS.CONSTRUCTOR_RIGHT_OFFSET;
      spedUpNote.top = ORBIT3_D_VIEW_NODE_SETTINGS.TOP_TOP;
    });
    linkUntilDisposed(this, model.fastForwardingProperty, (fastForwarding) => {
      spedUpNote.visible = fastForwarding;
    });

    const planeFill = new Path(null, {
      fill: TransitHunterColors.orbitPathColorProperty,
      opacity: ORBIT3_D_VIEW_NODE_SETTINGS.PLANE_FILL_OPACITY,
    });
    const orbit = new Path(null, {
      stroke: TransitHunterColors.orbitPathColorProperty,
      lineDash: [ORBIT3_D_VIEW_NODE_SETTINGS.ORBIT_LINE_DASH_DASH, ORBIT3_D_VIEW_NODE_SETTINGS.ORBIT_LINE_DASH_DASH],
    });
    const normalLine = new Line(0, 0, 0, 0, {
      stroke: TransitHunterColors.orbitPathColorProperty,
      lineDash: [1, ORBIT3_D_VIEW_NODE_SETTINGS.NORMAL_LINE_LINE_DASH_DASH],
    });
    const star = new StarNode(SUN_TEMPERATURE_K, STAR_RADIUS);
    const planet = new PlanetNode();
    const planetHalo = new Circle(PLANET_RADIUS + PLANET_HALO_WIDTH, { fill: TransitHunterColors.spaceColorProperty });
    const planetLabel = new Text(common.planetStringProperty, {
      font: FONTS.SMALL,
      fill: TransitHunterColors.textColorProperty,
      maxWidth: ORBIT3_D_VIEW_NODE_SETTINGS.PLANET_LABEL_MAX_WIDTH,
    });
    const planetGroup = new Node({ children: [planetHalo, planet, planetLabel] });

    const earthArrow = new ArrowNode(0, 0, 1, 0, {
      stroke: null,
      headHeight: ORBIT3_D_VIEW_NODE_SETTINGS.EARTH_ARROW_HEAD_HEIGHT,
      headWidth: ORBIT3_D_VIEW_NODE_SETTINGS.EARTH_ARROW_HEAD_WIDTH,
      tailWidth: ORBIT3_D_VIEW_NODE_SETTINGS.EARTH_ARROW_TAIL_WIDTH,
    });
    const earthLabel = new Text(common.toEarthStringProperty, {
      font: FONTS.LABEL,
      maxWidth: ORBIT3_D_VIEW_NODE_SETTINGS.EARTH_LABEL_MAX_WIDTH,
    });

    const bodies = new Node({ children: [planetGroup, star] });
    const scene = new Node({ children: [planeFill, normalLine, orbit, earthArrow, earthLabel, bodies] });

    const update = (): void => {
      const elevation = this.cameraElevationProperty.value * DEG;
      const azimuth = this.cameraAzimuthProperty.value * DEG;
      const sinE = Math.sin(elevation);
      const cosE = Math.cos(elevation);
      const c = Math.cos(-azimuth);
      const s = Math.sin(-azimuth);
      const project = (p: Vector3): Projected => {
        // Rotate the camera azimuth away, then view from (0, −cos e, sin e).
        const x = p.x * c - p.y * s;
        const y = p.x * s + p.y * c;
        const up = y * sinE + p.z * cosE;
        return { point: center.plusXY(x, -up), depth: -y * cosE + p.z * sinE };
      };
      const circle = (radius: number): Shape => {
        const shape = new Shape();
        for (let i = 0; i <= ORBIT_SAMPLES; i++) {
          const angle = (2 * Math.PI * i) / ORBIT_SAMPLES;
          const { point } = project(new Vector3(radius * Math.cos(angle), radius * Math.sin(angle), 0));
          i === 0 ? shape.moveToPoint(point) : shape.lineToPoint(point);
        }
        return shape.close();
      };
      planeFill.shape = circle(ORBIT_RADIUS * 1.15);
      orbit.shape = circle(ORBIT_RADIUS);
      const normalTip = project(new Vector3(0, 0, 60)).point;
      normalLine.setLine(center.x, center.y, normalTip.x, normalTip.y);

      const theta = 2 * Math.PI * model.phase();
      const planetProjected = project(new Vector3(ORBIT_RADIUS * Math.cos(theta), ORBIT_RADIUS * Math.sin(theta), 0));
      planet.setAppearance(PLANET_RADIUS, model.planetPresetProperty.value, false);
      planet.center = planetProjected.point;
      planetHalo.center = planetProjected.point;
      planetLabel.centerTop = planet.centerBottom.plusXY(0, PLANET_HALO_WIDTH + PLANET_LABEL_GAP);
      star.center = center;
      if (planetProjected.depth < 0) {
        planetGroup.moveToBack();
      } else {
        planetGroup.moveToFront();
      }

      const inclination = model.inclinationProperty.value * DEG;
      const toEarth = new Vector3(Math.sin(inclination), 0, Math.cos(inclination));
      const earthTip = project(toEarth.timesScalar(EARTH_ARROW_LENGTH)).point;
      earthArrow.setTailAndTip(center.x, center.y, earthTip.x, earthTip.y);
      const color = model.transitsProperty.value
        ? TransitHunterColors.earthColorProperty
        : TransitHunterColors.mutedTextColorProperty;
      earthArrow.fill = color;
      earthLabel.fill = color;
      const outward = earthTip.minus(center);
      const labelOffset =
        outward.magnitude > 1
          ? outward.normalized().timesScalar(20).plusXY(0, ORBIT3_D_VIEW_NODE_SETTINGS.LABEL_OFFSET_Y_OFFSET)
          : new Vector2(0, ORBIT3_D_VIEW_NODE_SETTINGS.LABEL_OFFSET_Y);
      earthLabel.center = earthTip.plus(labelOffset);
      // Keep the label inside the frame.
      earthLabel.left = Math.max(earthLabel.left, ORBIT3_D_VIEW_NODE_SETTINGS.UPDATE_LEFT);
      earthLabel.right = Math.min(earthLabel.right, width - ORBIT3_D_VIEW_NODE_SETTINGS.UPDATE_RIGHT_OFFSET);
      earthLabel.top = Math.max(earthLabel.top, ORBIT3_D_VIEW_NODE_SETTINGS.UPDATE_TOP);
      earthLabel.bottom = Math.min(earthLabel.bottom, height - ORBIT3_D_VIEW_NODE_SETTINGS.UPDATE_BOTTOM_OFFSET);
    };

    const multilink = Multilink.multilinkAny(
      [
        this.cameraElevationProperty,
        this.cameraAzimuthProperty,
        model.cycleTimeProperty,
        model.windowHalfWidthProperty,
        model.inclinationProperty,
        model.planetPresetProperty,
        model.transitsProperty,
        planetLabel.localBoundsProperty, // re-centre the label when its text changes
      ],
      update,
    );

    // ── Rotate by dragging or with the arrow keys ─────────────────────────────
    let previousPoint: Vector2 | null = null;
    background.addInputListener(
      new DragListener({
        start: (event) => {
          previousPoint = event.pointer.point.copy();
        },
        drag: (event) => {
          if (previousPoint) {
            const delta = event.pointer.point.minus(previousPoint);
            this.rotateCamera(-delta.x * DRAG_DEG_PER_PX, delta.y * DRAG_DEG_PER_PX);
          }
          previousPoint = event.pointer.point.copy();
        },
        end: () => {
          previousPoint = null;
        },
      }),
    );
    this.tagName = "div";
    this.focusable = true;
    this.accessibleName = a11y.controls.rotateViewStringProperty;
    this.addInputListener(
      new KeyboardListener({
        keys: ["arrowLeft", "arrowRight", "arrowUp", "arrowDown"],
        fireOnHold: true,
        fire: (_event, keysPressed) => {
          if (keysPressed === "arrowLeft") {
            this.rotateCamera(KEYBOARD_STEP_DEG, 0);
          } else if (keysPressed === "arrowRight") {
            this.rotateCamera(-KEYBOARD_STEP_DEG, 0);
          } else if (keysPressed === "arrowUp") {
            this.rotateCamera(0, KEYBOARD_STEP_DEG);
          } else {
            this.rotateCamera(0, -KEYBOARD_STEP_DEG);
          }
        },
      }),
    );

    this.children = [background, scene, title, notToScale, spedUpNote, rotateHint];
    scene.clipArea = Shape.roundRect(
      0,
      0,
      width,
      height,
      ORBIT3_D_VIEW_NODE_SETTINGS.CLIP_AREA_CORNER_X,
      ORBIT3_D_VIEW_NODE_SETTINGS.CLIP_AREA_CORNER_Y,
    );
    scene.pickable = false;

    this.disposeEmitter.addListener(() => {
      multilink.dispose();
      star.dispose();
    });
  }

  /** Rotates the camera by these angles, degrees (elevation is clamped). */
  public rotateCamera(azimuthDelta: number, elevationDelta: number): void {
    this.cameraAzimuthProperty.value = (this.cameraAzimuthProperty.value + azimuthDelta + 360) % 360;
    this.cameraElevationProperty.value = ELEVATION_RANGE.constrainValue(
      this.cameraElevationProperty.value + elevationDelta,
    );
  }

  /** Returns the camera to its initial position. */
  public resetCamera(): void {
    this.cameraElevationProperty.reset();
    this.cameraAzimuthProperty.reset();
  }
}

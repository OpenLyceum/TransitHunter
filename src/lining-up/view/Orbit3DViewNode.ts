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
 */

import { Multilink, NumberProperty } from "scenerystack/axon";
import { Range, Vector2, Vector3 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { DragListener, KeyboardListener, Line, Node, Path, Rectangle, Text } from "scenerystack/scenery";
import { ArrowNode } from "scenerystack/scenery-phet";
import { PlanetNode } from "../../common/view/PlanetNode.js";
import { StarNode } from "../../common/view/StarNode.js";
import { StringManager } from "../../i18n/StringManager.js";
import TransitHunterColors from "../../TransitHunterColors.js";
import { FONTS, SUN_TEMPERATURE_K } from "../../TransitHunterConstants.js";
import type { LiningUpModel } from "../model/LiningUpModel.js";

const DEG = Math.PI / 180;

/** Drawn orbit radius, star radius and planet radius, px. */
const ORBIT_RADIUS = 105;
const STAR_RADIUS = 14;
const PLANET_RADIUS = 5;

/** Length of the Earth arrow, px. */
const EARTH_ARROW_LENGTH = 140;

const ORBIT_SAMPLES = 90;

/** Camera elevation range (degrees above the orbital plane) and keyboard step. */
const ELEVATION_RANGE = new Range(-85, 85);
const KEYBOARD_STEP_DEG = 5;
const DRAG_DEG_PER_PX = 0.5;

/** Initial camera: 20° above the orbital plane, side-on to the edge-on Earth direction (+x). */
const INITIAL_ELEVATION = 20;
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

    const background = new Rectangle(0, 0, width, height, 6, 6, {
      fill: TransitHunterColors.spaceColorProperty,
      stroke: TransitHunterColors.spaceBorderColorProperty,
      cursor: "grab",
    });
    const title = new Text(strings.view3DTitleStringProperty, {
      font: FONTS.TITLE,
      fill: TransitHunterColors.textColorProperty,
      maxWidth: width,
      left: 0,
      bottom: -4,
    });
    const notToScale = new Text(common.notToScaleStringProperty, {
      font: FONTS.SMALL,
      fill: TransitHunterColors.mutedTextColorProperty,
      maxWidth: width / 2,
      left: 8,
      top: 6,
    });
    const rotateHint = new Text(strings.rotateHintStringProperty, {
      font: FONTS.SMALL,
      fill: TransitHunterColors.mutedTextColorProperty,
      maxWidth: width - 16,
    });
    rotateHint.boundsProperty.link(() => {
      rotateHint.left = 8;
      rotateHint.bottom = height - 6;
    });

    const planeFill = new Path(null, { fill: TransitHunterColors.orbitPathColorProperty, opacity: 0.12 });
    const orbit = new Path(null, { stroke: TransitHunterColors.orbitPathColorProperty, lineDash: [4, 4] });
    const normalLine = new Line(0, 0, 0, 0, { stroke: TransitHunterColors.orbitPathColorProperty, lineDash: [1, 4] });
    const star = new StarNode(SUN_TEMPERATURE_K, STAR_RADIUS);
    const planet = new PlanetNode();

    const earthArrow = new ArrowNode(0, 0, 1, 0, {
      stroke: null,
      headHeight: 12,
      headWidth: 14,
      tailWidth: 4,
    });
    const earthLabel = new Text(common.toEarthStringProperty, { font: FONTS.LABEL, maxWidth: 90 });

    const bodies = new Node({ children: [planet, star] });
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
      star.center = center;
      if (planetProjected.depth < 0) {
        planet.moveToBack();
      } else {
        planet.moveToFront();
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
        outward.magnitude > 1 ? outward.normalized().timesScalar(20).plusXY(0, -12) : new Vector2(0, -18);
      earthLabel.center = earthTip.plus(labelOffset);
      // Keep the label inside the frame.
      earthLabel.left = Math.max(earthLabel.left, 4);
      earthLabel.right = Math.min(earthLabel.right, width - 4);
      earthLabel.top = Math.max(earthLabel.top, 4);
      earthLabel.bottom = Math.min(earthLabel.bottom, height - 4);
    };

    const multilink = Multilink.multilinkAny(
      [
        this.cameraElevationProperty,
        this.cameraAzimuthProperty,
        model.windowTimeProperty,
        model.windowHalfWidthProperty,
        model.inclinationProperty,
        model.planetPresetProperty,
        model.transitsProperty,
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

    this.children = [background, scene, title, notToScale, rotateHint];
    scene.clipArea = Shape.roundRect(0, 0, width, height, 6, 6);
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

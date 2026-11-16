/**
 * TransitHunterScreenIcons.ts
 *
 * Programmatic home-screen / navigation-bar icons for each screen, drawn on the
 * standard 548 × 373 canvas with TransitHunterColors.
 *
 *  - Dimming: a planet's silhouette on its star, over a light curve with a dip.
 *  - Lining Up: a tilted orbit and the arrow toward Earth.
 *  - Light Curve: noisy measurements with three dips and the model curve.
 *  - Planet Hunt: folded measurements whose averages reveal a dip, and the depth line.
 *  - Rock or Gas?: a giant planet floating in water and a small rocky planet sunk to the bottom.
 */
import { Shape } from "scenerystack/kite";
import { Circle, Line, Node, Path, Rectangle } from "scenerystack/scenery";
import { ArrowNode } from "scenerystack/scenery-phet";
import { ScreenIcon } from "scenerystack/sim";
import TransitHunterColors from "../TransitHunterColors.js";
import { SUN_TEMPERATURE_K, TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS } from "../TransitHunterConstants.js";
import { StarNode } from "./view/StarNode.js";

const W = 548;
const H = 373;

function background(): Rectangle {
  return new Rectangle(0, 0, W, H, { fill: TransitHunterColors.spaceColorProperty });
}

function iconFrom(...children: Node[]): ScreenIcon {
  return new ScreenIcon(new Node({ children: [background(), ...children], clipArea: Shape.rect(0, 0, W, H) }), {
    maxIconWidthProportion: 1,
    maxIconHeightProportion: 1,
    fill: TransitHunterColors.spaceColorProperty,
  });
}

/** Repeatable pseudo-random numbers (the icons must look the same every time). */
function pseudoRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/** Approximately normal noise from a uniform source (sum of three). */
function noise(random: () => number): number {
  return random() + random() + random() - 1.5;
}

/** Brightness of a box-shaped dip with rounded edges, 0 outside, 1 at the bottom. */
function dipShape(x: number, centre: number, halfWidth: number): number {
  const d = Math.abs(x - centre) / halfWidth;
  return d >= 1 ? 0 : d < 0.7 ? 1 : (1 - d) / 0.3;
}

/** A line through y = f(x) for x in [x0, x1]. */
function curve(x0: number, x1: number, f: (x: number) => number): Shape {
  const shape = new Shape().moveTo(x0, f(x0));
  for (let x = x0 + 2; x <= x1; x += 2) {
    shape.lineTo(x, f(x));
  }
  return shape;
}

/** Dots at (x, f(x) + scatter). */
function dots(x0: number, x1: number, step: number, f: (x: number) => number, scatter: number, seed: number): Path {
  const random = pseudoRandom(seed);
  const shape = new Shape();
  for (let x = x0; x <= x1; x += step) {
    shape.circle(x, f(x) + scatter * noise(random), TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.DOTS_RADIUS);
    shape.newSubpath();
  }
  return new Path(shape, { fill: TransitHunterColors.measurementColorProperty });
}

export function createDimmingIcon(): ScreenIcon {
  const star = new StarNode(SUN_TEMPERATURE_K, 105, {
    x: W / 2,
    y: TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.STAR_Y,
    glowScale: 1.3,
  });
  const planet = new Circle(TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.PLANET_RADIUS, {
    fill: TransitHunterColors.planetSilhouetteColorProperty,
    stroke: TransitHunterColors.jupiterPlanetColorProperty,
    lineWidth: TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.PLANET_LINE_WIDTH,
    x: W / 2 + TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.PLANET_X_OFFSET,
    y: TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.PLANET_Y,
  });
  const lightCurve = new Path(
    curve(
      40,
      W - 40,
      (x) => 320 + 34 * dipShape(x, W / 2 + 35, TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.LIGHT_CURVE_HALF_WIDTH),
    ),
    {
      stroke: TransitHunterColors.lightCurveColorProperty,
      lineWidth: TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.LIGHT_CURVE_LINE_WIDTH,
      lineJoin: "round",
    },
  );
  return iconFrom(star, planet, lightCurve);
}

export function createLiningUpIcon(): ScreenIcon {
  const cx = W / 2 - 20;
  const cy = H / 2 - 10;
  const orbit = new Path(
    new Shape().ellipse(
      cx,
      cy,
      TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.ORBIT_RADIUS_X,
      TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.ORBIT_RADIUS_Y,
      TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.ORBIT_ROTATION,
    ),
    {
      stroke: TransitHunterColors.orbitPathColorProperty,
      lineWidth: TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.ORBIT_LINE_WIDTH,
      lineDash: [
        TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.ORBIT_LINE_DASH_DASH,
        TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.CREATE_LINING_UP_ICON_ORBIT_LINE_DASH_DASH,
      ],
    },
  );
  const star = new StarNode(SUN_TEMPERATURE_K, 34, { x: cx, y: cy });
  const planet = new Circle(TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.PLANET_RADIUS_SEGMENT_2, {
    fill: TransitHunterColors.jupiterPlanetColorProperty,
    x: cx + TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.CREATE_LINING_UP_ICON_PLANET_X_OFFSET,
    y: cy - 2,
  });
  const toEarth = new ArrowNode(cx, cy, W - 20, cy + 135, {
    fill: TransitHunterColors.earthColorProperty,
    stroke: null,
    headHeight: TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.TO_EARTH_HEAD_HEIGHT,
    headWidth: TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.TO_EARTH_HEAD_WIDTH,
    tailWidth: TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.TO_EARTH_TAIL_WIDTH,
  });
  return iconFrom(orbit, toEarth, star, planet);
}

export function createLightCurveIcon(): ScreenIcon {
  const level = 150;
  const depth = 120;
  const f = (x: number): number =>
    level +
    depth *
      (dipShape(x, 110, TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.F_HALF_WIDTH) +
        dipShape(x, 274, TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.F_HALF_WIDTH) +
        dipShape(x, 438, TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.F_HALF_WIDTH));
  return iconFrom(
    dots(20, W - 20, 7, f, 26, 7),
    new Path(curve(20, W - 20, f), {
      stroke: TransitHunterColors.lightCurveColorProperty,
      lineWidth: TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.CREATE_LIGHT_CURVE_ICON_LINE_WIDTH,
    }),
  );
}

export function createPlanetHuntIcon(): ScreenIcon {
  const level = 150;
  const f = (x: number): number =>
    level + 70 * dipShape(x, W / 2, TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.F_HALF_WIDTH_SEGMENT_2);
  return iconFrom(
    dots(20, W - 20, 3, f, 120, 11),
    new Path(curve(20, W - 20, f), {
      stroke: TransitHunterColors.lightCurveColorProperty,
      lineWidth: TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.CREATE_PLANET_HUNT_ICON_LINE_WIDTH,
    }),
    new Line(TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.CREATE_PLANET_HUNT_ICON_START_X, level + 70, W - 20, level + 70, {
      stroke: TransitHunterColors.answerCurveColorProperty,
      lineWidth: TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.CREATE_PLANET_HUNT_ICON_LINE_WIDTH_VARIANT_2,
      lineDash: [TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.CREATE_PLANET_HUNT_ICON_LINE_DASH_DASH, 12],
    }),
  );
}

export function createRockOrGasIcon(): ScreenIcon {
  const waterTop: number = TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.WATER_TOP;
  const water = new Rectangle(0, waterTop, W, H - waterTop, {
    fill: TransitHunterColors.neptunePlanetColorProperty,
    opacity: TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.WATER_OPACITY,
  });
  const waterLine = new Line(0, waterTop, W, waterTop, {
    stroke: TransitHunterColors.neptunePlanetColorProperty,
    lineWidth: TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.WATER_LINE_LINE_WIDTH,
  });
  // A banded giant floating, about two thirds above the water (Saturn's density is about 0.7 g/cm³).
  const giantRadius: number = TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.GIANT_RADIUS;
  const giantCentre = {
    x: TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.GIANT_CENTRE_X,
    y: waterTop - TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.GIANT_CENTRE_Y_OFFSET,
  };
  const bands = new Shape();
  for (const dy of [-55, -15, 25, 62]) {
    bands
      .moveTo(giantCentre.x - giantRadius, giantCentre.y + dy)
      .lineTo(giantCentre.x + giantRadius, giantCentre.y + dy);
  }
  const giant = new Node({
    children: [
      new Circle(giantRadius, {
        fill: TransitHunterColors.jupiterPlanetColorProperty,
        x: giantCentre.x,
        y: giantCentre.y,
      }),
      new Path(bands, {
        stroke: TransitHunterColors.planetSilhouetteColorProperty,
        lineWidth: TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.GIANT_LINE_WIDTH,
        opacity: TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.GIANT_OPACITY,
        clipArea: Shape.circle(giantCentre.x, giantCentre.y, giantRadius),
      }),
    ],
  });
  const rock = new Circle(TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.ROCK_RADIUS, {
    fill: TransitHunterColors.mutedTextColorProperty,
    stroke: TransitHunterColors.planetSilhouetteColorProperty,
    lineWidth: TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.ROCK_LINE_WIDTH,
    x: TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.ROCK_X,
    y: H - TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS.ROCK_Y_OFFSET,
  });
  return iconFrom(giant, water, waterLine, rock);
}

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
import { SUN_TEMPERATURE_K } from "../TransitHunterConstants.js";
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
    shape.circle(x, f(x) + scatter * noise(random), 3.2);
    shape.newSubpath();
  }
  return new Path(shape, { fill: TransitHunterColors.measurementColorProperty });
}

export function createDimmingIcon(): ScreenIcon {
  const star = new StarNode(SUN_TEMPERATURE_K, 105, { x: W / 2, y: 145, glowScale: 1.3 });
  const planet = new Circle(28, {
    fill: TransitHunterColors.planetSilhouetteColorProperty,
    stroke: TransitHunterColors.jupiterPlanetColorProperty,
    lineWidth: 3,
    x: W / 2 + 35,
    y: 160,
  });
  const lightCurve = new Path(
    curve(40, W - 40, (x) => 320 + 34 * dipShape(x, W / 2 + 35, 70)),
    { stroke: TransitHunterColors.lightCurveColorProperty, lineWidth: 8, lineJoin: "round" },
  );
  return iconFrom(star, planet, lightCurve);
}

export function createLiningUpIcon(): ScreenIcon {
  const cx = W / 2 - 20;
  const cy = H / 2 - 10;
  const orbit = new Path(new Shape().ellipse(cx, cy, 210, 62, -0.12), {
    stroke: TransitHunterColors.orbitPathColorProperty,
    lineWidth: 6,
    lineDash: [16, 12],
  });
  const star = new StarNode(SUN_TEMPERATURE_K, 34, { x: cx, y: cy });
  const planet = new Circle(16, { fill: TransitHunterColors.jupiterPlanetColorProperty, x: cx + 190, y: cy - 2 });
  const toEarth = new ArrowNode(cx, cy, W - 20, cy + 135, {
    fill: TransitHunterColors.earthColorProperty,
    stroke: null,
    headHeight: 44,
    headWidth: 50,
    tailWidth: 14,
  });
  return iconFrom(orbit, toEarth, star, planet);
}

export function createLightCurveIcon(): ScreenIcon {
  const level = 150;
  const depth = 120;
  const f = (x: number): number => level + depth * (dipShape(x, 110, 34) + dipShape(x, 274, 34) + dipShape(x, 438, 34));
  return iconFrom(
    dots(20, W - 20, 7, f, 26, 7),
    new Path(curve(20, W - 20, f), { stroke: TransitHunterColors.lightCurveColorProperty, lineWidth: 7 }),
  );
}

export function createPlanetHuntIcon(): ScreenIcon {
  const level = 150;
  const f = (x: number): number => level + 70 * dipShape(x, W / 2, 110);
  return iconFrom(
    dots(20, W - 20, 3, f, 120, 11),
    new Path(curve(20, W - 20, f), { stroke: TransitHunterColors.lightCurveColorProperty, lineWidth: 10 }),
    new Line(20, level + 70, W - 20, level + 70, {
      stroke: TransitHunterColors.answerCurveColorProperty,
      lineWidth: 6,
      lineDash: [22, 12],
    }),
  );
}

export function createRockOrGasIcon(): ScreenIcon {
  const waterTop = 200;
  const water = new Rectangle(0, waterTop, W, H - waterTop, {
    fill: TransitHunterColors.neptunePlanetColorProperty,
    opacity: 0.45,
  });
  const waterLine = new Line(0, waterTop, W, waterTop, {
    stroke: TransitHunterColors.neptunePlanetColorProperty,
    lineWidth: 5,
  });
  // A banded giant floating, about two thirds above the water (Saturn's density is about 0.7 g/cm³).
  const giantRadius = 100;
  const giantCentre = { x: 210, y: waterTop - 30 };
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
        lineWidth: 9,
        opacity: 0.25,
        clipArea: Shape.circle(giantCentre.x, giantCentre.y, giantRadius),
      }),
    ],
  });
  const rock = new Circle(30, {
    fill: TransitHunterColors.mutedTextColorProperty,
    stroke: TransitHunterColors.planetSilhouetteColorProperty,
    lineWidth: 3,
    x: 430,
    y: H - 34,
  });
  return iconFrom(giant, water, waterLine, rock);
}

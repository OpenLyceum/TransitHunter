/**
 * TransitHunterConstants.ts
 *
 * Every named numeric constant used across the simulation: physical constants
 * and parameter ranges (SI unless the name says otherwise), and layout values
 * in screen pixels. Colours live in TransitHunterColors.ts.
 */

import { Range } from "scenerystack/dot";
import { PhetFont } from "scenerystack/scenery-phet";
import TransitHunterNamespace from "./TransitHunterNamespace.js";

// ── Physical constants (SI) ───────────────────────────────────────────────────

/** Newtonian gravitational constant, m³ kg⁻¹ s⁻². */
export const G_SI = 6.674e-11;

/** Solar mass, kg. */
export const SUN_MASS_KG = 1.989e30;

/** Jupiter mass, kg. */
export const JUPITER_MASS_KG = 1.898e27;

/** Earth mass, kg. */
export const EARTH_MASS_KG = 5.972e24;

/** Solar radius (nominal, IAU 2015), m. */
export const SUN_RADIUS_M = 6.957e8;

/** Jupiter equatorial radius, m. */
export const JUPITER_RADIUS_M = 7.1492e7;

/** Earth mean radius, m. */
export const EARTH_RADIUS_M = 6.371e6;

/** Astronomical unit, m. */
export const AU_M = 1.496e11;

/** One day, s. */
export const DAY_S = 86_400;

/** Solar effective temperature, K. */
export const SUN_TEMPERATURE_K = 5772;

/** Earth's mean density, g/cm³. */
export const EARTH_DENSITY_G_CM3 = 5.514;

/** Density of liquid water, g/cm³ (the "would it float?" line). */
export const WATER_DENSITY_G_CM3 = 1;

/**
 * Quadratic limb-darkening coefficients I(μ)/I(1) = 1 − u₁(1 − μ) − u₂(1 − μ)².
 * Typical visible-light values for a Sun-like star (close to the Kepler-band
 * values for T ≈ 5800 K); used for every star, which is an approximation.
 */
export const LIMB_DARKENING_U1 = 0.4;
export const LIMB_DARKENING_U2 = 0.26;

/** Rings used when integrating the limb-darkened flux blocked by the planet. */
export const LIMB_DARKENING_RINGS = 200;

// ── Shared model ranges (display units) ───────────────────────────────────────

/** Wall-clock seconds for one orbit at normal speed (the clock is scaled per orbit). */
export const SECONDS_PER_ORBIT = 8;

/** Speed multipliers of the time control. */
export const SLOW_SPEED_FACTOR = 0.25;
export const FAST_SPEED_FACTOR = 3;

/** Planet radius, Earth radii (Mars-size up to a large hot Jupiter). */
export const PLANET_RADIUS_RANGE = new Range(0.5, 25);

/** Star radius, solar radii (red dwarf up to a subgiant). */
export const STAR_RADIUS_RANGE = new Range(0.1, 2.5);

/** Star mass, solar masses. */
export const STAR_MASS_RANGE = new Range(0.1, 2);

/** Star–planet distance, AU. */
export const DISTANCE_RANGE = new Range(0.01, 2);

/** Inclination, degrees (90 = edge-on, where the planet crosses the middle of the star). */
export const INCLINATION_RANGE = new Range(0, 90);

// ── Layout / chrome (screen pixels) ───────────────────────────────────────────

/** Margin between the screen edge and edge-anchored controls (e.g. Reset All). */
export const SCREEN_VIEW_MARGIN = 15;

/** Corner radius shared by control panels and dialogs. */
export const PANEL_CORNER_RADIUS = 6;

/** Width of the right-hand control panels. */
export const CONTROL_PANEL_WIDTH = 230;

/** Shared fonts. */
export const FONTS = {
  TITLE: new PhetFont({ size: 15, weight: "bold" }),
  LABEL: new PhetFont(13),
  SMALL: new PhetFont(11),
  READOUT: new PhetFont(13),
  BIG_READOUT: new PhetFont({ size: 18, weight: "bold" }),
  AXIS_LABEL: new PhetFont(13),
  TICK_LABEL: new PhetFont(11),
  EXPLANATION: new PhetFont(15),
} as const;

TransitHunterNamespace.register("TransitHunterConstants", {
  G_SI,
  SCREEN_VIEW_MARGIN,
  PANEL_CORNER_RADIUS,
});

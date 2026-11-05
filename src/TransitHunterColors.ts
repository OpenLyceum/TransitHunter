/**
 * TransitHunterColors.ts
 *
 * Defines all dynamic colors for the simulation using ProfileColorProperty.
 *
 * Each color has two profiles:
 *   - "default"   — used in standard (dark) mode
 *   - "projector" — used when the user enables Projector Mode in Preferences
 *
 * SceneryStack switches profiles automatically; no manual toggling is needed.
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 * Import TransitHunterColors and pass properties directly to Node's fillProperty or
 * strokeProperty options:
 *
 *   import TransitHunterColors from "../../TransitHunterColors.js";
 *
 *   new Rectangle( 0, 0, 100, 50, {
 *     fillProperty: TransitHunterColors.backgroundColorProperty,
 *   });
 *
 * ── How to add a color ────────────────────────────────────────────────────────
 * Add a new ProfileColorProperty entry to the TransitHunterColors object below.
 * Always provide both "default" and "projector" values.
 */
import { ProfileColorProperty } from "scenerystack/scenery";
import TransitHunterNamespace from "./TransitHunterNamespace.js";

const TransitHunterColors = {
  /**
   * Background color for the simulation screen.
   * Deep navy in default mode; white in projector mode.
   */
  backgroundColorProperty: new ProfileColorProperty(TransitHunterNamespace, "background", {
    default: "#1a1a2e",
    projector: "#ffffff",
  }),

  /**
   * Primary accent color for highlights, selected items, and key UI elements.
   * Sky blue in default mode; dark navy in projector mode.
   */
  accentColorProperty: new ProfileColorProperty(TransitHunterNamespace, "accent", {
    default: "#4fc3f7",
    projector: "#1a1a2e",
  }),

  /**
   * Background fill for control panels and dialogs.
   * Deep blue in default mode; light gray in projector mode.
   */
  panelBackgroundColorProperty: new ProfileColorProperty(TransitHunterNamespace, "panelBackground", {
    default: "#16213e",
    projector: "#f5f5f5",
  }),

  /**
   * Border/stroke color for control panels and dialogs.
   * Teal-navy in default mode; medium gray in projector mode.
   */
  panelBorderColorProperty: new ProfileColorProperty(TransitHunterNamespace, "panelBorder", {
    default: "#0f3460",
    projector: "#999999",
  }),

  /**
   * Text color for labels, readouts, and general UI text.
   * Near-white in default mode; near-black in projector mode.
   */
  textColorProperty: new ProfileColorProperty(TransitHunterNamespace, "text", {
    default: "#e0e0e0",
    projector: "#1a1a1a",
  }),

  /** Secondary text: captions, "not to scale" notes, units. */
  mutedTextColorProperty: new ProfileColorProperty(TransitHunterNamespace, "mutedText", {
    default: "#9aa4b8",
    projector: "#555555",
  }),

  // ── Space scenes ─────────────────────────────────────────────────────────────

  /** Fill of the space views (orbit view, Doppler wave view). */
  spaceColorProperty: new ProfileColorProperty(TransitHunterNamespace, "space", {
    default: "#05070f",
    projector: "#eef1f7",
  }),

  /** Border of the space views. */
  spaceBorderColorProperty: new ProfileColorProperty(TransitHunterNamespace, "spaceBorder", {
    default: "#2c3a5a",
    projector: "#9aa4b8",
  }),

  /** Background stars drawn in the space views. */
  backgroundStarColorProperty: new ProfileColorProperty(TransitHunterNamespace, "backgroundStar", {
    default: "#c8d0e0",
    projector: "#9aa4b8",
  }),

  /** The planet disc. */
  planetColorProperty: new ProfileColorProperty(TransitHunterNamespace, "planet", {
    default: "#6fb3ff",
    projector: "#1f5fbf",
  }),

  /** Orbit paths. */
  orbitPathColorProperty: new ProfileColorProperty(TransitHunterNamespace, "orbitPath", {
    default: "#5c6b8a",
    projector: "#8a94a8",
  }),

  /** Direction-to-Earth arrow and Earth icon. */
  earthColorProperty: new ProfileColorProperty(TransitHunterNamespace, "earth", {
    default: "#3fd19a",
    projector: "#0b7a52",
  }),

  // ── Charts ───────────────────────────────────────────────────────────────────

  chartBackgroundColorProperty: new ProfileColorProperty(TransitHunterNamespace, "chartBackground", {
    default: "#0b1020",
    projector: "#ffffff",
  }),

  chartAxisColorProperty: new ProfileColorProperty(TransitHunterNamespace, "chartAxis", {
    default: "#8090b0",
    projector: "#333333",
  }),

  chartGridColorProperty: new ProfileColorProperty(TransitHunterNamespace, "chartGrid", {
    default: "#1f2a44",
    projector: "#dddddd",
  }),

  /** Zero line of a radial-velocity chart. */
  chartZeroLineColorProperty: new ProfileColorProperty(TransitHunterNamespace, "chartZeroLine", {
    default: "#56648a",
    projector: "#888888",
  }),

  /** Measured data points. */
  measurementColorProperty: new ProfileColorProperty(TransitHunterNamespace, "measurement", {
    default: "#e8ecf5",
    projector: "#222222",
  }),

  /** The user's fitted model curve. */
  fitCurveColorProperty: new ProfileColorProperty(TransitHunterNamespace, "fitCurve", {
    default: "#3fd19a",
    projector: "#0b7a52",
  }),

  /** The true (revealed) curve. */
  answerCurveColorProperty: new ProfileColorProperty(TransitHunterNamespace, "answerCurve", {
    default: "#ff5ca8",
    projector: "#c2185b",
  }),

  /** Time / phase cursor on a chart. */
  cursorColorProperty: new ProfileColorProperty(TransitHunterNamespace, "cursor", {
    default: "#ffffff",
    projector: "#222222",
  }),

  // ── Transits ─────────────────────────────────────────────────────────────────

  /** Earth in the planet presets. */
  earthPlanetColorProperty: new ProfileColorProperty(TransitHunterNamespace, "earthPlanet", {
    default: "#3f8fe0",
    projector: "#1f5fbf",
  }),

  /** Neptune in the planet presets. */
  neptunePlanetColorProperty: new ProfileColorProperty(TransitHunterNamespace, "neptunePlanet", {
    default: "#5fd0e8",
    projector: "#0f7f99",
  }),

  /** Jupiter in the planet presets. */
  jupiterPlanetColorProperty: new ProfileColorProperty(TransitHunterNamespace, "jupiterPlanet", {
    default: "#d9a066",
    projector: "#8a5a20",
  }),

  /** A planet seen against its star: its dark night side. */
  planetSilhouetteColorProperty: new ProfileColorProperty(TransitHunterNamespace, "planetSilhouette", {
    default: "#0a0a14",
    projector: "#0a0a14",
  }),

  /** The planet's path across the star (the transit chord). */
  chordColorProperty: new ProfileColorProperty(TransitHunterNamespace, "chord", {
    default: "rgba(255,255,255,0.5)",
    projector: "rgba(0,0,0,0.5)",
  }),

  /** A light curve (brightness against time). */
  lightCurveColorProperty: new ProfileColorProperty(TransitHunterNamespace, "lightCurve", {
    default: "#ffcf5c",
    projector: "#b07800",
  }),

  /** The live point on a light curve. */
  liveDotColorProperty: new ProfileColorProperty(TransitHunterNamespace, "liveDot", {
    default: "#ffffff",
    projector: "#222222",
  }),

  // ── Light control surfaces ───────────────────────────────────────────────────
  // White chrome (combo boxes, flat push buttons, editable input fields) stays light
  // in both profiles; its text stays dark. Same values in default and projector mode,
  // but defined here so every color lives in one themeable place.

  /** Fill of light control surfaces: combo-box button/list, editable input fields. */
  controlSurfaceColorProperty: new ProfileColorProperty(TransitHunterNamespace, "controlSurface", {
    default: "#ffffff",
    projector: "#ffffff",
  }),

  /** Fill of a disabled control surface (grayed-out editable input field). */
  controlSurfaceDisabledColorProperty: new ProfileColorProperty(TransitHunterNamespace, "controlSurfaceDisabled", {
    default: "#cccccc",
    projector: "#cccccc",
  }),

  /** Text on light control surfaces: combo items, flat-button labels, field values, preferences. */
  controlSurfaceTextColorProperty: new ProfileColorProperty(TransitHunterNamespace, "controlSurfaceText", {
    default: "#1a1a1a",
    projector: "#1a1a1a",
  }),
};

export default TransitHunterColors;

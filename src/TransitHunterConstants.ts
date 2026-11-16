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

/**
 * Jupiter mass, kg.
 * @internal Exported for unit tests; not part of the application API.
 */
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

/** Earth masses per Jupiter mass (IAU nominal). */
export const EARTH_MASSES_PER_JUPITER = 317.83;

/** Earth radii per Jupiter radius (from IAU nominal radii). */
export const EARTH_RADII_PER_JUPITER = JUPITER_RADIUS_M / EARTH_RADIUS_M;

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

/** Speed multipliers of the time control. */
export const SLOW_SPEED_FACTOR = 0.25;
export const FAST_SPEED_FACTOR = 3;

/** Planet radius, Earth radii (Mars-size up to a large hot Jupiter). */
export const PLANET_RADIUS_RANGE = new Range(0.5, 25);

/** Star–planet distance, AU. */
export const DISTANCE_RANGE = new Range(0.01, 2);

/**
 * Closest orbit allowed, in star radii. Nearer than about two star radii a planet
 * would skim the star's surface (and be torn apart by its tides); the hottest
 * known hot Jupiters orbit at three to four.
 */
export const MIN_ORBIT_IN_STAR_RADII = 2;

/**
 * Largest planet allowed, as a fraction of the star's radius. Jupiter-sized
 * planets around the smallest red dwarfs reach about half; a planet bigger
 * than its star would hide it completely.
 */
export const MAX_RADIUS_RATIO = 0.6;

/** Inclination, degrees (90 = edge-on, where the planet crosses the middle of the star). */
export const INCLINATION_RANGE = new Range(0, 90);

// ── Light Curve screen ────────────────────────────────────────────────────────

/** Time between measurements, minutes (Kepler's short cadence is 1 min, its long cadence 30 min). */
export const CADENCE_MINUTES = 10;

/** Scatter of one measurement, ppm (Kepler reached ~30 ppm in 6 h on bright stars; 1000 ppm is a small telescope). */
export const NOISE_RANGE_PPM = new Range(0, 1000);

/** Transits folded together. */
export const STACK_RANGE = new Range(1, 100);

/** Signal-to-noise ratios above which a dip counts as a hint and as a clear detection. */
export const HINT_SNR = 3;
export const DETECTION_SNR = 7;

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

/** Settings for common/TransitHunterControlOptions.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const TRANSIT_HUNTER_CONTROL_OPTIONS_SETTINGS = {
  SLIDER_THUMB_SIZE_WIDTH: 12,
  SLIDER_THUMB_SIZE_HEIGHT: 22,
  STANDALONE_SLIDER_TRACK_SIZE_WIDTH: 150,
  STANDALONE_SLIDER_TRACK_SIZE_HEIGHT: 3,
  NUMBER_CONTROL_SLIDER_TRACK_SIZE_WIDTH: 110,
  NUMBER_CONTROL_SLIDER_TRACK_SIZE_HEIGHT: 3,
  CHECKBOX_BOX_WIDTH: 16,
  /** Transit hunter number control options scale (dimensionless). */
  TRANSIT_HUNTER_NUMBER_CONTROL_OPTIONS_SCALE: 0.75,
  TRANSIT_HUNTER_NUMBER_CONTROL_OPTIONS_SLIDER_PADDING: 4,
  TRANSIT_HUNTER_NUMBER_CONTROL_OPTIONS_ARROW_BUTTON_SPACING: 3,
  TRANSIT_HUNTER_NUMBER_CONTROL_OPTIONS_VERTICAL_SPACING: 4,
  TRANSIT_HUNTER_CHECKBOX_OPTIONS_SPACING: 4,
} as const;

/** Settings for common/TransitHunterPanel.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const TRANSIT_HUNTER_PANEL_SETTINGS = {
  OPTIONS_X_MARGIN: 12,
  OPTIONS_Y_MARGIN: 10,
} as const;

/** Settings for common/TransitHunterScreenIcons.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const TRANSIT_HUNTER_SCREEN_ICONS_SETTINGS = {
  DOTS_RADIUS: 3.2, // px
  LIGHT_CURVE_HALF_WIDTH: 70, // px
  PLANET_RADIUS_SEGMENT_2: 16, // px
  F_HALF_WIDTH: 34, // px
  F_HALF_WIDTH_SEGMENT_2: 110, // px
  CREATE_PLANET_HUNT_ICON_LINE_WIDTH_VARIANT_2: 6, // px

  PLANET_X_OFFSET: 35, // px
  ORBIT_LINE_DASH_DASH: 16, // px
  CREATE_LINING_UP_ICON_ORBIT_LINE_DASH_DASH: 12, // px
  CREATE_LINING_UP_ICON_PLANET_X_OFFSET: 190, // px
  CREATE_PLANET_HUNT_ICON_LINE_DASH_DASH: 22, // px
  GIANT_CENTRE_Y_OFFSET: 30, // px
  ROCK_Y_OFFSET: 34, // px

  STAR_Y: 145,
  PLANET_RADIUS: 28,
  PLANET_LINE_WIDTH: 3,
  PLANET_Y: 160,
  LIGHT_CURVE_LINE_WIDTH: 8,
  ORBIT_RADIUS_X: 210,
  ORBIT_RADIUS_Y: 62,
  ORBIT_ROTATION: -0.12,
  ORBIT_LINE_WIDTH: 6,
  TO_EARTH_HEAD_HEIGHT: 44,
  TO_EARTH_HEAD_WIDTH: 50,
  TO_EARTH_TAIL_WIDTH: 14,
  CREATE_LIGHT_CURVE_ICON_LINE_WIDTH: 7,
  CREATE_PLANET_HUNT_ICON_LINE_WIDTH: 10,
  CREATE_PLANET_HUNT_ICON_START_X: 20,
  WATER_TOP: 200,
  /** Water opacity (dimensionless). */
  WATER_OPACITY: 0.45,
  WATER_LINE_LINE_WIDTH: 5,
  GIANT_RADIUS: 100,
  GIANT_CENTRE_X: 210,
  GIANT_LINE_WIDTH: 9,
  /** Giant opacity (dimensionless). */
  GIANT_OPACITY: 0.25,
  ROCK_RADIUS: 30,
  ROCK_LINE_WIDTH: 3,
  ROCK_X: 430,
} as const;

/** Settings for common/model/composition.ts. */
export const COMPOSITION_SETTINGS = {
  /** Core mass fraction of an Earth-like rocky planet (Zeng, Sasselov & Jacobsen 2016). */
  EARTH_LIKE_CORE_MASS_FRACTION: 0.325,
  /** Radius above which a planet is called a giant, Earth radii (about 0.5 R_J). */
  GIANT_RADIUS_EARTH: 6,
} as const;

/** Settings for common/model/transitPhysics.ts. */
export const TRANSIT_PHYSICS_SETTINGS = {
  /** Below this an impact parameter is rounding error (cos 90° is 6 × 10⁻¹⁷ in floating point), and is 0. */
  IMPACT_PARAMETER_EPSILON: 1e-9,
} as const;

/** Settings for common/view/PlanetNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const PLANET_NODE_SETTINGS = {
  /** Smallest drawn planet radius, px. */
  MIN_PLANET_RADIUS: 4,
  LINE_WIDTH_LINE_WIDTH: 1.2,
} as const;

/** Settings for common/view/chartUtils.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const CHART_UTILS_SETTINGS = {
  DEFAULT_DIGITS: 3,
} as const;

/** Settings for common/view/controls.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const CONTROLS_SETTINGS = {
  CREATE_NUMBER_CONTROL_MAX_WIDTH_VARIANT_2: 96, // px
  CREATE_NUMBER_CONTROL_MAX_WIDTH_VARIANT_3: 110, // px

  PARAGRAPHS_LINE_WRAP: 600, // px
  CREATE_PUSH_BUTTON_Y_MARGIN: 5, // px

  DIALOG_TITLE_FONT_SIZE: 20,
  CREATE_NUMBER_CONTROL_MAX_WIDTH: 130,
  CREATE_CHECKBOX_MAX_WIDTH: 180,
  /** Create explanation button scale (dimensionless). */
  CREATE_EXPLANATION_BUTTON_SCALE: 0.6,
  CREATE_EXPLANATION_BUTTON_SPACING: 14,
  CREATE_EXPLANATION_BUTTON_MAX_WIDTH: 600,
  DEFAULT_MAX_WIDTH: 220,
  DEFAULT_MAX_TEXT_WIDTH: 180,
} as const;

/** Settings for common/view/formatters.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const FORMATTERS_SETTINGS = {
  FORMAT_PERCENT_DIGITS: 2, // digits
  FORMAT_PARTS_IN_SIGNIFICANT_FIGURES: 2, // digits
  FORMAT_DAYS_DIGITS: 3, // digits
  FORMAT_HOURS_DIGITS: 2, // digits
  FORMAT_PLANET_MASS_DIGITS: 2, // digits

  /** Earth masses above which a planet mass reads in Jupiter masses. */
  JUPITER_MASS_THRESHOLD_EARTH: 30,
} as const;

/** Settings for composition/view/DensityScaleNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const DENSITY_SCALE_NODE_SETTINGS = {
  MARKER_X_SEGMENT_2: 7, // px
  MARKER_LABEL_DIGITS: 2, // digits

  CONSTRUCTOR_TOP_OFFSET: 5, // px
  MARKER_Y_OFFSET: 20, // px

  /** Largest density on the scale, g/cm³. */
  MAX_DENSITY: 9,
  /** Density of iron, g/cm³ (uncompressed). */
  IRON_DENSITY: 7.87,
  /** Height of the density bar, px. */
  BAR_HEIGHT: 12,
  BAR_CORNER_X: 3,
  BAR_CORNER_Y: 3,
  FLOAT_ZONE_CORNER_X: 3,
  FLOAT_ZONE_CORNER_Y: 3,
  /** Float zone opacity (dimensionless). */
  FLOAT_ZONE_OPACITY: 0.35,
  REFERENCE_MAX_WIDTH: 70,
  MARKER_X: -7,
  MARKER_Y: 11,
} as const;

/** Settings for composition/view/MassRadiusDiagramNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const MASS_RADIUS_DIAGRAM_NODE_SETTINGS = {
  CIRCLE_RADIUS: 4, // px

  CONSTRUCTOR_TOP_OFFSET: 4, // px
  PLACE_AXIS_LABELS_TOP_OFFSET: 20, // px
  CURVE_LABEL_LEFT_OFFSET: 4, // px
  CONSTRUCTOR_CURVE_LABEL_LEFT_OFFSET: 3, // px
  WATER_GUIDE_LINE_DASH_DASH: 5, // px
  CONSTRUCTOR_WATER_GUIDE_LINE_DASH_DASH: 4, // px
  GUIDES_RIGHT: 40, // px
  GUIDES_BOTTOM: 40, // px
  GUIDES_BOTTOM_OFFSET: 4, // px
  CONSTRUCTOR_LABEL_MAX_WIDTH: 70, // px
  CONSTRUCTOR_RIGHT_OFFSET: 5, // px
  CONSTRUCTOR_LEFT_OFFSET: 5, // px
  MULTILINK_LEFT_OFFSET: 12, // px
  MULTILINK_RIGHT_OFFSET: 12, // px
  MULTILINK_BOTTOM_OFFSET: 4, // px

  /** Rocky-planet curves are drawn up to this mass (the fit's range, generously). */
  ROCKY_MAX_MASS: 30,
  CONSTRUCTOR_RIGHT: -5,
  RIGHT_RIGHT: -26,
  LABEL_MAX_WIDTH: 110,
  IRON_CURVE_LINE_WIDTH: 1.5,
  ROCK_CURVE_LINE_WIDTH: 2,
  WATER_GUIDE_LINE_WIDTH: 1.5,
  GUIDES_MAX_WIDTH: 130,
  CONSTRUCTOR_RADIUS: 3,
  SELECTED_RING_RADIUS: 9,
  SELECTED_RING_LINE_WIDTH: 2,
  SELECTED_LABEL_MAX_WIDTH: 120,
} as const;

/** Settings for composition/view/RockOrGasScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const ROCK_OR_GAS_SCREEN_VIEW_SETTINGS = {
  RADIUS_EARTH_FORMAT_SIGNIFICANT_DIGITS: 3, // digits
  RADIUS_VALUE_DIGITS: 2, // digits
  TRANSIT_LINES_DIGITS: 2, // digits
  STAR_RADIUS_SUN_FORMAT_SIGNIFICANT_DIGITS: 3, // digits
  TRANSIT_LINES_DIGITS_SEGMENT_2: 3, // digits
  TEXT_DIGITS: 3, // digits
  STAR_MASS_SUN_FORMAT_SIGNIFICANT_DIGITS: 3, // digits
  DENSITY_TEXT_DIGITS: 2, // digits

  TRANSIT_CARD_MIN_WIDTH_OFFSET: 24, // px
  TRANSIT_CARD_MAX_WIDTH_OFFSET: 24, // px
  WOBBLE_CARD_MIN_WIDTH_OFFSET: 24, // px
  WOBBLE_CARD_MAX_WIDTH_OFFSET: 24, // px
  CONSTRUCTOR_TOP_OFFSET: 12, // px
  DENSITY_PANEL_MIN_WIDTH_OFFSET: 24, // px
  DENSITY_PANEL_MAX_WIDTH_OFFSET: 24, // px
  CONSTRUCTOR_LEFT_OFFSET: 12, // px
  CONSTRUCTOR_RIGHT_OFFSET: 4, // px
  PLANET_RADIOS_MAX_WIDTH_OFFSET: 40, // px
  CONSTRUCTOR_CONTROL_PANEL_SPACING: 8, // px
  CONTROL_PANEL_MAX_WIDTH_OFFSET: 40, // px
  CONTROL_PANEL_MIN_WIDTH_OFFSET: 24, // px

  CARD_WIDTH: 300,
  MIDDLE_WIDTH: 320,
  DIAGRAM_WIDTH: 265,
  DIAGRAM_HEIGHT: 215,
  /** Size-comparison scale, px per Earth radius. */
  PX_PER_EARTH_RADIUS: 2,
  /** Height of the size comparison: the largest planet (Kepler-7 b, 18 R⊕) plus its label. */
  SIZE_ROW_HEIGHT: 92,
  TRANSIT_LINES_SPACING: 5,
  SIZE_DISC_SPACING: 3,
  SIZE_DISC_MAX_WIDTH: 90,
  SIZE_ROW_SPACING: 16,
  TRANSIT_CARD_SPACING: 8,
  WOBBLE_CARD_SPACING: 6,
  DENSITY_PANEL_SPACING: 7,
  DENSITY_PANEL_X: 10,
  PLANET_RADIOS_SPACING: 7,
  PLANET_RADIOS_RADIUS: 7,
  CONTROL_PANEL_SPACING: 10,
} as const;

/** Settings for dimming/model/DimmingModel.ts. */
export const DIMMING_MODEL_SETTINGS = {
  /** Orbit radius in star radii as drawn on this screen (real orbits are tens to hundreds). */
  DIMMING_ORBIT_IN_STAR_RADII: 2.2,
  /** Wall-clock seconds per orbit at normal speed. */
  DIMMING_SECONDS_PER_ORBIT: 12,
  /** Orbits shown across the light-curve chart before the sweep restarts. */
  TRACE_ORBITS: 2,
  /** Light-curve samples per orbit. */
  SAMPLES_PER_ORBIT: 400,
  /** Phase at start-up and after Reset All: a quarter orbit before the first transit. */
  INITIAL_PHASE: -0.25,
} as const;

/** Settings for dimming/view/DimmingChartNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const DIMMING_CHART_NODE_SETTINGS = {
  SPAN_TEXT_PROPERTY_DIGITS: 2, // digits

  TITLE_MAX_WIDTH_OFFSET: 40, // px
  ZOOM_NOTE_MAX_WIDTH_OFFSET: 40, // px
  CONSTRUCTOR_TOP_OFFSET: 40, // px

  /** Headroom above 100 % as a fraction of the zoomed span. */
  HEADROOM: 0.15,
  /** Frame range min (in the source module’s documented units). */
  FRAME_RANGE_MIN: 99,
  /** Frame range max (in the source module’s documented units). */
  FRAME_RANGE_MAX: 100.2,
  LINE_LINE_WIDTH: 2,
  LIVE_DOT_RADIUS: 4,
  TITLE_LEFT: -40,
  TITLE_BOTTOM: -6,
  LEFT_LEFT: -40,
} as const;

/** Settings for dimming/view/DimmingScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const DIMMING_SCREEN_VIEW_SETTINGS = {
  STAR_SIZE_TEXT_DIGITS: 2, // digits

  CONSTRUCTOR_TOP_OFFSET: 20, // px
  CONSTRUCTOR_LEFT_OFFSET: 70, // px
  EXPLANATION_ROW_MAX_WIDTH_OFFSET: 40, // px
  READOUT_PANEL_MIN_WIDTH_OFFSET: 24, // px
  READOUT_PANEL_MAX_WIDTH_OFFSET: 24, // px
  LABEL_MAX_WIDTH_OFFSET: 40, // px
  CONTROL_PANEL_MIN_WIDTH_OFFSET: 24, // px
  CONSTRUCTOR_RIGHT_OFFSET: 30, // px

  VIEW_WIDTH: 360,
  SIDE_VIEW_HEIGHT: 170,
  EARTH_VIEW_HEIGHT: 180,
  STAR_RADIUS: 65,
  CHART_WIDTH: 250,
  CHART_HEIGHT: 200,
  READOUT_WIDTH: 300,
  /** Fraction blocked above which the planet is said to hide the whole star. */
  WHOLE_STAR: 0.9999,
  EXPLANATION_ROW_SPACING: 8,
  READOUT_PANEL_SPACING: 8,
  RADIO_OPTIONS_SPACING: 6,
  RADIO_OPTIONS_RADIUS: 7,
  /** Custom radius control significant figures (dimensionless). */
  CUSTOM_RADIUS_CONTROL_SIGNIFICANT_FIGURES: 2,
  CONTROL_PANEL_SPACING: 10,
} as const;

/** Settings for dimming/view/DimmingViews.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const DIMMING_VIEWS_SETTINGS = {
  ORBIT_STYLE_LINE_DASH_DASH: 5, // px
  CONSTRUCTOR_ORBIT_STYLE_LINE_DASH_DASH: 4, // px
  CONSTRUCTOR_LEFT_OFFSET: 6, // px
  CONSTRUCTOR_BOTTOM_OFFSET: 8, // px
  NOT_TO_SCALE_LINE_WRAP: 105, // px
  TELESCOPE_CAPTION_LINE_WRAP_OFFSET: 40, // px
  MAGNIFICATION_TEXT_MAX_WIDTH_OFFSET: 16, // px
  DRAG_HINT_MAX_WIDTH_OFFSET: 16, // px

  /** Vertical squash of the orbit in the side view (seen from slightly above). */
  SIDE_VIEW_SQUASH: 0.28,
  /** Glow of the zoomed-in stars, as a multiple of their radius. */
  GLOW_SCALE: 1.25,
  /** Phase step of one arrow-key press, orbits. */
  KEYBOARD_PHASE_STEP: 0.005,
  BACKGROUND_CORNER_X: 6,
  BACKGROUND_CORNER_Y: 6,
  TITLE_BOTTOM: -4,
  SCENE_CORNER_X: 6,
  SCENE_CORNER_Y: 6,
  ORBIT_STYLE_LINE_WIDTH: 1.5,
  TO_EARTH_HEAD_HEIGHT: 9,
  TO_EARTH_HEAD_WIDTH: 12,
  TO_EARTH_TAIL_WIDTH: 3,
  TO_EARTH_LABEL_MAX_WIDTH: 120,
  NOT_TO_SCALE_LEFT: 8,
  NOT_TO_SCALE_TOP: 6,
  LEFT_LEFT: 8,
  TOP_TOP: 6,
} as const;

/** Settings for hunt/model/PlanetHuntModel.ts. */
export const PLANET_HUNT_MODEL_SETTINGS = {
  /** Hunt period range min (days). */
  HUNT_PERIOD_RANGE_MIN: 0.3,
  /** Hunt period range max (days). */
  HUNT_PERIOD_RANGE_MAX: 500,
  /** Hunt depth range min (percent). */
  HUNT_DEPTH_RANGE_MIN: 0.001,
  /** Hunt depth range max (percent). */
  HUNT_DEPTH_RANGE_MAX: 5,
  /** Most dip marks kept.  @internal Exported for unit tests; not part of the application API. */
  MAX_MARKS: 8,
  /** Wall-clock time the period search may use per animation frame, ms. The longest  light curve (four years of Kepler-22) takes a few seconds in all. */
  SEARCH_MILLISECONDS_PER_STEP: 12,
  /** Wall-clock time the period search may use per animation frame, ms. The longest  light curve (four years of Kepler-22) takes a few seconds in all. */
  DEFAULT_PERIOD: 2,
  /** Wall-clock time the period search may use per animation frame, ms. The longest  light curve (four years of Kepler-22) takes a few seconds in all. */
  DEFAULT_DEPTH: 0.5,
} as const;

/** Settings for hunt/model/boxSearch.ts. */
export const BOX_SEARCH_SETTINGS = {
  /** Shortest trial box spans at least this many cadence bins. */
  MIN_DURATION_BINS: 1.5,
  /** Ratio of successive trial durations (dimensionless). */
  DURATION_STEP_FACTOR: 1.5,
  /** Tolerance at the maximum trial duration (days). */
  DURATION_EPSILON_DAYS: 1e-9,
  /** Minimum bins in a folded light curve (count). */
  MIN_PHASE_BINS: 3,
  /** Fraction of a Sun-like transit defining the period-grid duration. */
  GRID_TRANSIT_FRACTION: 0.5,
  /** Longest box tried, hours (Kepler-11 g's transit lasts 9.5 h). */
  MAX_DURATION_HOURS: 16,
  /** Longest box tried, as a fraction of the period. */
  MAX_DURATION_FRACTION: 0.12,
  /** A transit across the Sun seen from 1 AU (central, P = 1 yr) lasts about this long, hours. */
  SUN_TRANSIT_HOURS_AT_ONE_YEAR: 13,
  /** Most phase bins of one fold (long periods get wider bins). */
  MAX_PHASE_BINS: 30_000,
  /** Largest drift between neighbouring trial periods over the run, in grid durations. A transit  smeared by this much still shows (with somewhat less signal); the peak is then refined. */
  GRID_DRIFT: 1.5,
  /** Elementary steps between clock checks in {@link BoxSearch.advanceFor}. */
  OPERATIONS_PER_CHUNK: 200_000,
  /** Steps of the fine search either side of a peak in {@link BoxSearch.refinePeak}. */
  REFINE_STEPS: 40,
} as const;

/** Settings for hunt/view/HuntChartNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const HUNT_CHART_NODE_SETTINGS = {
  CENTRE_LINE_LINE_DASH_DASH: 3, // px
  CONSTRUCTOR_CENTRE_LINE_LINE_DASH_DASH: 4, // px
  DEPTH_LINE_VISUAL_LINE_DASH_DASH: 8, // px
  CONSTRUCTOR_DEPTH_LINE_VISUAL_LINE_DASH_DASH: 4, // px
  DEPTH_LABEL_RIGHT_OFFSET: 4, // px
  UPDATE_Y_OFFSET: 100, // px
  CONSTRUCTOR_CONTROLS_SPACING: 6, // px
  CONSTRUCTOR_TOP_OFFSET: 44, // px

  /** Narrowest window, in days (unfolded) or hours (folded). */
  MIN_SPAN_DAYS: 0.3,
  /** Narrowest window, in days (unfolded) or hours (folded). */
  MIN_SPAN_HOURS: 3,
  /** Folded charts open on ±this many hours (or the whole period if shorter). */
  FOLDED_HALF_WINDOW_HOURS: 30,
  /** Centred on the far side, the chart opens on ±this fraction of the period, which leaves out the transit. */
  FAR_SIDE_HALF_WINDOW_FRACTION: 0.35,
  /** Centred on the far side, the chart opens on ±this fraction of the period, which leaves out the transit. */
  BUTTON_ZOOM_FACTOR: 0.5,
  /** Centred on the far side, the chart opens on ±this fraction of the period, which leaves out the transit. */
  BUTTON_SCROLL_FRACTION: 0.25,
  /** Centred on the far side, the chart opens on ±this fraction of the period, which leaves out the transit. */
  WHEEL_ZOOM_PER_PIXEL: 0.002,
  /** Centred on the far side, the chart opens on ±this fraction of the period, which leaves out the transit. */
  PIXELS_PER_WHEEL_LINE: 16,
  /** Centred on the far side, the chart opens on ±this fraction of the period, which leaves out the transit. */
  BUTTON_SIZE: 26,
  /** A press that moves less than this (px) is a click, which marks a dip. */
  CLICK_TOLERANCE: 4,
  /** Bins of the folded averages across the shown window. */
  FOLDED_BINS: 90,
  /** Points left outside the brightness axis at each end (stray outliers). A fixed  count, not a fraction: a long light curve has few points inside its transits. */
  Y_CLIP_POINTS: 2,
  /** Frame range min (in the source module’s documented units). */
  FRAME_RANGE_MIN: 99,
  /** Frame range max (in the source module’s documented units). */
  FRAME_RANGE_MAX: 100.2,
  AVERAGES_LINE_WIDTH: 2.5,
  MARKS_PATH_LINE_WIDTH: 1.5,
  DEPTH_LINE_VISUAL_LINE_WIDTH: 2,
  DEPTH_HANDLE_Y: -7,
  DEPTH_HANDLE_HEIGHT: 14,
  DEPTH_LABEL_MAX_WIDTH: 150,
  DEPTH_LABEL_BOTTOM: -3,
  /** Y range min (in the source module’s documented units). */
  Y_RANGE_MIN: 99,
  /** Y range max (in the source module’s documented units). */
  Y_RANGE_MAX: 100.2,
  UPDATE_Y: 7,
  UPDATE_LINE_WIDTH: 2,
  CONTROLS_SPACING: 4,
} as const;

/** Settings for hunt/view/PeriodSearchNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const PERIOD_SEARCH_NODE_SETTINGS = {
  CONSTRUCTOR_TOP_OFFSET: 20, // px
  PROGRESS_TEXT_MAX_WIDTH_OFFSET: 20, // px
  CONSTRUCTOR_RIGHT_OFFSET: 8, // px
  HINT_MAX_WIDTH_OFFSET: 240, // px
  PLACE_CONTROLS_TOP_OFFSET: 44, // px
  PLACE_CONTROLS_LEFT_OFFSET: 12, // px
  DRAW_AXES_TOP_OFFSET: 6, // px
  PLACE_MARKERS_LINE_DASH_DASH: 6, // px
  CONSTRUCTOR_PLACE_MARKERS_LINE_DASH_DASH: 4, // px

  /** A click folds on the strongest dip within this many pixels of it. */
  CLICK_PICK_PIXELS: 8,
  /** A click folds on the strongest dip within this many pixels of it. */
  BUTTON_HEIGHT: 26,
  CURVE_LINE_WIDTH: 1.5,
  TRIAL_LINE_LINE_WIDTH: 2,
  RIGHT_RIGHT: -36,
  TOP_TOP: 6,
  DRAW_AXES_X: -5,
  DRAW_AXES_RIGHT: -7,
  CHILDREN_LINE_WIDTH: 2,
} as const;

/** Settings for hunt/view/PlanetHuntScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const PLANET_HUNT_SCREEN_VIEW_SETTINGS = {
  USE_SPACING_CREATE_PUSH_BUTTON_MAX_TEXT_WIDTH: 150, // px
  CLEAR_MARKS_CREATE_PUSH_BUTTON_MAX_TEXT_WIDTH: 150, // px
  RADIUS_TEXT_DIGITS: 2, // digits
  STAR_RADIUS_SUN_FORMAT_SIGNIFICANT_DIGITS: 3, // digits
  LINE_DIGITS: 2, // digits
  FOLD_ON_IT_CREATE_PUSH_BUTTON_MAX_TEXT_WIDTH: 60, // px

  CONSTRUCTOR_LEFT_OFFSET: 60, // px
  CONSTRUCTOR_TOP_OFFSET: 8, // px
  CONSTRUCTOR_MEASUREMENT_PANEL_SPACING: 8, // px
  MEASUREMENT_PANEL_MAX_WIDTH_OFFSET: 40, // px
  MEASUREMENT_PANEL_MIN_WIDTH_OFFSET: 24, // px
  CONSTRUCTOR_MEASUREMENT_PANEL_MAX_WIDTH_OFFSET: 24, // px
  ANSWER_PANEL_MIN_WIDTH_OFFSET: 24, // px
  ANSWER_PANEL_MAX_WIDTH_OFFSET: 24, // px
  LINE_MAX_WIDTH_OFFSET: 70, // px
  TARGET_COMBO_BOX_MAX_WIDTH_OFFSET: 50, // px
  CONTROL_PANEL_MIN_WIDTH_OFFSET: 24, // px

  CHART_WIDTH: 610,
  CHART_HEIGHT: 245,
  PANEL_WIDTH: 318,
  /** Arrow steps of the trial period (decades) and of the fold's slide (fraction of  the period). NumberControl rounds every value to its step, so these set the  finest fold reachable: 0.0023 % of the period, so one click moves Kepler-22 b's  four transits by under an hour over the four years of data, and 0.0002 of a  period (1.4 h at Kepler-22 b's 290 days). */
  PERIOD_STEP_DECADES: 0.00001,
  /** Arrow steps of the trial period (decades) and of the fold's slide (fraction of  the period). NumberControl rounds every value to its step, so these set the  finest fold reachable: 0.0023 % of the period, so one click moves Kepler-22 b's  four transits by under an hour over the four years of data, and 0.0002 of a  period (1.4 h at Kepler-22 b's 290 days). */
  SHIFT_STEP: 0.0002,
  MEASUREMENT_PANEL_SPACING: 6,
  ANSWER_LIST_SPACING: 3,
  ANSWER_PANEL_SPACING: 6,
  ANSWER_ROW_SPACING: 8,
  /** Period control significant figures (dimensionless). */
  PERIOD_CONTROL_SIGNIFICANT_FIGURES: 6,
  /** Shift control significant figures (dimensionless). */
  SHIFT_CONTROL_SIGNIFICANT_FIGURES: 4,
  /** Depth control significant figures (dimensionless). */
  DEPTH_CONTROL_SIGNIFICANT_FIGURES: 2,
  CONTROL_PANEL_SPACING: 8,
} as const;

/** Settings for light-curve/model/LightCurveModel.ts. */
export const LIGHT_CURVE_MODEL_SETTINGS = {
  /** Minimum duration used to frame a single transit (hours). */
  MIN_ZOOM_DURATION_HOURS: 0.5,
  /** Minimum samples shown in the folded transit view (count). */
  MIN_ZOOM_POINTS: 10,
  /** Minimum quadrature samples averaged over one exposure (count). */
  MIN_EXPOSURE_SAMPLES: 16,
  /** The wide chart spans this many orbits, with dips at ½, 1½, 2½ … orbits. */
  WIDE_ORBITS: 3.25,
  /** Most points drawn on the wide chart (coarser bins beyond this). */
  MAX_WIDE_POINTS: 3000,
  /** The zoomed chart spans this many transit durations, centred on mid-transit. */
  ZOOM_IN_DURATIONS: 2.4,
  /** Most points drawn on the zoomed chart. */
  MAX_ZOOM_POINTS: 400,
  /** Planet radius default (Earth radii). */
  PLANET_RADIUS_DEFAULT: 11.2,
  /** Distance default (AU). */
  DISTANCE_DEFAULT: 0.05,
} as const;

/** Settings for light-curve/view/LightCurveChartNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const LIGHT_CURVE_CHART_NODE_SETTINGS = {
  TITLE_MAX_WIDTH_OFFSET: 50, // px

  /** Frame range min (in the source module’s documented units). */
  FRAME_RANGE_MIN: 99,
  /** Frame range max (in the source module’s documented units). */
  FRAME_RANGE_MAX: 100.2,
  DOTS_RADIUS: 1.6,
  LINE_LINE_WIDTH: 2,
  TITLE_LEFT: -50,
  TITLE_BOTTOM: -6,
} as const;

/** Settings for light-curve/view/LightCurveScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const LIGHT_CURVE_SCREEN_VIEW_SETTINGS = {
  RADIUS_TEXT_DIGITS: 2, // digits
  DISTANCE_TEXT_DIGITS: 2, // digits
  SNR_TEXT_DIGITS: 2, // digits
  READOUT_PANEL_ITEM_1_SPACING: 5, // px
  READOUT_PANEL_ITEM_2_SPACING: 5, // px

  CONSTRUCTOR_LEFT_OFFSET: 60, // px
  CONSTRUCTOR_TOP_OFFSET: 22, // px
  UPDATE_BOTTOM_OFFSET: 3, // px
  UPDATE_LEFT_OFFSET: 6, // px
  UPDATE_CENTER_Y_FACTOR: 100, // dimensionless
  CONSTRUCTOR_UPDATE_BOTTOM_OFFSET: 4, // px
  CONSTRUCTOR_READOUT_PANEL_SPACING: 20, // px
  LABEL_MAX_WIDTH_OFFSET: 40, // px
  CONTROL_PANEL_MIN_WIDTH_OFFSET: 24, // px

  CHART_WIDTH: 560,
  WIDE_HEIGHT: 120,
  ZOOM_HEIGHT: 165,
  MODEL_SAMPLES: 1200,
  READOUT_COLUMN_WIDTH: 330,
  MARK_ARROW_OPTIONS_HEAD_HEIGHT: 7,
  MARK_ARROW_OPTIONS_HEAD_WIDTH: 9,
  MARK_ARROW_OPTIONS_TAIL_WIDTH: 1.5,
  MARK_LABEL_MAX_WIDTH: 200,
  BACKED_X_MARGIN: 3,
  BACKED_CORNER_RADIUS: 3,
  EXPLANATION_ROW_SPACING: 8,
  EXPLANATION_ROW_MAX_WIDTH: 200,
  READOUT_PANEL_SPACING: 6,
  /** Radius control significant figures (dimensionless). */
  RADIUS_CONTROL_SIGNIFICANT_FIGURES: 2,
  /** Distance control significant figures (dimensionless). */
  DISTANCE_CONTROL_SIGNIFICANT_FIGURES: 2,
  STAR_RADIOS_SPACING: 5,
  STAR_RADIOS_RADIUS: 7,
  /** Noise control significant figures (dimensionless). */
  NOISE_CONTROL_SIGNIFICANT_FIGURES: 3,
  /** Noise control delta (dimensionless). */
  NOISE_CONTROL_DELTA: 10,
  /** Stack control significant figures (dimensionless). */
  STACK_CONTROL_SIGNIFICANT_FIGURES: 3,
  CONTROL_PANEL_SPACING: 9,
} as const;

/** Settings for lining-up/model/LiningUpModel.ts. */
export const LINING_UP_MODEL_SETTINGS = {
  /** Wall-clock seconds for one pass through the transit window at normal speed.  @internal Exported for unit tests; not part of the application API. */
  LINING_UP_SECONDS_PER_WINDOW: 6,
  /** Wall-clock seconds for the fast-forward round the rest of the orbit at normal speed.  @internal Exported for unit tests; not part of the application API. */
  LINING_UP_SECONDS_PER_REST: 3,
  /** Largest end slope of the fast-forward's Hermite curve that keeps it monotonic. */
  MAX_HERMITE_SLOPE: 3,
  /** The window is this many edge-on transit durations wide. */
  WINDOW_IN_DURATIONS: 1.6,
  /** Systems in the random sample. */
  SAMPLE_SIZE: 100,
  /** Distance default (AU). */
  DISTANCE_DEFAULT: 0.05,
  /** Inclination default (degrees). */
  INCLINATION_DEFAULT: 90,
} as const;

/** Settings for lining-up/view/LiningUpChartNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const LINING_UP_CHART_NODE_SETTINGS = {
  SPAN_TEXT_PROPERTY_DIGITS: 2, // digits

  GHOST_LINE_DASH_DASH: 5, // px
  CONSTRUCTOR_GHOST_LINE_DASH_DASH: 4, // px
  TITLE_MAX_WIDTH_OFFSET: 40, // px
  LEGEND_MAX_WIDTH_OFFSET: 40, // px
  ZOOM_NOTE_MAX_WIDTH_OFFSET: 40, // px
  CONSTRUCTOR_TOP_OFFSET: 38, // px

  SAMPLES: 300,
  HEADROOM: 0.15,
  /** Frame range min (in the source module’s documented units). */
  FRAME_RANGE_MIN: 99,
  /** Frame range max (in the source module’s documented units). */
  FRAME_RANGE_MAX: 100.2,
  GHOST_LINE_WIDTH: 1.5,
  LINE_LINE_WIDTH: 2,
  LIVE_DOT_RADIUS: 4,
  TITLE_LEFT: -40,
  TITLE_BOTTOM: -6,
  LEFT_LEFT: -40,
} as const;

/** Settings for lining-up/view/LiningUpScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const LINING_UP_SCREEN_VIEW_SETTINGS = {
  IMPACT_TEXT_DIGITS: 2, // digits
  TILT_LIMIT_TEXT_DIGITS: 2, // digits
  PROBABILITY_TEXT_DIGITS: 2, // digits

  CONSTRUCTOR_TOP_OFFSET: 20, // px
  CONSTRUCTOR_LEFT_OFFSET: 70, // px
  LABEL_MAX_WIDTH_OFFSET: 40, // px
  CONTROL_PANEL_MIN_WIDTH_OFFSET: 24, // px
  EXPLANATION_ROW_MAX_WIDTH_OFFSET: 40, // px
  READOUT_PANEL_MIN_WIDTH_OFFSET: 24, // px
  READOUT_PANEL_MAX_WIDTH_OFFSET: 24, // px
  CONSTRUCTOR_RIGHT_OFFSET: 30, // px

  VIEW_WIDTH: 340,
  VIEW_3_D_HEIGHT: 270,
  SKY_VIEW_HEIGHT: 170,
  SKY_STAR_RADIUS: 55,
  CHART_WIDTH: 230,
  CHART_HEIGHT: 150,
  /** How far the step button moves the clock, wall-clock seconds at normal speed. */
  STEP_SECONDS: 0.12,
  PLANET_RADIOS_SPACING: 5,
  PLANET_RADIOS_RADIUS: 7,
  /** Inclination control significant figures (dimensionless). */
  INCLINATION_CONTROL_SIGNIFICANT_FIGURES: 4,
  /** Inclination control delta (dimensionless). */
  INCLINATION_CONTROL_DELTA: 0.1,
  /** Distance control significant figures (dimensionless). */
  DISTANCE_CONTROL_SIGNIFICANT_FIGURES: 2,
  CONTROL_PANEL_SPACING: 10,
  EXPLANATION_ROW_SPACING: 8,
  READOUT_PANEL_SPACING: 7,
} as const;

/** Settings for lining-up/view/Orbit3DViewNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const ORBIT3_D_VIEW_NODE_SETTINGS = {
  LABEL_OFFSET_Y_OFFSET: -12, // px

  ROTATE_HINT_MAX_WIDTH_OFFSET: 16, // px
  CONSTRUCTOR_BOTTOM_OFFSET: 6, // px
  SPED_UP_NOTE_MAX_WIDTH_OFFSET: 16, // px
  CONSTRUCTOR_RIGHT_OFFSET: 8, // px
  ORBIT_LINE_DASH_DASH: 4, // px
  NORMAL_LINE_LINE_DASH_DASH: 4, // px
  UPDATE_LEFT: 4, // px
  UPDATE_RIGHT_OFFSET: 4, // px
  UPDATE_TOP: 4, // px
  UPDATE_BOTTOM_OFFSET: 4, // px

  /** Drawn orbit radius, star radius and planet radius, px. */
  ORBIT_RADIUS: 105,
  /** Drawn orbit radius, star radius and planet radius, px. */
  STAR_RADIUS: 14,
  /** Drawn orbit radius, star radius and planet radius, px. */
  PLANET_RADIUS: 7,
  /** Width of the dark ring around the planet that separates it from the Earth arrow, px. */
  PLANET_HALO_WIDTH: 2.5,
  /** Gap between the planet and its label, px. */
  PLANET_LABEL_GAP: 3,
  /** Length of the Earth arrow, px. */
  EARTH_ARROW_LENGTH: 140,
  /** Length of the Earth arrow, px. */
  ORBIT_SAMPLES: 90,
  /** Elevation range min (in the source module’s documented units). */
  ELEVATION_RANGE_MIN: -85,
  /** Elevation range max (in the source module’s documented units). */
  ELEVATION_RANGE_MAX: 85,
  /** Camera elevation range (degrees above the orbital plane) and keyboard step. */
  KEYBOARD_STEP_DEG: 5,
  /** Camera elevation range (degrees above the orbital plane) and keyboard step. */
  DRAG_DEG_PER_PX: 0.5,
  /** Initial camera: 20° above the orbital plane, side-on to the edge-on Earth direction (+x). */
  INITIAL_ELEVATION: 20,
  BACKGROUND_CORNER_X: 6,
  BACKGROUND_CORNER_Y: 6,
  TITLE_BOTTOM: -4,
  NOT_TO_SCALE_LEFT: 8,
  NOT_TO_SCALE_TOP: 6,
  LEFT_LEFT: 8,
  TOP_TOP: 6,
  /** Plane fill opacity (dimensionless). */
  PLANE_FILL_OPACITY: 0.12,
  PLANET_LABEL_MAX_WIDTH: 80,
  EARTH_ARROW_HEAD_HEIGHT: 12,
  EARTH_ARROW_HEAD_WIDTH: 14,
  EARTH_ARROW_TAIL_WIDTH: 4,
  EARTH_LABEL_MAX_WIDTH: 90,
  LABEL_OFFSET_Y: -18,
  CLIP_AREA_CORNER_X: 6,
  CLIP_AREA_CORNER_Y: 6,
} as const;

/** Settings for lining-up/view/RandomSkyNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const RANDOM_SKY_NODE_SETTINGS = {
  COUNT_TEXT_DIGITS: 2, // digits

  COLUMNS: 10,
  CELL: 20,
  ORBIT_RADIUS: 8.5,
  BACKGROUND_CORNER_X: 4,
  BACKGROUND_CORNER_Y: 4,
  TRANSITING_LINE_WIDTH: 1.6,
  MISSING_LINE_WIDTH: 0.8,
  CONSTRUCTOR_RADIUS: 1.6,
  CONSTRUCTOR_SPACING: 6,
} as const;

/** Settings for lining-up/view/SkyViewNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const SKY_VIEW_NODE_SETTINGS = {
  FAR_ABOVE_TEXT_DIGITS: 2, // digits

  CHORD_LINE_DASH_DASH: 6, // px
  CONSTRUCTOR_CHORD_LINE_DASH_DASH: 5, // px
  FAR_ABOVE_TEXT_MAX_WIDTH_OFFSET: 20, // px
  CONSTRUCTOR_LEFT_OFFSET: 12, // px
  MAGNIFICATION_TEXT_MAX_WIDTH_OFFSET: 16, // px
  MULTILINK_BOTTOM_OFFSET: 6, // px

  BACKGROUND_CORNER_X: 6,
  BACKGROUND_CORNER_Y: 6,
  TITLE_BOTTOM: -4,
  CHORD_LINE_WIDTH: 1.5,
  FAR_ABOVE_START_Y: 34,
  FAR_ABOVE_END_Y: 12,
  FAR_ABOVE_HEAD_HEIGHT: 9,
  FAR_ABOVE_HEAD_WIDTH: 12,
  FAR_ABOVE_TAIL_WIDTH: 3,
  CENTER_Y_CENTER_Y: 23,
  SCENE_CORNER_X: 6,
  SCENE_CORNER_Y: 6,
  LEFT_LEFT: 8,
} as const;

/** Settings for preferences/TransitHunterPreferencesNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const TRANSIT_HUNTER_PREFERENCES_NODE_SETTINGS = {
  HEADER_FONT_SIZE: 18,
  SHOW_EQUATIONS_CHECKBOX_FONT_SIZE: 14,
  SHOW_EQUATIONS_CHECKBOX_SPACING: 8,
  DESCRIPTION_FONT_SIZE: 12,
  DESCRIPTION_MAX_WIDTH: 420,
  CONSTRUCTOR_SPACING: 12,
} as const;

/** Layout lengths in px; precision values count digits; factors are dimensionless. */
export const PLANET_HUNT_SCREEN_SUMMARY_CONTENT_SETTINGS = {
  PERIOD_PLAIN_DIGITS: 4, // digits
  SPAN_DAYS_PLAIN_DIGITS: 3, // digits
  DETAILS_DIGITS: 4, // digits
  DETAILS_DIGITS_SEGMENT_2: 2, // digits

  UPDATE_MARKS_SPACING: 4, // px
} as const;

/** Layout lengths in px; precision values count digits; factors are dimensionless. */
export const STAR_NODE_SETTINGS = {
  DISC_LINE_WIDTH_FACTOR: 0.08, // dimensionless
} as const;

/** Layout lengths in px; precision values count digits; factors are dimensionless. */
export const CHART_FRAME_NODE_SETTINGS = {
  PLACE_AXIS_LABELS_TOP_OFFSET: 20, // px
  PLACE_AXIS_LABELS_RIGHT_OFFSET: 6, // px
} as const;

/** Numerical settings; units are specified per value. */
export const ORBIT_SOLVER = {
  /** Maximum planet-mass fixed-point iterations (count). */
  MASS_ITERATIONS: 50,
  /** Relative convergence tolerance on inferred planet mass. */
  MASS_RELATIVE_TOLERANCE: 1e-12,
} as const;

/** Component dimensions in px; ratios and control steps are dimensionless; precision counts digits. */
export const LINING_UP_SCREEN_SUMMARY_CONTENT_SETTINGS = {
  TRANSIT_PATTERN_DIGITS: 2, // digits
  PLAIN_DIGITS: 2, // digits
  PLAIN_DIGITS_SEGMENT_2: 3, // digits
  PLAIN_DIGITS_SEGMENT_3: 4, // digits
} as const;

/** Component dimensions in px; ratios and control steps are dimensionless; precision counts digits. */
export const LIGHT_CURVE_SCREEN_SUMMARY_CONTENT_SETTINGS = {
  PLAIN_DIGITS: 2, // digits
  PLAIN_DIGITS_SEGMENT_2: 3, // digits
} as const;

/** Component dimensions in px; ratios and control steps are dimensionless; precision counts digits. */
export const DIMMING_SCREEN_SUMMARY_CONTENT_SETTINGS = {
  FORMAT_SIGNIFICANT_DIGITS: 2, // digits
} as const;

/** Component dimensions in px; ratios and control steps are dimensionless; precision counts digits. */
export const ROCK_OR_GAS_SCREEN_SUMMARY_CONTENT_SETTINGS = {
  RADIUS_EARTH_PLAIN_DIGITS: 3, // digits
  TRUE_MASS_PLAIN_DIGITS: 3, // digits
  PLAIN_DIGITS: 2, // digits
} as const;

TransitHunterNamespace.register("TransitHunterConstants", {
  G_SI,
  SCREEN_VIEW_MARGIN,
  PANEL_CORNER_RADIUS,
});

/**
 * formatters.ts
 *
 * Readout formatting: percentages of light, "1 part in N", and values with
 * localized units built from the "{{value}} {{units}}" pattern so a locale can
 * reorder them. Also the 1-2-5 helpers used to pick chart ranges and to label
 * drawing exaggerations.
 */

import { StringUtils } from "scenerystack/phetcommon";
import { StringManager } from "../../i18n/StringManager.js";
import { formatGrouped, formatSignificant } from "./chartUtils.js";

/** "{{value}} {{units}}" with the localized pattern. */
export function valueWithUnits(value: string, units: string): string {
  return StringUtils.fillIn(StringManager.getInstance().getUnits().valueUnitsPatternStringProperty.value, {
    value: value,
    units: units,
  });
}

/** A fraction (0–1) as a percentage with two significant figures: 0.0106 → "1.1", 8.4e-5 → "0.0084". */
export function formatPercent(fraction: number): string {
  return formatSignificant(fraction * 100, 2);
}

/** 1 / fraction to two significant figures with grouped thousands: 8.4e-5 → "12 000". */
export function formatPartsIn(fraction: number): string {
  if (!(fraction > 0)) {
    return "—";
  }
  return formatGrouped(Number((1 / fraction).toPrecision(2)));
}

/**
 * Decimal places a brightness percentage needs so a dip of `depth` (fraction)
 * shows in the readout: one more than the first significant digit of the depth.
 */
export function brightnessDecimals(depth: number): number {
  if (!(depth > 0)) {
    return 1;
  }
  return Math.min(5, Math.max(1, Math.ceil(-Math.log10(depth * 100)) + 1));
}

/** The smallest of 1, 2 or 5 × 10ⁿ that is at least `value` (for chart ranges). */
export function niceCeil(value: number): number {
  if (!(value > 0 && Number.isFinite(value))) {
    return 1;
  }
  const decade = 10 ** Math.floor(Math.log10(value));
  const mantissa = value / decade;
  return decade * (mantissa <= 1 + 1e-9 ? 1 : mantissa <= 2 + 1e-9 ? 2 : mantissa <= 5 + 1e-9 ? 5 : 10);
}

/**
 * How much bigger than true size something must be drawn to reach `minimum`
 * pixels, as a 1-2-5 factor (1 when it is already big enough).
 */
export function drawingMagnification(truePixels: number, minimum: number): number {
  if (truePixels >= minimum || !(truePixels > 0)) {
    return 1;
  }
  return niceCeil(minimum / truePixels);
}

/** A duration in days ("3.52 days"), or years above two years. */
export function formatDays(days: number): string {
  const units = StringManager.getInstance().getUnits();
  return valueWithUnits(formatSignificant(days, 3), units.daysStringProperty.value);
}

/** A duration in hours ("2.9 h"). */
export function formatHours(hours: number): string {
  const units = StringManager.getInstance().getUnits();
  return valueWithUnits(formatSignificant(hours, 2), units.hoursStringProperty.value);
}

/** Earth masses above which a planet mass reads in Jupiter masses. */
const JUPITER_MASS_THRESHOLD_EARTH = 30;

/** Earth masses per Jupiter mass. */
const EARTH_MASSES_PER_JUPITER = 317.83;

/** A planet mass given in Earth masses: in Earth masses when small, Jupiter masses when large. */
export function formatPlanetMass(massEarth: number): string {
  const units = StringManager.getInstance().getUnits();
  return massEarth < JUPITER_MASS_THRESHOLD_EARTH
    ? valueWithUnits(formatSignificant(massEarth, 2), units.earthMassesStringProperty.value)
    : valueWithUnits(
        formatSignificant(massEarth / EARTH_MASSES_PER_JUPITER, 2),
        units.jupiterMassesStringProperty.value,
      );
}

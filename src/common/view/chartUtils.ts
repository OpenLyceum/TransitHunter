/**
 * chartUtils.ts
 *
 * Small pure helpers shared by the charts and the numeric readouts (adapted from
 * RelativisticDynamics). They pick a "nice" tick spacing for an arbitrary value
 * range, work out how many decimal places the labels then need, and format
 * values for display.
 */

import { toFixed } from "scenerystack/dot";

/**
 * Pick a "nice" step (1, 2, or 5 × 10ⁿ) that yields roughly `targetDivisions`
 * segments across `rangeSpan`.
 */
export const niceStep = (rangeSpan: number, targetDivisions = 5): number => {
  const safeSpan = Number.isFinite(rangeSpan) && rangeSpan > 0 ? rangeSpan : 1;
  const raw = safeSpan / targetDivisions;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  let coefficient: number;
  if (normalized < 1.5) {
    coefficient = 1;
  } else if (normalized < 3) {
    coefficient = 2;
  } else if (normalized < 7) {
    coefficient = 5;
  } else {
    coefficient = 10;
  }
  return coefficient * magnitude;
};

/** Number of decimal places a tick label needs so it lines up with its step. */
export const decimalPlacesForStep = (step: number): number => {
  if (step <= 0 || !Number.isFinite(step)) {
    return 0;
  }
  return Math.min(4, Math.max(0, -Math.floor(Math.log10(step))));
};

/** Format a tick or readout value to a fixed number of decimals (dot's stable toFixed). */
export const formatTickValue = (value: number, decimalPlaces: number): string => {
  if (!Number.isFinite(value)) {
    return "—";
  }
  // −0 formats as "-0", which reads as an error rather than as zero.
  const text = toFixed(value === 0 ? 0 : value, decimalPlaces);
  return text.replace("-", "−");
};

/**
 * Format to `digits` significant figures, dropping trailing zeros, with a true
 * minus sign. Large and tiny values use plain decimals down to 10⁻⁴; anything
 * smaller is written in scientific notation with a superscript exponent
 * (rich text).
 */
export const formatSignificant = (value: number, digits = 3): string => {
  if (!Number.isFinite(value)) {
    return "—";
  }
  if (value === 0) {
    return "0";
  }
  const magnitude = Math.abs(value);
  if (magnitude < 1e-4) {
    const exponent = Math.floor(Math.log10(magnitude));
    const mantissa = Number((value / 10 ** exponent).toPrecision(digits));
    return `${String(mantissa).replace("-", "−")} × 10<sup>${String(exponent).replace("-", "−")}</sup>`;
  }
  return String(Number(value.toPrecision(digits))).replace("-", "−");
};

/** Format with an explicit sign (+ or −), for velocities and shifts. */
export const formatSigned = (value: number, digits = 3): string => {
  const text = formatSignificant(value, digits);
  return value > 0 ? `+${text}` : text;
};

/** Format an integer with thin-space thousands separators (1 000 000). */
export const formatGrouped = (value: number): string => String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

/** Strips rich-text markup for screen-reader text: "2 × 10<sup>−5</sup>" becomes "2 × 10^-5". */
export const toPlainText = (text: string): string =>
  text
    .replace(/<sup>/g, "^")
    .replace(/<\/sup>/g, "")
    .replace(/<\/?sub>/g, "")
    .replace(/−/g, "-");

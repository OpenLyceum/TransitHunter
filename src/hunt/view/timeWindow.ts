/**
 * timeWindow.ts
 *
 * Pure helpers for the Planet Hunt chart's time axis when the user zooms in or
 * scrolls. A window is the range of days shown; `limits` is the range that
 * shows all the data (all the data). A window never leaves the limits, and
 * zooming out to the limits or past them returns null, which means "show all"
 * (the chart then grows with the data again).
 */

import { Range } from "scenerystack/dot";

/**
 * Scales a window by `factor` (below 1 zooms in) about the time `anchor`, which
 * stays at the same place on screen. The span never drops below `minSpan`.
 */
export function zoomTimeWindow(
  window: Range,
  factor: number,
  anchor: number,
  limits: Range,
  minSpan: number,
): Range | null {
  const span = Math.max(window.getLength() * factor, Math.min(minSpan, limits.getLength()));
  if (span >= limits.getLength()) {
    return null;
  }
  const anchorFraction = window.getLength() > 0 ? (anchor - window.min) / window.getLength() : 0.5;
  return clampTimeWindow(anchor - anchorFraction * span, span, limits);
}

/** Moves a window by `delta` days (positive is later), stopping at the limits. */
export function panTimeWindow(window: Range, delta: number, limits: Range): Range {
  return clampTimeWindow(window.min + delta, window.getLength(), limits);
}

/** A window of the given start and span, slid back inside the limits. */
function clampTimeWindow(start: number, span: number, limits: Range): Range {
  const min = Math.min(Math.max(start, limits.min), limits.max - span);
  return new Range(min, min + span);
}

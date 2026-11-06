/**
 * ChartFrameNode.ts
 *
 * A bamboo chart frame shared by every chart in the sim: background rectangle,
 * gridlines, ticks and tick labels on the left and bottom edges, axis titles,
 * a clipped plot layer for curves, and an unclipped overlay layer for markers.
 * Screens add their own LinePlots to `plotLayer`.
 *
 * The ranges can change after construction ({@link setRanges}); the gridline and
 * tick spacing follow, so a chart whose scale depends on the selected
 * planet does not need rebuilding. Copied from RelativisticDynamics.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { ChartRectangle, ChartTransform, GridLineSet, TickLabelSet, TickMarkSet } from "scenerystack/bamboo";
import { Range } from "scenerystack/dot";
import { Orientation } from "scenerystack/phet-core";
import { Node, type NodeOptions, RichText, Text } from "scenerystack/scenery";
import TransitHunterColors from "../../TransitHunterColors.js";
import { FONTS } from "../../TransitHunterConstants.js";
import { decimalPlacesForStep, formatTickValue, niceStep } from "./chartUtils.js";

export type ChartFrameNodeOptions = {
  viewWidth: number;
  viewHeight: number;
  xRange: Range;
  yRange: Range;
  xAxisLabelProperty: TReadOnlyProperty<string>;
  yAxisLabelProperty: TReadOnlyProperty<string>;
  /** Approximate number of grid divisions along each axis. */
  targetDivisions?: number;
  nodeOptions?: NodeOptions;
};

export class ChartFrameNode extends Node {
  public readonly chartTransform: ChartTransform;

  /** Curves go here; clipped to the plotting rectangle. */
  public readonly plotLayer: Node;

  /** Markers and labels that may overhang the frame go here; not clipped. */
  public readonly overlayLayer: Node;

  private readonly targetDivisions: number;
  private readonly gridX: GridLineSet;
  private readonly gridY: GridLineSet;
  private readonly ticksX: TickMarkSet;
  private readonly ticksY: TickMarkSet;
  private readonly labelsX: TickLabelSet;
  private readonly labelsY: TickLabelSet;
  private xDecimals = 0;
  private yDecimals = 0;

  public constructor(options: ChartFrameNodeOptions) {
    super();
    this.targetDivisions = options.targetDivisions ?? 5;

    this.chartTransform = new ChartTransform({
      viewWidth: options.viewWidth,
      viewHeight: options.viewHeight,
      modelXRange: options.xRange,
      modelYRange: options.yRange,
    });
    const transform = this.chartTransform;

    const background = new ChartRectangle(transform, {
      fill: TransitHunterColors.chartBackgroundColorProperty,
      stroke: TransitHunterColors.chartAxisColorProperty,
      lineWidth: 1,
    });

    const gridOptions = { stroke: TransitHunterColors.chartGridColorProperty };
    this.gridX = new GridLineSet(transform, Orientation.HORIZONTAL, 1, gridOptions);
    this.gridY = new GridLineSet(transform, Orientation.VERTICAL, 1, gridOptions);

    const tickOptions = { edge: "min" as const, stroke: TransitHunterColors.chartAxisColorProperty, extent: 5 };
    this.ticksX = new TickMarkSet(transform, Orientation.HORIZONTAL, 1, tickOptions);
    this.ticksY = new TickMarkSet(transform, Orientation.VERTICAL, 1, tickOptions);

    const makeLabel = (value: number, decimals: number): Text =>
      new Text(formatTickValue(value, decimals), {
        font: FONTS.TICK_LABEL,
        fill: TransitHunterColors.textColorProperty,
      });
    this.labelsX = new TickLabelSet(transform, Orientation.HORIZONTAL, 1, {
      edge: "min",
      extent: 6,
      createLabel: (value: number) => makeLabel(value, this.xDecimals),
    });
    this.labelsY = new TickLabelSet(transform, Orientation.VERTICAL, 1, {
      edge: "min",
      extent: 6,
      createLabel: (value: number) => makeLabel(value, this.yDecimals),
    });

    this.plotLayer = new Node({ clipArea: background.getShape() });
    this.overlayLayer = new Node();

    const xAxisLabel = new RichText(options.xAxisLabelProperty, {
      font: FONTS.AXIS_LABEL,
      fill: TransitHunterColors.textColorProperty,
      maxWidth: options.viewWidth,
    });
    const yAxisLabel = new RichText(options.yAxisLabelProperty, {
      font: FONTS.AXIS_LABEL,
      fill: TransitHunterColors.textColorProperty,
      rotation: -Math.PI / 2,
      maxWidth: options.viewHeight,
    });
    // The y-axis title sits left of the widest tick label (long labels such as 100.015 % on a zoomed
    // brightness axis would otherwise run into it), and never closer than 32 px to the axis.
    const placeAxisLabels = (): void => {
      xAxisLabel.centerX = options.viewWidth / 2;
      xAxisLabel.top = options.viewHeight + 20;
      yAxisLabel.centerY = options.viewHeight / 2;
      const labelsLeft = this.labelsY.bounds.isFinite() ? this.labelsY.left : 0;
      yAxisLabel.right = Math.min(-32, labelsLeft - 6);
    };
    xAxisLabel.boundsProperty.lazyLink(placeAxisLabels);
    yAxisLabel.boundsProperty.lazyLink(placeAxisLabels);
    this.labelsY.boundsProperty.lazyLink(placeAxisLabels);
    placeAxisLabels();

    this.children = [
      background,
      this.gridX,
      this.gridY,
      this.plotLayer,
      this.ticksX,
      this.ticksY,
      this.labelsX,
      this.labelsY,
      xAxisLabel,
      yAxisLabel,
      this.overlayLayer,
    ];

    this.setRanges(options.xRange, options.yRange);
    if (options.nodeOptions) {
      this.mutate(options.nodeOptions);
    }
  }

  /** Changes the model ranges and re-chooses gridline and tick spacing to suit. */
  public setRanges(xRange: Range, yRange: Range): void {
    const xStep = niceStep(xRange.getLength(), this.targetDivisions);
    const yStep = niceStep(yRange.getLength(), this.targetDivisions);
    this.xDecimals = decimalPlacesForStep(xStep);
    this.yDecimals = decimalPlacesForStep(yStep);
    // Park every spacing at a huge value while the ranges change. Otherwise a range that
    // grows by orders of magnitude (a 1 m/s wobble to a 2 km/s one) is briefly drawn with the old, tiny
    // spacing, creating tens of thousands of tick nodes.
    const parked = Number.MAX_SAFE_INTEGER;
    for (const set of [this.gridX, this.ticksX, this.labelsX, this.gridY, this.ticksY, this.labelsY]) {
      set.setSpacing(parked);
    }
    this.chartTransform.setModelXRange(new Range(xRange.min, xRange.max));
    this.chartTransform.setModelYRange(new Range(yRange.min, yRange.max));
    this.gridX.setSpacing(xStep);
    this.ticksX.setSpacing(xStep);
    this.labelsX.setSpacing(xStep);
    this.gridY.setSpacing(yStep);
    this.ticksY.setSpacing(yStep);
    this.labelsY.setSpacing(yStep);
    // Labels are cached by value; the decimal count may have changed with the range.
    this.labelsX.invalidateTickLabelSet();
    this.labelsY.invalidateTickLabelSet();
  }
}

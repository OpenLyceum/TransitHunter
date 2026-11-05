/**
 * LightCurveChartNode.ts
 *
 * A light-curve chart: measurements as dots, the noise-free curve as a line, and
 * an annotation layer (in view coordinates) for the measuring marks. The
 * brightness axis is in percent and zooms to fit the dip and the scatter.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { LinePlot, ScatterPlot } from "scenerystack/bamboo";
import { Range, Vector2 } from "scenerystack/dot";
import { Node, Text } from "scenerystack/scenery";
import { ChartFrameNode } from "../../common/view/ChartFrameNode.js";
import { niceCeil } from "../../common/view/formatters.js";
import TransitHunterColors from "../../TransitHunterColors.js";
import { FONTS } from "../../TransitHunterConstants.js";
import type { LightCurvePoint } from "../model/LightCurveModel.js";

export class LightCurveChartNode extends Node {
  public readonly frame: ChartFrameNode;

  /** Measuring marks go here (view coordinates of the frame). */
  public readonly annotationLayer = new Node();

  private readonly dots: ScatterPlot;
  private readonly line: LinePlot;

  public constructor(
    titleProperty: TReadOnlyProperty<string>,
    xAxisLabelProperty: TReadOnlyProperty<string>,
    yAxisLabelProperty: TReadOnlyProperty<string>,
    width: number,
    height: number,
  ) {
    super();
    this.frame = new ChartFrameNode({
      viewWidth: width,
      viewHeight: height,
      xRange: new Range(0, 1),
      yRange: new Range(99, 100.2),
      xAxisLabelProperty: xAxisLabelProperty,
      yAxisLabelProperty: yAxisLabelProperty,
      targetDivisions: 4,
    });
    this.dots = new ScatterPlot(this.frame.chartTransform, [], {
      fill: TransitHunterColors.measurementColorProperty,
      radius: 1.6,
    });
    this.line = new LinePlot(this.frame.chartTransform, [], {
      stroke: TransitHunterColors.lightCurveColorProperty,
      lineWidth: 2,
    });
    this.frame.plotLayer.children = [this.dots, this.line];
    this.frame.overlayLayer.addChild(this.annotationLayer);
    const title = new Text(titleProperty, {
      font: FONTS.TITLE,
      fill: TransitHunterColors.textColorProperty,
      maxWidth: width + 50,
      left: -50,
      bottom: -6,
    });
    this.children = [title, this.frame];
  }

  /**
   * Sets the data. The brightness axis goes down to fit the dip (with room) and
   * three standard deviations of scatter, and up to fit the scatter.
   *
   * @param depth - depth of the dip (fraction)
   * @param scatter - standard deviation of a plotted point (fraction)
   */
  public setData(
    xRange: Range,
    observations: readonly LightCurvePoint[],
    model: readonly LightCurvePoint[],
    depth: number,
    scatter: number,
  ): void {
    const below = Math.min(100, niceCeil(100 * Math.max(1.25 * depth, 3 * scatter, 1e-6)));
    const above = Math.max(0.15 * below, 300 * scatter);
    this.frame.setRanges(xRange, new Range(100 - below, 100 + above));
    this.dots.setDataSet(observations.map((p) => new Vector2(p.x, 100 * p.y)));
    this.line.setDataSet(model.map((p) => new Vector2(p.x, 100 * p.y)));
  }
}

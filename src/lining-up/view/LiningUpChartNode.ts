/**
 * LiningUpChartNode.ts
 *
 * The light curve around mid-transit (time in hours) for the current tilt, over
 * a dashed ghost of the edge-on transit: tilting the orbit makes the transit
 * shorter, then V-shaped (grazing), then it disappears.
 */

import { Multilink, PatternStringProperty, StringProperty } from "scenerystack/axon";
import { LinePlot } from "scenerystack/bamboo";
import { Range, Vector2 } from "scenerystack/dot";
import { Circle, Node, RichText, Text } from "scenerystack/scenery";
import { relativeFlux, uniformDepth } from "../../common/model/transitPhysics.js";
import { ChartFrameNode } from "../../common/view/ChartFrameNode.js";
import { formatSignificant } from "../../common/view/chartUtils.js";
import { niceCeil } from "../../common/view/formatters.js";
import { linkUntilDisposed } from "../../common/view/linkUntilDisposed.js";
import { StringManager } from "../../i18n/StringManager.js";
import TransitHunterColors from "../../TransitHunterColors.js";
import { FONTS } from "../../TransitHunterConstants.js";
import type { LiningUpModel } from "../model/LiningUpModel.js";

const SAMPLES = 300;
const HEADROOM = 0.15;

export class LiningUpChartNode extends Node {
  public constructor(model: LiningUpModel, width: number, height: number) {
    super();
    const stringManager = StringManager.getInstance();
    const common = stringManager.getCommonStrings();
    const strings = stringManager.getLiningUpStrings();

    const frame = new ChartFrameNode({
      viewWidth: width,
      viewHeight: height,
      xRange: new Range(-1, 1),
      yRange: new Range(99, 100.2),
      xAxisLabelProperty: common.hoursFromMidTransitAxisStringProperty,
      yAxisLabelProperty: common.brightnessAxisStringProperty,
      targetDivisions: 4,
    });
    const ghost = new LinePlot(frame.chartTransform, [], {
      stroke: TransitHunterColors.mutedTextColorProperty,
      lineWidth: 1.5,
      lineDash: [5, 4],
    });
    const line = new LinePlot(frame.chartTransform, [], {
      stroke: TransitHunterColors.lightCurveColorProperty,
      lineWidth: 2,
    });
    frame.plotLayer.children = [ghost, line];
    const liveDot = new Circle(4, { fill: TransitHunterColors.liveDotColorProperty });
    frame.overlayLayer.addChild(liveDot);

    const title = new Text(strings.chartTitleStringProperty, {
      font: FONTS.TITLE,
      fill: TransitHunterColors.textColorProperty,
      maxWidth: width + 40,
      left: -40,
      bottom: -6,
    });
    const legend = new RichText(strings.ghostLegendStringProperty, {
      font: FONTS.SMALL,
      fill: TransitHunterColors.mutedTextColorProperty,
      maxWidth: width + 40,
    });
    const spanTextProperty = new StringProperty("1");
    const zoomNote = new RichText(
      new PatternStringProperty(common.axisZoomPatternStringProperty, { percent: spanTextProperty }),
      { font: FONTS.SMALL, fill: TransitHunterColors.mutedTextColorProperty, maxWidth: width + 40 },
    );
    linkUntilDisposed(this, legend.boundsProperty, () => {
      legend.left = -40;
      legend.top = height + 38;
    });
    linkUntilDisposed(this, zoomNote.boundsProperty, () => {
      zoomNote.left = -40;
      zoomNote.top = height + 54;
    });

    this.children = [title, frame, legend, zoomNote];

    const updateCurves = (): void => {
      const g = model.geometryProperty.value;
      const edgeOn = model.edgeOnGeometryProperty.value;
      const halfWidth = model.windowHalfWidthProperty.value;
      const hours = halfWidth * model.periodProperty.value * 24;
      const span = Math.min(100, niceCeil(uniformDepth(g.radiusRatio) * 100 * 1.25));
      frame.setRanges(new Range(-hours, hours), new Range(100 - span, 100 + HEADROOM * span));
      spanTextProperty.value = formatSignificant(span, 2);
      zoomNote.visible = span < 100;
      const curve = (geometry: typeof g): Vector2[] =>
        Array.from({ length: SAMPLES + 1 }, (_, i) => {
          const t = -0.5 + i / SAMPLES;
          return new Vector2(2 * t * hours, 100 * relativeFlux(2 * t * halfWidth, geometry));
        });
      ghost.setDataSet(curve(edgeOn));
      line.setDataSet(curve(g));
    };
    const curveLink = Multilink.multilink([model.geometryProperty, model.windowHalfWidthProperty], updateCurves);
    // Between transits the time is off the chart, so the dot is hidden.
    const dotLink = Multilink.multilink(
      [model.windowTimeProperty, model.brightnessProperty, model.geometryProperty, model.fastForwardingProperty],
      (t, brightness, _geometry, fastForwarding) => {
        const hours = model.windowHalfWidthProperty.value * model.periodProperty.value * 24;
        liveDot.center = frame.chartTransform.modelToViewXY(2 * t * hours, 100 * brightness);
        liveDot.visible = !fastForwarding;
      },
    );
    this.disposeEmitter.addListener(() => {
      curveLink.dispose();
      dotLink.dispose();
    });
  }
}

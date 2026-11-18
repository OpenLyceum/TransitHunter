import { LINING_UP_CHART_NODE_SETTINGS } from "../../TransitHunterConstants.js";
/**
 * LiningUpChartNode.ts
 *
 * The light curve around mid-transit (time in hours) for the current tilt, over
 * a dashed ghost of the edge-on transit: tilting the orbit makes the transit
 * shorter, then V-shaped (grazing), then it disappears.
 */

import { DerivedProperty, Multilink, PatternStringProperty, StringProperty } from "scenerystack/axon";
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

const SAMPLES: number = LINING_UP_CHART_NODE_SETTINGS.SAMPLES;
const HEADROOM: number = LINING_UP_CHART_NODE_SETTINGS.HEADROOM;

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
      yRange: new Range(LINING_UP_CHART_NODE_SETTINGS.FRAME_RANGE_MIN, LINING_UP_CHART_NODE_SETTINGS.FRAME_RANGE_MAX),
      xAxisLabelProperty: common.hoursFromMidTransitAxisStringProperty,
      yAxisLabelProperty: common.brightnessAxisStringProperty,
      targetDivisions: 4,
    });
    const ghost = new LinePlot(frame.chartTransform, [], {
      stroke: TransitHunterColors.mutedTextColorProperty,
      lineWidth: LINING_UP_CHART_NODE_SETTINGS.GHOST_LINE_WIDTH,
      lineDash: [LINING_UP_CHART_NODE_SETTINGS.GHOST_LINE_DASH_DASH, LINING_UP_CHART_NODE_SETTINGS.GHOST_LINE_DASH_GAP],
    });
    const line = new LinePlot(frame.chartTransform, [], {
      stroke: TransitHunterColors.lightCurveColorProperty,
      lineWidth: LINING_UP_CHART_NODE_SETTINGS.LINE_LINE_WIDTH,
    });
    frame.plotLayer.children = [ghost, line];
    const liveDot = new Circle(LINING_UP_CHART_NODE_SETTINGS.LIVE_DOT_RADIUS, {
      fill: TransitHunterColors.liveDotColorProperty,
    });
    frame.overlayLayer.addChild(liveDot);

    const title = new Text(strings.chartTitleStringProperty, {
      font: FONTS.TITLE,
      fill: TransitHunterColors.textColorProperty,
      maxWidth: width + LINING_UP_CHART_NODE_SETTINGS.TITLE_MAX_WIDTH_OFFSET,
      left: LINING_UP_CHART_NODE_SETTINGS.TITLE_LEFT,
      bottom: LINING_UP_CHART_NODE_SETTINGS.TITLE_BOTTOM,
    });
    const legend = new RichText(strings.ghostLegendStringProperty, {
      font: FONTS.SMALL,
      fill: TransitHunterColors.mutedTextColorProperty,
      maxWidth: width + LINING_UP_CHART_NODE_SETTINGS.LEGEND_MAX_WIDTH_OFFSET,
    });
    const spanTextProperty = new StringProperty("1");
    const zoomNote = new RichText(
      new PatternStringProperty(common.axisZoomPatternStringProperty, { percent: spanTextProperty }),
      {
        font: FONTS.SMALL,
        fill: TransitHunterColors.mutedTextColorProperty,
        maxWidth: width + LINING_UP_CHART_NODE_SETTINGS.ZOOM_NOTE_MAX_WIDTH_OFFSET,
      },
    );
    linkUntilDisposed(this, legend.boundsProperty, () => {
      legend.left = LINING_UP_CHART_NODE_SETTINGS.LEFT_LEFT;
      legend.top = height + LINING_UP_CHART_NODE_SETTINGS.TOP_OFFSET;
    });
    linkUntilDisposed(this, zoomNote.boundsProperty, () => {
      zoomNote.left = LINING_UP_CHART_NODE_SETTINGS.LEFT_LEFT;
      zoomNote.top = height + 54;
    });

    this.children = [title, frame, legend, zoomNote];

    // Half-span of the hours axis. The period updates after the geometry when the
    // distance changes, so every drawing below takes the span from here rather than
    // reading the period itself (which would lag one step behind).
    const hoursHalfSpanProperty = new DerivedProperty(
      [model.windowHalfWidthProperty, model.periodProperty],
      (halfWidth, period) => halfWidth * period * 24,
    );
    const updateDot = (): void => {
      const hours = hoursHalfSpanProperty.value;
      liveDot.center = frame.chartTransform.modelToViewXY(
        2 * model.windowTimeProperty.value * hours,
        100 * model.brightnessProperty.value,
      );
      liveDot.visible = !model.fastForwardingProperty.value;
    };
    const curveLink = Multilink.multilink(
      [model.geometryProperty, model.edgeOnGeometryProperty, model.windowHalfWidthProperty, hoursHalfSpanProperty],
      (g, edgeOn, halfWidth, hours) => {
        const span = Math.min(100, niceCeil(uniformDepth(g.radiusRatio) * 100 * 1.25));
        frame.setRanges(new Range(-hours, hours), new Range(100 - span, 100 + HEADROOM * span));
        spanTextProperty.value = formatSignificant(span, LINING_UP_CHART_NODE_SETTINGS.SPAN_TEXT_PROPERTY_DIGITS);
        zoomNote.visible = span < 100;
        const curve = (geometry: typeof g): Vector2[] =>
          Array.from({ length: SAMPLES + 1 }, (_, i) => {
            const t = -0.5 + i / SAMPLES;
            return new Vector2(2 * t * hours, 100 * relativeFlux(2 * t * halfWidth, geometry));
          });
        ghost.setDataSet(curve(edgeOn));
        line.setDataSet(curve(g));
        // The ranges just changed, so the dot moves with them.
        updateDot();
      },
    );
    // Between transits the time is off the chart, so the dot is hidden.
    const dotLink = Multilink.multilink(
      [model.windowTimeProperty, model.brightnessProperty, model.fastForwardingProperty],
      updateDot,
    );
    this.disposeEmitter.addListener(() => {
      curveLink.dispose();
      dotLink.dispose();
      hoursHalfSpanProperty.dispose();
    });
  }
}

import { DIMMING_CHART_NODE_SETTINGS } from "../../TransitHunterConstants.js";
/**
 * DimmingChartNode.ts
 *
 * The star's brightness against time, drawn as the planet orbits: a sweep over
 * TRACE_ORBITS orbits that restarts from the left. The brightness axis zooms in
 * so even Earth's tiny dip is visible, and says so whenever it is zoomed.
 */

import { Multilink, PatternStringProperty, StringProperty } from "scenerystack/axon";
import { LinePlot } from "scenerystack/bamboo";
import { Range, Vector2 } from "scenerystack/dot";
import { Circle, Node, RichText, Text } from "scenerystack/scenery";
import { ChartFrameNode } from "../../common/view/ChartFrameNode.js";
import { formatSignificant } from "../../common/view/chartUtils.js";
import { niceCeil } from "../../common/view/formatters.js";
import { linkUntilDisposed } from "../../common/view/linkUntilDisposed.js";
import { StringManager } from "../../i18n/StringManager.js";
import TransitHunterColors from "../../TransitHunterColors.js";
import { FONTS } from "../../TransitHunterConstants.js";
import { type DimmingModel, TRACE_ORBITS } from "../model/DimmingModel.js";

/** Headroom above 100 % as a fraction of the zoomed span. */
const HEADROOM: number = DIMMING_CHART_NODE_SETTINGS.HEADROOM;

/** The brightness span (percent below 100) the axis shows for a dip of `depth` (fraction). */
function brightnessSpan(depth: number): number {
  return Math.min(100, niceCeil(depth * 100 * 1.25));
}

export class DimmingChartNode extends Node {
  public constructor(model: DimmingModel, width: number, height: number) {
    super();
    const stringManager = StringManager.getInstance();
    const common = stringManager.getCommonStrings();
    const strings = stringManager.getDimmingStrings();

    const frame = new ChartFrameNode({
      viewWidth: width,
      viewHeight: height,
      xRange: new Range(0, TRACE_ORBITS),
      yRange: new Range(DIMMING_CHART_NODE_SETTINGS.FRAME_RANGE_MIN, DIMMING_CHART_NODE_SETTINGS.FRAME_RANGE_MAX),
      xAxisLabelProperty: common.orbitsAxisStringProperty,
      yAxisLabelProperty: common.brightnessAxisStringProperty,
      targetDivisions: 4,
    });
    const line = new LinePlot(frame.chartTransform, [], {
      stroke: TransitHunterColors.lightCurveColorProperty,
      lineWidth: DIMMING_CHART_NODE_SETTINGS.LINE_LINE_WIDTH,
    });
    frame.plotLayer.addChild(line);
    const liveDot = new Circle(DIMMING_CHART_NODE_SETTINGS.LIVE_DOT_RADIUS, {
      fill: TransitHunterColors.liveDotColorProperty,
    });
    frame.overlayLayer.addChild(liveDot);

    const title = new Text(strings.chartTitleStringProperty, {
      font: FONTS.TITLE,
      fill: TransitHunterColors.textColorProperty,
      maxWidth: width + DIMMING_CHART_NODE_SETTINGS.TITLE_MAX_WIDTH_OFFSET,
      left: DIMMING_CHART_NODE_SETTINGS.TITLE_LEFT,
      bottom: DIMMING_CHART_NODE_SETTINGS.TITLE_BOTTOM,
    });

    const spanTextProperty = new StringProperty("1");
    const zoomNote = new RichText(
      new PatternStringProperty(common.axisZoomPatternStringProperty, { percent: spanTextProperty }),
      {
        font: FONTS.SMALL,
        fill: TransitHunterColors.mutedTextColorProperty,
        maxWidth: width + DIMMING_CHART_NODE_SETTINGS.ZOOM_NOTE_MAX_WIDTH_OFFSET,
      },
    );
    linkUntilDisposed(this, zoomNote.boundsProperty, () => {
      zoomNote.left = DIMMING_CHART_NODE_SETTINGS.LEFT_LEFT;
      zoomNote.top = height + DIMMING_CHART_NODE_SETTINGS.TOP_OFFSET;
    });

    this.children = [title, frame, zoomNote];

    let span = 0;
    const multilink = Multilink.multilink(
      [model.phaseProperty, model.maxBlockedFractionProperty, model.sweepStartProperty],
      (_phase, depth) => {
        const newSpan = brightnessSpan(depth);
        if (newSpan !== span) {
          span = newSpan;
          frame.setRanges(new Range(0, TRACE_ORBITS), new Range(100 - span, 100 + HEADROOM * span));
          spanTextProperty.value = formatSignificant(span, DIMMING_CHART_NODE_SETTINGS.SPAN_TEXT_PROPERTY_DIGITS);
          zoomNote.visible = span < 100;
        }
        const samples = model.traceSamples();
        line.setDataSet(samples.map((sample) => new Vector2(sample.x, sample.y * 100)));
        const last = samples[samples.length - 1];
        if (last) {
          liveDot.center = frame.chartTransform.modelToViewXY(last.x, last.y * 100);
        }
      },
    );
    this.disposeEmitter.addListener(() => multilink.dispose());
  }
}

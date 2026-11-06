/**
 * LightCurveScreenView.ts
 *
 * The Light Curve screen: reading a planet from its dips.
 *
 *  - Top: several orbits of single measurements, with the period marked.
 *  - Middle: one transit, zoomed, from N transits folded together, with the
 *    depth and the duration marked.
 *  - Bottom: what the marks tell us (planet size, distance) and whether the dip
 *    stands out of the noise.
 *  - Right: planet, distance, star, limb darkening, noise and stacking controls.
 */

import {
  BooleanProperty,
  DerivedProperty,
  Multilink,
  PatternStringProperty,
  type TReadOnlyProperty,
} from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { StringUtils } from "scenerystack/phetcommon";
import { HBox, Node, RichText, Text, VBox } from "scenerystack/scenery";
import { ArrowNode, ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { AquaRadioButtonGroup, Panel } from "scenerystack/sun";
import { averagedNoise } from "../../common/model/lightCurveTools.js";
import { StarPreset } from "../../common/model/StarPreset.js";
import { FLAT_RESET_ALL_BUTTON_OPTIONS } from "../../common/TransitHunterButtonOptions.js";
import { TransitHunterPanel } from "../../common/TransitHunterPanel.js";
import { formatGrouped, formatSignificant } from "../../common/view/chartUtils.js";
import {
  createCheckbox,
  createEquationNode,
  createExplanationButton,
  createNumberControl,
  createPushButton,
} from "../../common/view/controls.js";
import { formatDays, formatHours, formatPercent, valueWithUnits } from "../../common/view/formatters.js";
import { StringManager } from "../../i18n/StringManager.js";
import TransitHunterColors from "../../TransitHunterColors.js";
import {
  CADENCE_MINUTES,
  CONTROL_PANEL_WIDTH,
  DETECTION_SNR,
  DISTANCE_RANGE,
  FONTS,
  HINT_SNR,
  NOISE_RANGE_PPM,
  PLANET_RADIUS_RANGE,
  SCREEN_VIEW_MARGIN,
  STACK_RANGE,
} from "../../TransitHunterConstants.js";
import { type LightCurveModel, MAX_WIDE_POINTS, WIDE_ORBITS } from "../model/LightCurveModel.js";
import { LightCurveChartNode } from "./LightCurveChartNode.js";
import { LightCurveScreenSummaryContent } from "./LightCurveScreenSummaryContent.js";

export type LightCurveScreenViewOptions = ScreenViewOptions;

const CHART_WIDTH = 560;
const WIDE_HEIGHT = 120;
const ZOOM_HEIGHT = 165;
const MODEL_SAMPLES = 1200;
const READOUT_COLUMN_WIDTH = 330;

/** Style of the measuring marks. */
const MARK_ARROW_OPTIONS = {
  doubleHead: true,
  headHeight: 7,
  headWidth: 9,
  tailWidth: 1.5,
  stroke: null,
  fill: TransitHunterColors.cursorColorProperty,
};

export class LightCurveScreenView extends ScreenView {
  private readonly showMeasurementsProperty = new BooleanProperty(true);

  public constructor(model: LightCurveModel, providedOptions?: LightCurveScreenViewOptions) {
    const options = optionize<LightCurveScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      {
        screenSummaryContent: new LightCurveScreenSummaryContent(model),
      },
      providedOptions,
    );
    super(options);

    const stringManager = StringManager.getInstance();
    const strings = stringManager.getLightCurveStrings();
    const common = stringManager.getCommonStrings();
    const units = stringManager.getUnits();
    const a11y = stringManager.getLightCurveA11yStrings();
    const bounds = this.layoutBounds;

    // ── Charts ────────────────────────────────────────────────────────────────
    const wideChart = new LightCurveChartNode(
      strings.wideChartTitleStringProperty,
      common.daysAxisStringProperty,
      common.brightnessAxisStringProperty,
      CHART_WIDTH,
      WIDE_HEIGHT,
    );
    wideChart.left = bounds.minX + SCREEN_VIEW_MARGIN + 60;
    wideChart.top = bounds.minY + SCREEN_VIEW_MARGIN + 22;
    const zoomChart = new LightCurveChartNode(
      strings.zoomChartTitleStringProperty,
      common.hoursFromMidTransitAxisStringProperty,
      common.brightnessAxisStringProperty,
      CHART_WIDTH,
      ZOOM_HEIGHT,
    );
    zoomChart.left = wideChart.left;
    zoomChart.top = wideChart.bottom + 30;

    // Measuring marks: period on the wide chart, depth and duration on the zoomed one.
    const markLabel = (): RichText =>
      new RichText("", { font: FONTS.SMALL, fill: TransitHunterColors.cursorColorProperty, maxWidth: 200 });
    // A dark backing keeps a label readable over scattered measurements.
    const backed = (text: RichText): Panel =>
      new Panel(text, {
        fill: TransitHunterColors.markBackingColorProperty,
        stroke: null,
        xMargin: 3,
        yMargin: 1,
        cornerRadius: 3,
      });
    const periodArrow = new ArrowNode(0, 0, 1, 0, MARK_ARROW_OPTIONS);
    const periodLabel = markLabel();
    const periodBacking = backed(periodLabel);
    wideChart.annotationLayer.children = [periodArrow, periodBacking];
    const depthArrow = new ArrowNode(0, 0, 0, 1, MARK_ARROW_OPTIONS);
    const depthLabel = markLabel();
    const durationArrow = new ArrowNode(0, 0, 1, 0, MARK_ARROW_OPTIONS);
    const durationLabel = markLabel();
    const depthBacking = backed(depthLabel);
    const durationBacking = backed(durationLabel);
    zoomChart.annotationLayer.children = [depthArrow, depthBacking, durationArrow, durationBacking];
    wideChart.annotationLayer.visibleProperty = this.showMeasurementsProperty;
    zoomChart.annotationLayer.visibleProperty = this.showMeasurementsProperty;

    const update = (): void => {
      const period = model.periodProperty.value;
      const depth = model.depthProperty.value;
      const noise = model.noiseProperty.value * 1e-6;
      const duration = model.durationProperty.value;

      // Wide chart: single measurements (binned above MAX_WIDE_POINTS).
      const spanMeasurements = (WIDE_ORBITS * period * 24 * 60) / CADENCE_MINUTES;
      const wideScatter = averagedNoise(noise, Math.max(1, spanMeasurements / MAX_WIDE_POINTS));
      wideChart.setData(
        new Range(0, WIDE_ORBITS * period),
        model.wideObservations(),
        model.wideModelCurve(MODEL_SAMPLES),
        depth,
        wideScatter,
      );
      const halfWidth = model.zoomHalfWidthHours();
      const zoomObservations = model.zoomObservations();
      const perPoint = (2 * halfWidth * 60) / CADENCE_MINUTES / zoomObservations.length;
      zoomChart.setData(
        new Range(-halfWidth, halfWidth),
        zoomObservations,
        model.zoomModelCurve(MODEL_SAMPLES / 4),
        depth,
        averagedNoise(noise, perPoint * model.stackProperty.value),
      );

      // Marks.
      const wide = wideChart.frame.chartTransform;
      const markY = wide.modelToViewY(100 - 50 * depth);
      periodArrow.setTailAndTip(wide.modelToViewX(0.5 * period), markY, wide.modelToViewX(1.5 * period), markY);
      periodLabel.string = StringUtils.fillIn(strings.periodMarkPatternStringProperty.value, {
        value: formatDays(period),
      });
      periodBacking.centerX = wide.modelToViewX(period);
      periodBacking.bottom = markY - 3;

      const zoom = zoomChart.frame.chartTransform;
      const x0 = zoom.modelToViewX(0);
      depthArrow.setTailAndTip(x0, zoom.modelToViewY(100), x0, zoom.modelToViewY(100 * (1 - depth)));
      depthLabel.string = StringUtils.fillIn(strings.depthMarkPatternStringProperty.value, {
        value: formatPercent(depth),
      });
      depthBacking.left = x0 + 6;
      depthBacking.centerY = zoom.modelToViewY(100 * (1 - depth / 2));
      const durationY = zoom.modelToViewY(100) - 12;
      durationArrow.setTailAndTip(
        zoom.modelToViewX(-duration / 2),
        durationY,
        zoom.modelToViewX(duration / 2),
        durationY,
      );
      durationLabel.string = StringUtils.fillIn(strings.durationMarkPatternStringProperty.value, {
        value: formatHours(duration),
      });
      durationBacking.centerX = x0;
      durationBacking.bottom = durationY - 4;
    };
    const multilink = Multilink.multilinkAny(
      [
        model.geometryProperty,
        model.periodProperty,
        model.noiseProperty,
        model.stackProperty,
        strings.periodMarkPatternStringProperty,
        strings.depthMarkPatternStringProperty,
        strings.durationMarkPatternStringProperty,
        units.daysStringProperty,
        units.hoursStringProperty,
        units.valueUnitsPatternStringProperty,
      ],
      update,
    );
    model.observationsChangedEmitter.addListener(update);

    // ── Readouts ──────────────────────────────────────────────────────────────
    const readout = (stringProperty: TReadOnlyProperty<string>): RichText =>
      new RichText(stringProperty, {
        font: FONTS.READOUT,
        fill: TransitHunterColors.textColorProperty,
        lineWrap: READOUT_COLUMN_WIDTH,
      });
    const radiusText = readout(
      new PatternStringProperty(strings.radiusReadoutPatternStringProperty, {
        depth: new DerivedProperty([model.depthProperty], formatPercent),
        radius: new DerivedProperty(
          [model.inferredRadiusProperty, units.earthRadiiStringProperty, units.valueUnitsPatternStringProperty],
          (radius, earthRadii) => valueWithUnits(formatSignificant(radius, 2), earthRadii),
        ),
      }),
    );
    const distanceText = readout(
      new PatternStringProperty(strings.distanceReadoutPatternStringProperty, {
        period: new DerivedProperty(
          [model.periodProperty, units.daysStringProperty, units.valueUnitsPatternStringProperty],
          (period) => formatDays(period),
        ),
        distance: new DerivedProperty(
          [model.distanceProperty, units.auStringProperty, units.valueUnitsPatternStringProperty],
          (distance, au) => valueWithUnits(formatSignificant(distance, 2), au),
        ),
      }),
    );
    const limbNote = new RichText(strings.limbDarkeningNoteStringProperty, {
      font: FONTS.SMALL,
      fill: TransitHunterColors.mutedTextColorProperty,
      lineWrap: READOUT_COLUMN_WIDTH,
      visibleProperty: model.limbDarkeningProperty,
    });
    const verdictProperty = new DerivedProperty(
      [
        model.signalToNoiseProperty,
        strings.noNoiseStringProperty,
        strings.lostStringProperty,
        strings.hintStringProperty,
        strings.detectedStringProperty,
      ],
      (snr, noNoise, lost, hint, detected) =>
        !Number.isFinite(snr) ? noNoise : snr < HINT_SNR ? lost : snr < DETECTION_SNR ? hint : detected,
    );
    const snrText = readout(
      new PatternStringProperty(strings.snrReadoutPatternStringProperty, {
        snr: new DerivedProperty([model.signalToNoiseProperty], (snr) =>
          Number.isFinite(snr) ? formatSignificant(snr, 2) : "∞",
        ),
        verdict: verdictProperty,
      }),
    );
    const pointsText = new RichText(
      new PatternStringProperty(strings.pointsReadoutPatternStringProperty, {
        points: new DerivedProperty([model.pointsInTransitProperty], formatGrouped),
        cadence: CADENCE_MINUTES,
      }),
      { font: FONTS.SMALL, fill: TransitHunterColors.mutedTextColorProperty, lineWrap: READOUT_COLUMN_WIDTH },
    );
    const equation = createEquationNode(strings.equationStringProperty, 2 * READOUT_COLUMN_WIDTH);
    const explanationButton = createExplanationButton(
      strings.explanationTitleStringProperty,
      [
        strings.explanation1StringProperty,
        strings.explanation2StringProperty,
        strings.explanation3StringProperty,
        strings.explanation4StringProperty,
      ],
      a11y.controls.explanationStringProperty,
    );
    const explanationRow = new HBox({
      spacing: 8,
      children: [
        explanationButton,
        new Text(common.explanationButtonStringProperty, {
          font: FONTS.LABEL,
          fill: TransitHunterColors.textColorProperty,
          maxWidth: 200,
        }),
      ],
    });
    const readoutPanel = new TransitHunterPanel(
      new VBox({
        spacing: 6,
        align: "left",
        children: [
          new HBox({
            spacing: 20,
            align: "top",
            children: [
              new VBox({ spacing: 5, align: "left", children: [radiusText, limbNote, distanceText] }),
              new VBox({ spacing: 5, align: "left", children: [snrText, pointsText, explanationRow] }),
            ],
          }),
          equation,
        ],
      }),
    );
    readoutPanel.left = bounds.minX + SCREEN_VIEW_MARGIN;
    readoutPanel.bottom = bounds.maxY - SCREEN_VIEW_MARGIN;

    // ── Controls ──────────────────────────────────────────────────────────────
    const radiusControl = createNumberControl(
      common.planetRadiusStringProperty,
      model.planetRadiusProperty,
      PLANET_RADIUS_RANGE,
      {
        unitsProperty: units.earthRadiiStringProperty,
        logarithmic: true,
        significantFigures: 2,
        enabledRangeProperty: model.planetRadiusRangeProperty,
        accessibleName: a11y.controls.planetRadiusStringProperty,
      },
    );
    const distanceControl = createNumberControl(common.distanceStringProperty, model.distanceProperty, DISTANCE_RANGE, {
      unitsProperty: units.auStringProperty,
      logarithmic: true,
      significantFigures: 2,
      enabledRangeProperty: model.distanceRangeProperty,
      accessibleName: a11y.controls.distanceStringProperty,
    });
    const label = (stringProperty: TReadOnlyProperty<string>): Text =>
      new Text(stringProperty, {
        font: FONTS.LABEL,
        fill: TransitHunterColors.textColorProperty,
        maxWidth: CONTROL_PANEL_WIDTH - 40,
      });
    const starRadios = new AquaRadioButtonGroup(
      model.starPresetProperty,
      [
        { value: StarPreset.SUN_LIKE, createNode: () => label(common.sunLikeStarStringProperty) },
        { value: StarPreset.RED_DWARF, createNode: () => label(common.redDwarfStringProperty) },
        { value: StarPreset.BIG_STAR, createNode: () => label(common.bigStarStringProperty) },
      ],
      { spacing: 5, radioButtonOptions: { radius: 7 }, accessibleName: a11y.controls.starStringProperty },
    );
    const limbCheckbox = createCheckbox(model.limbDarkeningProperty, strings.limbDarkeningStringProperty);
    const noiseControl = createNumberControl(strings.noiseStringProperty, model.noiseProperty, NOISE_RANGE_PPM, {
      unitsProperty: units.ppmStringProperty,
      significantFigures: 3,
      delta: 10,
      accessibleName: a11y.controls.noiseStringProperty,
      numberControlOptions: { sliderOptions: { constrainValue: (value: number) => Math.round(value / 10) * 10 } },
    });
    const stackControl = createNumberControl(strings.stackStringProperty, model.stackProperty, STACK_RANGE, {
      significantFigures: 3,
      delta: 1,
      accessibleName: a11y.controls.stackStringProperty,
      numberControlOptions: { sliderOptions: { constrainValue: (value: number) => Math.round(value) } },
    });
    const newObservationsButton = createPushButton(
      strings.newObservationsStringProperty,
      () => model.newObservations(),
      CONTROL_PANEL_WIDTH,
    );
    const measurementsCheckbox = createCheckbox(this.showMeasurementsProperty, strings.showMeasurementsStringProperty);
    const controlPanel = new TransitHunterPanel(
      new VBox({
        spacing: 9,
        align: "left",
        children: [
          radiusControl,
          distanceControl,
          starRadios,
          limbCheckbox,
          noiseControl,
          stackControl,
          newObservationsButton,
          measurementsCheckbox,
        ],
      }),
      { minWidth: CONTROL_PANEL_WIDTH + 24 },
    );
    controlPanel.right = bounds.maxX - SCREEN_VIEW_MARGIN;
    controlPanel.top = bounds.minY + SCREEN_VIEW_MARGIN;

    const resetAllButton = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => {
        model.reset();
        this.reset();
      },
      right: bounds.maxX - SCREEN_VIEW_MARGIN,
      bottom: bounds.maxY - SCREEN_VIEW_MARGIN,
    });

    this.children = [wideChart, zoomChart, readoutPanel, controlPanel, resetAllButton];

    this.addChild(
      new Node({
        pdomOrder: [
          radiusControl,
          distanceControl,
          starRadios,
          limbCheckbox,
          noiseControl,
          stackControl,
          newObservationsButton,
          measurementsCheckbox,
          explanationButton,
          resetAllButton,
        ],
      }),
    );
    this.disposeEmitter.addListener(() => multilink.dispose());
  }

  public reset(): void {
    this.showMeasurementsProperty.reset();
  }
}

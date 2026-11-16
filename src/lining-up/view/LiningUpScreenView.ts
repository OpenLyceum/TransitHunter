import { LINING_UP_SCREEN_VIEW_SETTINGS } from "../../TransitHunterConstants.js";
/**
 * LiningUpScreenView.ts
 *
 * The Lining Up screen: a planet transits only when its orbit is lined up with
 * Earth.
 *
 *  - Left: the orbit in 3-D with the arrow toward Earth, and below it the star
 *    seen from Earth with the planet's path.
 *  - Middle: the dip in the star's light against the edge-on dip, and 100
 *    randomly tilted systems.
 *  - Right: planet, tilt and distance controls, and readouts.
 */

import { DerivedProperty, PatternStringProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { HBox, Node, RichText, Text, VBox } from "scenerystack/scenery";
import { ResetAllButton, TimeControlNode, TimeSpeed } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { AquaRadioButtonGroup } from "scenerystack/sun";
import { PlanetPreset } from "../../common/model/PlanetPreset.js";
import {
  FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS,
  FLAT_RESET_ALL_BUTTON_OPTIONS,
  TIME_CONTROL_SPEED_RADIO_OPTIONS,
} from "../../common/TransitHunterButtonOptions.js";
import { TransitHunterPanel } from "../../common/TransitHunterPanel.js";
import { formatSignificant } from "../../common/view/chartUtils.js";
import { createEquationNode, createExplanationButton, createNumberControl } from "../../common/view/controls.js";
import { formatDays, formatHours } from "../../common/view/formatters.js";
import { StringManager } from "../../i18n/StringManager.js";
import TransitHunterColors from "../../TransitHunterColors.js";
import {
  CONTROL_PANEL_WIDTH,
  DISTANCE_RANGE,
  FONTS,
  INCLINATION_RANGE,
  SCREEN_VIEW_MARGIN,
} from "../../TransitHunterConstants.js";
import type { LiningUpModel } from "../model/LiningUpModel.js";
import { LiningUpChartNode } from "./LiningUpChartNode.js";
import { LiningUpScreenSummaryContent } from "./LiningUpScreenSummaryContent.js";
import { Orbit3DViewNode } from "./Orbit3DViewNode.js";
import { RandomSkyNode } from "./RandomSkyNode.js";
import { SkyViewNode } from "./SkyViewNode.js";

export type LiningUpScreenViewOptions = ScreenViewOptions;

const VIEW_WIDTH: number = LINING_UP_SCREEN_VIEW_SETTINGS.VIEW_WIDTH;
const VIEW_3D_HEIGHT: number = LINING_UP_SCREEN_VIEW_SETTINGS.VIEW_3_D_HEIGHT;
const SKY_VIEW_HEIGHT: number = LINING_UP_SCREEN_VIEW_SETTINGS.SKY_VIEW_HEIGHT;
const SKY_STAR_RADIUS: number = LINING_UP_SCREEN_VIEW_SETTINGS.SKY_STAR_RADIUS;
const CHART_WIDTH: number = LINING_UP_SCREEN_VIEW_SETTINGS.CHART_WIDTH;
const CHART_HEIGHT: number = LINING_UP_SCREEN_VIEW_SETTINGS.CHART_HEIGHT;
const READOUT_WIDTH = CONTROL_PANEL_WIDTH;

/** How far the step button moves the clock, wall-clock seconds at normal speed. */
const STEP_SECONDS: number = LINING_UP_SCREEN_VIEW_SETTINGS.STEP_SECONDS;

export class LiningUpScreenView extends ScreenView {
  private readonly orbitView: Orbit3DViewNode;

  public constructor(model: LiningUpModel, providedOptions?: LiningUpScreenViewOptions) {
    const options = optionize<LiningUpScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      {
        screenSummaryContent: new LiningUpScreenSummaryContent(model),
      },
      providedOptions,
    );
    super(options);

    const stringManager = StringManager.getInstance();
    const strings = stringManager.getLiningUpStrings();
    const common = stringManager.getCommonStrings();
    const units = stringManager.getUnits();
    const a11y = stringManager.getLiningUpA11yStrings();
    const bounds = this.layoutBounds;

    // ── Views ─────────────────────────────────────────────────────────────────
    this.orbitView = new Orbit3DViewNode(model, VIEW_WIDTH, VIEW_3D_HEIGHT);
    this.orbitView.left = bounds.minX + SCREEN_VIEW_MARGIN;
    this.orbitView.top = bounds.minY + SCREEN_VIEW_MARGIN + LINING_UP_SCREEN_VIEW_SETTINGS.CONSTRUCTOR_TOP_OFFSET;
    const skyView = new SkyViewNode(model, VIEW_WIDTH, SKY_VIEW_HEIGHT, SKY_STAR_RADIUS);
    skyView.left = this.orbitView.left;
    skyView.top = this.orbitView.bottom + 32;

    // ── Chart and random sky ──────────────────────────────────────────────────
    const chart = new LiningUpChartNode(model, CHART_WIDTH, CHART_HEIGHT);
    chart.left = this.orbitView.right + LINING_UP_SCREEN_VIEW_SETTINGS.CONSTRUCTOR_LEFT_OFFSET;
    chart.top = bounds.minY + SCREEN_VIEW_MARGIN + 22;
    const randomSky = new RandomSkyNode(model, CHART_WIDTH + 50);
    randomSky.left = this.orbitView.right + 22;
    randomSky.top = chart.bottom + 12;

    // ── Controls ──────────────────────────────────────────────────────────────
    const label = (stringProperty: TReadOnlyProperty<string>): Text =>
      new Text(stringProperty, {
        font: FONTS.LABEL,
        fill: TransitHunterColors.textColorProperty,
        maxWidth: CONTROL_PANEL_WIDTH - LINING_UP_SCREEN_VIEW_SETTINGS.LABEL_MAX_WIDTH_OFFSET,
      });
    const planetRadios = new AquaRadioButtonGroup(
      model.planetPresetProperty,
      [
        { value: PlanetPreset.EARTH, createNode: () => label(common.earthSizedStringProperty) },
        { value: PlanetPreset.NEPTUNE, createNode: () => label(common.neptuneSizedStringProperty) },
        { value: PlanetPreset.JUPITER, createNode: () => label(common.jupiterSizedStringProperty) },
      ],
      {
        spacing: LINING_UP_SCREEN_VIEW_SETTINGS.PLANET_RADIOS_SPACING,
        radioButtonOptions: { radius: LINING_UP_SCREEN_VIEW_SETTINGS.PLANET_RADIOS_RADIUS },
        accessibleName: a11y.controls.planetStringProperty,
      },
    );
    const inclinationControl = createNumberControl(
      common.inclinationStringProperty,
      model.inclinationProperty,
      INCLINATION_RANGE,
      {
        unitsProperty: units.degreesStringProperty,
        compactUnits: true,
        significantFigures: LINING_UP_SCREEN_VIEW_SETTINGS.INCLINATION_CONTROL_SIGNIFICANT_FIGURES,
        delta: LINING_UP_SCREEN_VIEW_SETTINGS.INCLINATION_CONTROL_DELTA,
        accessibleName: a11y.controls.inclinationStringProperty,
      },
    );
    const distanceControl = createNumberControl(common.distanceStringProperty, model.distanceProperty, DISTANCE_RANGE, {
      unitsProperty: units.auStringProperty,
      logarithmic: true,
      significantFigures: LINING_UP_SCREEN_VIEW_SETTINGS.DISTANCE_CONTROL_SIGNIFICANT_FIGURES,
      accessibleName: a11y.controls.distanceStringProperty,
    });
    const controlPanel = new TransitHunterPanel(
      new VBox({
        spacing: LINING_UP_SCREEN_VIEW_SETTINGS.CONTROL_PANEL_SPACING,
        align: "left",
        children: [
          new Text(common.planetSizeHeadingStringProperty, {
            font: FONTS.TITLE,
            fill: TransitHunterColors.textColorProperty,
            maxWidth: CONTROL_PANEL_WIDTH,
          }),
          planetRadios,
          inclinationControl,
          distanceControl,
        ],
      }),
      { minWidth: CONTROL_PANEL_WIDTH + LINING_UP_SCREEN_VIEW_SETTINGS.CONTROL_PANEL_MIN_WIDTH_OFFSET },
    );
    controlPanel.right = bounds.maxX - SCREEN_VIEW_MARGIN;
    controlPanel.top = bounds.minY + SCREEN_VIEW_MARGIN;

    // ── Readouts ──────────────────────────────────────────────────────────────
    const readout = (stringProperty: TReadOnlyProperty<string>, font = FONTS.READOUT): RichText =>
      new RichText(stringProperty, {
        font: font,
        fill: TransitHunterColors.textColorProperty,
        lineWrap: READOUT_WIDTH,
      });
    const periodText = readout(
      new PatternStringProperty(common.periodPatternStringProperty, {
        value: new DerivedProperty(
          [model.periodProperty, units.daysStringProperty, units.valueUnitsPatternStringProperty],
          (period) => formatDays(period),
        ),
      }),
    );
    const durationPattern = new PatternStringProperty(common.durationPatternStringProperty, {
      value: new DerivedProperty(
        [model.durationProperty, units.hoursStringProperty, units.valueUnitsPatternStringProperty],
        (hours) => formatHours(hours),
      ),
    });
    const durationText = readout(
      new DerivedProperty(
        [model.transitsProperty, durationPattern, common.noTransitStringProperty],
        (transits, duration, none) => (transits ? duration : none),
      ),
      FONTS.TITLE,
    );
    const impactText = readout(
      new PatternStringProperty(strings.impactPatternStringProperty, {
        value: new DerivedProperty([model.impactParameterProperty], (b) =>
          formatSignificant(b, LINING_UP_SCREEN_VIEW_SETTINGS.IMPACT_TEXT_DIGITS),
        ),
      }),
    );
    const tiltLimitText = readout(
      new PatternStringProperty(strings.tiltLimitPatternStringProperty, {
        value: new DerivedProperty([model.tiltLimitProperty], (limit) =>
          formatSignificant(limit, LINING_UP_SCREEN_VIEW_SETTINGS.TILT_LIMIT_TEXT_DIGITS),
        ),
      }),
    );
    const probabilityText = readout(
      new PatternStringProperty(strings.probabilityPatternStringProperty, {
        value: new DerivedProperty([model.probabilityProperty], (p) =>
          formatSignificant(100 * p, LINING_UP_SCREEN_VIEW_SETTINGS.PROBABILITY_TEXT_DIGITS),
        ),
      }),
    );
    const equation = createEquationNode(strings.equationStringProperty, READOUT_WIDTH);
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
      spacing: LINING_UP_SCREEN_VIEW_SETTINGS.EXPLANATION_ROW_SPACING,
      children: [
        explanationButton,
        new Text(common.explanationButtonStringProperty, {
          font: FONTS.LABEL,
          fill: TransitHunterColors.textColorProperty,
          maxWidth: READOUT_WIDTH - LINING_UP_SCREEN_VIEW_SETTINGS.EXPLANATION_ROW_MAX_WIDTH_OFFSET,
        }),
      ],
    });
    const readoutPanel = new TransitHunterPanel(
      new VBox({
        spacing: LINING_UP_SCREEN_VIEW_SETTINGS.READOUT_PANEL_SPACING,
        align: "left",
        children: [durationText, impactText, periodText, tiltLimitText, probabilityText, equation, explanationRow],
      }),
      {
        minWidth: CONTROL_PANEL_WIDTH + LINING_UP_SCREEN_VIEW_SETTINGS.READOUT_PANEL_MIN_WIDTH_OFFSET,
        maxWidth: CONTROL_PANEL_WIDTH + LINING_UP_SCREEN_VIEW_SETTINGS.READOUT_PANEL_MAX_WIDTH_OFFSET,
      },
    );
    readoutPanel.right = controlPanel.right;
    readoutPanel.top = controlPanel.bottom + 12;

    // ── Time controls and Reset All ──────────────────────────────────────────
    const timeControlNode = new TimeControlNode(model.timer.isPlayingProperty, {
      timeSpeedProperty: model.timeSpeedProperty,
      timeSpeeds: [TimeSpeed.FAST, TimeSpeed.NORMAL, TimeSpeed.SLOW],
      ...TIME_CONTROL_SPEED_RADIO_OPTIONS,
      playPauseStepButtonOptions: {
        ...FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS,
        stepForwardButtonOptions: {
          ...FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS.stepForwardButtonOptions,
          listener: () => model.advance(STEP_SECONDS),
        },
      },
    });
    const resetAllButton = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => {
        model.reset();
        this.reset();
      },
      right: bounds.maxX - SCREEN_VIEW_MARGIN,
      bottom: bounds.maxY - SCREEN_VIEW_MARGIN,
    });
    timeControlNode.right = resetAllButton.left - LINING_UP_SCREEN_VIEW_SETTINGS.CONSTRUCTOR_RIGHT_OFFSET;
    timeControlNode.bottom = resetAllButton.bottom;

    this.children = [
      this.orbitView,
      skyView,
      chart,
      randomSky,
      controlPanel,
      readoutPanel,
      timeControlNode,
      resetAllButton,
    ];

    // ── Spoken responses when a slider makes the transit start or stop ────────
    model.transitsProperty.lazyLink((transits) => {
      this.addAccessibleResponse(
        transits ? a11y.responses.transitStartsStringProperty.value : a11y.responses.transitStopsStringProperty.value,
      );
    });

    this.addChild(
      new Node({
        pdomOrder: [
          planetRadios,
          inclinationControl,
          distanceControl,
          this.orbitView,
          randomSky.newSkyButton,
          explanationButton,
          timeControlNode,
          resetAllButton,
        ],
      }),
    );
  }

  public reset(): void {
    this.orbitView.resetCamera();
  }
}

import type { TransitHunterPreferencesModel } from "../../preferences/TransitHunterPreferencesModel.js";
import { DIMMING_SCREEN_VIEW_SETTINGS } from "../../TransitHunterConstants.js";
/**
 * DimmingScreenView.ts
 *
 * The Dimming screen: a planet passing in front of its star blocks some of its
 * light.
 *
 *  - Left: the orbit seen from the side, and below it the star seen from Earth
 *    (zoomed in), at the same horizontal scale so the planet lines up.
 *  - Middle: the star's brightness over time, and readouts in words.
 *  - Right: the planet and star choices and the telescope view.
 */

import { BooleanProperty, DerivedProperty, PatternStringProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { HBox, Node, RichText, Text, VBox } from "scenerystack/scenery";
import { ResetAllButton, TimeControlNode, TimeSpeed } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { AquaRadioButtonGroup } from "scenerystack/sun";
import { PlanetPreset } from "../../common/model/PlanetPreset.js";
import { StarPreset } from "../../common/model/StarPreset.js";
import {
  FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS,
  FLAT_RESET_ALL_BUTTON_OPTIONS,
  TIME_CONTROL_SPEED_RADIO_OPTIONS,
} from "../../common/TransitHunterButtonOptions.js";
import { TransitHunterPanel } from "../../common/TransitHunterPanel.js";
import { formatSignificant, formatTickValue } from "../../common/view/chartUtils.js";
import {
  createCheckbox,
  createEquationNode,
  createExplanationButton,
  createNumberControl,
} from "../../common/view/controls.js";
import { brightnessDecimals, formatPartsIn, formatPercent } from "../../common/view/formatters.js";
import { createPlanetNameProperty } from "../../common/view/planetName.js";
import { StringManager } from "../../i18n/StringManager.js";
import TransitHunterColors from "../../TransitHunterColors.js";
import { CONTROL_PANEL_WIDTH, FONTS, PLANET_RADIUS_RANGE, SCREEN_VIEW_MARGIN } from "../../TransitHunterConstants.js";
import type { DimmingModel } from "../model/DimmingModel.js";
import { DimmingChartNode } from "./DimmingChartNode.js";
import { DimmingScreenSummaryContent } from "./DimmingScreenSummaryContent.js";
import { EarthViewNode, SideViewNode } from "./DimmingViews.js";

export type DimmingScreenViewOptions = ScreenViewOptions;

const VIEW_WIDTH: number = DIMMING_SCREEN_VIEW_SETTINGS.VIEW_WIDTH;
const SIDE_VIEW_HEIGHT: number = DIMMING_SCREEN_VIEW_SETTINGS.SIDE_VIEW_HEIGHT;
const EARTH_VIEW_HEIGHT: number = DIMMING_SCREEN_VIEW_SETTINGS.EARTH_VIEW_HEIGHT;
const STAR_RADIUS: number = DIMMING_SCREEN_VIEW_SETTINGS.STAR_RADIUS;
const CHART_WIDTH: number = DIMMING_SCREEN_VIEW_SETTINGS.CHART_WIDTH;
const CHART_HEIGHT: number = DIMMING_SCREEN_VIEW_SETTINGS.CHART_HEIGHT;
const READOUT_WIDTH: number = DIMMING_SCREEN_VIEW_SETTINGS.READOUT_WIDTH;

/** Fraction blocked above which the planet is said to hide the whole star. */
const WHOLE_STAR: number = DIMMING_SCREEN_VIEW_SETTINGS.WHOLE_STAR;

export class DimmingScreenView extends ScreenView {
  private readonly telescopeViewProperty = new BooleanProperty(false);

  public constructor(
    model: DimmingModel,
    preferences: TransitHunterPreferencesModel,
    providedOptions?: DimmingScreenViewOptions,
  ) {
    const options = optionize<DimmingScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      {
        screenSummaryContent: new DimmingScreenSummaryContent(model),
      },
      providedOptions,
    );
    super(options);

    const stringManager = StringManager.getInstance();
    const strings = stringManager.getDimmingStrings();
    const common = stringManager.getCommonStrings();
    const units = stringManager.getUnits();
    const a11y = stringManager.getDimmingA11yStrings();
    const bounds = this.layoutBounds;

    // ── Side view and view from Earth ─────────────────────────────────────────
    const sideView = new SideViewNode(model, this.telescopeViewProperty, VIEW_WIDTH, SIDE_VIEW_HEIGHT, STAR_RADIUS);
    sideView.left = bounds.minX + SCREEN_VIEW_MARGIN;
    sideView.top = bounds.minY + SCREEN_VIEW_MARGIN + DIMMING_SCREEN_VIEW_SETTINGS.TOP_OFFSET;
    const earthView = new EarthViewNode(model, this.telescopeViewProperty, VIEW_WIDTH, EARTH_VIEW_HEIGHT, STAR_RADIUS);
    earthView.left = sideView.left;
    earthView.top = sideView.bottom + 32;

    // ── Light curve ───────────────────────────────────────────────────────────
    const chart = new DimmingChartNode(model, CHART_WIDTH, CHART_HEIGHT);
    chart.left = sideView.right + DIMMING_SCREEN_VIEW_SETTINGS.LEFT_OFFSET;
    chart.top = bounds.minY + SCREEN_VIEW_MARGIN + 22;

    // ── Readouts ──────────────────────────────────────────────────────────────
    const planetNameProperty: TReadOnlyProperty<string> = createPlanetNameProperty(
      model.planetPresetProperty,
      strings.thisPlanetStringProperty,
    );
    const brightnessText = new RichText(
      new PatternStringProperty(strings.brightnessNowPatternStringProperty, {
        value: new DerivedProperty([model.brightnessProperty, model.maxBlockedFractionProperty], (brightness, depth) =>
          formatTickValue(brightness * 100, brightnessDecimals(depth)),
        ),
      }),
      { font: FONTS.BIG_READOUT, fill: TransitHunterColors.textColorProperty, maxWidth: READOUT_WIDTH },
    );
    const blocksPattern = new PatternStringProperty(strings.blocksPatternStringProperty, {
      planet: planetNameProperty,
      percent: new DerivedProperty([model.maxBlockedFractionProperty], formatPercent),
      parts: new DerivedProperty([model.maxBlockedFractionProperty], formatPartsIn),
    });
    const blocksAllPattern = new PatternStringProperty(strings.blocksAllPatternStringProperty, {
      planet: planetNameProperty,
    });
    const blocksText = new RichText(
      new DerivedProperty(
        [model.maxBlockedFractionProperty, blocksPattern, blocksAllPattern],
        (depth, blocks, blocksAll) => (depth >= WHOLE_STAR ? blocksAll : blocks),
      ),
      { font: FONTS.READOUT, fill: TransitHunterColors.textColorProperty, lineWrap: READOUT_WIDTH },
    );
    const starSizeText = new RichText(
      new PatternStringProperty(strings.starSizePatternStringProperty, {
        value: new DerivedProperty([model.starPresetProperty], (star) =>
          formatSignificant(star.radiusSun, DIMMING_SCREEN_VIEW_SETTINGS.STAR_SIZE_TEXT_DIGITS),
        ),
      }),
      { font: FONTS.SMALL, fill: TransitHunterColors.mutedTextColorProperty, maxWidth: READOUT_WIDTH },
    );
    const equation = createEquationNode(
      preferences.showEquationsProperty,
      strings.equationStringProperty,
      READOUT_WIDTH,
    );
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
      spacing: DIMMING_SCREEN_VIEW_SETTINGS.EXPLANATION_ROW_SPACING,
      children: [
        explanationButton,
        new Text(common.explanationButtonStringProperty, {
          font: FONTS.LABEL,
          fill: TransitHunterColors.textColorProperty,
          maxWidth: READOUT_WIDTH - DIMMING_SCREEN_VIEW_SETTINGS.EXPLANATION_ROW_MAX_WIDTH_OFFSET,
        }),
      ],
    });
    const readoutPanel = new TransitHunterPanel(
      new VBox({
        spacing: DIMMING_SCREEN_VIEW_SETTINGS.READOUT_PANEL_SPACING,
        align: "left",
        children: [brightnessText, blocksText, starSizeText, equation, explanationRow],
      }),
      {
        minWidth: READOUT_WIDTH + DIMMING_SCREEN_VIEW_SETTINGS.READOUT_PANEL_MIN_WIDTH_OFFSET,
        maxWidth: READOUT_WIDTH + DIMMING_SCREEN_VIEW_SETTINGS.READOUT_PANEL_MAX_WIDTH_OFFSET,
      },
    );
    readoutPanel.left = sideView.right + 20;
    readoutPanel.top = chart.bottom + 62;

    // ── Controls ──────────────────────────────────────────────────────────────
    const label = (stringProperty: TReadOnlyProperty<string>): Text =>
      new Text(stringProperty, {
        font: FONTS.LABEL,
        fill: TransitHunterColors.textColorProperty,
        maxWidth: CONTROL_PANEL_WIDTH - DIMMING_SCREEN_VIEW_SETTINGS.LABEL_MAX_WIDTH_OFFSET,
      });
    const heading = (stringProperty: TReadOnlyProperty<string>): Text =>
      new Text(stringProperty, {
        font: FONTS.TITLE,
        fill: TransitHunterColors.textColorProperty,
        maxWidth: CONTROL_PANEL_WIDTH,
      });
    const radioOptions = {
      spacing: DIMMING_SCREEN_VIEW_SETTINGS.RADIO_OPTIONS_SPACING,
      radioButtonOptions: { radius: DIMMING_SCREEN_VIEW_SETTINGS.RADIO_OPTIONS_RADIUS },
    };
    const planetRadios = new AquaRadioButtonGroup(
      model.planetPresetProperty,
      [
        { value: PlanetPreset.EARTH, createNode: () => label(common.earthSizedStringProperty) },
        { value: PlanetPreset.NEPTUNE, createNode: () => label(common.neptuneSizedStringProperty) },
        { value: PlanetPreset.JUPITER, createNode: () => label(common.jupiterSizedStringProperty) },
        { value: PlanetPreset.CUSTOM, createNode: () => label(common.customPlanetStringProperty) },
      ],
      { ...radioOptions, accessibleName: a11y.controls.planetStringProperty },
    );
    const customRadiusControl = createNumberControl(
      common.planetRadiusStringProperty,
      model.customRadiusProperty,
      PLANET_RADIUS_RANGE,
      {
        unitsProperty: units.earthRadiiStringProperty,
        logarithmic: true,
        significantFigures: DIMMING_SCREEN_VIEW_SETTINGS.CUSTOM_RADIUS_CONTROL_SIGNIFICANT_FIGURES,
        enabledRangeProperty: model.customRadiusRangeProperty,
        accessibleName: a11y.controls.customRadiusStringProperty,
        numberControlOptions: {
          visibleProperty: new DerivedProperty(
            [model.planetPresetProperty],
            (preset) => preset === PlanetPreset.CUSTOM,
          ),
        },
      },
    );
    const starRadios = new AquaRadioButtonGroup(
      model.starPresetProperty,
      [
        { value: StarPreset.SUN_LIKE, createNode: () => label(common.sunLikeStarStringProperty) },
        { value: StarPreset.RED_DWARF, createNode: () => label(common.redDwarfStringProperty) },
        { value: StarPreset.BIG_STAR, createNode: () => label(common.bigStarStringProperty) },
      ],
      { ...radioOptions, accessibleName: a11y.controls.starStringProperty },
    );
    const telescopeCheckbox = createCheckbox(this.telescopeViewProperty, common.telescopeViewStringProperty);

    const controlPanel = new TransitHunterPanel(
      new VBox({
        spacing: DIMMING_SCREEN_VIEW_SETTINGS.CONTROL_PANEL_SPACING,
        align: "left",
        children: [
          heading(strings.planetHeadingStringProperty),
          planetRadios,
          customRadiusControl,
          heading(strings.starHeadingStringProperty),
          starRadios,
          telescopeCheckbox,
        ],
      }),
      { minWidth: CONTROL_PANEL_WIDTH + DIMMING_SCREEN_VIEW_SETTINGS.CONTROL_PANEL_MIN_WIDTH_OFFSET },
    );
    controlPanel.right = bounds.maxX - SCREEN_VIEW_MARGIN;
    controlPanel.top = bounds.minY + SCREEN_VIEW_MARGIN;

    // ── Time controls and Reset All ──────────────────────────────────────────
    const timeControlNode = new TimeControlNode(model.timer.isPlayingProperty, {
      timeSpeedProperty: model.timeSpeedProperty,
      timeSpeeds: [TimeSpeed.FAST, TimeSpeed.NORMAL, TimeSpeed.SLOW],
      ...TIME_CONTROL_SPEED_RADIO_OPTIONS,
      playPauseStepButtonOptions: {
        ...FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS,
        stepForwardButtonOptions: {
          ...FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS.stepForwardButtonOptions,
          listener: () => model.advance(0.01),
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
    timeControlNode.right = resetAllButton.left - DIMMING_SCREEN_VIEW_SETTINGS.RIGHT_OFFSET;
    timeControlNode.bottom = resetAllButton.bottom;

    this.children = [sideView, earthView, chart, readoutPanel, controlPanel, timeControlNode, resetAllButton];

    // ── Spoken responses when the planet is moved by hand ─────────────────────
    // While the animation plays a transit happens every few seconds, so the
    // start and end are announced only when the user moves the planet.
    let wasBlocking = model.brightnessProperty.value < 1;
    model.brightnessProperty.lazyLink((brightness) => {
      const blocking = brightness < 1;
      if (blocking !== wasBlocking && !model.timer.isPlayingProperty.value) {
        this.addAccessibleResponse(
          blocking ? a11y.responses.transitStartStringProperty.value : a11y.responses.transitEndStringProperty.value,
        );
      }
      wasBlocking = blocking;
    });

    this.addChild(
      new Node({
        pdomOrder: [
          earthView.planet,
          planetRadios,
          customRadiusControl,
          starRadios,
          telescopeCheckbox,
          explanationButton,
          timeControlNode,
          resetAllButton,
        ],
      }),
    );
  }

  public reset(): void {
    this.telescopeViewProperty.reset();
  }
}

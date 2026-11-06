/**
 * PlanetHuntScreenView.ts
 *
 * The Planet Hunt screen: real Kepler and TESS light curves.
 *
 *  - Top left: the light curve (zoom, scroll, mark dips; or folded with the
 *    averages and the depth line, centred on the transit or on the far side),
 *    or the period search in its place.
 *  - Bottom left: the user's measurements (mark spacing, depth → radius) and,
 *    once revealed, the archive's planets.
 *  - Right: the star, the fold controls, and the reveal.
 */

import { DerivedProperty, PatternStringProperty, StringProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { StringUtils } from "scenerystack/phetcommon";
import { HBox, Node, RichText, Text, VBox } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { ComboBox } from "scenerystack/sun";
import type { ArchivePlanet } from "../../common/model/archive.js";
import {
  FLAT_RESET_ALL_BUTTON_OPTIONS,
  LIGHT_SURFACE_TEXT_FILL,
  TRANSIT_HUNTER_COMBO_BOX_OPTIONS,
} from "../../common/TransitHunterButtonOptions.js";
import { TransitHunterPanel } from "../../common/TransitHunterPanel.js";
import { formatSignificant } from "../../common/view/chartUtils.js";
import {
  createCheckbox,
  createEquationNode,
  createExplanationButton,
  createNumberControl,
  createPushButton,
} from "../../common/view/controls.js";
import { formatDays, valueWithUnits } from "../../common/view/formatters.js";
import { StringManager } from "../../i18n/StringManager.js";
import TransitHunterColors from "../../TransitHunterColors.js";
import {
  CONTROL_PANEL_WIDTH,
  EARTH_RADIUS_M,
  FONTS,
  JUPITER_RADIUS_M,
  SCREEN_VIEW_MARGIN,
} from "../../TransitHunterConstants.js";
import { type Difficulty, HuntTarget } from "../model/HuntTarget.js";
import { HUNT_DEPTH_RANGE, HUNT_PERIOD_RANGE, type PlanetHuntModel } from "../model/PlanetHuntModel.js";
import { HuntChartNode } from "./HuntChartNode.js";
import { PeriodSearchNode } from "./PeriodSearchNode.js";
import { PlanetHuntScreenSummaryContent } from "./PlanetHuntScreenSummaryContent.js";

export type PlanetHuntScreenViewOptions = ScreenViewOptions;

const CHART_WIDTH = 610;
const CHART_HEIGHT = 245;
const PANEL_WIDTH = 318;

/**
 * Arrow steps of the trial period (decades) and of the fold's slide (fraction of
 * the period). NumberControl rounds every value to its step, so these set the
 * finest fold reachable: 0.0023 % of the period, so one click moves Kepler-22 b's
 * four transits by under an hour over the four years of data, and 0.0002 of a
 * period (1.4 h at Kepler-22 b's 290 days).
 */
const PERIOD_STEP_DECADES = 0.00001;
const SHIFT_STEP = 0.0002;

export class PlanetHuntScreenView extends ScreenView {
  private readonly chart: HuntChartNode;

  public constructor(model: PlanetHuntModel, providedOptions?: PlanetHuntScreenViewOptions) {
    const options = optionize<PlanetHuntScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      {
        screenSummaryContent: new PlanetHuntScreenSummaryContent(model),
      },
      providedOptions,
    );
    super(options);

    const stringManager = StringManager.getInstance();
    const strings = stringManager.getHuntStrings();
    const common = stringManager.getCommonStrings();
    const units = stringManager.getUnits();
    const a11y = stringManager.getHuntA11yStrings();
    const bounds = this.layoutBounds;

    // ── Chart ─────────────────────────────────────────────────────────────────
    this.chart = new HuntChartNode(model, CHART_WIDTH, CHART_HEIGHT);
    this.chart.left = bounds.minX + SCREEN_VIEW_MARGIN + 60;
    this.chart.top = bounds.minY + SCREEN_VIEW_MARGIN + 8;
    const searchNode = new PeriodSearchNode(model, CHART_WIDTH, CHART_HEIGHT);
    searchNode.translation = this.chart.translation;
    model.showSearchProperty.link((show) => {
      searchNode.visible = show;
      this.chart.visible = !show;
    });

    // ── Measurements ──────────────────────────────────────────────────────────
    const text = (stringProperty: TReadOnlyProperty<string>, font = FONTS.READOUT): RichText =>
      new RichText(stringProperty, { font: font, fill: TransitHunterColors.textColorProperty, lineWrap: PANEL_WIDTH });
    const marksTextProperty = new StringProperty("");
    const updateMarksText = (): void => {
      const spacing = model.markSpacing();
      marksTextProperty.value =
        spacing === null
          ? StringUtils.fillIn(strings.marksCountPatternStringProperty.value, { count: model.marks.length })
          : StringUtils.fillIn(strings.marksSpacingPatternStringProperty.value, {
              count: model.marks.length,
              spacing: formatDays(spacing),
            });
    };
    model.marks.addItemAddedListener(updateMarksText);
    model.marks.addItemRemovedListener(updateMarksText);
    strings.marksCountPatternStringProperty.link(updateMarksText);
    strings.marksSpacingPatternStringProperty.link(updateMarksText);
    const useSpacingButton = createPushButton(strings.useSpacingStringProperty, () => model.useMarkSpacing(), 150);
    const clearMarksButton = createPushButton(strings.clearMarksStringProperty, () => model.marks.clear(), 150);
    const updateMarkButtons = (): void => {
      useSpacingButton.enabled = model.marks.length >= 2;
      clearMarksButton.enabled = model.marks.length > 0;
    };
    model.marks.addItemAddedListener(updateMarkButtons);
    model.marks.addItemRemovedListener(updateMarkButtons);
    updateMarkButtons();

    const radiusText = text(
      new PatternStringProperty(strings.radiusPatternStringProperty, {
        depth: new DerivedProperty([model.depthProperty], (depth) => formatSignificant(depth, 2)),
        earth: new DerivedProperty(
          [model.inferredRadiusProperty, units.earthRadiiStringProperty, units.valueUnitsPatternStringProperty],
          (radius, earthRadii) => valueWithUnits(formatSignificant(radius, 2), earthRadii),
        ),
        jupiter: new DerivedProperty(
          [model.inferredRadiusProperty, units.jupiterRadiiStringProperty, units.valueUnitsPatternStringProperty],
          (radius, jupiterRadii) =>
            valueWithUnits(formatSignificant((radius * EARTH_RADIUS_M) / JUPITER_RADIUS_M, 2), jupiterRadii),
        ),
      }),
    );
    const starText = text(
      new PatternStringProperty(strings.starPatternStringProperty, {
        radius: new DerivedProperty(
          [model.planetsProperty, units.solarRadiiStringProperty, units.valueUnitsPatternStringProperty],
          (planets, solarRadii) =>
            planets[0] ? valueWithUnits(formatSignificant(planets[0].starRadiusSun, 3), solarRadii) : "—",
        ),
        mission: new DerivedProperty([model.lightCurveProperty], (curve) =>
          curve ? `${curve.file.mission} (${curve.file.pipeline})` : "—",
        ),
      }),
      FONTS.SMALL,
    );
    const equation = createEquationNode(strings.equationStringProperty, PANEL_WIDTH);
    const explanationButton = createExplanationButton(
      strings.explanationTitleStringProperty,
      [
        strings.explanation1StringProperty,
        strings.explanation2StringProperty,
        strings.explanation3StringProperty,
        strings.explanation4StringProperty,
        strings.explanation5StringProperty,
        strings.explanation6StringProperty,
      ],
      a11y.controls.explanationStringProperty,
    );
    const measurementPanel = new TransitHunterPanel(
      new VBox({
        spacing: 6,
        align: "left",
        children: [
          new Text(strings.measurementsTitleStringProperty, {
            font: FONTS.TITLE,
            fill: TransitHunterColors.textColorProperty,
            maxWidth: PANEL_WIDTH,
          }),
          text(marksTextProperty),
          new HBox({ spacing: 8, children: [useSpacingButton, clearMarksButton] }),
          radiusText,
          starText,
          equation,
          new HBox({
            spacing: 8,
            children: [
              explanationButton,
              new Text(common.explanationButtonStringProperty, {
                font: FONTS.LABEL,
                fill: TransitHunterColors.textColorProperty,
                maxWidth: PANEL_WIDTH - 40,
              }),
            ],
          }),
        ],
      }),
      { minWidth: PANEL_WIDTH + 24, maxWidth: PANEL_WIDTH + 24 },
    );
    measurementPanel.left = bounds.minX + SCREEN_VIEW_MARGIN;
    measurementPanel.top = this.chart.bottom + 12;

    // ── Archive answer ────────────────────────────────────────────────────────
    const answerList = new VBox({ spacing: 3, align: "left" });
    const answerPanel = new TransitHunterPanel(
      new VBox({
        spacing: 6,
        align: "left",
        children: [
          new Text(strings.answerTitleStringProperty, {
            font: FONTS.TITLE,
            fill: TransitHunterColors.textColorProperty,
            maxWidth: PANEL_WIDTH,
          }),
          answerList,
          new RichText(strings.answerSourceStringProperty, {
            font: FONTS.SMALL,
            fill: TransitHunterColors.mutedTextColorProperty,
            lineWrap: PANEL_WIDTH,
          }),
        ],
      }),
      { minWidth: PANEL_WIDTH + 24, maxWidth: PANEL_WIDTH + 24, visibleProperty: model.revealProperty },
    );
    answerPanel.left = measurementPanel.right + 12;
    answerPanel.top = measurementPanel.top;
    const answerRow = (planet: ArchivePlanet): Node => {
      const line = new RichText(
        StringUtils.fillIn(strings.answerRowPatternStringProperty.value, {
          name: planet.name,
          period: formatDays(planet.periodDays),
          radius: valueWithUnits(formatSignificant(planet.radiusEarth, 2), units.earthRadiiStringProperty.value),
          year: planet.discoveryYear,
        }),
        { font: FONTS.SMALL, fill: TransitHunterColors.textColorProperty, maxWidth: PANEL_WIDTH - 70 },
      );
      const foldButton = createPushButton(
        strings.foldOnItStringProperty,
        () => model.useArchiveEphemeris(planet),
        60,
        true,
      );
      foldButton.accessibleName = StringUtils.fillIn(a11y.controls.foldOnPatternStringProperty.value, {
        name: planet.name,
      });
      return new HBox({ spacing: 8, children: [foldButton, line] });
    };
    const updateAnswers = (): void => {
      for (const child of answerList.children) {
        child.dispose();
      }
      answerList.children = model.planetsProperty.value.map(answerRow);
    };
    model.planetsProperty.link(updateAnswers);
    strings.answerRowPatternStringProperty.lazyLink(updateAnswers);
    units.earthRadiiStringProperty.lazyLink(updateAnswers);

    // ── Controls ──────────────────────────────────────────────────────────────
    const difficultyName = (difficulty: Difficulty): TReadOnlyProperty<string> =>
      difficulty === "easy"
        ? strings.easyStringProperty
        : difficulty === "medium"
          ? strings.mediumStringProperty
          : difficulty === "hard"
            ? strings.hardStringProperty
            : strings.challengeStringProperty;
    const comboListParent = new Node();
    const targetComboBox = new ComboBox(
      model.targetProperty,
      HuntTarget.enumeration.values.map((target) => ({
        value: target,
        createNode: () =>
          new Text(
            new PatternStringProperty(strings.targetPatternStringProperty, {
              star: target.starName,
              difficulty: difficultyName(target.difficulty),
            }),
            { font: FONTS.LABEL, fill: LIGHT_SURFACE_TEXT_FILL, maxWidth: CONTROL_PANEL_WIDTH - 50 },
          ),
      })),
      comboListParent,
      { ...TRANSIT_HUNTER_COMBO_BOX_OPTIONS, accessibleName: a11y.controls.targetStringProperty },
    );
    const periodControl = createNumberControl(strings.periodStringProperty, model.periodProperty, HUNT_PERIOD_RANGE, {
      unitsProperty: units.daysStringProperty,
      logarithmic: true,
      significantFigures: 6,
      delta: PERIOD_STEP_DECADES,
      accessibleName: a11y.controls.periodStringProperty,
    });
    const shiftControl = createNumberControl(
      strings.shiftStringProperty,
      model.shiftProperty,
      model.shiftProperty.range,
      {
        significantFigures: 4,
        delta: SHIFT_STEP,
        accessibleName: a11y.controls.shiftStringProperty,
      },
    );
    const searchCheckbox = createCheckbox(model.showSearchProperty, strings.searchStringProperty);
    const foldCheckbox = createCheckbox(model.foldProperty, strings.foldStringProperty);
    const farSideCheckbox = createCheckbox(model.farSideProperty, strings.farSideStringProperty);
    model.foldProperty.link((fold) => {
      farSideCheckbox.enabled = fold;
    });
    const depthControl = createNumberControl(strings.depthStringProperty, model.depthProperty, HUNT_DEPTH_RANGE, {
      unitsProperty: units.percentStringProperty,
      logarithmic: true,
      significantFigures: 2,
      accessibleName: a11y.controls.depthStringProperty,
    });
    const revealCheckbox = createCheckbox(model.revealProperty, strings.revealStringProperty);
    const controlPanel = new TransitHunterPanel(
      new VBox({
        spacing: 8,
        align: "left",
        children: [
          new Text(strings.starTitleStringProperty, {
            font: FONTS.TITLE,
            fill: TransitHunterColors.textColorProperty,
            maxWidth: CONTROL_PANEL_WIDTH,
          }),
          targetComboBox,
          searchCheckbox,
          periodControl,
          shiftControl,
          foldCheckbox,
          farSideCheckbox,
          depthControl,
          revealCheckbox,
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

    this.children = [
      this.chart,
      searchNode,
      measurementPanel,
      answerPanel,
      controlPanel,
      resetAllButton,
      comboListParent,
    ];

    this.addChild(
      new Node({
        pdomOrder: [
          targetComboBox,
          searchCheckbox,
          ...this.chart.buttons,
          searchNode.usePeakButton,
          useSpacingButton,
          clearMarksButton,
          periodControl,
          shiftControl,
          foldCheckbox,
          farSideCheckbox,
          depthControl,
          this.chart.depthLine,
          revealCheckbox,
          answerList,
          explanationButton,
          resetAllButton,
        ],
      }),
    );
  }

  public reset(): void {
    this.chart.reset();
  }
}

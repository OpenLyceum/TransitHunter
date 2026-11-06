/**
 * RockOrGasScreenView.ts
 *
 * The Rock or Gas? screen: combine the transit (radius, and an edge-on orbit)
 * with the star's wobble (mass) to get a planet's density.
 *
 *  - Left: what the transit tells us (with the planet's size next to Earth and
 *    Jupiter), and what the wobble tells us.
 *  - Middle: the density, on a scale of familiar materials, and the planet on a
 *    mass–radius diagram.
 *  - Right: the choice of planet.
 */

import { DerivedProperty, PatternStringProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { Bounds2 } from "scenerystack/dot";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { StringUtils } from "scenerystack/phetcommon";
import { AlignBox, Circle, HBox, Node, RichText, Text, VBox } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { AquaRadioButtonGroup } from "scenerystack/sun";
import { FLAT_RESET_ALL_BUTTON_OPTIONS } from "../../common/TransitHunterButtonOptions.js";
import { TransitHunterPanel } from "../../common/TransitHunterPanel.js";
import { formatSignificant } from "../../common/view/chartUtils.js";
import { createEquationNode, createExplanationButton } from "../../common/view/controls.js";
import { formatDays, formatPlanetMass, valueWithUnits } from "../../common/view/formatters.js";
import { StringManager } from "../../i18n/StringManager.js";
import TransitHunterColors from "../../TransitHunterColors.js";
import {
  CONTROL_PANEL_WIDTH,
  EARTH_RADIUS_M,
  FONTS,
  JUPITER_RADIUS_M,
  SCREEN_VIEW_MARGIN,
  WATER_DENSITY_G_CM3,
} from "../../TransitHunterConstants.js";
import { CompositionPlanet } from "../model/CompositionPlanet.js";
import type { RockOrGasModel } from "../model/RockOrGasModel.js";
import { DensityScaleNode } from "./DensityScaleNode.js";
import { MassRadiusDiagramNode } from "./MassRadiusDiagramNode.js";
import { RockOrGasScreenSummaryContent } from "./RockOrGasScreenSummaryContent.js";

export type RockOrGasScreenViewOptions = ScreenViewOptions;

const CARD_WIDTH = 300;
const MIDDLE_WIDTH = 320;
const DIAGRAM_WIDTH = 265;
const DIAGRAM_HEIGHT = 215;

/** Size-comparison scale, px per Earth radius. */
const PX_PER_EARTH_RADIUS = 2;

/** Height of the size comparison: the largest planet (Kepler-7 b, 18 R⊕) plus its label. */
const SIZE_ROW_HEIGHT = 92;

const JUPITER_IN_EARTH_RADII = JUPITER_RADIUS_M / EARTH_RADIUS_M;

export class RockOrGasScreenView extends ScreenView {
  public constructor(model: RockOrGasModel, providedOptions?: RockOrGasScreenViewOptions) {
    const options = optionize<RockOrGasScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      {
        screenSummaryContent: new RockOrGasScreenSummaryContent(model),
      },
      providedOptions,
    );
    super(options);

    const stringManager = StringManager.getInstance();
    const strings = stringManager.getCompositionStrings();
    const common = stringManager.getCommonStrings();
    const units = stringManager.getUnits();
    const a11y = stringManager.getCompositionA11yStrings();
    const bounds = this.layoutBounds;
    const unitDependencies = [
      units.valueUnitsPatternStringProperty,
      units.earthRadiiStringProperty,
      units.jupiterRadiiStringProperty,
      units.earthMassesStringProperty,
      units.jupiterMassesStringProperty,
      units.solarRadiiStringProperty,
      units.solarMassesStringProperty,
      units.daysStringProperty,
    ] as const;

    const line = (stringProperty: TReadOnlyProperty<string>, font = FONTS.READOUT): RichText =>
      new RichText(stringProperty, { font: font, fill: TransitHunterColors.textColorProperty, lineWrap: CARD_WIDTH });
    const title = (stringProperty: TReadOnlyProperty<string>): Text =>
      new Text(stringProperty, {
        font: FONTS.TITLE,
        fill: TransitHunterColors.textColorProperty,
        maxWidth: CARD_WIDTH,
      });
    const derived = (format: () => string): TReadOnlyProperty<string> =>
      DerivedProperty.deriveAny([model.archiveProperty, model.massProperty, ...unitDependencies], format);

    // ── From the transit ──────────────────────────────────────────────────────
    const radiusValue = (): string => {
      const planet = model.archiveProperty.value;
      return `${valueWithUnits(formatSignificant(planet.radiusEarth, 3), units.earthRadiiStringProperty.value)} = ${valueWithUnits(
        formatSignificant(planet.radiusEarth / JUPITER_IN_EARTH_RADII, 2),
        units.jupiterRadiiStringProperty.value,
      )}`;
    };
    const transitLines = new VBox({
      spacing: 5,
      align: "left",
      children: [
        title(strings.transitTitleStringProperty),
        line(
          new PatternStringProperty(strings.depthPatternStringProperty, {
            depth: derived(() => formatSignificant(model.archiveProperty.value.depthPercent ?? 0, 2)),
            starRadius: derived(() =>
              valueWithUnits(
                formatSignificant(model.archiveProperty.value.starRadiusSun, 3),
                units.solarRadiiStringProperty.value,
              ),
            ),
          }),
        ),
        line(new PatternStringProperty(strings.radiusPatternStringProperty, { radius: derived(radiusValue) })),
        line(
          new PatternStringProperty(strings.tiltPatternStringProperty, {
            tilt: derived(() => formatSignificant(model.archiveProperty.value.inclinationDeg ?? 90, 3)),
          }),
          FONTS.SMALL,
        ),
      ],
    });

    // Size next to Earth and Jupiter.
    const sizeDisc = (
      labelProperty: TReadOnlyProperty<string>,
      radiusEarth: number,
      fill: typeof TransitHunterColors.planetColorProperty,
    ): VBox =>
      new VBox({
        spacing: 3,
        children: [
          new Circle(Math.max(1.5, radiusEarth * PX_PER_EARTH_RADIUS), { fill: fill }),
          new Text(labelProperty, {
            font: FONTS.SMALL,
            fill: TransitHunterColors.mutedTextColorProperty,
            maxWidth: 90,
          }),
        ],
      });
    const planetDiscHolder = new Node();
    const planetNameProperty = new DerivedProperty([model.archiveProperty], (planet) => planet.name);
    const sizeRow = new HBox({
      spacing: 16,
      align: "bottom",
      children: [
        planetDiscHolder,
        sizeDisc(common.earthStringProperty, 1, TransitHunterColors.earthPlanetColorProperty),
        sizeDisc(common.jupiterStringProperty, JUPITER_IN_EARTH_RADII, TransitHunterColors.jupiterPlanetColorProperty),
      ],
    });
    model.archiveProperty.link((planet) => {
      for (const child of planetDiscHolder.children) {
        child.dispose();
      }
      planetDiscHolder.children = [
        sizeDisc(planetNameProperty, planet.radiusEarth, TransitHunterColors.lightCurveColorProperty),
      ];
    });
    const transitCard = new TransitHunterPanel(
      new VBox({
        spacing: 8,
        align: "left",
        children: [
          transitLines,
          line(strings.sizeCompareStringProperty, FONTS.SMALL),
          // Fixed height, so the card does not change size from planet to planet.
          new AlignBox(sizeRow, {
            alignBounds: new Bounds2(0, 0, CARD_WIDTH, SIZE_ROW_HEIGHT),
            xAlign: "left",
            yAlign: "bottom",
          }),
        ],
      }),
      { minWidth: CARD_WIDTH + 24, maxWidth: CARD_WIDTH + 24 },
    );
    transitCard.left = bounds.minX + SCREEN_VIEW_MARGIN;
    transitCard.top = bounds.minY + SCREEN_VIEW_MARGIN;

    // ── From the wobble ───────────────────────────────────────────────────────
    const wobbleText = DerivedProperty.deriveAny(
      [
        model.archiveProperty,
        model.massProperty,
        model.planetProperty,
        strings.wobblePatternStringProperty,
        strings.timingPatternStringProperty,
        strings.stellarWobbleNoteStringProperty,
        ...unitDependencies,
      ],
      () => {
        const planet = model.archiveProperty.value;
        const mass = model.massProperty.value;
        if (!mass.fromWobble) {
          return StringUtils.fillIn(strings.timingPatternStringProperty.value, {
            mass: formatPlanetMass(mass.trueMass),
          });
        }
        const text = StringUtils.fillIn(strings.wobblePatternStringProperty.value, {
          k: formatSignificant(planet.rvAmplitude ?? 0, 3),
          period: formatDays(planet.periodDays),
          starMass: valueWithUnits(formatSignificant(planet.starMassSun, 3), units.solarMassesStringProperty.value),
          minimum: formatPlanetMass(mass.minimum ?? 0),
          mass: formatPlanetMass(mass.trueMass),
        });
        return model.planetProperty.value.inStellarWobble
          ? `${text}<br>${strings.stellarWobbleNoteStringProperty.value}`
          : text;
      },
    );
    const wobbleLabel = new RichText(wobbleText, {
      font: FONTS.READOUT,
      fill: TransitHunterColors.textColorProperty,
      lineWrap: CARD_WIDTH,
      leading: 4,
    });
    const wobbleCard = new TransitHunterPanel(
      new VBox({ spacing: 6, align: "left", children: [title(strings.wobbleTitleStringProperty), wobbleLabel] }),
      { minWidth: CARD_WIDTH + 24, maxWidth: CARD_WIDTH + 24 },
    );
    wobbleCard.left = transitCard.left;
    wobbleCard.top = transitCard.bottom + 12;

    // ── Density ───────────────────────────────────────────────────────────────
    const densityText = new RichText(
      new PatternStringProperty(strings.densityPatternStringProperty, {
        value: new DerivedProperty([model.densityProperty], (rho) => formatSignificant(rho, 2)),
      }),
      { font: FONTS.BIG_READOUT, fill: TransitHunterColors.textColorProperty, maxWidth: MIDDLE_WIDTH },
    );
    const kindText = line(
      new DerivedProperty(
        [model.kindProperty, strings.rockyStringProperty, strings.inBetweenStringProperty, strings.giantStringProperty],
        (kind, rocky, inBetween, giant) => (kind === "rocky" ? rocky : kind === "inBetween" ? inBetween : giant),
      ),
    );
    kindText.lineWrap = MIDDLE_WIDTH;
    const floatText = new RichText(strings.floatsStringProperty, {
      font: FONTS.READOUT,
      fill: TransitHunterColors.neptunePlanetColorProperty,
      lineWrap: MIDDLE_WIDTH,
      visibleProperty: new DerivedProperty([model.densityProperty], (rho) => rho < WATER_DENSITY_G_CM3),
    });
    const scale = new DensityScaleNode(model.densityProperty, MIDDLE_WIDTH - 20);
    const equation = createEquationNode(strings.equationStringProperty, MIDDLE_WIDTH);
    const densityPanel = new TransitHunterPanel(
      new VBox({
        spacing: 7,
        align: "left",
        children: [densityText, kindText, floatText, new Node({ children: [scale], x: 10 }), equation],
      }),
      { minWidth: MIDDLE_WIDTH + 24, maxWidth: MIDDLE_WIDTH + 24 },
    );
    densityPanel.left = transitCard.right + 12;
    densityPanel.top = bounds.minY + SCREEN_VIEW_MARGIN;

    const diagram = new MassRadiusDiagramNode(model, DIAGRAM_WIDTH, DIAGRAM_HEIGHT);
    diagram.right = densityPanel.right - 4;
    diagram.top = densityPanel.bottom + 18;

    // ── Planet choice ─────────────────────────────────────────────────────────
    const planetRadios = new AquaRadioButtonGroup(
      model.planetProperty,
      CompositionPlanet.enumeration.values.map((planet) => ({
        value: planet,
        createNode: () =>
          new Text(planet.archiveName, {
            font: FONTS.LABEL,
            fill: TransitHunterColors.textColorProperty,
            maxWidth: CONTROL_PANEL_WIDTH - 40,
          }),
      })),
      { spacing: 7, radioButtonOptions: { radius: 7 }, accessibleName: a11y.controls.planetStringProperty },
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
    const controlPanel = new TransitHunterPanel(
      new VBox({
        spacing: 10,
        align: "left",
        children: [
          title(strings.choosePlanetStringProperty),
          planetRadios,
          new HBox({
            spacing: 8,
            children: [
              explanationButton,
              new Text(common.explanationButtonStringProperty, {
                font: FONTS.LABEL,
                fill: TransitHunterColors.textColorProperty,
                maxWidth: CONTROL_PANEL_WIDTH - 40,
              }),
            ],
          }),
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
      },
      right: bounds.maxX - SCREEN_VIEW_MARGIN,
      bottom: bounds.maxY - SCREEN_VIEW_MARGIN,
    });

    this.children = [transitCard, wobbleCard, densityPanel, diagram, controlPanel, resetAllButton];
    this.addChild(new Node({ pdomOrder: [planetRadios, explanationButton, resetAllButton] }));
  }
}

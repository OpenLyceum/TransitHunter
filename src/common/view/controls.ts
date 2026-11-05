/**
 * controls.ts
 *
 * Factories for the themed controls every screen uses:
 *  - {@link createNumberControl}: a NumberControl with a units suffix, a
 *    significant-figure readout, and an optional logarithmic slider (masses and
 *    distances span several decades). Adapted from ExtrasolarPlanets.
 *  - {@link createCheckbox}: a themed checkbox with a text label.
 *  - {@link createExplanationButton}: an info button opening a dialog of short
 *    explanatory paragraphs.
 *  - {@link createEquationNode}: rich text shown only when the "Show equations"
 *    preference is on.
 *  - {@link createPushButton}: a flat white push button with a text label.
 */

import { NumberProperty, type PhetioProperty, type Property, type TReadOnlyProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { combineOptions } from "scenerystack/phet-core";
import { StringUtils } from "scenerystack/phetcommon";
import { type Node, RichText, Text, VBox } from "scenerystack/scenery";
import { InfoButton, NumberControl, type NumberControlOptions, PhetFont } from "scenerystack/scenery-phet";
import { Dialog } from "scenerystack/sim";
import { Checkbox, type CheckboxOptions, TextPushButton } from "scenerystack/sun";
import { StringManager } from "../../i18n/StringManager.js";
import { transitHunterPreferences } from "../../preferences/TransitHunterPreferencesModel.js";
import TransitHunterColors from "../../TransitHunterColors.js";
import { FONTS } from "../../TransitHunterConstants.js";
import { FLAT_PANEL_PUSH_BUTTON_OPTIONS, LIGHT_SURFACE_TEXT_FILL } from "../TransitHunterButtonOptions.js";
import {
  TRANSIT_HUNTER_CHECKBOX_OPTIONS,
  TRANSIT_HUNTER_NUMBER_CONTROL_OPTIONS,
} from "../TransitHunterControlOptions.js";
import { formatSignificant } from "./chartUtils.js";

export type CreateNumberControlOptions = {
  /** Localized unit symbol appended after the value (rich text, e.g. M<sub>J</sub>). */
  unitsProperty?: TReadOnlyProperty<string>;
  /** Significant figures of the readout (default 3). */
  significantFigures?: number;
  /** Arrow-button step; in decades on a logarithmic control (default 1/100 of the range, or 0.02 decade). */
  delta?: number;
  /** Move the slider on a log₁₀ scale. */
  logarithmic?: boolean;
  /** Accessible name; defaults to the visible title. */
  accessibleName?: TReadOnlyProperty<string>;
  /** Write the units straight after the value, with no pattern (for "°"). */
  compactUnits?: boolean;
  /** Extra NumberControl options merged last. */
  numberControlOptions?: NumberControlOptions;
};

const DIALOG_TITLE_FONT = new PhetFont({ size: 20, weight: "bold" });

/** Rounds a value to `significantFigures`. */
const roundToFigures = (value: number, significantFigures: number): number =>
  value === 0 ? 0 : Number(value.toPrecision(significantFigures));

/**
 * A log₁₀ proxy of `property` for a logarithmic slider, kept in step both ways.
 * A value the proxy sets is rounded to the readout's figures and kept in range.
 */
function createLogarithmicProxy(property: PhetioProperty<number>, range: Range, figures: number): NumberProperty {
  const proxy = new NumberProperty(Math.log10(property.value), {
    range: new Range(Math.log10(range.min), Math.log10(range.max)),
  });
  let updating = false;
  proxy.lazyLink((log) => {
    if (!updating) {
      updating = true;
      property.value = range.constrainValue(roundToFigures(10 ** log, figures));
      updating = false;
    }
  });
  property.lazyLink((value) => {
    if (!updating) {
      updating = true;
      proxy.value = proxy.range.constrainValue(Math.log10(value));
      updating = false;
    }
  });
  return proxy;
}

export function createNumberControl(
  titleProperty: TReadOnlyProperty<string>,
  numberProperty: PhetioProperty<number>,
  range: Range,
  options: CreateNumberControlOptions = {},
): NumberControl {
  const figures = options.significantFigures ?? 3;
  const logarithmic = options.logarithmic ?? false;
  const units = StringManager.getInstance().getUnits();

  const controlledProperty = logarithmic ? createLogarithmicProxy(numberProperty, range, figures) : numberProperty;
  const controlledRange = logarithmic ? new Range(Math.log10(range.min), Math.log10(range.max)) : range;
  const delta = options.delta ?? (logarithmic ? 0.02 : (range.max - range.min) / 100);
  const toValue = (controlled: number): number => (logarithmic ? range.constrainValue(10 ** controlled) : controlled);

  const unitsProperty = options.unitsProperty;
  const format = (controlled: number): string => {
    const text = formatSignificant(roundToFigures(toValue(controlled), figures), figures);
    if (!unitsProperty) {
      return text;
    }
    return options.compactUnits
      ? `${text}${unitsProperty.value}`
      : StringUtils.fillIn(units.valueUnitsPatternStringProperty.value, { value: text, units: unitsProperty.value });
  };

  return new NumberControl(
    titleProperty,
    controlledProperty,
    controlledRange,
    combineOptions<NumberControlOptions>(
      {},
      TRANSIT_HUNTER_NUMBER_CONTROL_OPTIONS,
      {
        delta,
        accessibleName: options.accessibleName ?? titleProperty,
        titleNodeOptions: { fill: TransitHunterColors.textColorProperty, font: FONTS.LABEL, maxWidth: 130 },
        numberDisplayOptions: {
          useRichText: true,
          textOptions: { fill: TransitHunterColors.controlSurfaceTextColorProperty, font: FONTS.LABEL, maxWidth: 96 },
          backgroundFill: TransitHunterColors.controlSurfaceColorProperty,
          numberFormatter: format,
          numberFormatterDependencies: unitsProperty
            ? [unitsProperty, units.valueUnitsPatternStringProperty]
            : [units.valueUnitsPatternStringProperty],
          maxWidth: 110,
          minBackgroundWidth: 100,
        },
      },
      options.numberControlOptions,
    ),
  );
}

/** A themed checkbox with a text label. */
export function createCheckbox(
  property: Property<boolean>,
  labelProperty: TReadOnlyProperty<string>,
  options?: CheckboxOptions,
): Checkbox {
  return new Checkbox(
    property,
    new Text(labelProperty, { font: FONTS.LABEL, fill: TransitHunterColors.textColorProperty, maxWidth: 180 }),
    combineOptions<CheckboxOptions>({ accessibleName: labelProperty }, TRANSIT_HUNTER_CHECKBOX_OPTIONS, options),
  );
}

/**
 * An info button that opens a dialog with a title and short paragraphs (rich
 * text, so equations can use sub- and superscripts).
 */
export function createExplanationButton(
  titleProperty: TReadOnlyProperty<string>,
  paragraphProperties: readonly TReadOnlyProperty<string>[],
  accessibleNameProperty: TReadOnlyProperty<string>,
): InfoButton {
  let dialog: Dialog | null = null;
  const textFill = TransitHunterColors.controlSurfaceTextColorProperty;
  return new InfoButton({
    iconFill: TransitHunterColors.accentColorProperty,
    scale: 0.6,
    accessibleName: accessibleNameProperty,
    listener: () => {
      if (!dialog) {
        const paragraphs = paragraphProperties.map(
          (paragraph) =>
            new RichText(paragraph, { font: FONTS.EXPLANATION, fill: textFill, lineWrap: 600, leading: 3 }),
        );
        dialog = new Dialog(new VBox({ align: "left", spacing: 14, children: paragraphs }), {
          title: new Text(titleProperty, { font: DIALOG_TITLE_FONT, fill: textFill, maxWidth: 600 }),
          fill: TransitHunterColors.controlSurfaceColorProperty,
        });
      }
      dialog.show();
    },
  });
}

/** Rich text visible only while the "Show equations" preference is on. */
export function createEquationNode(equationProperty: TReadOnlyProperty<string>, maxWidth = 220): Node {
  return new RichText(equationProperty, {
    font: FONTS.READOUT,
    fill: TransitHunterColors.accentColorProperty,
    maxWidth: maxWidth,
    visibleProperty: transitHunterPreferences.showEquationsProperty,
  });
}

/** A flat white push button with a dark text label, for dark panels. */
export function createPushButton(
  labelProperty: TReadOnlyProperty<string>,
  listener: () => void,
  maxTextWidth = 180,
  compact = false,
): TextPushButton {
  return new TextPushButton(labelProperty, {
    ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
    font: compact ? FONTS.SMALL : FONTS.LABEL,
    yMargin: compact ? 2 : 5,
    textFill: LIGHT_SURFACE_TEXT_FILL,
    maxTextWidth: maxTextWidth,
    listener: listener,
  });
}

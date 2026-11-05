/**
 * RockOrGasScreenSummaryContent.ts
 *
 * The accessible screen summary for the Rock or Gas? screen. Its current-details
 * paragraph stays live: the planet's radius, mass and where the mass comes from,
 * its density and what kind of planet that makes it.
 */

import { DerivedProperty, PatternStringProperty } from "scenerystack/axon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { formatSignificant, toPlainText } from "../../common/view/chartUtils.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { RockOrGasModel } from "../model/RockOrGasModel.js";

export class RockOrGasScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: RockOrGasModel) {
    const stringManager = StringManager.getInstance();
    const a11y = stringManager.getCompositionA11yStrings();
    const strings = stringManager.getCompositionStrings();
    const plain = (value: number, digits: number): string => toPlainText(formatSignificant(value, digits));

    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: new PatternStringProperty(a11y.currentDetailsPatternStringProperty, {
        planet: new DerivedProperty([model.archiveProperty], (planet) => planet.name),
        radius: new DerivedProperty([model.archiveProperty], (planet) => plain(planet.radiusEarth, 3)),
        mass: new DerivedProperty([model.massProperty], (mass) => plain(mass.trueMass, 3)),
        source: new DerivedProperty(
          [model.massProperty, a11y.fromWobbleStringProperty, a11y.fromTimingStringProperty],
          (mass, wobble, timing) => (mass.fromWobble ? wobble : timing),
        ),
        density: new DerivedProperty([model.densityProperty], (rho) => plain(rho, 2)),
        kind: new DerivedProperty(
          [
            model.kindProperty,
            strings.rockyStringProperty,
            strings.inBetweenStringProperty,
            strings.giantStringProperty,
          ],
          (kind, rocky, inBetween, giant) => (kind === "rocky" ? rocky : kind === "inBetween" ? inBetween : giant),
        ),
      }),
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}

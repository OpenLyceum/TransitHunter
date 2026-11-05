/**
 * DimmingScreenSummaryContent.ts
 *
 * The accessible screen summary for the Dimming screen. Its current-details
 * paragraph stays live: the planet, the star's size, the largest fraction of
 * light blocked, the brightness now, and where the planet is.
 */

import { DerivedProperty, PatternStringProperty } from "scenerystack/axon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { PlanetPreset } from "../../common/model/PlanetPreset.js";
import { skyPosition } from "../../common/model/transitPhysics.js";
import { formatSignificant, formatTickValue, toPlainText } from "../../common/view/chartUtils.js";
import { brightnessDecimals, formatPercent } from "../../common/view/formatters.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { DimmingModel } from "../model/DimmingModel.js";

export class DimmingScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: DimmingModel) {
    const stringManager = StringManager.getInstance();
    const a11y = stringManager.getDimmingA11yStrings();
    const common = stringManager.getCommonStrings();
    const strings = stringManager.getDimmingStrings();

    const planetProperty = new DerivedProperty(
      [
        model.planetPresetProperty,
        common.earthStringProperty,
        common.neptuneStringProperty,
        common.jupiterStringProperty,
        strings.thisPlanetStringProperty,
      ],
      (preset, earth, neptune, jupiter, thisPlanet) =>
        preset === PlanetPreset.EARTH
          ? earth
          : preset === PlanetPreset.NEPTUNE
            ? neptune
            : preset === PlanetPreset.JUPITER
              ? jupiter
              : thisPlanet,
    );
    const whereProperty = new DerivedProperty(
      [
        model.phaseProperty,
        model.radiusRatioProperty,
        a11y.inFrontStringProperty,
        a11y.besideStringProperty,
        a11y.behindStringProperty,
      ],
      (phase, k, inFront, beside, behind) => {
        const sky = skyPosition(phase, model.geometry(k));
        if (Math.abs(sky.x) >= 1 + k) {
          return beside;
        }
        return sky.inFront ? inFront : behind;
      },
    );

    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: new PatternStringProperty(a11y.currentDetailsPatternStringProperty, {
        planet: planetProperty,
        starRadius: new DerivedProperty([model.starPresetProperty], (star) => formatSignificant(star.radiusSun, 2)),
        percent: new DerivedProperty([model.maxBlockedFractionProperty], (depth) => toPlainText(formatPercent(depth))),
        brightness: new DerivedProperty([model.brightnessProperty, model.maxBlockedFractionProperty], (b, depth) =>
          formatTickValue(b * 100, brightnessDecimals(depth)),
        ),
        where: whereProperty,
      }),
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}

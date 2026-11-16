import { LINING_UP_SCREEN_SUMMARY_CONTENT_SETTINGS } from "../../TransitHunterConstants.js";
/**
 * LiningUpScreenSummaryContent.ts
 *
 * The accessible screen summary for the Lining Up screen. Its current-details
 * paragraph stays live: planet, distance, period, tilt, whether it transits and
 * for how long, the tilt limit, and how many random systems transit.
 */

import { DerivedProperty, PatternStringProperty, StringProperty } from "scenerystack/axon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { formatSignificant, toPlainText } from "../../common/view/chartUtils.js";
import { createPlanetNameProperty } from "../../common/view/planetName.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { LiningUpModel } from "../model/LiningUpModel.js";

export class LiningUpScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: LiningUpModel) {
    const stringManager = StringManager.getInstance();
    const a11y = stringManager.getLiningUpA11yStrings();
    const common = stringManager.getCommonStrings();

    const countProperty = new StringProperty(String(model.transitingCount()));
    const updateCount = (): void => {
      countProperty.value = String(model.transitingCount());
    };
    model.geometryProperty.lazyLink(updateCount);
    model.sampleChangedEmitter.addListener(updateCount);

    const transitPattern = new PatternStringProperty(a11y.transitPatternStringProperty, {
      hours: new DerivedProperty([model.durationProperty], (hours) =>
        toPlainText(formatSignificant(hours, LINING_UP_SCREEN_SUMMARY_CONTENT_SETTINGS.TRANSIT_PATTERN_DIGITS)),
      ),
    });
    const plain = (value: number, digits: number): string => toPlainText(formatSignificant(value, digits));

    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: new PatternStringProperty(a11y.currentDetailsPatternStringProperty, {
        planet: createPlanetNameProperty(model.planetPresetProperty, common.planetStringProperty),
        distance: new DerivedProperty([model.distanceProperty], (d) =>
          plain(d, LINING_UP_SCREEN_SUMMARY_CONTENT_SETTINGS.PLAIN_DIGITS),
        ),
        period: new DerivedProperty([model.periodProperty], (p) =>
          plain(p, LINING_UP_SCREEN_SUMMARY_CONTENT_SETTINGS.PLAIN_DIGITS_SEGMENT_2),
        ),
        inclination: new DerivedProperty([model.inclinationProperty], (i) =>
          plain(i, LINING_UP_SCREEN_SUMMARY_CONTENT_SETTINGS.PLAIN_DIGITS_SEGMENT_3),
        ),
        transit: new DerivedProperty(
          [model.transitsProperty, transitPattern, a11y.noTransitStringProperty],
          (transits, yes, no) => (transits ? yes : no),
        ),
        limit: new DerivedProperty([model.tiltLimitProperty], (limit) =>
          plain(limit, LINING_UP_SCREEN_SUMMARY_CONTENT_SETTINGS.PLAIN_DIGITS),
        ),
        count: countProperty,
      }),
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}

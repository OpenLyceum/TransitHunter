import { LIGHT_CURVE_SCREEN_SUMMARY_CONTENT_SETTINGS } from "../../TransitHunterConstants.js";
/**
 * LightCurveScreenSummaryContent.ts
 *
 * The accessible screen summary for the Light Curve screen. Its current-details
 * paragraph stays live: the planet, its period, the transit's duration and
 * depth, the noise and stacking, and the signal-to-noise verdict.
 */

import { DerivedProperty, PatternStringProperty } from "scenerystack/axon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { formatSignificant, toPlainText } from "../../common/view/chartUtils.js";
import { formatPercent } from "../../common/view/formatters.js";
import { StringManager } from "../../i18n/StringManager.js";
import { DETECTION_SNR, HINT_SNR } from "../../TransitHunterConstants.js";
import type { LightCurveModel } from "../model/LightCurveModel.js";

export class LightCurveScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: LightCurveModel) {
    const stringManager = StringManager.getInstance();
    const a11y = stringManager.getLightCurveA11yStrings();
    const strings = stringManager.getLightCurveStrings();
    const plain = (value: number, digits: number): string => toPlainText(formatSignificant(value, digits));

    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: new PatternStringProperty(a11y.currentDetailsPatternStringProperty, {
        radius: new DerivedProperty([model.planetRadiusProperty], (r) =>
          plain(r, LIGHT_CURVE_SCREEN_SUMMARY_CONTENT_SETTINGS.PLAIN_DIGITS),
        ),
        distance: new DerivedProperty([model.distanceProperty], (d) =>
          plain(d, LIGHT_CURVE_SCREEN_SUMMARY_CONTENT_SETTINGS.PLAIN_DIGITS),
        ),
        period: new DerivedProperty([model.periodProperty], (p) =>
          plain(p, LIGHT_CURVE_SCREEN_SUMMARY_CONTENT_SETTINGS.PLAIN_DIGITS_SEGMENT_2),
        ),
        duration: new DerivedProperty([model.durationProperty], (t) =>
          plain(t, LIGHT_CURVE_SCREEN_SUMMARY_CONTENT_SETTINGS.PLAIN_DIGITS),
        ),
        depth: new DerivedProperty([model.depthProperty], (depth) => toPlainText(formatPercent(depth))),
        noise: new DerivedProperty([model.noiseProperty], (n) =>
          plain(n, LIGHT_CURVE_SCREEN_SUMMARY_CONTENT_SETTINGS.PLAIN_DIGITS_SEGMENT_2),
        ),
        stack: model.stackProperty,
        snr: new DerivedProperty([model.signalToNoiseProperty], (snr) =>
          Number.isFinite(snr) ? plain(snr, LIGHT_CURVE_SCREEN_SUMMARY_CONTENT_SETTINGS.PLAIN_DIGITS) : "∞",
        ),
        verdict: new DerivedProperty(
          [
            model.signalToNoiseProperty,
            strings.noNoiseStringProperty,
            strings.lostStringProperty,
            strings.hintStringProperty,
            strings.detectedStringProperty,
          ],
          (snr, noNoise, lost, hint, detected) =>
            !Number.isFinite(snr) ? noNoise : snr < HINT_SNR ? lost : snr < DETECTION_SNR ? hint : detected,
        ),
      }),
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}

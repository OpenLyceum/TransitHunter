import { PLANET_HUNT_SCREEN_SUMMARY_CONTENT_SETTINGS } from "../../TransitHunterConstants.js";
/**
 * PlanetHuntScreenSummaryContent.ts
 *
 * The accessible screen summary for the Planet Hunt screen. Its current-details
 * paragraph stays live: the star and its data, the marks, the trial period,
 * whether the light curve is folded, and the depth line's planet size.
 */

import { DerivedProperty, Multilink, PatternStringProperty, StringProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { formatSignificant, toPlainText } from "../../common/view/chartUtils.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { PlanetHuntModel } from "../model/PlanetHuntModel.js";

export class PlanetHuntScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: PlanetHuntModel) {
    const stringManager = StringManager.getInstance();
    const a11y = stringManager.getHuntA11yStrings();
    const strings = stringManager.getHuntStrings();
    const plain = (value: number, digits: number): string => toPlainText(formatSignificant(value, digits));

    const marksProperty = new StringProperty("");
    const updateMarks = (): void => {
      const spacing = model.markSpacing();
      marksProperty.value =
        spacing === null
          ? StringUtils.fillIn(strings.marksCountPatternStringProperty.value, { count: model.marks.length })
          : StringUtils.fillIn(strings.marksSpacingPatternStringProperty.value, {
              count: model.marks.length,
              spacing: plain(spacing, PLANET_HUNT_SCREEN_SUMMARY_CONTENT_SETTINGS.UPDATE_MARKS_SPACING),
            });
    };
    model.marks.addItemAddedListener(updateMarks);
    model.marks.addItemRemovedListener(updateMarks);
    // Both patterns: on a language change the count pattern updates before the spacing one.
    Multilink.multilink(
      [strings.marksCountPatternStringProperty, strings.marksSpacingPatternStringProperty],
      updateMarks,
    );

    // The period search: nothing before it starts, its progress while it runs, then its strongest dip.
    const searchProperty = new StringProperty("");
    const updateSearch = (): void => {
      const search = model.search;
      if (!search) {
        searchProperty.value = "";
      } else if (!search.done) {
        searchProperty.value = StringUtils.fillIn(a11y.searchRunningPatternStringProperty.value, {
          percent: Math.floor(100 * search.progress),
        });
      } else {
        const index = search.peakIndex();
        searchProperty.value =
          index < 0
            ? ""
            : StringUtils.fillIn(a11y.searchDonePatternStringProperty.value, {
                period: plain(
                  search.fitAt(index).period,
                  PLANET_HUNT_SCREEN_SUMMARY_CONTENT_SETTINGS.PERIOD_PLAIN_DIGITS,
                ),
              });
      }
    };
    model.searchChangedEmitter.addListener(updateSearch);
    a11y.searchRunningPatternStringProperty.lazyLink(updateSearch);
    a11y.searchDonePatternStringProperty.lazyLink(updateSearch);

    const details = new PatternStringProperty(a11y.currentDetailsPatternStringProperty, {
      star: new DerivedProperty([model.targetProperty], (target) => target.starName),
      days: new DerivedProperty([model.lightCurveProperty], (curve) =>
        curve ? plain(curve.spanDays, PLANET_HUNT_SCREEN_SUMMARY_CONTENT_SETTINGS.SPAN_DAYS_PLAIN_DIGITS) : "—",
      ),
      mission: new DerivedProperty([model.lightCurveProperty], (curve) => (curve ? curve.file.mission : "—")),
      marks: marksProperty,
      search: searchProperty,
      period: new DerivedProperty([model.periodProperty], (p) =>
        plain(p, PLANET_HUNT_SCREEN_SUMMARY_CONTENT_SETTINGS.DETAILS_DIGITS),
      ),
      folded: new DerivedProperty(
        [model.foldProperty, a11y.foldedStringProperty, a11y.notFoldedStringProperty],
        (fold, folded, notFolded) => (fold ? folded : notFolded),
      ),
      depth: new DerivedProperty([model.depthProperty], (d) =>
        plain(d, PLANET_HUNT_SCREEN_SUMMARY_CONTENT_SETTINGS.DETAILS_DIGITS_SEGMENT_2),
      ),
      radius: new DerivedProperty([model.inferredRadiusProperty], (r) =>
        plain(r, PLANET_HUNT_SCREEN_SUMMARY_CONTENT_SETTINGS.DETAILS_DIGITS_SEGMENT_2),
      ),
    });

    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: new DerivedProperty(
        [model.lightCurveProperty, details, a11y.loadingStringProperty],
        (curve, text: string, loading: string) => (curve ? text : loading),
      ),
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}

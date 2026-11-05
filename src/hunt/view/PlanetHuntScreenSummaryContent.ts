/**
 * PlanetHuntScreenSummaryContent.ts
 *
 * The accessible screen summary for the Planet Hunt screen. Its current-details
 * paragraph stays live: the star and its data, the marks, the trial period,
 * whether the light curve is folded, and the depth line's planet size.
 */

import { DerivedProperty, PatternStringProperty, StringProperty } from "scenerystack/axon";
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
              spacing: plain(spacing, 4),
            });
    };
    model.marks.addItemAddedListener(updateMarks);
    model.marks.addItemRemovedListener(updateMarks);
    strings.marksCountPatternStringProperty.link(updateMarks);

    const details = new PatternStringProperty(a11y.currentDetailsPatternStringProperty, {
      star: new DerivedProperty([model.targetProperty], (target) => target.starName),
      days: new DerivedProperty([model.lightCurveProperty], (curve) => (curve ? plain(curve.spanDays, 3) : "—")),
      mission: new DerivedProperty([model.lightCurveProperty], (curve) => (curve ? curve.file.mission : "—")),
      marks: marksProperty,
      period: new DerivedProperty([model.periodProperty], (p) => plain(p, 4)),
      folded: new DerivedProperty(
        [model.foldProperty, a11y.foldedStringProperty, a11y.notFoldedStringProperty],
        (fold, folded, notFolded) => (fold ? folded : notFolded),
      ),
      depth: new DerivedProperty([model.depthProperty], (d) => plain(d, 2)),
      radius: new DerivedProperty([model.inferredRadiusProperty], (r) => plain(r, 2)),
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

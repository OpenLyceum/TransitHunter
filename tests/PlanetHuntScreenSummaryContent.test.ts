/**
 * Checks for PlanetHuntScreenSummaryContent: the dip-marks sentence follows a
 * language change once two distinct dips are marked (the spacing pattern updates
 * after the count pattern, so watching only the count pattern kept the old language).
 */

import { localeProperty } from "scenerystack/joist";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PlanetHuntModel } from "../src/hunt/model/PlanetHuntModel.js";
import { PlanetHuntScreenSummaryContent } from "../src/hunt/view/PlanetHuntScreenSummaryContent.js";

const originalStrings = window.phet["chipper"].strings;

// The shared setup registers only English. Register the sim's other locales for this suite
// so the framework's locale validation does not fall back to English on a language change.
beforeAll(() => {
  window.phet["chipper"].strings = { ...originalStrings, fr: {}, es: {} };
});

afterAll(() => {
  window.phet["chipper"].strings = originalStrings;
});

afterEach(() => {
  localeProperty.value = "en";
});

/** Waits until the model's light curve has loaded. */
async function loaded(model: PlanetHuntModel): Promise<void> {
  for (let i = 0; i < 200 && !model.lightCurveProperty.value; i++) {
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  expect(model.lightCurveProperty.value).not.toBeNull();
}

// PatternStringProperty surrounds interpolated values with Unicode direction markers.
const readDetails = (summary: PlanetHuntScreenSummaryContent): string =>
  (summary.getVoicingDetailsString() ?? "").replace(/[‪‬]/g, "");

describe("PlanetHuntScreenSummaryContent", () => {
  it("describes two marked dips in the current language after a language change", async () => {
    const model = new PlanetHuntModel();
    await loaded(model);
    const summary = new PlanetHuntScreenSummaryContent(model);
    model.addMark(1);
    model.addMark(4);
    expect(model.markSpacing()).not.toBeNull();
    expect(readDetails(summary)).toContain("Dips marked: 2; they repeat every");

    localeProperty.value = "es";
    expect(readDetails(summary)).toContain("Caídas marcadas: 2; se repiten cada");

    localeProperty.value = "fr";
    expect(readDetails(summary)).not.toContain("Caídas marcadas");
    expect(readDetails(summary)).not.toContain("Dips marked");
    summary.dispose();
  });
});

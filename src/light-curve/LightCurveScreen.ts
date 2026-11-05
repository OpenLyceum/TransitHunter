/**
 * LightCurveScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createLightCurveIcon() in src/common/TransitHunterScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createLightCurveIcon } from "../common/TransitHunterScreenIcons.js";
import TransitHunterColors from "../TransitHunterColors.js";
import { LightCurveModel } from "./model/LightCurveModel.js";
import { LightCurveKeyboardHelpContent } from "./view/LightCurveKeyboardHelpContent.js";
import { LightCurveScreenView } from "./view/LightCurveScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type LightCurveScreenOptions = ScreenOptions & { tandem: Tandem };

export class LightCurveScreen extends Screen<LightCurveModel, LightCurveScreenView> {
  public constructor(options: LightCurveScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new LightCurveModel(),
      // View factory — receives the model instance
      (model) =>
        new LightCurveScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<LightCurveScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: TransitHunterColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new LightCurveKeyboardHelpContent(),
          homeScreenIcon: createLightCurveIcon(),
          navigationBarIcon: createLightCurveIcon(),
        },
        options,
      ),
    );
  }
}

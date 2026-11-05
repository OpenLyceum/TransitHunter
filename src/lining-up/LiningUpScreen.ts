/**
 * LiningUpScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createLiningUpIcon() in src/common/TransitHunterScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createLiningUpIcon } from "../common/TransitHunterScreenIcons.js";
import TransitHunterColors from "../TransitHunterColors.js";
import { LiningUpModel } from "./model/LiningUpModel.js";
import { LiningUpKeyboardHelpContent } from "./view/LiningUpKeyboardHelpContent.js";
import { LiningUpScreenView } from "./view/LiningUpScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type LiningUpScreenOptions = ScreenOptions & { tandem: Tandem };

export class LiningUpScreen extends Screen<LiningUpModel, LiningUpScreenView> {
  public constructor(options: LiningUpScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new LiningUpModel(),
      // View factory — receives the model instance
      (model) =>
        new LiningUpScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<LiningUpScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: TransitHunterColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new LiningUpKeyboardHelpContent(),
          homeScreenIcon: createLiningUpIcon(),
          navigationBarIcon: createLiningUpIcon(),
        },
        options,
      ),
    );
  }
}

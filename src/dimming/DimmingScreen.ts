/**
 * DimmingScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createDimmingIcon() in src/common/TransitHunterScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createDimmingIcon } from "../common/TransitHunterScreenIcons.js";
import TransitHunterColors from "../TransitHunterColors.js";
import { DimmingModel } from "./model/DimmingModel.js";
import { DimmingKeyboardHelpContent } from "./view/DimmingKeyboardHelpContent.js";
import { DimmingScreenView } from "./view/DimmingScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type DimmingScreenOptions = ScreenOptions & { tandem: Tandem };

export class DimmingScreen extends Screen<DimmingModel, DimmingScreenView> {
  public constructor(options: DimmingScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new DimmingModel(),
      // View factory — receives the model instance
      (model) =>
        new DimmingScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<DimmingScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: TransitHunterColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new DimmingKeyboardHelpContent(),
          homeScreenIcon: createDimmingIcon(),
          navigationBarIcon: createDimmingIcon(),
        },
        options,
      ),
    );
  }
}

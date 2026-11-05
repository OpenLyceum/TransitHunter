/**
 * RockOrGasScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createRockOrGasIcon() in src/common/TransitHunterScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createRockOrGasIcon } from "../common/TransitHunterScreenIcons.js";
import TransitHunterColors from "../TransitHunterColors.js";
import { RockOrGasModel } from "./model/RockOrGasModel.js";
import { RockOrGasKeyboardHelpContent } from "./view/RockOrGasKeyboardHelpContent.js";
import { RockOrGasScreenView } from "./view/RockOrGasScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type RockOrGasScreenOptions = ScreenOptions & { tandem: Tandem };

export class RockOrGasScreen extends Screen<RockOrGasModel, RockOrGasScreenView> {
  public constructor(options: RockOrGasScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new RockOrGasModel(),
      // View factory — receives the model instance
      (model) =>
        new RockOrGasScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<RockOrGasScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: TransitHunterColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new RockOrGasKeyboardHelpContent(),
          homeScreenIcon: createRockOrGasIcon(),
          navigationBarIcon: createRockOrGasIcon(),
        },
        options,
      ),
    );
  }
}

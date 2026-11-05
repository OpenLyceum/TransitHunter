/**
 * PlanetHuntScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createPlanetHuntIcon() in src/common/TransitHunterScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createPlanetHuntIcon } from "../common/TransitHunterScreenIcons.js";
import TransitHunterColors from "../TransitHunterColors.js";
import { PlanetHuntModel } from "./model/PlanetHuntModel.js";
import { PlanetHuntKeyboardHelpContent } from "./view/PlanetHuntKeyboardHelpContent.js";
import { PlanetHuntScreenView } from "./view/PlanetHuntScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type PlanetHuntScreenOptions = ScreenOptions & { tandem: Tandem };

export class PlanetHuntScreen extends Screen<PlanetHuntModel, PlanetHuntScreenView> {
  public constructor(options: PlanetHuntScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new PlanetHuntModel(),
      // View factory — receives the model instance
      (model) =>
        new PlanetHuntScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<PlanetHuntScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: TransitHunterColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new PlanetHuntKeyboardHelpContent(),
          homeScreenIcon: createPlanetHuntIcon(),
          navigationBarIcon: createPlanetHuntIcon(),
        },
        options,
      ),
    );
  }
}

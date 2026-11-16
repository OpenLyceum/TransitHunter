import { TRANSIT_HUNTER_PREFERENCES_NODE_SETTINGS } from "../TransitHunterConstants.js";
/**
 * TransitHunterPreferencesNode.ts
 *
 * Custom preferences UI shown in Preferences → Simulation. Controls are bound
 * to TransitHunterPreferencesModel Properties (whose initial values come from
 * transitHunterQueryParameters).
 */

import { Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { Checkbox } from "scenerystack/sun";
import type { Tandem } from "scenerystack/tandem";
import { StringManager } from "../i18n/StringManager.js";
import TransitHunterColors from "../TransitHunterColors.js";
import TransitHunterNamespace from "../TransitHunterNamespace.js";
import type { TransitHunterPreferencesModel } from "./TransitHunterPreferencesModel.js";

export class TransitHunterPreferencesNode extends VBox {
  public constructor(preferencesModel: TransitHunterPreferencesModel, tandem?: Tandem) {
    const prefStrings = StringManager.getInstance().getPreferences();

    // The Preferences dialog is always white, so use the dark "light control surface"
    // colors (readable on white in both default and projector profiles), not textColorProperty
    // (which is near-white in default mode and would be invisible on the white dialog).
    const header = new Text(prefStrings.titleStringProperty, {
      font: new PhetFont({ size: TRANSIT_HUNTER_PREFERENCES_NODE_SETTINGS.HEADER_FONT_SIZE, weight: "bold" }),
      fill: TransitHunterColors.controlSurfaceTextColorProperty,
    });

    const showEquationsCheckbox = new Checkbox(
      preferencesModel.showEquationsProperty,
      new Text(prefStrings.showEquationsStringProperty, {
        font: new PhetFont(TRANSIT_HUNTER_PREFERENCES_NODE_SETTINGS.SHOW_EQUATIONS_CHECKBOX_FONT_SIZE),
        fill: TransitHunterColors.controlSurfaceTextColorProperty,
      }),
      {
        checkboxColor: TransitHunterColors.controlSurfaceTextColorProperty,
        checkboxColorBackground: TransitHunterColors.controlSurfaceColorProperty,
        spacing: TRANSIT_HUNTER_PREFERENCES_NODE_SETTINGS.SHOW_EQUATIONS_CHECKBOX_SPACING,
        accessibleHelpText: prefStrings.showEquationsHelpStringProperty,
        ...(tandem && { tandem: tandem.createTandem("showEquationsCheckbox") }),
      },
    );

    const description = new Text(prefStrings.showEquationsHelpStringProperty, {
      font: new PhetFont(TRANSIT_HUNTER_PREFERENCES_NODE_SETTINGS.DESCRIPTION_FONT_SIZE),
      fill: TransitHunterColors.controlSurfaceTextColorProperty,
      maxWidth: TRANSIT_HUNTER_PREFERENCES_NODE_SETTINGS.DESCRIPTION_MAX_WIDTH,
    });

    super({
      align: "left",
      spacing: TRANSIT_HUNTER_PREFERENCES_NODE_SETTINGS.CONSTRUCTOR_SPACING,
      children: [header, showEquationsCheckbox, description],
    });
  }
}

TransitHunterNamespace.register("TransitHunterPreferencesNode", TransitHunterPreferencesNode);

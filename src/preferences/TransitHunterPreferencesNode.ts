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
      font: new PhetFont({ size: 18, weight: "bold" }),
      fill: TransitHunterColors.controlSurfaceTextColorProperty,
    });

    const showEquationsCheckbox = new Checkbox(
      preferencesModel.showEquationsProperty,
      new Text(prefStrings.showEquationsStringProperty, {
        font: new PhetFont(14),
        fill: TransitHunterColors.controlSurfaceTextColorProperty,
      }),
      {
        checkboxColor: TransitHunterColors.controlSurfaceTextColorProperty,
        checkboxColorBackground: TransitHunterColors.controlSurfaceColorProperty,
        spacing: 8,
        accessibleHelpText: prefStrings.showEquationsHelpStringProperty,
        ...(tandem && { tandem: tandem.createTandem("showEquationsCheckbox") }),
      },
    );

    const description = new Text(prefStrings.showEquationsHelpStringProperty, {
      font: new PhetFont(12),
      fill: TransitHunterColors.controlSurfaceTextColorProperty,
      maxWidth: 420,
    });

    super({
      align: "left",
      spacing: 12,
      children: [header, showEquationsCheckbox, description],
    });
  }
}

TransitHunterNamespace.register("TransitHunterPreferencesNode", TransitHunterPreferencesNode);

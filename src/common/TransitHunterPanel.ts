/**
 * TransitHunterPanel.ts
 *
 * A pre-themed Panel that automatically uses TransitHunterColors for background and
 * border. Use this for all control panels and info boxes in the sim so that
 * default / projector mode switching is handled automatically.
 *
 * ── Basic usage ───────────────────────────────────────────────────────────────
 *
 *   import { TransitHunterPanel } from "../../common/TransitHunterPanel.js";
 *   import { VBox, Text } from "scenerystack/scenery";
 *
 *   const content = new VBox({
 *     children: [ new Text("label"), slider ],
 *     spacing: 8,
 *   });
 *   const panel = new TransitHunterPanel(content);
 *
 * ── Overriding defaults ───────────────────────────────────────────────────────
 *
 *   // Wider margins, sharper corners, custom stroke
 *   const panel = new TransitHunterPanel(content, { xMargin: 20, cornerRadius: 0 });
 *
 *   // Transparent background (decorative border only)
 *   const panel = new TransitHunterPanel(content, { fill: "transparent" });
 */

import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { Node } from "scenerystack/scenery";
import { Panel, type PanelOptions } from "scenerystack/sun";
import TransitHunterColors from "../TransitHunterColors.js";
import { PANEL_CORNER_RADIUS } from "../TransitHunterConstants.js";

export type TransitHunterPanelOptions = PanelOptions;

export class TransitHunterPanel extends Panel {
  public constructor(content: Node, providedOptions?: TransitHunterPanelOptions) {
    const options = optionize<TransitHunterPanelOptions, EmptySelfOptions, PanelOptions>()(
      {
        fill: TransitHunterColors.panelBackgroundColorProperty,
        stroke: TransitHunterColors.panelBorderColorProperty,
        cornerRadius: PANEL_CORNER_RADIUS,
        xMargin: 12,
        yMargin: 10,
      },
      providedOptions,
    );
    super(content, options);
  }
}

/**
 * LightCurveKeyboardHelpContent.ts
 *
 * Keyboard-help dialog for the Light Curve screen: radio buttons, checkboxes and
 * buttons on the left; the sliders on the right.
 */

import {
  BasicActionsKeyboardHelpSection,
  SliderControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";

export class LightCurveKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    super(
      [new BasicActionsKeyboardHelpSection({ withCheckboxContent: true })],
      [new SliderControlsKeyboardHelpSection()],
    );
  }
}

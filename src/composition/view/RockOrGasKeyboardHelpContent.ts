/**
 * RockOrGasKeyboardHelpContent.ts
 *
 * Keyboard-help dialog for the Rock or Gas? screen: the planet radio buttons and
 * the buttons.
 */

import { BasicActionsKeyboardHelpSection, TwoColumnKeyboardHelpContent } from "scenerystack/scenery-phet";

export class RockOrGasKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    super([new BasicActionsKeyboardHelpSection()], []);
  }
}

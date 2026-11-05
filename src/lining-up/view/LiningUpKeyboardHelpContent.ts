/**
 * LiningUpKeyboardHelpContent.ts
 *
 * Keyboard-help dialog for the Lining Up screen: turning the 3-D view (arrow
 * keys) and the buttons on the left; the sliders and time controls on the right.
 */

import {
  BasicActionsKeyboardHelpSection,
  KeyboardHelpIconFactory,
  KeyboardHelpSection,
  KeyboardHelpSectionRow,
  SliderControlsKeyboardHelpSection,
  TimeControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";

export class LiningUpKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    const strings = StringManager.getInstance().getLiningUpStrings();
    const rotateSection = new KeyboardHelpSection(strings.keyboardHelpHeadingStringProperty, [
      KeyboardHelpSectionRow.labelWithIcon(
        strings.keyboardHelpRotateStringProperty,
        KeyboardHelpIconFactory.arrowKeysRowIcon(),
      ),
    ]);
    super(
      [rotateSection, new BasicActionsKeyboardHelpSection()],
      [new SliderControlsKeyboardHelpSection(), new TimeControlsKeyboardHelpSection()],
    );
  }
}

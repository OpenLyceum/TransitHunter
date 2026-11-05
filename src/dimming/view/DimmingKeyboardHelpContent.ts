/**
 * DimmingKeyboardHelpContent.ts
 *
 * Keyboard-help dialog for the Dimming screen: moving the planet, radio buttons
 * and checkboxes on the left; the custom-size slider and the time controls on
 * the right.
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

export class DimmingKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    const strings = StringManager.getInstance().getDimmingStrings();
    const planetSection = new KeyboardHelpSection(strings.keyboardHelpHeadingStringProperty, [
      KeyboardHelpSectionRow.labelWithIcon(
        strings.keyboardHelpMoveStringProperty,
        KeyboardHelpIconFactory.leftRightArrowKeysRowIcon(),
      ),
    ]);
    super(
      [planetSection, new BasicActionsKeyboardHelpSection({ withCheckboxContent: true })],
      [new SliderControlsKeyboardHelpSection(), new TimeControlsKeyboardHelpSection()],
    );
  }
}

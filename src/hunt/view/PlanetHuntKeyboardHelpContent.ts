/**
 * PlanetHuntKeyboardHelpContent.ts
 *
 * Keyboard-help dialog for the Planet Hunt screen: the depth line (up and down
 * arrows), the star selector, buttons and checkboxes on the left; the sliders on
 * the right.
 */

import {
  BasicActionsKeyboardHelpSection,
  ComboBoxKeyboardHelpSection,
  KeyboardHelpIconFactory,
  KeyboardHelpSection,
  KeyboardHelpSectionRow,
  SliderControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";

export class PlanetHuntKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    const strings = StringManager.getInstance().getHuntStrings();
    const depthSection = new KeyboardHelpSection(strings.keyboardHelpHeadingStringProperty, [
      KeyboardHelpSectionRow.labelWithIcon(
        strings.keyboardHelpMoveStringProperty,
        KeyboardHelpIconFactory.upDownArrowKeysRowIcon(),
      ),
    ]);
    super(
      [depthSection, new BasicActionsKeyboardHelpSection({ withCheckboxContent: true })],
      [new ComboBoxKeyboardHelpSection(), new SliderControlsKeyboardHelpSection()],
    );
  }
}

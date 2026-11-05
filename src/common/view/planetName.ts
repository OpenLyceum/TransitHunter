/**
 * planetName.ts
 *
 * The selected planet preset as the subject of a sentence ("A Jupiter-sized
 * planet"), as a live string. The presets are planets around a distant star of
 * the size of Earth, Neptune or Jupiter, never those planets themselves (we
 * watch from Earth, and we never see Jupiter transit).
 */

import { DerivedProperty, type ReadOnlyProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { StringManager } from "../../i18n/StringManager.js";
import { PlanetPreset } from "../model/PlanetPreset.js";

/**
 * @param presetProperty - the selected preset
 * @param customNameProperty - what to call a custom-size planet
 */
export function createPlanetNameProperty(
  presetProperty: TReadOnlyProperty<PlanetPreset>,
  customNameProperty: TReadOnlyProperty<string>,
): ReadOnlyProperty<string> {
  const common = StringManager.getInstance().getCommonStrings();
  return new DerivedProperty(
    [
      presetProperty,
      common.earthSizedPlanetStringProperty,
      common.neptuneSizedPlanetStringProperty,
      common.jupiterSizedPlanetStringProperty,
      customNameProperty,
    ],
    (preset, earth, neptune, jupiter, custom) =>
      preset === PlanetPreset.EARTH
        ? earth
        : preset === PlanetPreset.NEPTUNE
          ? neptune
          : preset === PlanetPreset.JUPITER
            ? jupiter
            : custom,
  );
}

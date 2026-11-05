/**
 * planetName.ts
 *
 * The localized name of the selected planet preset, as a live string.
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
      common.earthStringProperty,
      common.neptuneStringProperty,
      common.jupiterStringProperty,
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

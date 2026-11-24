/**
 * Rock or Gas? view: the planet's size disc is rebuilt each time the planet changes.
 * The old disc's label Text links the long-lived planet-name Property, so the disc
 * must be disposed as a subtree or every planet change leaks a Text.
 */

import { type Node, Text } from "scenerystack/scenery";
import { describe, expect, it } from "vitest";
import { CompositionPlanet } from "../src/composition/model/CompositionPlanet.js";
import { RockOrGasModel } from "../src/composition/model/RockOrGasModel.js";
import { RockOrGasScreenView } from "../src/composition/view/RockOrGasScreenView.js";
import { TransitHunterPreferencesModel } from "../src/preferences/TransitHunterPreferencesModel.js";
import { forceGC } from "./helpers/memoryLeak.js";

/** Weak references to every Text in the view that shows the current planet's name. */
function planetNameTexts(root: Node, name: string): WeakRef<Text>[] {
  const found: WeakRef<Text>[] = [];
  const visit = (node: Node): void => {
    if (node instanceof Text && node.string === name) {
      found.push(new WeakRef(node));
    }
    node.children.forEach(visit);
  };
  visit(root);
  return found;
}

describe("RockOrGasScreenView", () => {
  it("frees the old size-disc label when the planet changes", async () => {
    const model = new RockOrGasModel();
    const view = new RockOrGasScreenView(model, new TransitHunterPreferencesModel());
    const planets = CompositionPlanet.enumeration.values;

    const refs: WeakRef<Text>[] = [];
    for (const planet of planets) {
      model.planetProperty.value = planet;
      refs.push(...planetNameTexts(view, model.archiveProperty.value.name));
    }
    model.planetProperty.value = planets[0]!;
    expect(refs.length).toBeGreaterThan(0);

    // A Text removed from the view must be collected; ones still shown keep a parent.
    const detached = (): WeakRef<Text>[] => refs.filter((ref) => (ref.deref()?.parents.length ?? 1) === 0);
    await forceGC(detached());
    expect(detached().length, "detached planet-name Texts still alive").toBe(0);
  });
});

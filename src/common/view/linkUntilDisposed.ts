/**
 * linkUntilDisposed.ts
 *
 * Links a listener to a Property and unlinks it when `owner` is disposed.
 *
 * Use it for layout listeners such as `label.boundsProperty.link(() => …)` in a
 * disposable node. Such a listener lives as long as the label, and a label
 * whose text is a global string Property lives as long as the sim. In V8 the
 * listener can also keep the whole constructor scope alive, including `this`,
 * because closures created in one function share their captured variables.
 * Without the unlink, the owner would never be garbage collected.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import type { Node } from "scenerystack/scenery";

export function linkUntilDisposed<T>(owner: Node, property: TReadOnlyProperty<T>, listener: (value: T) => void): void {
  property.link(listener);
  owner.disposeEmitter.addListener(() => property.unlink(listener));
}

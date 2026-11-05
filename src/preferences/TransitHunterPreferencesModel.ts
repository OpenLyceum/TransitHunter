/**
 * TransitHunterPreferencesModel.ts
 *
 * Model for the simulation-specific preferences shown in Preferences →
 * Simulation. Each preference Property takes its initial value from the
 * corresponding query parameter in transitHunterQueryParameters.
 *
 * A single instance is shared by every screen (see {@link transitHunterPreferences}).
 */

import { BooleanProperty } from "scenerystack/axon";
import { Tandem } from "scenerystack/tandem";
import TransitHunterNamespace from "../TransitHunterNamespace.js";
import transitHunterQueryParameters from "./transitHunterQueryParameters.js";

export class TransitHunterPreferencesModel {
  /** Show the equations beside the readouts (R = R★√δ, Kepler's third law, density). */
  public readonly showEquationsProperty: BooleanProperty;

  public constructor(tandem?: Tandem) {
    this.showEquationsProperty = new BooleanProperty(
      transitHunterQueryParameters.showEquations,
      tandem ? { tandem: tandem.createTandem("showEquationsProperty") } : undefined,
    );
  }

  public reset(): void {
    this.showEquationsProperty.reset();
  }
}

/** The sim-wide preferences, shared by main.ts (the Preferences dialog) and the screen views. */
export const transitHunterPreferences = new TransitHunterPreferencesModel(Tandem.ROOT.createTandem("preferences"));

TransitHunterNamespace.register("TransitHunterPreferencesModel", TransitHunterPreferencesModel);

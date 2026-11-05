/**
 * main.ts
 *
 * Entry point for the simulation. Initializes SceneryStack, creates the
 * screens, and starts the main event loop.
 *
 * !! CRITICAL IMPORT ORDER !!
 * brand.js MUST be the first import. Each module imports the next, so the import nesting is
 *
 *   main → brand → splash → assert → init
 *
 * and therefore the actual EXECUTION order (deepest import runs first) is the reverse:
 *
 *   init → assert → splash → brand → main
 *
 * SceneryStack requires this exact load order. Never reorder these imports.
 */

// brand.js MUST be first; importing it runs the whole chain (init→assert→splash→brand) before main.
import "./brand.js";

import { onReadyToLaunch, PreferencesModel, Sim } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import { RockOrGasScreen } from "./composition/RockOrGasScreen.js";
import { DimmingScreen } from "./dimming/DimmingScreen.js";
import { PlanetHuntScreen } from "./hunt/PlanetHuntScreen.js";
import { StringManager } from "./i18n/StringManager.js";
import { LightCurveScreen } from "./light-curve/LightCurveScreen.js";
import { LiningUpScreen } from "./lining-up/LiningUpScreen.js";
import { TransitHunterPreferencesModel } from "./preferences/TransitHunterPreferencesModel.js";
import { TransitHunterPreferencesNode } from "./preferences/TransitHunterPreferencesNode.js";
import TransitHunterColors from "./TransitHunterColors.js";

onReadyToLaunch(() => {
  const stringManager = StringManager.getInstance();

  // Simulation-specific preferences; initial values come from transitHunterQueryParameters.
  const simPreferences = new TransitHunterPreferencesModel(Tandem.ROOT.createTandem("preferences"));

  const screens = [
    new DimmingScreen({
      name: stringManager.getScreenNames().dimmingStringProperty,
      tandem: Tandem.ROOT.createTandem("dimmingScreen"),
      backgroundColorProperty: TransitHunterColors.backgroundColorProperty,
    }),
    new LiningUpScreen({
      name: stringManager.getScreenNames().liningUpStringProperty,
      tandem: Tandem.ROOT.createTandem("liningUpScreen"),
      backgroundColorProperty: TransitHunterColors.backgroundColorProperty,
    }),
    new LightCurveScreen({
      name: stringManager.getScreenNames().lightCurveStringProperty,
      tandem: Tandem.ROOT.createTandem("lightCurveScreen"),
      backgroundColorProperty: TransitHunterColors.backgroundColorProperty,
    }),
    new PlanetHuntScreen({
      name: stringManager.getScreenNames().huntStringProperty,
      tandem: Tandem.ROOT.createTandem("huntScreen"),
      backgroundColorProperty: TransitHunterColors.backgroundColorProperty,
    }),
    new RockOrGasScreen({
      name: stringManager.getScreenNames().compositionStringProperty,
      tandem: Tandem.ROOT.createTandem("compositionScreen"),
      backgroundColorProperty: TransitHunterColors.backgroundColorProperty,
    }),
  ];

  const sim = new Sim(stringManager.getTitleStringProperty(), screens, {
    preferencesModel: new PreferencesModel({
      visualOptions: {
        // Adds a "Projector Mode" toggle in Preferences → Visual
        supportsProjectorMode: true,
        // Enables keyboard-navigation highlight outlines
        supportsInteractiveHighlights: true,
      },
      simulationOptions: {
        customPreferences: [
          {
            createContent: (tandem: Tandem) => new TransitHunterPreferencesNode(simPreferences, tandem),
          },
        ],
      },
      localizationOptions: {
        // Adds a language picker in Preferences → Language
        supportsDynamicLocale: true,
      },
    }),

    // Optional: fill in credits shown in Help → About
    credits: {
      leadDesign: "",
      softwareDevelopment: "",
      team: "",
      qualityAssurance: "",
    },
  });

  sim.start();
});

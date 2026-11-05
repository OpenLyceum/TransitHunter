/**
 * Memory-leak regression suite (fleet standard).
 *
 * Every object that links Properties, adds listeners, or owns child nodes, with
 * a factory that builds a fresh instance. The shared harness in
 * tests/helpers/memoryLeak.ts (template-owned) checks that each one is garbage
 * collected after dispose() and leaves no survivors across repeated cycles.
 * The screen models are long-lived (as in the sim), built once here.
 */

import { NumberProperty } from "scenerystack/axon";
import { ChartTransform } from "scenerystack/bamboo";
import { TimeModel } from "../src/common/TimeModel.js";
import { PlanetNode } from "../src/common/view/PlanetNode.js";
import { StarNode } from "../src/common/view/StarNode.js";
import { RockOrGasModel } from "../src/composition/model/RockOrGasModel.js";
import { DensityScaleNode } from "../src/composition/view/DensityScaleNode.js";
import { MassRadiusDiagramNode } from "../src/composition/view/MassRadiusDiagramNode.js";
import { DimmingModel } from "../src/dimming/model/DimmingModel.js";
import { DimmingChartNode } from "../src/dimming/view/DimmingChartNode.js";
import { EarthViewNode, SideViewNode } from "../src/dimming/view/DimmingViews.js";
import { PlanetHuntModel } from "../src/hunt/model/PlanetHuntModel.js";
import { HuntChartNode } from "../src/hunt/view/HuntChartNode.js";
import { PointCloudNode } from "../src/hunt/view/PointCloudNode.js";
import { StringManager } from "../src/i18n/StringManager.js";
import { LightCurveChartNode } from "../src/light-curve/view/LightCurveChartNode.js";
import { LiningUpModel } from "../src/lining-up/model/LiningUpModel.js";
import { LiningUpChartNode } from "../src/lining-up/view/LiningUpChartNode.js";
import { Orbit3DViewNode } from "../src/lining-up/view/Orbit3DViewNode.js";
import { RandomSkyNode } from "../src/lining-up/view/RandomSkyNode.js";
import { SkyViewNode } from "../src/lining-up/view/SkyViewNode.js";
import TransitHunterColors from "../src/TransitHunterColors.js";
import { describeDisposalLeaks } from "./helpers/memoryLeak.js";

const temperatureProperty = new NumberProperty(5772);
const densityProperty = new NumberProperty(1.3);
const dimming = new DimmingModel();
const liningUp = new LiningUpModel();
const hunt = new PlanetHuntModel();
const rockOrGas = new RockOrGasModel();
const telescopeProperty = dimming.isDraggingProperty;
const common = StringManager.getInstance().getCommonStrings();
const transform = new ChartTransform({ viewWidth: 100, viewHeight: 50 });

describeDisposalLeaks([
  { name: "TimeModel", create: () => new TimeModel(), idempotentDispose: true },
  { name: "StarNode", create: () => new StarNode(temperatureProperty, 10) },
  { name: "PlanetNode", create: () => new PlanetNode() },
  { name: "SideViewNode", create: () => new SideViewNode(dimming, telescopeProperty, 300, 150, 50) },
  { name: "EarthViewNode", create: () => new EarthViewNode(dimming, telescopeProperty, 300, 150, 50) },
  { name: "DimmingChartNode", create: () => new DimmingChartNode(dimming, 200, 150) },
  { name: "Orbit3DViewNode", create: () => new Orbit3DViewNode(liningUp, 300, 250) },
  { name: "SkyViewNode", create: () => new SkyViewNode(liningUp, 300, 150, 50) },
  { name: "LiningUpChartNode", create: () => new LiningUpChartNode(liningUp, 200, 150) },
  { name: "RandomSkyNode", create: () => new RandomSkyNode(liningUp, 220) },
  {
    name: "LightCurveChartNode",
    create: () =>
      new LightCurveChartNode(
        common.brightnessAxisStringProperty,
        common.daysAxisStringProperty,
        common.brightnessAxisStringProperty,
        200,
        100,
      ),
  },
  {
    name: "PointCloudNode",
    create: () => new PointCloudNode(transform, TransitHunterColors.measurementColorProperty, 2),
  },
  { name: "HuntChartNode", create: () => new HuntChartNode(hunt, 400, 200) },
  { name: "DensityScaleNode", create: () => new DensityScaleNode(densityProperty, 300) },
  { name: "MassRadiusDiagramNode", create: () => new MassRadiusDiagramNode(rockOrGas, 250, 200) },
]);

/**
 * MassRadiusDiagramNode.ts
 *
 * Planet radius against mass on log–log axes, with guide curves: a pure-iron
 * planet and an Earth-like rocky planet (Zeng, Sasselov & Jacobsen 2016), and a
 * ball as dense as water (a constant-density guide, labelled as such). The
 * Solar System's planets are grey reference points; the screen's exoplanets are
 * coloured, and the selected one is ringed and named.
 */

import { Multilink, type TReadOnlyProperty } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import { Circle, Node, Path, Rectangle, Text } from "scenerystack/scenery";
import { archivePlanet } from "../../common/model/archive.js";
import { constantDensityRadius, rockyRadius, SOLAR_SYSTEM_PLANETS } from "../../common/model/composition.js";
import { StringManager } from "../../i18n/StringManager.js";
import TransitHunterColors from "../../TransitHunterColors.js";
import { FONTS, WATER_DENSITY_G_CM3 } from "../../TransitHunterConstants.js";
import { CompositionPlanet } from "../model/CompositionPlanet.js";
import { type RockOrGasModel, wobbleMass } from "../model/RockOrGasModel.js";

/** Axis limits, log₁₀ of Earth masses and Earth radii. */
const LOG_MASS = { min: Math.log10(0.05), max: Math.log10(1000) };
const LOG_RADIUS = { min: Math.log10(0.3), max: Math.log10(25) };
const MASS_TICKS = [0.1, 1, 10, 100, 1000];
const RADIUS_TICKS = [0.5, 1, 2, 5, 10, 20];

/** Rocky-planet curves are drawn up to this mass (the fit's range, generously). */
const ROCKY_MAX_MASS = 30;

export class MassRadiusDiagramNode extends Node {
  public constructor(model: RockOrGasModel, width: number, height: number) {
    super();
    const stringManager = StringManager.getInstance();
    const strings = stringManager.getCompositionStrings();
    const common = stringManager.getCommonStrings();

    const x = (mass: number): number => ((Math.log10(mass) - LOG_MASS.min) / (LOG_MASS.max - LOG_MASS.min)) * width;
    const y = (radius: number): number =>
      height - ((Math.log10(radius) - LOG_RADIUS.min) / (LOG_RADIUS.max - LOG_RADIUS.min)) * height;

    const background = new Rectangle(0, 0, width, height, {
      fill: TransitHunterColors.chartBackgroundColorProperty,
      stroke: TransitHunterColors.chartAxisColorProperty,
    });
    const grid = new Shape();
    const labels = new Node();
    const tickLabel = (value: number): string => (value < 1 ? String(value) : String(Math.round(value)));
    for (const mass of MASS_TICKS) {
      grid.moveTo(x(mass), 0).lineTo(x(mass), height);
      labels.addChild(
        new Text(tickLabel(mass), {
          font: FONTS.TICK_LABEL,
          fill: TransitHunterColors.textColorProperty,
          centerX: x(mass),
          top: height + 4,
        }),
      );
    }
    for (const radius of RADIUS_TICKS) {
      grid.moveTo(0, y(radius)).lineTo(width, y(radius));
      labels.addChild(
        new Text(tickLabel(radius), {
          font: FONTS.TICK_LABEL,
          fill: TransitHunterColors.textColorProperty,
          right: -5,
          centerY: y(radius),
        }),
      );
    }
    const gridPath = new Path(grid, { stroke: TransitHunterColors.chartGridColorProperty });
    const xLabel = new Text(strings.massAxisStringProperty, {
      font: FONTS.AXIS_LABEL,
      fill: TransitHunterColors.textColorProperty,
      maxWidth: width,
    });
    const yLabel = new Text(strings.radiusAxisStringProperty, {
      font: FONTS.AXIS_LABEL,
      fill: TransitHunterColors.textColorProperty,
      rotation: -Math.PI / 2,
      maxWidth: height,
    });
    const placeAxisLabels = (): void => {
      xLabel.centerX = width / 2;
      xLabel.top = height + 20;
      yLabel.centerY = height / 2;
      yLabel.right = -26;
    };
    xLabel.boundsProperty.link(placeAxisLabels);
    yLabel.boundsProperty.link(placeAxisLabels);

    // Guide curves.
    const curve = (radiusOf: (mass: number) => number, maxMass: number): Shape => {
      const shape = new Shape();
      for (let i = 0; i <= 80; i++) {
        const logMass = LOG_MASS.min + ((Math.log10(maxMass) - LOG_MASS.min) * i) / 80;
        const mass = 10 ** logMass;
        i === 0 ? shape.moveTo(x(mass), y(radiusOf(mass))) : shape.lineTo(x(mass), y(radiusOf(mass)));
      }
      return shape;
    };
    const curveLabel = (labelProperty: TReadOnlyProperty<string>, mass: number, radius: number): Text =>
      new Text(labelProperty, {
        font: FONTS.SMALL,
        fill: TransitHunterColors.mutedTextColorProperty,
        maxWidth: 110,
        left: x(mass) + 4,
        centerY: y(radius),
      });
    const ironCurve = new Path(
      curve((m) => rockyRadius(m, 1), ROCKY_MAX_MASS),
      {
        stroke: TransitHunterColors.chartZeroLineColorProperty,
        lineWidth: 1.5,
      },
    );
    const rockCurve = new Path(
      curve((m) => rockyRadius(m), ROCKY_MAX_MASS),
      {
        stroke: TransitHunterColors.earthColorProperty,
        lineWidth: 2,
      },
    );
    const waterGuide = new Path(
      curve((m) => constantDensityRadius(m, WATER_DENSITY_G_CM3), 1000),
      {
        stroke: TransitHunterColors.neptunePlanetColorProperty,
        lineWidth: 1.5,
        lineDash: [5, 4],
      },
    );
    const guides = new Node({
      children: [
        waterGuide,
        ironCurve,
        rockCurve,
        curveLabel(strings.ironCurveStringProperty, ROCKY_MAX_MASS, rockyRadius(ROCKY_MAX_MASS, 1) * 0.92),
        curveLabel(strings.rockCurveStringProperty, ROCKY_MAX_MASS, rockyRadius(ROCKY_MAX_MASS) * 1.06),
        new Text(strings.waterGuideStringProperty, {
          font: FONTS.SMALL,
          fill: TransitHunterColors.neptunePlanetColorProperty,
          maxWidth: 130,
          right: x(40),
          bottom: y(constantDensityRadius(40, WATER_DENSITY_G_CM3)) - 4,
        }),
      ],
    });

    // Solar System reference points (names for the ones easy to tell apart).
    const named: Partial<Record<string, TReadOnlyProperty<string>>> = {
      earth: common.earthStringProperty,
      neptune: common.neptuneStringProperty,
      jupiter: common.jupiterStringProperty,
      saturn: strings.saturnStringProperty,
    };
    const solarSystem = new Node();
    for (const planet of SOLAR_SYSTEM_PLANETS) {
      const center = { x: x(planet.massEarth), y: y(planet.radiusEarth) };
      solarSystem.addChild(
        new Circle(3, { fill: TransitHunterColors.mutedTextColorProperty, x: center.x, y: center.y }),
      );
      const name = named[planet.key];
      if (name) {
        const label = new Text(name, {
          font: FONTS.SMALL,
          fill: TransitHunterColors.mutedTextColorProperty,
          maxWidth: 70,
          top: center.y + 1,
        });
        // Labels near the right edge go on the left of their point.
        if (center.x + 5 + label.width > width) {
          label.right = center.x - 5;
          label.bottom = center.y - 2;
        } else {
          label.left = center.x + 5;
        }
        solarSystem.addChild(label);
      }
    }

    // Exoplanets.
    const exoplanets = new Node();
    for (const value of CompositionPlanet.enumeration.values) {
      const planet = archivePlanet(value.archiveName);
      exoplanets.addChild(
        new Circle(4, {
          fill: TransitHunterColors.lightCurveColorProperty,
          x: x(wobbleMass(planet).trueMass),
          y: y(planet.radiusEarth),
        }),
      );
    }
    const selectedRing = new Circle(9, { stroke: TransitHunterColors.cursorColorProperty, lineWidth: 2 });
    const selectedLabel = new Text("", {
      font: FONTS.LABEL,
      fill: TransitHunterColors.cursorColorProperty,
      maxWidth: 120,
    });

    const plot = new Node({
      children: [gridPath, guides, solarSystem, exoplanets, selectedRing, selectedLabel],
      clipArea: Shape.rect(0, 0, width, height),
    });
    this.children = [background, plot, labels, xLabel, yLabel];

    const multilink = Multilink.multilink([model.archiveProperty, model.massProperty], (planet, mass) => {
      selectedRing.x = x(mass.trueMass);
      selectedRing.y = y(planet.radiusEarth);
      selectedLabel.string = planet.name;
      // Label to the left of the ring (the guide labels are on the right), unless it would run off the left edge.
      if (selectedRing.x - 12 - selectedLabel.width < 0) {
        selectedLabel.left = selectedRing.x + 12;
      } else {
        selectedLabel.right = selectedRing.x - 12;
      }
      selectedLabel.bottom = selectedRing.y - 4;
    });
    this.disposeEmitter.addListener(() => multilink.dispose());
  }
}

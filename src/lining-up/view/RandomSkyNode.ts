/**
 * RandomSkyNode.ts
 *
 * One hundred planetary systems like the current one, oriented at random, each
 * drawn as its orbit seen from Earth (an ellipse, flattened by the tilt). The
 * few that transit are highlighted, and the count is compared with the
 * expected fraction (R★ + Rp) / a.
 */

import { DerivedProperty, Multilink, PatternStringProperty, StringProperty } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Circle, Node, Path, Rectangle, RichText, Text, VBox } from "scenerystack/scenery";
import { formatSignificant } from "../../common/view/chartUtils.js";
import { createPushButton } from "../../common/view/controls.js";
import { StringManager } from "../../i18n/StringManager.js";
import TransitHunterColors from "../../TransitHunterColors.js";
import { FONTS } from "../../TransitHunterConstants.js";
import { type LiningUpModel, SAMPLE_SIZE } from "../model/LiningUpModel.js";

const COLUMNS = 10;
const CELL = 20;
const ORBIT_RADIUS = 8.5;

export class RandomSkyNode extends VBox {
  /** The "new random sky" button (for the screen's pdomOrder). */
  public readonly newSkyButton: Node;

  public constructor(model: LiningUpModel, width: number) {
    const stringManager = StringManager.getInstance();
    const strings = stringManager.getLiningUpStrings();
    const a11y = stringManager.getLiningUpA11yStrings();
    const rows = Math.ceil(SAMPLE_SIZE / COLUMNS);

    const title = new Text(strings.randomSkyTitleStringProperty, {
      font: FONTS.TITLE,
      fill: TransitHunterColors.textColorProperty,
      maxWidth: width,
    });
    const background = new Rectangle(0, 0, COLUMNS * CELL, rows * CELL, 4, 4, {
      fill: TransitHunterColors.spaceColorProperty,
      stroke: TransitHunterColors.spaceBorderColorProperty,
    });
    const transiting = new Path(null, { stroke: TransitHunterColors.earthColorProperty, lineWidth: 1.6 });
    const missing = new Path(null, { stroke: TransitHunterColors.orbitPathColorProperty, lineWidth: 0.8 });
    const stars = new Node();
    for (let i = 0; i < SAMPLE_SIZE; i++) {
      stars.addChild(
        new Circle(1.6, {
          fill: TransitHunterColors.backgroundStarColorProperty,
          center: cellCenter(i),
        }),
      );
    }
    const grid = new Node({ children: [background, missing, transiting, stars] });

    const countProperty = new StringProperty("0");
    const countText = new RichText(
      new PatternStringProperty(strings.randomSkyCountPatternStringProperty, {
        count: countProperty,
        total: SAMPLE_SIZE,
        expected: new DerivedProperty([model.probabilityProperty], (p) => formatSignificant(100 * p, 2)),
      }),
      { font: FONTS.READOUT, fill: TransitHunterColors.textColorProperty, lineWrap: width },
    );
    const newSkyButton = createPushButton(strings.newSkyStringProperty, () => model.newSample(), width);
    newSkyButton.accessibleName = a11y.controls.newSkyStringProperty;

    super({ spacing: 6, align: "left", children: [title, grid, countText, newSkyButton] });
    this.newSkyButton = newSkyButton;

    const update = (): void => {
      const yes = new Shape();
      const no = new Shape();
      model.sample.forEach((system, i) => {
        const center = cellCenter(i);
        const shape = model.sampleTransits(system) ? yes : no;
        shape.ellipse(
          center.x,
          center.y,
          ORBIT_RADIUS,
          Math.max(0.4, ORBIT_RADIUS * system.cosInclination),
          system.skyAngle,
        );
        shape.newSubpath();
      });
      transiting.shape = yes;
      missing.shape = no;
      countProperty.value = String(model.transitingCount());
    };
    const multilink = Multilink.multilink([model.geometryProperty], update);
    model.sampleChangedEmitter.addListener(update);
    this.disposeEmitter.addListener(() => {
      multilink.dispose();
      model.sampleChangedEmitter.removeListener(update);
    });
  }
}

function cellCenter(index: number): Vector2 {
  return new Vector2((index % COLUMNS) * CELL + CELL / 2, Math.floor(index / COLUMNS) * CELL + CELL / 2);
}

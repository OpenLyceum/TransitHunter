/**
 * PeriodSearchNode.ts
 *
 * The Planet Hunt period search (box least squares), shown in place of the
 * light curve when "Search for periods" is checked: for every trial period
 * (log axis), the signal-to-noise of the deepest dip found when the light curve
 * is folded on it. The search runs in chunks; the curve fills in as it goes.
 *
 * Peaks also appear at half and twice a planet's period (folding on 2P still
 * stacks every other transit). The trial period is marked, and the archive's
 * planets once revealed. Clicking near a peak folds on it; the button folds on
 * the strongest dip.
 */

import { Multilink, PatternStringProperty } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import { Line, Node, Path, Rectangle, type SceneryEvent, Text } from "scenerystack/scenery";
import { TextPushButton } from "scenerystack/sun";
import { FLAT_PANEL_PUSH_BUTTON_OPTIONS, LIGHT_SURFACE_TEXT_FILL } from "../../common/TransitHunterButtonOptions.js";
import { formatTickValue, niceStep } from "../../common/view/chartUtils.js";
import { StringManager } from "../../i18n/StringManager.js";
import TransitHunterColors from "../../TransitHunterColors.js";
import { FONTS } from "../../TransitHunterConstants.js";
import type { PlanetHuntModel } from "../model/PlanetHuntModel.js";

/** Candidate labelled periods on the log axis, days (those inside the searched range are drawn). */
const PERIOD_TICKS = [0.3, 0.5, 1, 2, 3, 5, 10, 20, 30, 50, 100, 200, 300, 500];

/** A click folds on the strongest dip within this many pixels of it. */
const CLICK_PICK_PIXELS = 8;

const BUTTON_HEIGHT = 26;

/** Colours of the archive planets' period marks (as the light curve's reveal ticks). */
const REVEAL_COLORS = [
  TransitHunterColors.answerCurveColorProperty,
  TransitHunterColors.fitCurveColorProperty,
  TransitHunterColors.neptunePlanetColorProperty,
  TransitHunterColors.jupiterPlanetColorProperty,
  TransitHunterColors.accentColorProperty,
  TransitHunterColors.earthPlanetColorProperty,
] as const;

export class PeriodSearchNode extends Node {
  /** The button below the plot, for the screen's pdomOrder. */
  public readonly usePeakButton: TextPushButton;

  public constructor(model: PlanetHuntModel, width: number, height: number) {
    super();
    const strings = StringManager.getInstance().getHuntStrings();
    const a11y = StringManager.getInstance().getHuntA11yStrings();

    // The axis follows the searched range (it depends on the light curve's length and cadence).
    let logMin = Math.log10(0.3);
    let logMax = Math.log10(500);
    const periodToX = (period: number): number => ((Math.log10(period) - logMin) / (logMax - logMin)) * width;
    const xToPeriod = (x: number): number => 10 ** (logMin + (x / width) * (logMax - logMin));
    let powerMax = 10;
    const powerToY = (power: number): number => height * (1 - Math.min(1, power / powerMax));

    const background = new Rectangle(0, 0, width, height, {
      fill: TransitHunterColors.chartBackgroundColorProperty,
      stroke: TransitHunterColors.chartAxisColorProperty,
      cursor: "pointer",
    });
    const grid = new Path(null, { stroke: TransitHunterColors.chartGridColorProperty, pickable: false });
    const ticks = new Path(null, { stroke: TransitHunterColors.chartAxisColorProperty, pickable: false });
    const tickLabels = new Node({ pickable: false });
    const curve = new Path(null, {
      stroke: TransitHunterColors.lightCurveColorProperty,
      lineWidth: 1.5,
      pickable: false,
    });
    const trialLine = new Line(0, 0, 0, height, {
      stroke: TransitHunterColors.fitCurveColorProperty,
      lineWidth: 2,
      pickable: false,
    });
    const revealLayer = new Node({ pickable: false });
    const plotLayer = new Node({
      clipArea: Shape.rect(0, 0, width, height),
      children: [curve, revealLayer, trialLine],
      pickable: false,
    });

    const xAxisLabel = new Text(strings.searchPeriodAxisStringProperty, {
      font: FONTS.AXIS_LABEL,
      fill: TransitHunterColors.textColorProperty,
      maxWidth: width,
    });
    xAxisLabel.boundsProperty.link(() => {
      xAxisLabel.centerX = width / 2;
      xAxisLabel.top = height + 20;
    });
    const yAxisLabel = new Text(strings.searchPowerAxisStringProperty, {
      font: FONTS.AXIS_LABEL,
      fill: TransitHunterColors.textColorProperty,
      rotation: -Math.PI / 2,
      maxWidth: height,
    });
    yAxisLabel.boundsProperty.link(() => {
      yAxisLabel.centerY = height / 2;
      yAxisLabel.right = -36;
    });

    const progressText = new Text(
      new PatternStringProperty(
        strings.searchingPatternStringProperty,
        {
          percent: model.searchProgressProperty,
        },
        { maps: { percent: (progress: number) => Math.floor(100 * progress) } },
      ),
      { font: FONTS.LABEL, fill: TransitHunterColors.mutedTextColorProperty, maxWidth: width - 20, pickable: false },
    );
    progressText.boundsProperty.link(() => {
      progressText.right = width - 8;
      progressText.top = 6;
    });

    background.addInputListener({
      down: (event: SceneryEvent) => {
        const x = background.globalToLocalPoint(event.pointer.point).x;
        model.useSearchPeak(
          xToPeriod(Math.max(0, x - CLICK_PICK_PIXELS)),
          xToPeriod(Math.min(width, x + CLICK_PICK_PIXELS)),
        );
      },
    });
    this.usePeakButton = new TextPushButton(strings.usePeakStringProperty, {
      ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
      font: FONTS.LABEL,
      textFill: LIGHT_SURFACE_TEXT_FILL,
      maxTextWidth: 220,
      minHeight: BUTTON_HEIGHT,
      listener: () => model.useSearchPeak(),
      accessibleName: a11y.controls.usePeakStringProperty,
    });
    const hint = new Text(strings.searchHintStringProperty, {
      font: FONTS.SMALL,
      fill: TransitHunterColors.mutedTextColorProperty,
      maxWidth: width - 240,
    });
    const placeControls = (): void => {
      const total = this.usePeakButton.width + 12 + hint.width;
      this.usePeakButton.left = width / 2 - total / 2;
      this.usePeakButton.top = height + 44;
      hint.left = this.usePeakButton.right + 12;
      hint.centerY = this.usePeakButton.centerY;
    };
    this.usePeakButton.boundsProperty.lazyLink(placeControls);
    hint.boundsProperty.lazyLink(placeControls);
    placeControls();

    /** Redraws the axes for the searched range and power scale. */
    const drawAxes = (): void => {
      const gridShape = new Shape();
      const tickShape = new Shape();
      const labels: Node[] = [];
      for (const period of PERIOD_TICKS) {
        if (period < 10 ** logMin * 0.999 || period > 10 ** logMax * 1.001) {
          continue;
        }
        const x = periodToX(period);
        gridShape.moveTo(x, 0).lineTo(x, height);
        tickShape.moveTo(x, height).lineTo(x, height + 5);
        labels.push(
          new Text(formatTickValue(period, period < 1 ? 1 : 0), {
            font: FONTS.TICK_LABEL,
            fill: TransitHunterColors.textColorProperty,
            centerX: x,
            top: height + 6,
          }),
        );
      }
      const step = niceStep(powerMax, 4);
      for (let power = 0; power <= powerMax + 1e-9; power += step) {
        const y = powerToY(power);
        gridShape.moveTo(0, y).lineTo(width, y);
        tickShape.moveTo(-5, y).lineTo(0, y);
        labels.push(
          new Text(formatTickValue(power, 0), {
            font: FONTS.TICK_LABEL,
            fill: TransitHunterColors.textColorProperty,
            right: -7,
            centerY: y,
          }),
        );
      }
      grid.shape = gridShape;
      ticks.shape = tickShape;
      for (const child of tickLabels.children) {
        child.dispose();
      }
      tickLabels.children = labels;
    };

    /** Redraws the curve: the highest power in each pixel column, so no narrow peak is lost. */
    const updateCurve = (): void => {
      const search = model.search;
      progressText.visible = !!search && !search.done;
      this.usePeakButton.enabled = !!search && search.peakIndex() >= 0;
      if (!search) {
        curve.shape = null;
        return;
      }
      const periods = search.periods;
      const newLogMin = Math.log10(periods[0] ?? 0.3);
      const newLogMax = Math.log10(Math.max(periods[periods.length - 1] ?? 500, (periods[0] ?? 0.3) * 1.01));
      let maximum = 0;
      for (const p of search.power) {
        maximum = Math.max(maximum, p);
      }
      // Rescale only when the peak outgrows the axis, so the axis does not jump every frame.
      const newPowerMax = maximum > powerMax || maximum < powerMax / 3 ? Math.max(10, maximum * 1.25) : powerMax;
      if (newLogMin !== logMin || newLogMax !== logMax || newPowerMax !== powerMax) {
        logMin = newLogMin;
        logMax = newLogMax;
        powerMax = newPowerMax;
        drawAxes();
      }
      const columns = new Float64Array(Math.ceil(width) + 1).fill(-1);
      const count = Math.round(search.progress * periods.length);
      for (let k = 0; k < count; k++) {
        const column = Math.round(periodToX(periods[k] ?? 1));
        if (column >= 0 && column < columns.length) {
          columns[column] = Math.max(columns[column] ?? -1, search.power[k] ?? 0);
        }
      }
      const shape = new Shape();
      let started = false;
      columns.forEach((value, column) => {
        if (value < 0) {
          return;
        }
        if (started) {
          shape.lineTo(column, powerToY(value));
        } else {
          shape.moveTo(column, powerToY(value));
          started = true;
        }
      });
      curve.shape = shape;
    };

    const placeMarkers = (): void => {
      const trialX = periodToX(model.periodProperty.value);
      trialLine.setLine(trialX, 0, trialX, height);
      for (const child of revealLayer.children) {
        child.dispose();
      }
      revealLayer.children = model.revealProperty.value
        ? model.planetsProperty.value.map((planet, index) => {
            const x = periodToX(planet.periodDays);
            return new Line(x, 0, x, height, {
              stroke: REVEAL_COLORS[index % REVEAL_COLORS.length] ?? null,
              lineWidth: 2,
              lineDash: [6, 4],
            });
          })
        : [];
    };

    const refresh = (): void => {
      if (this.visible) {
        updateCurve();
        placeMarkers();
      }
    };
    model.searchChangedEmitter.addListener(refresh);
    const multilink = Multilink.multilinkAny(
      [model.periodProperty, model.revealProperty, model.planetsProperty, model.showSearchProperty],
      refresh,
    );
    this.visibleProperty.lazyLink(refresh);
    drawAxes();

    this.children = [
      background,
      grid,
      plotLayer,
      ticks,
      tickLabels,
      xAxisLabel,
      yAxisLabel,
      progressText,
      this.usePeakButton,
      hint,
    ];

    this.disposeEmitter.addListener(() => {
      multilink.dispose();
      model.searchChangedEmitter.removeListener(refresh);
    });
  }
}

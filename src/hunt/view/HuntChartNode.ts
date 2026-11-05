/**
 * HuntChartNode.ts
 *
 * The Planet Hunt chart: a real light curve against time, or folded on the trial
 * period (hours from the predicted transit), with the averages of the folded
 * points in bins so a dip far smaller than the scatter shows up.
 *
 * Time axis: zoom and scroll by dragging sideways, turning the mouse wheel over
 * the plot, or with the buttons below it (adapted from StellarWobble's
 * Observatory chart). A click (a press that does not move) marks a dip; so does
 * the "Mark the middle" button, for keyboard users, at the dashed centre line.
 *
 * Folded, a draggable horizontal line sets the depth of the dip. With the
 * answer revealed, the unfolded chart shows where the archive predicts each
 * known planet's transits.
 */

import { DerivedProperty, Multilink, Property } from "scenerystack/axon";
import { LinePlot } from "scenerystack/bamboo";
import { Range, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import {
  DragListener,
  HBox,
  KeyboardListener,
  Line,
  Node,
  Path,
  Rectangle,
  type SceneryEvent,
  Text,
  VBox,
} from "scenerystack/scenery";
import { ZoomButton } from "scenerystack/scenery-phet";
import { ArrowButton, TextPushButton } from "scenerystack/sun";
import { binPoints } from "../../common/model/lightCurveTools.js";
import { FLAT_PANEL_PUSH_BUTTON_OPTIONS, LIGHT_SURFACE_TEXT_FILL } from "../../common/TransitHunterButtonOptions.js";
import { ChartFrameNode } from "../../common/view/ChartFrameNode.js";
import { linkUntilDisposed } from "../../common/view/linkUntilDisposed.js";
import { StringManager } from "../../i18n/StringManager.js";
import TransitHunterColors from "../../TransitHunterColors.js";
import { FONTS } from "../../TransitHunterConstants.js";
import { HUNT_DEPTH_RANGE, type PlanetHuntModel } from "../model/PlanetHuntModel.js";
import { PointCloudNode } from "./PointCloudNode.js";
import { panTimeWindow, zoomTimeWindow } from "./timeWindow.js";

/** Narrowest window, in days (unfolded) or hours (folded). */
const MIN_SPAN_DAYS = 0.3;
const MIN_SPAN_HOURS = 3;

/** Folded charts open on ±this many hours (or the whole period if shorter). */
const FOLDED_HALF_WINDOW_HOURS = 30;

const BUTTON_ZOOM_FACTOR = 0.5;
const BUTTON_SCROLL_FRACTION = 0.25;
const WHEEL_ZOOM_PER_PIXEL = 0.002;
const PIXELS_PER_WHEEL_LINE = 16;
const BUTTON_SIZE = 26;

/** A press that moves less than this (px) is a click, which marks a dip. */
const CLICK_TOLERANCE = 4;

/** Bins of the folded averages across the shown window. */
const FOLDED_BINS = 90;

/**
 * Points left outside the brightness axis at each end (stray outliers). A fixed
 * count, not a fraction: a long light curve has few points inside its transits.
 */
const Y_CLIP_POINTS = 2;

/** Distinct tick colours for the planets of one star. */
const REVEAL_COLORS = [
  TransitHunterColors.answerCurveColorProperty,
  TransitHunterColors.fitCurveColorProperty,
  TransitHunterColors.neptunePlanetColorProperty,
  TransitHunterColors.jupiterPlanetColorProperty,
  TransitHunterColors.accentColorProperty,
  TransitHunterColors.earthPlanetColorProperty,
] as const;

export class HuntChartNode extends Node {
  /** Zoom, scroll, show-all and mark buttons, in focus order. */
  public readonly buttons: Node[];

  /** The draggable depth line (focusable), for the pdomOrder. */
  public readonly depthLine: Node;

  /** Window of the time axis in days (unfolded) or hours (folded); null shows everything. */
  private readonly windowProperty = new Property<Range | null>(null);

  public constructor(model: PlanetHuntModel, width: number, height: number) {
    super();
    const stringManager = StringManager.getInstance();
    const strings = stringManager.getHuntStrings();
    const common = stringManager.getCommonStrings();
    const a11y = stringManager.getHuntA11yStrings();

    const xAxisLabelProperty = new DerivedProperty(
      [model.foldProperty, common.daysAxisStringProperty, strings.foldedAxisStringProperty],
      (fold, days, folded) => (fold ? folded : days),
    );
    const frame = new ChartFrameNode({
      viewWidth: width,
      viewHeight: height,
      xRange: new Range(0, 1),
      yRange: new Range(99, 100.2),
      xAxisLabelProperty: xAxisLabelProperty,
      yAxisLabelProperty: common.brightnessAxisStringProperty,
      targetDivisions: 6,
    });
    const transform = frame.chartTransform;

    const points = new PointCloudNode(transform, TransitHunterColors.measurementColorProperty, 2);
    const averages = new LinePlot(transform, [], {
      stroke: TransitHunterColors.lightCurveColorProperty,
      lineWidth: 2.5,
    });
    const marksPath = new Path(null, { stroke: TransitHunterColors.fitCurveColorProperty, lineWidth: 1.5 });
    const centreLine = new Line(width / 2, 0, width / 2, height, {
      stroke: TransitHunterColors.chordColorProperty,
      lineDash: [3, 4],
    });
    const revealLayer = new Node();
    frame.plotLayer.children = [centreLine, points, averages, marksPath, revealLayer];

    // ── Depth line (folded) ───────────────────────────────────────────────────
    const depthLineVisual = new Line(0, 0, width, 0, {
      stroke: TransitHunterColors.answerCurveColorProperty,
      lineWidth: 2,
      lineDash: [8, 4],
    });
    const depthHandle = new Rectangle(0, -7, width, 14, { fill: "rgba(0,0,0,0)", cursor: "ns-resize" });
    const depthLabel = new Text(strings.depthLineStringProperty, {
      font: FONTS.SMALL,
      fill: TransitHunterColors.answerCurveColorProperty,
      maxWidth: 150,
      right: width - 4,
      bottom: -3,
    });
    const depthLine = new Node({ children: [depthLineVisual, depthHandle, depthLabel] });
    this.depthLine = depthLine;
    const setDepthFromY = (viewY: number): void => {
      model.depthProperty.value = HUNT_DEPTH_RANGE.constrainValue(100 - transform.viewToModelY(viewY));
    };
    depthHandle.addInputListener(
      new DragListener({
        drag: (event) => setDepthFromY(frame.globalToLocalPoint(event.pointer.point).y),
      }),
    );
    depthLine.tagName = "div";
    depthLine.focusable = true;
    depthLine.accessibleName = a11y.controls.depthLineStringProperty;
    depthLine.addInputListener(
      new KeyboardListener({
        keys: ["arrowUp", "arrowDown"],
        fireOnHold: true,
        fire: (_event, keysPressed) => {
          setDepthFromY(depthLine.y + (keysPressed === "arrowUp" ? -2 : 2));
        },
      }),
    );
    frame.overlayLayer.addChild(depthLine);

    const loading = new Text(strings.loadingStringProperty, {
      font: FONTS.LABEL,
      fill: TransitHunterColors.mutedTextColorProperty,
      center: new Vector2(width / 2, height / 2),
    });
    frame.overlayLayer.addChild(loading);

    // ── Data ranges ───────────────────────────────────────────────────────────
    let foldedTimes = new Float64Array(0);
    let percent = new Float64Array(0);
    let yRange = new Range(99, 100.2);

    const fullRange = (): Range => {
      const curve = model.lightCurveProperty.value;
      if (model.foldProperty.value) {
        const halfPeriodHours = model.periodProperty.value * 12;
        return new Range(-halfPeriodHours, halfPeriodHours);
      }
      return new Range(0, curve ? curve.spanDays : 1);
    };
    const shownRange = (): Range => this.windowProperty.value ?? fullRange();

    const updateYRange = (): void => {
      const curve = model.lightCurveProperty.value;
      if (!curve) {
        return;
      }
      percent = curve.brightness.map((b) => 100 * b);
      const sorted = Float64Array.from(percent).sort();
      const low = sorted[Math.min(Y_CLIP_POINTS, sorted.length - 1)] ?? 99;
      const high = sorted[Math.max(0, sorted.length - 1 - Y_CLIP_POINTS)] ?? 100;
      const margin = 0.08 * (high - low);
      yRange = new Range(low - margin, high + margin);
    };

    const update = (): void => {
      const curve = model.lightCurveProperty.value;
      loading.visible = !curve;
      points.visible = !!curve;
      const fold = model.foldProperty.value;
      const xRange = shownRange();
      frame.setRanges(xRange, yRange);
      if (!curve) {
        averages.setDataSet([]);
        marksPath.shape = null;
        revealLayer.children = [];
        return;
      }

      // Points and folded averages.
      if (fold) {
        const periodHours = model.periodProperty.value * 24;
        foldedTimes = curve.times.map((t) => model.phaseOf(t) * periodHours);
        points.setPoints(foldedTimes, percent);
        const bins = binPoints(Array.from(foldedTimes), Array.from(percent), xRange.min, xRange.max, FOLDED_BINS);
        averages.setDataSet(bins.map((bin) => new Vector2(bin.x, bin.mean)));
      } else {
        points.setPoints(curve.times, percent);
        averages.setDataSet([]);
      }
      averages.visible = fold;
      centreLine.visible = !fold;

      // Dip marks.
      const marks = new Shape();
      if (!fold) {
        for (const time of model.marks) {
          const x = transform.modelToViewX(time);
          marks.moveTo(x, 0).lineTo(x, height);
          marks
            .moveTo(x - 5, 0)
            .lineTo(x, 7)
            .lineTo(x + 5, 0);
        }
      }
      marksPath.shape = marks;

      // Depth line.
      depthLine.visible = fold;
      // Kept on the chart: a depth below the axis pins the line to the bottom edge.
      depthLine.y = Math.min(height, Math.max(0, transform.modelToViewY(100 - model.depthProperty.value)));

      // Revealed transit times.
      const revealed: Node[] = [];
      if (model.revealProperty.value && !fold) {
        model.planetsProperty.value.forEach((planet, index) => {
          const shape = new Shape();
          const reference = planet.transitMidBjd - curve.zeroBjd;
          const first = Math.ceil((xRange.min - reference) / planet.periodDays);
          const last = Math.floor((xRange.max - reference) / planet.periodDays);
          const tickHeight = 10 + 4 * index;
          if (last - first < 2000) {
            for (let n = first; n <= last; n++) {
              const x = transform.modelToViewX(reference + n * planet.periodDays);
              shape.moveTo(x, height).lineTo(x, height - tickHeight);
            }
          }
          revealed.push(new Path(shape, { stroke: REVEAL_COLORS[index % REVEAL_COLORS.length] ?? null, lineWidth: 2 }));
        });
      }
      revealLayer.children = revealed;
    };

    const multilink = Multilink.multilinkAny(
      [
        model.lightCurveProperty,
        model.foldProperty,
        model.periodProperty,
        model.shiftProperty,
        model.depthProperty,
        model.revealProperty,
        this.windowProperty,
      ],
      update,
    );
    const onCurve = (): void => {
      this.windowProperty.value = null;
      updateYRange();
      update();
    };
    model.lightCurveProperty.link(onCurve);
    const onFold = (fold: boolean): void => {
      if (fold) {
        const halfPeriodHours = model.periodProperty.value * 12;
        this.windowProperty.value =
          halfPeriodHours > FOLDED_HALF_WINDOW_HOURS
            ? new Range(-FOLDED_HALF_WINDOW_HOURS, FOLDED_HALF_WINDOW_HOURS)
            : null;
      } else {
        this.windowProperty.value = null;
      }
    };
    model.foldProperty.lazyLink(onFold);
    // A new period changes the folded range; keep the window inside it.
    const onPeriod = (): void => {
      const window = this.windowProperty.value;
      if (model.foldProperty.value && window) {
        const full = fullRange();
        this.windowProperty.value = window.getLength() >= full.getLength() ? null : panTimeWindow(window, 0, full);
      }
    };
    model.periodProperty.lazyLink(onPeriod);
    model.marks.addItemAddedListener(update);
    model.marks.addItemRemovedListener(update);

    // ── Zoom, scroll and mark ─────────────────────────────────────────────────
    const minSpan = (): number => (model.foldProperty.value ? MIN_SPAN_HOURS : MIN_SPAN_DAYS);
    const zoom = (factor: number, anchor = shownRange().getCenter()): void => {
      this.windowProperty.value = zoomTimeWindow(shownRange(), factor, anchor, fullRange(), minSpan());
    };
    const scroll = (delta: number): void => {
      const window = this.windowProperty.value;
      if (window) {
        this.windowProperty.value = panTimeWindow(window, delta, fullRange());
      }
    };
    const markAt = (time: number): void => {
      if (!model.foldProperty.value && model.lightCurveProperty.value) {
        model.addMark(time);
      }
    };

    const dragArea = new Rectangle(0, 0, width, height, { fill: "rgba(0,0,0,0)", cursor: "ew-resize" });
    let lastDragX = 0;
    let pressX = 0;
    dragArea.addInputListener(
      new DragListener({
        start: (event) => {
          lastDragX = dragArea.globalToLocalPoint(event.pointer.point).x;
          pressX = lastDragX;
        },
        drag: (event) => {
          const x = dragArea.globalToLocalPoint(event.pointer.point).x;
          scroll(((lastDragX - x) / width) * shownRange().getLength());
          lastDragX = x;
        },
        end: () => {
          if (Math.abs(lastDragX - pressX) < CLICK_TOLERANCE) {
            markAt(transform.viewToModelX(pressX));
          }
        },
      }),
    );
    dragArea.addInputListener({
      wheel: (event: SceneryEvent<WheelEvent>) => {
        const domEvent = event.domEvent;
        if (!domEvent) {
          return;
        }
        domEvent.preventDefault();
        event.handle();
        const scale = domEvent.deltaMode === WheelEvent.DOM_DELTA_LINE ? PIXELS_PER_WHEEL_LINE : 1;
        const sideways = domEvent.shiftKey ? domEvent.deltaY : domEvent.deltaX;
        if (Math.abs(sideways) > Math.abs(domEvent.deltaY) || domEvent.shiftKey) {
          scroll(((sideways * scale) / width) * shownRange().getLength());
        } else {
          const x = dragArea.globalToLocalPoint(event.pointer.point).x;
          zoom(Math.exp(domEvent.deltaY * scale * WHEEL_ZOOM_PER_PIXEL), transform.viewToModelX(x));
        }
      },
    });
    // The drag area sits under the depth line so the line stays draggable.
    frame.overlayLayer.insertChild(0, dragArea);

    const buttonOptions = { ...FLAT_PANEL_PUSH_BUTTON_OPTIONS, minHeight: BUTTON_SIZE, minWidth: BUTTON_SIZE };
    const textButton = (label: typeof strings.showAllStringProperty, listener: () => void): TextPushButton =>
      new TextPushButton(label, {
        ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
        font: FONTS.LABEL,
        textFill: LIGHT_SURFACE_TEXT_FILL,
        maxTextWidth: 150,
        minHeight: BUTTON_SIZE,
        listener: listener,
      });
    const scrollEarlierButton = new ArrowButton(
      "left",
      () => scroll(-BUTTON_SCROLL_FRACTION * shownRange().getLength()),
      {
        ...buttonOptions,
        arrowHeight: 12,
        arrowWidth: 12,
        accessibleName: a11y.controls.scrollEarlierStringProperty,
      },
    );
    const scrollLaterButton = new ArrowButton(
      "right",
      () => scroll(BUTTON_SCROLL_FRACTION * shownRange().getLength()),
      {
        ...buttonOptions,
        arrowHeight: 12,
        arrowWidth: 12,
        accessibleName: a11y.controls.scrollLaterStringProperty,
      },
    );
    const zoomOutButton = new ZoomButton({
      ...buttonOptions,
      in: false,
      magnifyingGlassOptions: { glassRadius: 7 },
      listener: () => zoom(1 / BUTTON_ZOOM_FACTOR),
      accessibleName: a11y.controls.zoomOutStringProperty,
    });
    const zoomInButton = new ZoomButton({
      ...buttonOptions,
      in: true,
      magnifyingGlassOptions: { glassRadius: 7 },
      listener: () => zoom(BUTTON_ZOOM_FACTOR),
      accessibleName: a11y.controls.zoomInStringProperty,
    });
    const showAllButton = textButton(strings.showAllStringProperty, () => {
      this.windowProperty.value = null;
    });
    showAllButton.accessibleName = a11y.controls.showAllStringProperty;
    const markMiddleButton = textButton(strings.markMiddleStringProperty, () => markAt(shownRange().getCenter()));
    markMiddleButton.accessibleName = a11y.controls.markMiddleStringProperty;

    const hintProperty = new DerivedProperty(
      [model.foldProperty, strings.chartHintStringProperty, strings.foldedHintStringProperty],
      (fold, unfolded, folded) => (fold ? folded : unfolded),
    );
    const hint = new Text(hintProperty, {
      font: FONTS.SMALL,
      fill: TransitHunterColors.mutedTextColorProperty,
      maxWidth: width,
    });
    const controls = new VBox({
      spacing: 4,
      children: [
        new HBox({
          spacing: 6,
          children: [
            scrollEarlierButton,
            zoomOutButton,
            zoomInButton,
            scrollLaterButton,
            showAllButton,
            markMiddleButton,
          ],
        }),
        hint,
      ],
    });
    linkUntilDisposed(this, controls.boundsProperty, () => {
      controls.centerX = width / 2;
      controls.top = height + 44;
    });
    this.buttons = [
      scrollEarlierButton,
      zoomOutButton,
      zoomInButton,
      scrollLaterButton,
      showAllButton,
      markMiddleButton,
    ];

    const enabledLink = Multilink.multilink(
      [model.foldProperty, this.windowProperty, model.lightCurveProperty, model.periodProperty],
      (fold, window) => {
        const full = fullRange();
        const shown = window ?? full;
        zoomInButton.enabled = shown.getLength() > minSpan() * 1.001;
        zoomOutButton.enabled = window !== null;
        showAllButton.enabled = window !== null;
        scrollEarlierButton.enabled = window !== null && window.min > full.min;
        scrollLaterButton.enabled = window !== null && window.max < full.max;
        markMiddleButton.enabled = !fold;
      },
    );

    this.children = [frame, controls];

    this.disposeEmitter.addListener(() => {
      multilink.dispose();
      enabledLink.dispose();
      model.lightCurveProperty.unlink(onCurve);
      model.foldProperty.unlink(onFold);
      model.periodProperty.unlink(onPeriod);
      model.marks.removeItemAddedListener(update);
      model.marks.removeItemRemovedListener(update);
      // The frame and the buttons hold global string and colour links, and their listeners reach
      // this node (zoom, scroll); dispose them so nothing global keeps this node alive.
      frame.disposeSubtree();
      controls.disposeSubtree();
      hintProperty.dispose();
      xAxisLabelProperty.dispose();
    });
  }

  /** Shows the whole run again. */
  public reset(): void {
    this.windowProperty.reset();
  }
}

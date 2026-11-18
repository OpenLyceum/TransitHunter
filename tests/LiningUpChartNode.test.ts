/**
 * Checks for LiningUpChartNode: the hours axis, curves and live dot follow the
 * current orbital period when the orbital distance changes (the period updates
 * after the geometry, so a listener that read it directly lagged one step).
 */

import { describe, expect, it } from "vitest";
import { ChartFrameNode } from "../src/common/view/ChartFrameNode.js";
import { LiningUpModel } from "../src/lining-up/model/LiningUpModel.js";
import { LiningUpChartNode } from "../src/lining-up/view/LiningUpChartNode.js";

function frameOf(chart: LiningUpChartNode): ChartFrameNode {
  const frame = chart.children.find((child) => child instanceof ChartFrameNode);
  if (!frame) {
    throw new Error("chart frame not found");
  }
  return frame;
}

describe("LiningUpChartNode", () => {
  it("uses the current period for the hours axis after the distance changes", () => {
    const model = new LiningUpModel();
    const chart = new LiningUpChartNode(model, 200, 150);
    const frame = frameOf(chart);
    for (const distance of [0.2, 0.03, 0.1]) {
      model.distanceProperty.value = distance;
      const hours = model.windowHalfWidthProperty.value * model.periodProperty.value * 24;
      expect(frame.chartTransform.modelXRange.max).toBeCloseTo(hours, 6);
      expect(frame.chartTransform.modelXRange.min).toBeCloseTo(-hours, 6);
    }
    chart.dispose();
  });

  it("places the live dot on the current hours axis after the distance changes", () => {
    const model = new LiningUpModel();
    model.cycleTimeProperty.value = 0.1;
    const chart = new LiningUpChartNode(model, 200, 150);
    const frame = frameOf(chart);
    const dot = frame.overlayLayer.children[0];
    model.distanceProperty.value = 0.2;
    const hours = model.windowHalfWidthProperty.value * model.periodProperty.value * 24;
    const expected = frame.chartTransform.modelToViewXY(
      2 * model.windowTimeProperty.value * hours,
      100 * model.brightnessProperty.value,
    );
    expect(dot?.center.x).toBeCloseTo(expected.x, 6);
    expect(dot?.center.y).toBeCloseTo(expected.y, 6);
    chart.dispose();
  });
});

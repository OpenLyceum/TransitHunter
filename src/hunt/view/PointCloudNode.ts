/**
 * PointCloudNode.ts
 *
 * Thousands of light-curve points painted straight onto a canvas (a bamboo
 * ScatterPlot builds one shape for all of them, which is too slow for a year of
 * Kepler data being scrolled). Points outside the chart's model ranges are
 * skipped.
 */

import type { ChartTransform } from "scenerystack/bamboo";
import { Bounds2 } from "scenerystack/dot";
import { CanvasNode, type ProfileColorProperty } from "scenerystack/scenery";

export class PointCloudNode extends CanvasNode {
  private readonly chartTransform: ChartTransform;
  private readonly colorProperty: ProfileColorProperty;
  private readonly size: number;
  private xs: ArrayLike<number> = [];
  private ys: ArrayLike<number> = [];

  /**
   * @param transform - the chart's model–view transform
   * @param colorProperty - point colour
   * @param size - point size, px
   */
  public constructor(transform: ChartTransform, colorProperty: ProfileColorProperty, size: number) {
    super({ canvasBounds: new Bounds2(0, 0, transform.viewWidth, transform.viewHeight) });
    this.chartTransform = transform;
    this.colorProperty = colorProperty;
    this.size = size;
    const repaint = (): void => this.invalidatePaint();
    colorProperty.lazyLink(repaint);
    transform.changedEmitter.addListener(repaint);
    this.disposeEmitter.addListener(() => {
      colorProperty.unlink(repaint);
      transform.changedEmitter.removeListener(repaint);
    });
  }

  /** Sets the points (model coordinates; ys in the chart's y units). */
  public setPoints(xs: ArrayLike<number>, ys: ArrayLike<number>): void {
    this.xs = xs;
    this.ys = ys;
    this.invalidatePaint();
  }

  public override paintCanvas(context: CanvasRenderingContext2D): void {
    const transform = this.chartTransform;
    const xRange = transform.modelXRange;
    const yRange = transform.modelYRange;
    const half = this.size / 2;
    context.fillStyle = this.colorProperty.value.toCSS();
    for (let i = 0; i < this.xs.length; i++) {
      const x = this.xs[i] ?? Number.NaN;
      const y = this.ys[i] ?? Number.NaN;
      if (x >= xRange.min && x <= xRange.max && y >= yRange.min && y <= yRange.max) {
        context.fillRect(transform.modelToViewX(x) - half, transform.modelToViewY(y) - half, this.size, this.size);
      }
    }
  }
}

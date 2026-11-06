/**
 * Pure-iron planet radii from Li Zeng's numerical interior models, in Earth units.
 * Source: https://lweb.cfa.harvard.edu/~lzeng/tables/massradiusFe.txt
 * Log-log interpolation within the published table; no extrapolation.
 */
import data from "./data/pureIron.json";

const TABLE = data.massRadius as [number, number][];

export function ironRadius(massEarth: number): number {
  const first = TABLE[0];
  const last = TABLE[TABLE.length - 1];
  if (!(first && last && Number.isFinite(massEarth)) || massEarth < first[0] || massEarth > last[0]) {
    return Number.NaN;
  }
  let low = 0;
  let high = TABLE.length - 1;
  while (high - low > 1) {
    const mid = (low + high) >> 1;
    if ((TABLE[mid]?.[0] ?? Infinity) <= massEarth) {
      low = mid;
    } else {
      high = mid;
    }
  }
  const a = TABLE[low] as [number, number];
  const b = TABLE[high] as [number, number];
  const fraction = Math.log(massEarth / a[0]) / Math.log(b[0] / a[0]);
  return a[1] * (b[1] / a[1]) ** fraction;
}

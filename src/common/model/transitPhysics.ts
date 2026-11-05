/**
 * transitPhysics.ts
 *
 * The light of a star partly covered by a planet. Pure functions, no
 * SceneryStack types, so everything is easy to unit-test.
 *
 * Lengths are in units of the star's radius:
 *   k = Rp / R★      planet-to-star radius ratio
 *   z                centre-to-centre distance on the sky
 *   a/R★             orbit size in star radii
 *   b = (a/R★) cos i impact parameter (0 = through the middle, 1 = the edge)
 *
 * Geometry on the sky. The orbit is circular, transit is at phase 0, and the
 * planet's sky position at orbital angle θ = 2π·phase is
 *   x = (a/R★) sin θ,  y = (a/R★) cos i cos θ,
 * with the planet in front of the star when cos θ > 0.
 *
 * Limb darkening uses the quadratic law I(μ)/I(1) = 1 − u₁(1 − μ) − u₂(1 − μ)²,
 * μ = √(1 − r²), integrated numerically over thin rings of the stellar disk.
 */

import { LIMB_DARKENING_RINGS, LIMB_DARKENING_U1, LIMB_DARKENING_U2 } from "../../TransitHunterConstants.js";

/** Limb-darkening coefficients (both 0 = a uniformly bright disk). */
export type LimbDarkening = {
  readonly u1: number;
  readonly u2: number;
};

export const UNIFORM_DISK: LimbDarkening = { u1: 0, u2: 0 };
export const SUN_LIKE_LIMB_DARKENING: LimbDarkening = { u1: LIMB_DARKENING_U1, u2: LIMB_DARKENING_U2 };

/** A transiting system in the dimensionless form the light curve needs. */
export type TransitGeometry = {
  /** Rp / R★. */
  readonly radiusRatio: number;
  /** a / R★. */
  readonly orbitInStarRadii: number;
  /** Orbital inclination, rad (π/2 = edge-on). */
  readonly inclinationRad: number;
  readonly limbDarkening: LimbDarkening;
};

/**
 * Area of the overlap of two disks, radii r1 and r2, centres d apart (any units).
 * The standard lens formula.
 */
export function circleOverlapArea(r1: number, r2: number, d: number): number {
  if (d >= r1 + r2) {
    return 0;
  }
  const small = Math.min(r1, r2);
  const large = Math.max(r1, r2);
  if (d <= large - small) {
    return Math.PI * small * small;
  }
  const a1 = Math.acos(clamp((d * d + r1 * r1 - r2 * r2) / (2 * d * r1), -1, 1));
  const a2 = Math.acos(clamp((d * d + r2 * r2 - r1 * r1) / (2 * d * r2), -1, 1));
  const kite = 0.5 * Math.sqrt(Math.max(0, (-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2)));
  return r1 * r1 * a1 + r2 * r2 * a2 - kite;
}

/** Brightness of the stellar disk at radius r (0–1), relative to the centre. */
export function limbIntensity(r: number, limbDarkening: LimbDarkening): number {
  const oneMinusMu = 1 - Math.sqrt(Math.max(0, 1 - r * r));
  return 1 - limbDarkening.u1 * oneMinusMu - limbDarkening.u2 * oneMinusMu * oneMinusMu;
}

/** Total light of the disk in the same units: π (1 − u₁/3 − u₂/6). */
export function totalDiskFlux(limbDarkening: LimbDarkening): number {
  return Math.PI * (1 - limbDarkening.u1 / 3 - limbDarkening.u2 / 6);
}

/**
 * Fraction of the star's light blocked by a planet of radius ratio k whose centre
 * is z star radii from the star's centre (assumed in front of the star).
 */
export function blockedFraction(k: number, z: number, limbDarkening: LimbDarkening): number {
  if (k <= 0 || z >= 1 + k) {
    return 0;
  }
  if (limbDarkening.u1 === 0 && limbDarkening.u2 === 0) {
    return circleOverlapArea(1, k, z) / Math.PI;
  }

  // Sum over rings of the stellar disk between the nearest and farthest radii the
  // planet reaches: each ring contributes its brightness × the arc length inside the planet.
  const rMin = Math.max(0, z - k);
  const rMax = Math.min(1, z + k);
  const n = LIMB_DARKENING_RINGS;
  const dr = (rMax - rMin) / n;
  let blocked = 0;
  for (let i = 0; i < n; i++) {
    const r = rMin + (i + 0.5) * dr;
    blocked += limbIntensity(r, limbDarkening) * 2 * ringHalfAngleInside(r, k, z) * r * dr;
  }
  return blocked / totalDiskFlux(limbDarkening);
}

/** Half the angle of the ring of radius r (star centre) that lies inside the planet's disk. */
function ringHalfAngleInside(r: number, k: number, z: number): number {
  if (r + z <= k) {
    return Math.PI;
  }
  if (r <= z - k || r >= z + k || z === 0) {
    return 0;
  }
  return Math.acos(clamp((r * r + z * z - k * k) / (2 * r * z), -1, 1));
}

/** Planet's position on the sky (star radii) at an orbital phase; `inFront` false when behind the star. */
export function skyPosition(
  phase: number,
  geometry: Pick<TransitGeometry, "orbitInStarRadii" | "inclinationRad">,
): { x: number; y: number; inFront: boolean } {
  const theta = 2 * Math.PI * phase;
  return {
    x: geometry.orbitInStarRadii * Math.sin(theta),
    y: geometry.orbitInStarRadii * Math.cos(geometry.inclinationRad) * Math.cos(theta),
    inFront: Math.cos(theta) > 0,
  };
}

/** The star's brightness (1 = unblocked) at an orbital phase. */
export function relativeFlux(phase: number, geometry: TransitGeometry): number {
  const sky = skyPosition(phase, geometry);
  if (!sky.inFront) {
    return 1;
  }
  return 1 - blockedFraction(geometry.radiusRatio, Math.hypot(sky.x, sky.y), geometry.limbDarkening);
}

/** Below this an impact parameter is rounding error (cos 90° is 6 × 10⁻¹⁷ in floating point), and is 0. */
const IMPACT_PARAMETER_EPSILON = 1e-9;

/** Impact parameter b = (a/R★) cos i. */
export function impactParameter(orbitInStarRadii: number, inclinationRad: number): number {
  const b = orbitInStarRadii * Math.cos(inclinationRad);
  return Math.abs(b) < IMPACT_PARAMETER_EPSILON ? 0 : b;
}

/** Whether any part of the planet crosses the star: b < 1 + k. */
export function transits(
  geometry: Pick<TransitGeometry, "radiusRatio" | "orbitInStarRadii" | "inclinationRad">,
): boolean {
  return impactParameter(geometry.orbitInStarRadii, geometry.inclinationRad) < 1 + geometry.radiusRatio;
}

/**
 * Time from first to last contact as a fraction of the period (Seager &
 * Mallén-Ornelas 2003, circular orbit): (1/π) asin( √((1 + k)² − b²) / ((a/R★) sin i) ).
 * 0 when the planet misses the star.
 */
export function totalDurationFraction(
  geometry: Pick<TransitGeometry, "radiusRatio" | "orbitInStarRadii" | "inclinationRad">,
): number {
  return durationFraction(geometry, 1 + geometry.radiusRatio);
}

/** Time the planet is wholly inside the disk, as a fraction of the period; 0 for a grazing transit. */
export function fullDurationFraction(
  geometry: Pick<TransitGeometry, "radiusRatio" | "orbitInStarRadii" | "inclinationRad">,
): number {
  return durationFraction(geometry, 1 - geometry.radiusRatio);
}

function durationFraction(
  geometry: Pick<TransitGeometry, "radiusRatio" | "orbitInStarRadii" | "inclinationRad">,
  reach: number,
): number {
  const b = impactParameter(geometry.orbitInStarRadii, geometry.inclinationRad);
  if (reach <= 0 || b >= reach) {
    return 0;
  }
  const s = Math.sqrt(reach * reach - b * b) / (geometry.orbitInStarRadii * Math.sin(geometry.inclinationRad));
  return Math.asin(Math.min(1, s)) / Math.PI;
}

/**
 * Chance that a randomly oriented orbit transits (directions uniform on the sky,
 * so cos i is uniform): (1 + k) / (a/R★).
 */
export function transitProbability(radiusRatio: number, orbitInStarRadii: number): number {
  return Math.min(1, (1 + radiusRatio) / orbitInStarRadii);
}

/** Depth of a uniform-disk central transit: δ = k². */
export function uniformDepth(radiusRatio: number): number {
  return radiusRatio * radiusRatio;
}

/** Planet radius from a measured depth and the star's radius (any unit): Rp = R★ √δ. */
export function radiusFromDepth(depth: number, starRadius: number): number {
  return starRadius * Math.sqrt(Math.max(0, depth));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

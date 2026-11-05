/**
 * orbitPhysics.ts
 *
 * Two-body relations for a star and one planet on a circular orbit: Kepler's
 * third law both ways, and the radial-velocity relations the Rock or Gas?
 * screen uses to turn a measured wobble into a planet mass. Adapted from
 * StellarWobble's orbitPhysics.ts (same conventions, SI in and out).
 */

import { G_SI } from "../../TransitHunterConstants.js";

/** Orbital period from Kepler's third law, s: P = 2π √(a³ / G(M★ + Mp)). */
export function orbitalPeriod(starMassKg: number, planetMassKg: number, distanceM: number): number {
  return 2 * Math.PI * Math.sqrt(distanceM ** 3 / (G_SI * (starMassKg + planetMassKg)));
}

/** Semi-major axis from the period (Kepler's third law), m: a = (G(M★ + Mp) P² / 4π²)^{1/3}. */
export function semiMajorAxis(starMassKg: number, planetMassKg: number, periodS: number): number {
  return ((G_SI * (starMassKg + planetMassKg) * periodS ** 2) / (4 * Math.PI ** 2)) ** (1 / 3);
}

/**
 * Radial-velocity semi-amplitude K, m/s, from the period:
 * K = (2πG/P)^{1/3} · Mp sin i / (M★ + Mp)^{2/3}.
 */
export function semiAmplitudeFromPeriod(
  starMassKg: number,
  planetMassKg: number,
  periodS: number,
  inclinationRad: number,
): number {
  return (
    (((2 * Math.PI * G_SI) / periodS) ** (1 / 3) * planetMassKg * Math.sin(inclinationRad)) /
    (starMassKg + planetMassKg) ** (2 / 3)
  );
}

/**
 * The planet mass, kg, that gives this semi-amplitude K (m/s) and period (s)
 * around a star of known mass, seen at inclination i. Solves
 * m sin i = K (P / 2πG)^{1/3} (M★ + m)^{2/3} by fixed-point iteration (it
 * converges in a few steps because m ≪ M★). With i = 90° this is the minimum
 * mass M sin i that radial velocity alone gives; a transit tells us i, so it
 * becomes the true mass.
 */
export function planetMassFromWobble(
  semiAmplitudeMS: number,
  periodS: number,
  starMassKg: number,
  inclinationRad = Math.PI / 2,
): number {
  const sinI = Math.sin(inclinationRad);
  if (semiAmplitudeMS <= 0 || periodS <= 0 || sinI <= 0) {
    return 0;
  }
  const factor = (semiAmplitudeMS * (periodS / (2 * Math.PI * G_SI)) ** (1 / 3)) / sinI;
  let mass = factor * starMassKg ** (2 / 3);
  for (let i = 0; i < 50; i++) {
    const next = factor * (starMassKg + mass) ** (2 / 3);
    if (Math.abs(next - mass) <= 1e-12 * next) {
      return next;
    }
    mass = next;
  }
  return mass;
}

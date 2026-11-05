/**
 * archive.ts
 *
 * Typed access to the NASA Exoplanet Archive parameters in data/archive.json
 * (written by scripts/lightcurves/fetch_lightcurves.py from the Planetary
 * Systems Composite Parameters table). Values are as the archive gives them;
 * null means the archive has no value.
 */

import archiveJson from "./data/archive.json";

export type ArchivePlanet = {
  readonly name: string;
  readonly host: string;
  readonly periodDays: number;
  readonly transitMidBjd: number;
  readonly radiusEarth: number;
  readonly radiusEarthErrPlus: number | null;
  readonly radiusEarthErrMinus: number | null;
  readonly massEarth: number;
  readonly massEarthErrPlus: number | null;
  readonly massEarthErrMinus: number | null;
  readonly massProvenance: string | null;
  readonly semiMajorAxisAu: number;
  readonly inclinationDeg: number | null;
  readonly impactParameter: number | null;
  readonly depthPercent: number | null;
  readonly durationHours: number | null;
  /** Radial-velocity semi-amplitude K, m/s (null when the mass comes from transit timing). */
  readonly rvAmplitude: number | null;
  readonly eccentricity: number | null;
  readonly starRadiusSun: number;
  readonly starMassSun: number;
  readonly starTeffK: number;
  readonly distancePc: number | null;
  readonly discoveryYear: number;
  readonly discoveryMethod: string;
  readonly discoveryFacility: string;
  readonly radiusReference: string | null;
  readonly massReference: string | null;
  readonly rvAmplitudeReference: string | null;
};

const PLANETS: readonly ArchivePlanet[] = archiveJson.planets as readonly ArchivePlanet[];

/** The archive's retrieval date (ISO). */
export const ARCHIVE_RETRIEVED: string = archiveJson.retrieved;

/** The archive entry of a planet, by its archive name (e.g. "HD 209458 b"). */
export function archivePlanet(name: string): ArchivePlanet {
  const planet = PLANETS.find((p) => p.name === name);
  if (!planet) {
    throw new Error(`No archive entry for ${name}`);
  }
  return planet;
}

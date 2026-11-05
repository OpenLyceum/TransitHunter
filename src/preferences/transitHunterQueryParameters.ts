/**
 * transitHunterQueryParameters.ts
 *
 * Sim-specific startup query parameters. This is the single place where every
 * sim-specific query parameter is declared and documented. Public-facing
 * parameters (intended for end users / sharing links) set `public: true`.
 *
 * Usage: append e.g. `?showEquations` to the sim URL.
 */

import { logGlobal } from "scenerystack/phet-core";
import { QueryStringMachine } from "scenerystack/query-string-machine";
import TransitHunterNamespace from "../TransitHunterNamespace.js";

const transitHunterQueryParameters = QueryStringMachine.getAll({
  /**
   * Shows the equations (Rp = R★√δ, Kepler's third law, density) beside the readouts. Off by
   * default because the first screens are pitched at beginners.
   */
  showEquations: {
    type: "flag",
    public: true,
  },
});

TransitHunterNamespace.register("transitHunterQueryParameters", transitHunterQueryParameters);

// Log query parameters (for the console / PhET-iO).
logGlobal("phet.chipper.queryParameters");

export default transitHunterQueryParameters;

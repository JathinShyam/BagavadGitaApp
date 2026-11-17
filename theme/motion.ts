import { Easing } from "react-native-reanimated";

/**
 * Shared motion vocabulary (motion-and-typography spec §1.1).
 *
 * Durations are semantic, not literal: pick the token that describes the
 * moment, not the number that happens to look right at the call site.
 */
export const Duration = {
  instant: 90, // press confirm
  fast: 140, // icon morph, state swap
  base: 220, // default UI transition
  slow: 320, // sheet, modal, ribbon
  ritual: 600, // reward entrance
  ambient: 1200, // shimmer / breathing loop
} as const;

export const Ease = {
  standard: Easing.bezier(0.23, 1, 0.32, 1), // entering — strong ease-out
  emphasized: Easing.bezier(0.16, 1, 0.3, 1), // hero entrances
  inOut: Easing.bezier(0.77, 0, 0.175, 1), // on-screen movement
  accelerate: Easing.in(Easing.quad), // gravity, exits, "undo"
  decelerate: Easing.out(Easing.cubic), // falling, settling
} as const;

/**
 * Reanimated 4 defaults to mass: 4, stiffness: 900. Every spring in the app
 * states `mass: 1` explicitly (house rule) so damping ratios stay predictable.
 *
 * ζ = damping / (2 * sqrt(stiffness * mass))
 */
export const Spring = {
  snappy: { damping: 28, stiffness: 400, mass: 1 }, // ζ 0.70 — toggles, chips, dots
  bouncy: { damping: 12, stiffness: 300, mass: 1 }, // ζ 0.35 — reward, streak increment
  gentle: { damping: 17, stiffness: 200, mass: 1 }, // ζ 0.60 — modals, sheets
  settle: { damping: 20, stiffness: 260, mass: 1 }, // ζ 0.62 — image settle
} as const;

export default {
  Duration,
  Ease,
  Spring,
};

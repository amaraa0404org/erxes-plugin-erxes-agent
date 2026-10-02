import type { Block } from './bloub/bot/cycles';
/**
 * Curated bot montages used across the agents surfaces.
 *
 * Module-level constants on purpose: `BloubBot` restarts playback whenever the
 * `cycle` array identity changes, so these must never be rebuilt per render.
 *
 * Every duration sits well above the engine's block floor (the longest state
 * morph, ~0.6s) so no block is cut before its transition finishes.
 */
/**
 * Calm, size-stable montage: only states that keep the measured circle body
 * (`baseBody`), so the silhouette never grows, shrinks or collapses into the
 * loading-spinner-like "thinking" dots. Safe for the empty-state hero at any
 * container width.
 */
export declare const CALM_FACE_CYCLE: Block[];
/**
 * Launcher montage: the same size-stable face states, slightly slower, so the
 * floating button reads as alive without ever changing its footprint.
 */
export declare const LAUNCHER_CYCLE: Block[];

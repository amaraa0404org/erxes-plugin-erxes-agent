import { useCallback, useEffect, useId, useRef, useState } from 'react';

import type { Block } from '../bloub/bot/cycles';
import { makeBlock } from '../bloub/bot/cycles';
import { NOTIF_BLUE, type DotRender } from '../bloub/bot/decor';
import {
  EXPRESSION_BY_ID,
  DEFAULT_EXPRESSION,
} from '../bloub/bot/expressions';
import { BotEngine, type BotFrame } from '../bloub/bot/engine';
import { DEMI_VIEWBOX, RAYON } from '../bloub/bot/repere';
import {
  COLOR_BY_ID,
  SHAPE_BY_ID,
  DEFAULT_SHAPE,
  mixHex,
} from '../bloub/bot/skins';
import type { StateId } from '../bloub/bot/states';

/**
 * React client of the vendored bloub bot engine (`../bloub/bot`), ported from
 * upstream's Vue `BloubBot.vue`. The engine is framework-free and clock-free
 * (`engine.sample(t)` is a pure function of time); this component only owns
 * the requestAnimationFrame loop, the playback cursor for montage cycles, and
 * the SVG rendering of one `BotFrame`.
 *
 * Three modes:
 * - `cycle` given: plays the montage (list of `{ state, duration }` blocks)
 *   in a loop — pass a stable (module-level or memoized) array, an inline
 *   literal restarts playback on every render.
 * - `shuffle` given: plays a random, never-repeating walk through the
 *   shuffle pool (a stable array of state ids). Each pick is held its
 *   measured duration (the vendored `makeBlock`), every next pick is random
 *   among the pool minus the state currently on screen, and a calm `state`
 *   block always opens the walk. The array reference must be stable for
 *   the same reason as `cycle`.
 * - neither: renders the single `state` continuously; the engine's
 *   liveliness (breathing, gaze drift, blinking) keeps it alive.
 *
 * `frozenAt` renders one exact frame with no animation loop (upstream's
 * thumbnail mode) — `0` is a safe idle frame with fully open eyes.
 */

/** How long a hidden tab may advance the clock when it becomes visible again. */
const MAX_FRAME_DELTA_SECONDS = 0.064;

export interface IBloubBotProps {
  /** Rendered square size in px. */
  size?: number;
  /** Single-state mode: the state rendered when no `cycle` is given. */
  state?: StateId;
  /** Montage mode: blocks to play in a loop. Keep the reference stable. */
  cycle?: Block[];
  /**
   * Shuffle mode: a stable pool of state ids to play as a random,
   * never-repeating walk. Takes precedence over `state` (but not `cycle`).
   * Keep the reference stable.
   */
  shuffle?: StateId[];
  /** Body shape id from the vendored skins catalog. */
  shape?: string;
  /**
   * Ink color: a vendored skins catalog id (resolved to its hex) or any CSS
   * color value (`#…`, `var(--primary)`). Defaults to the design system
   * primary so every avatar matches the product's brand color.
   */
  color?: string;
  /** Rest expression id from the vendored expressions catalog. */
  expression?: string;
  /**
   * Background color used for the eye-hole underlay. A CSS variable works
   * (`var(--background)`); non-hex values only lose the particle depth fog,
   * which no vendored state uses.
   */
  paper?: string;
  /** Freezes the render at this time (seconds); no animation loop runs. */
  frozenAt?: number;
  className?: string;
}

export const BloubBot = ({
  size = 320,
  state = 'idle',
  cycle,
  shuffle,
  shape = DEFAULT_SHAPE,
  color = 'var(--primary)',
  expression = DEFAULT_EXPRESSION,
  paper = 'var(--background)',
  frozenAt,
  className,
}: IBloubBotProps) => {
  // useId contains ':' which breaks url(#…) paint references; strip it.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const maskId = `bot-mask-${uid}`;

  const shapeRadii = SHAPE_BY_ID.get(shape)?.radii ?? null;
  // Catalog ids resolve to their hex; any other CSS color passes through.
  // Inks are applied via CSS `fill` (style), since the SVG `fill` attribute
  // does not resolve `var(--…)` values.
  const ink = COLOR_BY_ID.get(color)?.hex ?? color;
  const expr = EXPRESSION_BY_ID.get(expression) ?? null;

  const engineRef = useRef<BotEngine | null>(null);

  if (engineRef.current === null) {
    engineRef.current = new BotEngine(RAYON, state, shapeRadii, expr);
  }

  const engine = engineRef.current;

  /** Scene clock in seconds; shared by the loop and the prop-change effects. */
  const clockRef = useRef(0);
  const [frame, setFrame] = useState<BotFrame>(() =>
    engine.sample(frozenAt ?? 0),
  );

  const redrawFrozen = useCallback(() => {
    if (frozenAt !== undefined) {
      setFrame(engine.sample(frozenAt));
    }
  }, [engine, frozenAt]);

  // Single-state changes (cycle mode drives the engine itself and never
  // changes the `state` prop mid-flight).
  useEffect(() => {
    if (engine.state === state) {
      return;
    }

    engine.setState(state, clockRef.current);
    redrawFrozen();
  }, [engine, state, redrawFrozen]);

  // Shape/expression changes morph instead of jumping, exactly like upstream.
  useEffect(() => {
    engine.setShape(shapeRadii, clockRef.current);
    engine.setExpression(expr, clockRef.current);
    redrawFrozen();
  }, [engine, shapeRadii, expr, redrawFrozen]);

  useEffect(() => {
    if (frozenAt !== undefined) {
      return;
    }

    let raf = 0;
    let last = 0;
    let nextAt = Infinity;
    let blockStart = 0;
    let block = 0;
    /**
     * The shuffle walk never stores more than the next block: the pick is
     * derived from the state currently on screen, so memory stays O(1)
     * however long the avatar lives.
     */
    let shuffleCurrent: StateId | null = null;

    /** Enters a block: engine state + the block's end date. */
    const enterBlock = (next: StateId, duration: number) => {
      shuffleCurrent = next;
      blockStart = clockRef.current;
      engine.setState(next, clockRef.current);
      nextAt = blockStart + duration;
    };

    /** Random shuffle pick among the pool minus the state on screen. */
    const pickShuffle = (): { state: StateId; duration: number } | null => {
      if (!shuffle?.length) {
        return null;
      }

      const current = shuffleCurrent ?? state;
      const candidates = shuffle.filter((s) => s !== current);
      const picked =
        candidates[Math.floor(Math.random() * candidates.length)] ?? current;

      return makeBlock(picked);
    };

    /** Schedules the block that follows the current one. */
    const advance = (): boolean => {
      if (cycle?.length) {
        block = (block + 1) % cycle.length;
        const b = cycle[block];

        blockStart = clockRef.current;
        engine.setState(b.state, clockRef.current);
        nextAt = blockStart + b.duration;
        return true;
      }

      const picked = pickShuffle();

      if (picked) {
        block += 1;
        enterBlock(picked.state, picked.duration);
        return true;
      }

      nextAt = Infinity;
      return false;
    };

    if (cycle?.length) {
      block = 0;
      const b = cycle[0];

      blockStart = clockRef.current;
      engine.setState(b.state, clockRef.current);
      nextAt = blockStart + b.duration;
    } else if (shuffle?.length) {
      // The walk opens with a calm arrival on the `state` prop, held its
      // measured duration, then starts the random never-repeating picks.
      const opening = makeBlock(state);

      enterBlock(state, opening.duration);
    }

    const tick = (ms: number) => {
      raf = requestAnimationFrame(tick);
      // Bounded delta: a hidden then re-shown tab resumes without jumping.
      const dt = last
        ? Math.min((ms - last) / 1000, MAX_FRAME_DELTA_SECONDS)
        : 0;

      last = ms;
      clockRef.current += dt;

      if (clockRef.current >= nextAt) {
        advance();
      }

      setFrame(engine.sample(clockRef.current));
    };

    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [engine, cycle, shuffle, state, frozenAt]);

  const dotFill = (dot: DotRender): string => {
    if (dot.color) {
      return dot.color;
    }

    // Depth fog needs real hex values on both ends; a var()-based ink or
    // paper just falls back to the plain ink.
    if (
      dot.depth === undefined ||
      !paper.startsWith('#') ||
      !ink.startsWith('#')
    ) {
      return ink;
    }

    return mixHex(paper, ink, dot.depth);
  };

  const renderDot = (dot: DotRender, key: string) =>
    dot.d ? (
      <path
        key={key}
        d={dot.d}
        transform={`translate(${dot.x} ${dot.y}) rotate(${dot.rot ?? 0}) scale(${RAYON})`}
        style={{ fill: dotFill(dot) }}
        opacity={dot.opacity}
      />
    ) : (
      <circle
        key={key}
        cx={dot.x}
        cy={dot.y}
        r={dot.r}
        style={{ fill: dotFill(dot) }}
        opacity={dot.opacity}
      />
    );

  const VB = DEMI_VIEWBOX;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-VB} ${-VB} ${VB * 2} ${VB * 2}`}
      role="img"
      aria-label="Agent avatar"
      className={className}
    >
      <defs>
        {/*
         * The eyes are true holes punched in the body (as on x.ai), not white
         * shapes laid on top: they stay cropped by the silhouette when they
         * slide toward the edge. The notch (notify state) is a hole too.
         */}
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x={-VB}
          y={-VB}
          width={VB * 2}
          height={VB * 2}
        >
          <path d={frame.bodyPath} fill="#fff" />
          {frame.eyes.map((eye, i) => (
            <path
              key={i}
              d={eye.d}
              transform={eye.matrix}
              opacity={eye.alpha}
              fill="#000"
            />
          ))}
          {frame.notch && (
            <circle
              cx={frame.notch.x}
              cy={frame.notch.y}
              r={frame.notch.r}
              fill="#000"
            />
          )}
        </mask>

        {frame.arcs.map((arc) => (
          <linearGradient
            key={arc.id}
            id={`${uid}-${arc.id}`}
            gradientUnits="userSpaceOnUse"
            x1={arc.grad.x1}
            y1={arc.grad.y1}
            x2={arc.grad.x2}
            y2={arc.grad.y2}
          >
            {arc.grad.stops.map((stopColor, i) => (
              <stop
                key={i}
                offset={i / (arc.grad.stops.length - 1)}
                stopColor={stopColor}
              />
            ))}
          </linearGradient>
        ))}
      </defs>

      {/* back half of the orbit arcs: drawn before the body, so occluded */}
      <g fill="none" strokeLinecap="round">
        {frame.arcs.map((arc) => (
          <path
            key={`b${arc.id}`}
            d={arc.back}
            stroke={`url(#${uid}-${arc.id})`}
            strokeWidth={arc.width}
            opacity={arc.opacity}
          />
        ))}
      </g>

      {/* burst particles: they pass behind the core */}
      {frame.dotsBehind && (
        <g>{frame.dots.map((dot, i) => renderDot(dot, `pb${i}`))}</g>
      )}

      <g opacity={frame.bodyAlpha}>
        {/*
         * Opaque underlay in the exact body shape, below the body itself: the
         * eye holes must not reveal what is drawn behind (back-half arcs,
         * particles). Applied via CSS fill so `var(--background)` resolves.
         */}
        <path d={frame.bodyPath} style={{ fill: paper }} />
        <g mask={`url(#${maskId})`}>
          <rect
            x={-VB}
            y={-VB}
            width={VB * 2}
            height={VB * 2}
            style={{ fill: ink }}
          />
        </g>
      </g>

      {!frame.dotsBehind && (
        <g>{frame.dots.map((dot, i) => renderDot(dot, `pf${i}`))}</g>
      )}

      {frame.notif && (
        <circle
          cx={frame.notif.x}
          cy={frame.notif.y}
          r={frame.notif.r}
          fill={NOTIF_BLUE}
        />
      )}

      {/* front half of the orbit arcs */}
      <g fill="none" strokeLinecap="round">
        {frame.arcs.map((arc) => (
          <path
            key={`f${arc.id}`}
            d={arc.front}
            stroke={`url(#${uid}-${arc.id})`}
            strokeWidth={arc.width}
            opacity={arc.opacity}
          />
        ))}
      </g>
    </svg>
  );
};

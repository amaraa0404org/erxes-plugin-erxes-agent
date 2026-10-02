import type { Block } from '../bloub/bot/cycles';
import type { StateId } from '../bloub/bot/states';
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
export declare const BloubBot: ({ size, state, cycle, shuffle, shape, color, expression, paper, frozenAt, className, }: IBloubBotProps) => import("react").JSX.Element;

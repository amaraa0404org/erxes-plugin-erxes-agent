import '../styles.css';
/**
 * Global floating agents widget, mounted on every page by the host via
 * `hasFloatingWidget`.
 *
 * The launcher is the bot itself: it plays the calm face montage so it is
 * always alive, and it can be dragged anywhere on screen — while dragging it
 * switches to the `orbit` state (rings spinning around the ball) and its spot
 * is remembered across visits. A press that never moves counts as a click and
 * opens a full-height right side panel with the conversation history and the
 * same chat surface as the full page.
 */
export declare const FloatingWidget: () => import("react").JSX.Element;
export default FloatingWidget;

import '../styles.css';
/**
 * Main router for the plugin, mounted by the host at `/erxes-agent/*` via
 * the `./erxes_agent` expose. The chat page lives at the `chat` sub-route
 * (`/erxes-agent/chat`) and the root redirects there — a deep link so the
 * host's rail click never lands on a plugin root that a stale remote's
 * index redirect could rewrite. No catch-all route.
 */
export declare const ErxesAgent: () => import("react").JSX.Element;

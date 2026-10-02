/**
 * Tenant-wide "Code mode" settings: when enabled, every user's chat agent
 * additionally carries the sandboxed `execute_typescript` tool (model-
 * authored TypeScript runs in the server's in-process QuickJS sandbox).
 * Every agents user can read the state; only admins (`manageAgentsSettings`)
 * can change it — the switch is disabled for everyone else.
 */
export declare const SettingsCodeModePage: () => import("react").JSX.Element;

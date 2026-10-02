/**
 * Settings sidebar group registered through `CONFIG.settingsNavigation`.
 * `SettingsNavigationMenuLinkItem` prefixes the link with `settings/`, so the
 * entries point at `/settings/erxes-agent/connection` and
 * `/settings/erxes-agent/code-mode` where the host mounts this remote's
 * settings expose (`./erxes_agentSettings`).
 */
export declare const ErxesAgentSettingsNavigation: () => import("react").JSX.Element;

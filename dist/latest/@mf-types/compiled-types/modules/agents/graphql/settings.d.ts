/**
 * GraphQL documents for the tenant-wide agents settings: the
 * admin-controlled feature flags that shape every user's chat surface
 * (currently the code-mode toggle and its sandbox environment). Reading is
 * open to anyone who can view agents; changing is admin-only server-side
 * (`manageAgentsSettings`), and the UI mirrors that by disabling controls.
 */
export declare const AGENTS_SETTINGS: import("graphql").DocumentNode;
export declare const AGENTS_SETTINGS_UPDATE: import("graphql").DocumentNode;
export interface IAgentsSettings {
    codeModeEnabled: boolean | null;
    codeModeEnvironment: string | null;
    updatedAt?: string | null;
}
export interface IAgentsSettingsData {
    agentsSettings: IAgentsSettings | null;
}
export interface IAgentsSettingsUpdateData {
    agentsSettingsUpdate: IAgentsSettings | null;
}
export interface IAgentsSettingsUpdateVariables {
    codeModeEnabled?: boolean;
    codeModeEnvironment?: string;
}

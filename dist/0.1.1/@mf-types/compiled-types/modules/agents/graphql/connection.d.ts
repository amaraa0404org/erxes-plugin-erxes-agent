/**
 * GraphQL documents for the per-user agents connections (BYOK) surface.
 *
 * Operation names are prefixed with `Agents` to stay unique repo-wide. The
 * backend never returns stored API keys; `hasKey` only reports whether one
 * is stored. Multiple providers may be configured side by side, and
 * `agentsModels` lists each configured provider's model ids (fetched
 * server-side from the provider's own /models endpoint) for the chat's
 * model picker.
 */
export declare const AGENTS_CONNECTIONS: import("graphql").DocumentNode;
export declare const AGENTS_MODELS: import("graphql").DocumentNode;
export declare const AGENTS_CONNECTION_UPSERT: import("graphql").DocumentNode;
export declare const AGENTS_CONNECTION_REMOVE: import("graphql").DocumentNode;
export interface IAgentsConnectionEntry {
    provider: string;
    model: string;
    hasKey: boolean;
    updatedAt?: string | null;
}
export interface IAgentsConnectionsData {
    agentsConnections: IAgentsConnectionEntry[] | null;
}
export interface IAgentsProviderModels {
    provider: string;
    models: string[] | null;
}
export interface IAgentsModelsData {
    agentsModels: IAgentsProviderModels[] | null;
}
export interface IAgentsConnectionUpsertData {
    agentsConnectionUpsert: IAgentsConnectionEntry;
}
export interface IAgentsConnectionUpsertVariables {
    provider: string;
    /** Optional; the server defaults to the provider's model when omitted. */
    model?: string;
    /** Omit to keep this provider's stored key; only send a freshly entered value. */
    apiKey?: string;
}
export interface IAgentsConnectionRemoveData {
    agentsConnectionRemove: boolean;
}
export interface IAgentsConnectionRemoveVariables {
    provider: string;
}

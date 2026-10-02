import type { IAgentsConnectionEntry } from '../graphql/connection';
export interface IUseAgentsConnectionResult {
    connections: IAgentsConnectionEntry[];
    loading: boolean;
    error: string | undefined;
    refetch: () => Promise<void>;
}
/**
 * Loads the acting user's configured BYOK connections (one entry per
 * provider). The backend never returns the stored API keys; `hasKey` only
 * reports whether one is stored.
 */
export declare const useAgentsConnection: () => IUseAgentsConnectionResult;

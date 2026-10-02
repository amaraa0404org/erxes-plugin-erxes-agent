import type { IAgentsThread } from '../types';
export interface IUseAgentsThreadsResult {
    threads: IAgentsThread[];
    loading: boolean;
    error: string | undefined;
    refetch: () => Promise<void>;
}
/**
 * Loads the acting user's agents threads. The `agentsThreadsChanged`
 * subscription is used purely as a refetch signal: whenever a chat turn is
 * persisted or a thread title is generated server-side, a debounced refetch
 * keeps the list fresh without any manual refresh.
 */
export declare const useAgentsThreads: () => IUseAgentsThreadsResult;

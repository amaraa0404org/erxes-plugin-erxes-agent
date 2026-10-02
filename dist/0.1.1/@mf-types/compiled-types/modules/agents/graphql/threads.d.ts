import type { IAgentsThread, IStoredMessage } from '../types';
/**
 * GraphQL documents for the agents thread history surface.
 *
 * Operation names are prefixed with `Agents` to stay unique repo-wide. The
 * `AgentsThreadsChanged` subscription is consumed purely as a refetch
 * signal: it fires when a chat turn is persisted and again when a thread
 * title is generated.
 */
export declare const AGENTS_THREADS: import("graphql").DocumentNode;
export declare const AGENTS_THREAD_DETAIL: import("graphql").DocumentNode;
export declare const AGENTS_THREAD_REMOVE: import("graphql").DocumentNode;
export declare const AGENTS_THREADS_CHANGED: import("graphql").DocumentNode;
export interface IAgentsThreadsData {
    agentsThreads: {
        threads: IAgentsThread[];
        total: number;
        page: number;
        perPage: number;
        hasMore: boolean;
    } | null;
}
export interface IAgentsThreadDetailData {
    agentsThreadDetail: {
        thread: IAgentsThread;
        messages: IStoredMessage[];
    } | null;
}
export interface IAgentsThreadRemoveData {
    agentsThreadRemove: boolean;
}
export interface IAgentsThreadRemoveVariables {
    threadId: string;
}

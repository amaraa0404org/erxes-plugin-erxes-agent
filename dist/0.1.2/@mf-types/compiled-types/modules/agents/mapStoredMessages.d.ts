import type { UIMessage } from 'ai';
import type { IStoredMessage } from './types';
/**
 * Converts stored Mastra thread messages (as returned by the
 * `agentsThreadDetail` GraphQL query) into AI SDK `UIMessage`s that
 * `useChat` can render. Messages with no renderable parts are dropped.
 */
export declare const mapStoredMessagesToUIMessages: (messages: IStoredMessage[]) => UIMessage[];

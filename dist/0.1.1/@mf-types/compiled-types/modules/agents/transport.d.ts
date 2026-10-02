import { DefaultChatTransport } from 'ai';
import type { ChatTransport, UIMessage, UIMessageChunk } from 'ai';
/** Model/thinking selection sent with every turn (empty provider = auto). */
export interface IAgentsRequestSelection {
    provider?: string;
    model?: string;
    thinkingLevel?: string;
}
/**
 * The ask_user answer staged by the hook, plus the suspended tool call it
 * resolves. The tool call id scopes the transport's chunk filter to the
 * suspension replay so the resumed run's own tool results still reach the UI.
 */
export interface IPendingAnswer {
    answer: string | string[] | (string | string[])[];
    suspendedToolCallId?: string;
}
export interface IAgentsChatTransportOptions {
    /** Returns the currently active thread id, if any. */
    getThreadId: () => string | undefined;
    /** Returns the current model/thinking selection for the next turn. */
    getRequestSelection: () => IAgentsRequestSelection;
    /** Called when the backend reports the thread id for this conversation. */
    onThreadId: (threadId: string) => void;
    /** Returns the currently active run id, if any. */
    getActiveRunId: () => string | undefined;
    /**
     * Called when the active run id changes: set on send, cleared on 204
     * reconnects and on non-ok normal-chat HTTP responses.
     */
    onActiveRunId: (runId: string | undefined) => void;
    /**
     * Returns the ask_user answer awaiting submission, if any. The transport
     * consumes it exactly once in `sendMessages` — which the hook triggers
     * right after staging — turning that one request into the
     * `POST /agents/answer` resume call. A batched multi-question card
     * answers positionally: element i answers question i (a string, or a
     * string array for that question's multi-select).
     */
    consumePendingAnswer: () => IPendingAnswer | undefined;
    /**
     * Reports the outcome of a reconnect attempt as soon as it is known:
     * `true` when the backend replayed an active run's stream (200),
     * `false` when it reported no active run (204). The hook uses this —
     * not a post-resume transcript comparison, which races React's
     * throttled message renders — to decide whether the stored transcript
     * needs one re-read (the run finished while the surface was away, so
     * its persisted reply is missing from the restored messages) or must
     * be left alone (the replay is streaming the reply in already).
     */
    onReconnectOutcome?: (reconnected: boolean) => void;
}
/**
 * Chat transport for erxes agents.
 *
 * Extends the AI SDK's `DefaultChatTransport` (the documented extension
 * point) instead of re-implementing SSE parsing or message state:
 *
 * - Normal sends go to `POST /agents/chat`; the hook pins the conversation
 *   by generating the thread id client-side and including it in the body
 *   (`threadId`) on every turn. The response header `X-Agents-Thread-Id` is
 *   captured through the transport's `fetch` middleware as advisory only —
 *   a cross-origin browser cannot read a custom header unless the gateway
 *   exposes it, so continuity must never depend on it.
 * - When the framework auto-resends after the user answered a tool approval
 *   (last message is the assistant's approval-responded message), the request
 *   is routed to `POST /agents/approve` with `{ threadId, approved, reason }`
 *   because the backend resumes the suspended Mastra run through its own
 *   endpoint instead of re-running the whole transcript.
 */
export declare class AgentsChatTransport extends DefaultChatTransport<UIMessage> implements ChatTransport<UIMessage> {
    private readonly getThreadId;
    private readonly onThreadId;
    private readonly getRequestSelection;
    private readonly getActiveRunId;
    private readonly onActiveRunId;
    private readonly consumePendingAnswer;
    private readonly onReconnectOutcome?;
    constructor({ getThreadId, getRequestSelection, onThreadId, getActiveRunId, onActiveRunId, consumePendingAnswer, onReconnectOutcome, }: IAgentsChatTransportOptions);
    sendMessages(options: Parameters<ChatTransport<UIMessage>['sendMessages']>[0]): Promise<ReadableStream<UIMessageChunk>>;
    /**
     * POSTs the ask_user answer to the answer resume endpoint and returns the
     * resumed stream. The resumed run replays the suspension's resolution as
     * chunks tagged with the PREVIOUS turn's tool call id, which the send-side
     * streaming state cannot match (the SDK throws "must be preceded by a
     * tool-input-available" and discards the whole stream; the hook marks the
     * tool part answered locally instead). Only those replay chunks are
     * dropped — every other chunk, including the resumed run's own tool
     * inputs and outputs, flows through to the UI.
     */
    private postAnswerResume;
    /**
     * Reconnects to an active run's stream via the backend's native
     * `POST /agents/chat/reconnect` endpoint. The backend uses the durable
     * agent's `listActiveRuns` + `observe` over the shared Redis Streams bus,
     * so replay works across browser refreshes and API replicas/processes.
     *
     * Returns null on 204 (run no longer active) and clears the stale
     * active run id. Throws a readable error on non-2xx responses.
     */
    reconnectToStream(options: {
        chatId: string;
        abortSignal?: AbortSignal;
    }): Promise<ReadableStream<UIMessageChunk> | null>;
}

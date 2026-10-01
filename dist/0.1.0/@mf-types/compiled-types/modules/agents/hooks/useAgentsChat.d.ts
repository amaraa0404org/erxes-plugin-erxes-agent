import type { UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
/** Thinking depth selectable per turn in the chat UI. */
export type IAgentsThinkingLevel = 'off' | 'minimal' | 'low' | 'medium' | 'high';
/** Which chat surface owns this hook instance (page vs floating widget). */
export type IAgentsSessionScope = 'page' | 'widget';
export interface IUseAgentsChatResult {
    messages: UIMessage[];
    status: ReturnType<typeof useChat<UIMessage>>['status'];
    error: Error | undefined;
    threadId: string | undefined;
    loadingThread: boolean;
    sendMessage: ReturnType<typeof useChat<UIMessage>>['sendMessage'];
    addToolApprovalResponse: ReturnType<typeof useChat<UIMessage>>['addToolApprovalResponse'];
    stop: ReturnType<typeof useChat<UIMessage>>['stop'];
    clearError: ReturnType<typeof useChat<UIMessage>>['clearError'];
    /** Starts a fresh conversation, dropping the local transcript and thread. */
    startNewConversation: () => Promise<void>;
    /** Loads an existing thread's stored messages into the chat. */
    openThread: (threadId: string) => Promise<void>;
    /** Current model/thinking selection; empty provider means server default. */
    modelProvider: string;
    modelId: string;
    thinkingLevel: IAgentsThinkingLevel;
    /** Picks the provider/model the next turns run on ('' = auto). */
    selectModel: (provider: string, model: string) => void;
    selectThinkingLevel: (level: IAgentsThinkingLevel) => void;
    /** True while an ask_user answer is being submitted and resumed. */
    answerBusy: boolean;
    /**
     * Submits the answer(s) to the thread's suspended ask_user question(s):
     * a bare string (or string array for one multi-select question) for a
     * single-question card, or one entry per question positionally for a
     * batched card.
     */
    submitAnswer: (answer: string | string[] | (string | string[])[]) => void;
    /** True when there is an active run id that can be reconnected. */
    canReconnect: boolean;
    /** Resumes streaming from the active run via the backend reconnect endpoint. */
    resumeStream: () => Promise<void>;
}
/**
 * Agents chat state built on the AI SDK's `useChat` with a custom
 * `AgentsChatTransport`. The framework owns message state, streaming, and
 * tool-approval handling; this hook only adds:
 *
 * - thread continuity: the thread id is generated client-side on the first
 *   send (`crypto.randomUUID()`) and pinned to every subsequent turn in the
 *   request body. The backend accepts client-supplied ids (auto-creating
 *   unknown ones, 403 for foreign threads). The `X-Agents-Thread-Id`
 *   response header is still captured when readable, but a cross-origin
 *   caller cannot read it unless the gateway exposes it, so it must never
 *   be the sole carrier of the id,
 * - automatic resend after an approval decision via the SDK's native
 *   `sendAutomaticallyWhen` predicate (the transport routes that resend to
 *   the backend's `/agents/approve` resume endpoint),
 * - active run id tracking for reconnect: generated per normal send,
 *   persisted per thread in sessionStorage (one shared entry per thread
 *   — a durable run belongs to the thread, not the surface), cleared on
 *   clean completion and on terminal errors (via `onFinish`), retained
 *   only on abort, disconnect, or a pending approval/ask_user suspension
 *   so reconnectable streams can resume under the same run,
 * - surface-scoped session restore: the selected thread id persists per
 *   `sessionScope` (`page` vs `widget`), so a browser refresh reopens
 *   the same conversation through `openThread` (which resumes a stored
 *   live run, and re-reads the thread once after a non-replayed resume
 *   so a run that finished during the reload still shows its reply)
 *   without the two surfaces restoring each other's selection,
 */
export declare const useAgentsChat: (options?: {
    sessionScope?: IAgentsSessionScope;
}) => IUseAgentsChatResult;

import type { UIMessage } from 'ai';
import { type IAskUserAnswerEntry } from '../askUserAnswers';
type MessagePart = UIMessage['parts'][number];
export interface IMessagePartRendererProps {
    part: MessagePart;
    role: UIMessage['role'];
    /** True while the approval decision is being submitted. */
    approvalBusy: boolean;
    onApprovalRespond: (decision: {
        approvalId: string;
        approved: boolean;
        reason?: string;
    }) => void;
    /** True while an ask_user answer is being submitted. */
    answerBusy: boolean;
    onAnswer: (answer: string | string[] | (string | string[])[]) => void;
    /** Tool calls already resolved somewhere in the message. */
    answeredToolCallIds: Set<string>;
    isStreaming?: boolean;
    onRetryArtifact?: (title: string) => void;
}
/**
 * Message-level variant: the answered Q&A pairs of the message's settled
 * askUser tool part, or null when there is none. The transcript uses this to
 * detect the ask_user turn a following answer bubble belongs to.
 */
export declare const readMessageAskUserAnswerCard: (message: UIMessage) => IAskUserAnswerEntry[] | null;
/**
 * Whether an assistant message renders anything at all: text, reasoning, an
 * approval prompt, an unanswered ask_user card, or an answered ask_user
 * Q&A card. The transcript skips messages without any of these so answered
 * interruptions never leave empty avatar-only rows behind.
 */
export declare const hasVisibleParts: (parts: MessagePart[], answeredToolCallIds: Set<string>) => boolean;
/**
 * Renders one UIMessage part according to its type. Tool parts surface the
 * destructive-action approval prompt and the settled ask_user Q&A card;
 * data parts surface the pending ask_user questions; all other tool states
 * stay hidden in the transcript.
 */
export declare const MessagePartRenderer: ({ part, role, approvalBusy, onApprovalRespond, answerBusy, onAnswer, answeredToolCallIds, isStreaming, onRetryArtifact, }: IMessagePartRendererProps) => import("react").JSX.Element | null;
export {};

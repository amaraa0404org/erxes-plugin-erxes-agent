import { type UIMessage } from 'ai';
export interface IMessageListProps {
    messages: UIMessage[];
    onRetryArtifact: (title: string) => void;
    status: string;
    loadingThread: boolean;
    approvalBusy: boolean;
    onApprovalRespond: (decision: {
        approvalId: string;
        approved: boolean;
        reason?: string;
    }) => void;
    answerBusy: boolean;
    onAnswer: (answer: string | string[] | (string | string[])[]) => void;
}
/**
 * Scrollable transcript. Follows the inbox ScrollArea viewport pattern:
 * sticks to the bottom while new content streams in, and pauses auto-scroll
 * as soon as the user scrolls up. The empty state lives in `ChatPanel`, which
 * pairs it with the composer; this component only renders history plus its
 * loading state.
 */
export declare const MessageList: ({ messages, status, loadingThread, approvalBusy, onApprovalRespond, answerBusy, onAnswer, onRetryArtifact, }: IMessageListProps) => import("react").JSX.Element;

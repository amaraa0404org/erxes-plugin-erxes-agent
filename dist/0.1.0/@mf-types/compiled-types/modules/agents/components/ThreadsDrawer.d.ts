import type { IUseAgentsThreadsResult } from '../hooks/useAgentsThreads';
export interface IThreadsDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    threadsState: IUseAgentsThreadsResult;
    activeThreadId: string | undefined;
    onSelectThread: (threadId: string) => void;
    onNewConversation: () => void;
    /** Called after a thread has been deleted successfully. */
    onThreadDeleted?: (threadId: string) => void;
}
/**
 * Conversation history as a left drawer, for every width where the permanent
 * sidebar is hidden (below `lg`). Both the full page and the floating side
 * panel mount this, so history stays reachable on tablets and phones — the
 * floating panel's sidebar used to be `hidden md:block` with no fallback,
 * which left phones with no way to reopen a thread at all.
 *
 * The drawer is controlled: the owning surface owns the open state and the
 * trigger, and closes it once a thread has been picked.
 */
export declare const ThreadsDrawer: ({ open, onOpenChange, ...listProps }: IThreadsDrawerProps) => import("react").JSX.Element;

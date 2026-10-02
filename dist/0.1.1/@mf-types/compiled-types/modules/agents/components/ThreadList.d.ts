import type { IUseAgentsThreadsResult } from '../hooks/useAgentsThreads';
export interface IThreadListProps {
    threadsState: IUseAgentsThreadsResult;
    activeThreadId: string | undefined;
    onSelectThread: (threadId: string) => void;
    onNewConversation: () => void;
    /** Called after a thread has been deleted successfully. */
    onThreadDeleted?: (threadId: string) => void;
}
export declare const ThreadList: import("react").MemoExoticComponent<({ threadsState, activeThreadId, onSelectThread, onNewConversation, onThreadDeleted, }: IThreadListProps) => import("react").JSX.Element>;

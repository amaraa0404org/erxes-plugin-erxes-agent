import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useMutation } from '@apollo/client';
import {
  AlertDialog,
  Button,
  buttonVariants,
  formatDateISOStringToRelativeDateShort,
  toast,
} from 'erxes-ui';
import { Fragment, memo, useMemo, useState } from 'react';

import { AGENTS_THREADS, AGENTS_THREAD_REMOVE } from '../graphql/threads';
import type {
  IAgentsThreadRemoveData,
  IAgentsThreadRemoveVariables,
} from '../graphql/threads';
import type { IUseAgentsThreadsResult } from '../hooks/useAgentsThreads';
import type { IAgentsThread } from '../types';
import { BloubBot } from './BloubBot';

export interface IThreadListProps {
  threadsState: IUseAgentsThreadsResult;
  activeThreadId: string | undefined;
  onSelectThread: (threadId: string) => void;
  onNewConversation: () => void;
  /** Called after a thread has been deleted successfully. */
  onThreadDeleted?: (threadId: string) => void;
}

/** Loading placeholder rows shown while the first page is still in flight. */
const SKELETON_ROWS = 5;

type IThreadGroup = { key: string; label: string; threads: IAgentsThread[] };

/**
 * Buckets threads into Today / Yesterday / Previous 7 days / Older so the
 * list scans like a session history instead of one undifferentiated feed.
 */
const groupThreads = (threads: IAgentsThread[]): IThreadGroup[] => {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  const buckets = new Map<string, IThreadGroup>([
    ['today', { key: 'today', label: 'Today', threads: [] }],
    ['yesterday', { key: 'yesterday', label: 'Yesterday', threads: [] }],
    ['week', { key: 'week', label: 'Previous 7 days', threads: [] }],
    ['older', { key: 'older', label: 'Older', threads: [] }],
  ]);

  for (const thread of threads) {
    const updatedAt = thread.updatedAt ? new Date(thread.updatedAt) : null;

    if (!updatedAt || Number.isNaN(updatedAt.getTime())) {
      buckets.get('older')?.threads.push(thread);
      continue;
    }

    const time = updatedAt.getTime();

    if (time >= startOfToday) {
      buckets.get('today')?.threads.push(thread);
    } else if (time >= startOfToday - dayMs) {
      buckets.get('yesterday')?.threads.push(thread);
    } else if (time >= startOfToday - 7 * dayMs) {
      buckets.get('week')?.threads.push(thread);
    } else {
      buckets.get('older')?.threads.push(thread);
    }
  }

  return [...buckets.values()].filter((group) => group.threads.length > 0);
};

/**
 * Sidebar list of the user's agents conversations: sessions grouped by
 * activity (Today / Yesterday / Previous 7 days / Older), an accent rail on
 * the active session, hover-revealed delete, and the sleeping bot on the
 * empty state. Grouping is derived purely from `updatedAt`, so it works both
 * in the full-page sidebar and the floating panel without extra data.
 *
 * Memoized: the chat surfaces re-render on every streamed delta, but the
 * thread list only changes when the threads, the active id, or one of the
 * (stable) handlers changes.
 */
const ThreadListBase = ({
  threadsState,
  activeThreadId,
  onSelectThread,
  onNewConversation,
  onThreadDeleted,
}: IThreadListProps) => {
  const { threads, loading, error } = threadsState;
  const [threadToDelete, setThreadToDelete] = useState<string | null>(null);

  const groups = useMemo(() => groupThreads(threads), [threads]);

  const [removeThread, { loading: removing }] = useMutation<
    IAgentsThreadRemoveData,
    IAgentsThreadRemoveVariables
  >(AGENTS_THREAD_REMOVE, {
    refetchQueries: [{ query: AGENTS_THREADS }],
    onCompleted: () => {
      if (threadToDelete) {
        onThreadDeleted?.(threadToDelete);
      }

      setThreadToDelete(null);
      toast({ title: 'Conversation deleted' });
    },
    onError: (removeError) => {
      toast({
        title: 'Failed to delete the conversation',
        description: removeError.message,
        variant: 'destructive',
      });
    },
  });

  const handleConfirmDelete = () => {
    if (!threadToDelete || removing) {
      return;
    }

    void removeThread({ variables: { threadId: threadToDelete } });
  };

  return (
    <div className="ea:flex ea:h-full ea:min-h-0 ea:flex-col">
      <div className="ea:flex ea:items-center ea:justify-between ea:gap-2 ea:px-3 ea:pb-1 ea:pt-3">
        <p className="ea:text-[11px] ea:font-semibold ea:uppercase ea:tracking-wider ea:text-muted-foreground">
          Conversations
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="ea:h-7 ea:gap-1 ea:px-2 ea:text-xs ea:text-muted-foreground ea:hover:text-foreground"
          onClick={onNewConversation}
          aria-label="New conversation"
        >
          <IconPlus className="ea:size-3.5" />
          New
        </Button>
      </div>

      <div className="ea:min-h-0 ea:flex-1 ea:overflow-y-auto ea:px-2 ea:pb-2 ea:pt-1">
        {loading && threads.length === 0 && (
          <div className="ea:space-y-1.5" aria-hidden="true">
            {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
              <div key={index} className="ea:space-y-1.5 ea:rounded-xl ea:px-3 ea:py-2.5">
                <span
                  className="ea:block ea:h-3 ea:animate-pulse ea:rounded ea:bg-accent"
                  style={{ width: `${60 + ((index * 13) % 35)}%` }}
                />
                <span className="ea:block ea:h-2 ea:w-1/4 ea:animate-pulse ea:rounded ea:bg-accent/70" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="ea:rounded-lg ea:border ea:border-destructive/30 ea:bg-destructive/5 ea:px-3 ea:py-2 ea:text-xs ea:text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && threads.length === 0 && (
          <div className="ea:flex ea:flex-col ea:items-center ea:gap-1.5 ea:px-3 ea:py-8 ea:text-center">
            {/* The bot naps while there is nothing to show — frozen on its
                sleeping frame so the empty state runs no animation loop. */}
            <BloubBot size={56} state="sleep" frozenAt={0} />
            <p className="ea:text-xs ea:text-muted-foreground">
              No conversations yet.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="ea:mt-1 ea:h-7 ea:gap-1 ea:rounded-full ea:px-3 ea:text-xs"
              onClick={onNewConversation}
            >
              <IconPlus className="ea:size-3.5" />
              Start one
            </Button>
          </div>
        )}

        {groups.map((group) => (
          <Fragment key={group.key}>
            <p className="ea:px-2.5 ea:pb-1 ea:pt-3 ea:text-[10px] ea:font-semibold ea:uppercase ea:tracking-wider ea:text-muted-foreground/70 ea:first:pt-1">
              {group.label}
            </p>
            <ul className="ea:space-y-0.5">
              {group.threads.map((thread) => {
                const isActive = thread.id === activeThreadId;

                return (
                  <li key={thread.id}>
                    <div
                      className={`ea:group ea:relative ea:flex ea:items-center ea:rounded-xl ea:py-2 ea:pl-3.5 ea:pr-1 ea:transition-colors ${
                        isActive ? 'ea:bg-primary/10' : 'ea:hover:bg-accent/60'
                      }`}
                    >
                      {isActive && (
                        <span
                          className="ea:absolute ea:left-0 ea:top-1/2 ea:h-5 ea:w-1 ea:-translate-y-1/2 ea:rounded-r-full ea:bg-primary"
                          aria-hidden="true"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => onSelectThread(thread.id)}
                        className="ea:min-w-0 ea:flex-1 ea:py-0.5 ea:text-left"
                      >
                        <span
                          className={`ea:block ea:truncate ea:text-[13px] ea:leading-tight ea:md:text-[13.5px] ${
                            isActive
                              ? 'ea:font-medium ea:text-foreground'
                              : 'ea:font-normal ea:text-foreground/90'
                          }`}
                        >
                          {thread.title || 'Untitled conversation'}
                        </span>
                        {thread.updatedAt && (
                          <span className="ea:mt-0.5 ea:block ea:truncate ea:text-[11px] ea:text-muted-foreground">
                            {formatDateISOStringToRelativeDateShort(
                              thread.updatedAt,
                            )}
                          </span>
                        )}
                      </button>
                      {/* Always visible where there is no reliable hover
                          (touch, and the drawer below `lg`); hover-revealed
                          only on the roomier pointer layouts. */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ea:size-6 ea:shrink-0 ea:text-muted-foreground ea:transition-opacity ea:lg:opacity-0 ea:lg:group-hover:opacity-100 ea:lg:focus-visible:opacity-100 ea:hover:text-destructive"
                        aria-label="Delete conversation"
                        onClick={() => setThreadToDelete(thread.id)}
                      >
                        <IconTrash className="ea:size-3.5" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Fragment>
        ))}
      </div>

      <AlertDialog
        open={threadToDelete !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setThreadToDelete(null);
          }
        }}
      >
        <AlertDialog.Content>
          <AlertDialog.Header>
            <AlertDialog.Title>Delete conversation</AlertDialog.Title>
            <AlertDialog.Description>
              This permanently deletes the conversation and its messages.
            </AlertDialog.Description>
          </AlertDialog.Header>
          <AlertDialog.Footer>
            <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
            <AlertDialog.Action
              className={buttonVariants({ variant: 'destructive' })}
              disabled={removing}
              onClick={(event) => {
                event.preventDefault();
                handleConfirmDelete();
              }}
            >
              Delete
            </AlertDialog.Action>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </div>
  );
};

export const ThreadList = memo(ThreadListBase);

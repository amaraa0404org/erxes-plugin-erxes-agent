import { useQuery } from '@apollo/client';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { usePermissionCheck } from 'ui-modules';

import { AGENTS_THREADS, AGENTS_THREADS_CHANGED } from '../graphql/threads';
import type { IAgentsThreadsData } from '../graphql/threads';
import type { IAgentsThread } from '../types';

const AGENTS_ACCESS_REQUIRED =
  'You need Agents access. Ask an administrator to assign the Agents User group.';

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
export const useAgentsThreads = (): IUseAgentsThreadsResult => {
  const { isLoaded, hasActionPermission } = usePermissionCheck();
  const canViewThreads =
    isLoaded && hasActionPermission('showAgents', 'erxes-agent');
  const refetchTimer = useRef<ReturnType<typeof setTimeout>>();

  const { data, loading, error, refetch, subscribeToMore } =
    useQuery<IAgentsThreadsData>(AGENTS_THREADS, {
      variables: { page: 1, perPage: 50 },
      skip: !canViewThreads,
    });

  // The server remains authoritative if the client's permissions are stale.
  const permissionDenied = error?.graphQLErrors.some(
    (graphQLError) =>
      graphQLError.extensions?.code === 'FORBIDDEN' ||
      graphQLError.message === 'Permission required',
  );

  useEffect(() => {
    if (!canViewThreads || permissionDenied) {
      return;
    }

    const unsubscribe = subscribeToMore({
      document: AGENTS_THREADS_CHANGED,
      updateQuery: (prev, { subscriptionData }) => {
        if (subscriptionData.data) {
          if (refetchTimer.current) {
            clearTimeout(refetchTimer.current);
          }

          refetchTimer.current = setTimeout(() => {
            void refetch().catch(() => {
              // Apollo exposes the failure through the list's error state.
            });
          }, 500);
        }

        return prev;
      },
    });

    return () => {
      if (refetchTimer.current) {
        clearTimeout(refetchTimer.current);
      }

      unsubscribe();
    };
  }, [canViewThreads, permissionDenied, refetch, subscribeToMore]);

  const handleRefetch = useCallback(async () => {
    if (canViewThreads) {
      await refetch();
    }
  }, [canViewThreads, refetch]);

  const threads =
    canViewThreads && !permissionDenied
      ? data?.agentsThreads?.threads
      : undefined;
  const errorMessage = !isLoaded
    ? undefined
    : !canViewThreads || permissionDenied
    ? AGENTS_ACCESS_REQUIRED
    : error?.message;
  const isLoading = !isLoaded || (canViewThreads && loading);

  // The chat surfaces re-render on every streamed delta; a memoized result
  // keeps the `threadsState` identity stable so the memoized `ThreadList`
  // can skip those renders.
  return useMemo<IUseAgentsThreadsResult>(
    () => ({
      threads: threads ?? [],
      loading: isLoading,
      error: errorMessage,
      refetch: handleRefetch,
    }),
    [threads, isLoading, errorMessage, handleRefetch],
  );
};

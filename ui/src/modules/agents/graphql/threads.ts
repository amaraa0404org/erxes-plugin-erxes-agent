import { gql } from '@apollo/client';

import type { IAgentsThread, IStoredMessage } from '../types';

/**
 * GraphQL documents for the agents thread history surface.
 *
 * Operation names are prefixed with `Agents` to stay unique repo-wide. The
 * `AgentsThreadsChanged` subscription is consumed purely as a refetch
 * signal: it fires when a chat turn is persisted and again when a thread
 * title is generated.
 */

export const AGENTS_THREADS = gql`
  query AgentsThreads($page: Int, $perPage: Int) {
    agentsThreads(page: $page, perPage: $perPage) {
      threads {
        id
        title
        createdAt
        updatedAt
      }
      total
      page
      perPage
      hasMore
    }
  }
`;

export const AGENTS_THREAD_DETAIL = gql`
  query AgentsThreadDetail($threadId: String!) {
    agentsThreadDetail(threadId: $threadId) {
      thread {
        id
        title
        createdAt
        updatedAt
      }
      messages {
        id
        role
        createdAt
        content
      }
    }
  }
`;

export const AGENTS_THREAD_REMOVE = gql`
  mutation AgentsThreadRemove($threadId: String!) {
    agentsThreadRemove(threadId: $threadId)
  }
`;

export const AGENTS_THREADS_CHANGED = gql`
  subscription AgentsThreadsChanged {
    agentsThreadsChanged {
      userId
    }
  }
`;

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

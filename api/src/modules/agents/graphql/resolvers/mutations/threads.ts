import { ExpectedError } from 'erxes-api-shared/utils';
import type { MastraMemory } from '@mastra/core/memory' with {
  'resolution-mode': 'import',
};

import { getAgentsMemory } from '@/agents/memory';
import { publishAgentsThreadsChanged } from '@/agents/threadsEvents';
import type { IContext } from '~/connectionResolvers';

export interface IAgentsThreadRemoveArgs {
  threadId: string;
}

export const agentsThreadMutations = {
  /**
   * Deletes one of the acting user's agents threads. The thread must exist
   * and belong to the acting user; the ownership error masks whether the
   * thread exists at all for other users. Publishes the standard refresh
   * signal so the sidebar refetches without a manual reload.
   */
  agentsThreadRemove: async (
    _p: undefined,
    { threadId }: IAgentsThreadRemoveArgs,
    ctx: IContext,
  ) => {
    await ctx.checkPermission('agentsChat');

    const memory: MastraMemory = await getAgentsMemory(ctx.subdomain);
    const thread = await memory.getThreadById({ threadId });

    if (!thread) {
      throw new ExpectedError('Thread not found.', 'NOT_FOUND');
    }

    if (thread.resourceId !== ctx.user._id) {
      throw new ExpectedError('Thread belongs to another user.', 'FORBIDDEN');
    }

    await memory.deleteThread(threadId);

    publishAgentsThreadsChanged(ctx.user._id);

    return true;
  },
};

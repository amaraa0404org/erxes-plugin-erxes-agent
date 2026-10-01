import { agentsConnectionMutations } from '@/agents/graphql/resolvers/mutations/connection';
import { agentsThreadMutations } from '@/agents/graphql/resolvers/mutations/threads';
import { agentsSettingsMutations } from '@/agents/graphql/resolvers/mutations/settings';

export const mutations = {
  ...agentsConnectionMutations,
  ...agentsThreadMutations,
  ...agentsSettingsMutations,
};

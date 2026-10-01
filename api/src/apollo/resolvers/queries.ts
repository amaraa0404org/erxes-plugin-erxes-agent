import { agentsConnectionsQueries } from '@/agents/graphql/resolvers/queries/connection';
import { agentsModelsQueries } from '@/agents/graphql/resolvers/queries/models';
import { agentsThreadsQueries } from '@/agents/graphql/resolvers/queries/threads';
import { agentsSettingsQueries } from '@/agents/graphql/resolvers/queries/settings';

export const queries = {
  ...agentsConnectionsQueries,
  ...agentsModelsQueries,
  ...agentsThreadsQueries,
  ...agentsSettingsQueries,
};

import {
  mutations as AgentsConnectionMutations,
  queries as AgentsConnectionQueries,
  types as AgentsConnectionTypes,
} from '@/agents/graphql/schemas/connection';
import {
  mutations as AgentsThreadMutations,
  queries as AgentsThreadQueries,
  types as AgentsThreadTypes,
} from '@/agents/graphql/schemas/threads';
import {
  mutations as AgentsSettingsMutations,
  queries as AgentsSettingsQueries,
  types as AgentsSettingsTypes,
} from '@/agents/graphql/schemas/settings';

export const types = `
  ${AgentsConnectionTypes}
  ${AgentsThreadTypes}
  ${AgentsSettingsTypes}
`;

export const queries = `
  ${AgentsConnectionQueries}
  ${AgentsThreadQueries}
  ${AgentsSettingsQueries}
`;

export const mutations = `
  ${AgentsConnectionMutations}
  ${AgentsThreadMutations}
  ${AgentsSettingsMutations}
`;

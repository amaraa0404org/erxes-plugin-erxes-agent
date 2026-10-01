import type { IPermissionConfig } from 'erxes-api-shared/core-types';

export const permissions: IPermissionConfig = {
  plugin: 'erxes-agent',

  modules: [
    {
      name: 'agents',
      description: 'AI agents',
      scopeField: null,
      ownerFields: [],
      scopes: [{ name: 'all', description: 'All agents access' }],
      actions: [
        {
          title: 'View agents',
          name: 'showAgents',
          description: 'View agents',
          always: true,
        },
        {
          title: 'Use agents chat',
          name: 'agentsChat',
          description: 'Use agents chat',
        },
        {
          title: 'Manage agents settings',
          name: 'manageAgentsSettings',
          description:
            'Manage tenant-wide agents settings (code mode toggle)',
        },
      ],
    },
  ],

  defaultGroups: [
    {
      id: 'erxes-agent:admin',
      name: 'Agents Admin',
      description: 'Full access to the AI agents',
      permissions: [
        {
          plugin: 'erxes-agent',
          module: 'agents',
          actions: ['showAgents', 'agentsChat', 'manageAgentsSettings'],
          scope: 'all',
        },
      ],
    },
    {
      id: 'erxes-agent:user',
      name: 'Agents User',
      description: 'Standard AI agents team member',
      permissions: [
        {
          plugin: 'erxes-agent',
          module: 'agents',
          actions: ['showAgents', 'agentsChat'],
          scope: 'all',
        },
      ],
    },
  ],
};
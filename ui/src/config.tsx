import { IconSparkles } from '@tabler/icons-react';
import { lazy, Suspense } from 'react';
import { IUIConfig } from 'erxes-ui';

import './styles.css';

const ErxesAgentSettingsNavigation = lazy(() =>
  import('@/ErxesAgentSettingsNavigation').then((module) => ({
    default: module.ErxesAgentSettingsNavigation,
  })),
);

export const CONFIG: IUIConfig = {
  // Module-federation remote/container names cannot contain dashes — Nx
  // normalizes `erxes-agent_ui` to the global `erxes_agent_ui` and the host
  // loads exposes via `${plugin.name}_ui`. So `name` must be the
  // underscored remote name, while `permissionName` keeps the dashed backend
  // plugin name used for permission checks.
  name: 'erxes_agent',
  permissionName: 'erxes-agent',
  path: 'erxes-agent',
  hasFloatingWidget: true,
  settingsNavigation: () => (
    <Suspense fallback={<div />}>
      <ErxesAgentSettingsNavigation />
    </Suspense>
  ),
  // The rail click on "Agents" navigates straight to the chat page at its
  // `chat` sub-route (the activity defaultPath) — deep-linking like every
  // other plugin so a stale remote's root redirect has nothing to match.
  // No navigationGroup content: the host renders a secondary plugin panel
  // only when content exists, so omitting it keeps the chat page free of
  // an extra sidebar step.
  navigationGroup: {
    name: 'Agents',
    defaultPath: 'erxes-agent/chat',
    icon: IconSparkles,
  },

  modules: [
    {
      name: 'agents',
      icon: IconSparkles,
      path: 'erxes-agent/chat',
    },
  ],
};

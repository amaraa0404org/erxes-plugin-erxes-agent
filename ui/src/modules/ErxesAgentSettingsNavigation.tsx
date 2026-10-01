import { IconCode, IconSparkles } from '@tabler/icons-react';
import { SettingsNavigationMenuLinkItem, Sidebar } from 'erxes-ui';

/**
 * Settings sidebar group registered through `CONFIG.settingsNavigation`.
 * `SettingsNavigationMenuLinkItem` prefixes the link with `settings/`, so the
 * entries point at `/settings/erxes-agent/connection` and
 * `/settings/erxes-agent/code-mode` where the host mounts this remote's
 * settings expose (`./erxes_agentSettings`).
 */
export const ErxesAgentSettingsNavigation = () => {
  return (
    <Sidebar.Group>
      <Sidebar.GroupLabel className="ea:h-4">Agents</Sidebar.GroupLabel>
      <Sidebar.GroupContent className="ea:pt-1">
        <Sidebar.Menu>
          <SettingsNavigationMenuLinkItem
            pathPrefix="erxes-agent"
            path="/connection"
            name="API key"
            icon={IconSparkles}
          />
          <SettingsNavigationMenuLinkItem
            pathPrefix="erxes-agent"
            path="/code-mode"
            name="Code mode"
            icon={IconCode}
          />
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  );
};

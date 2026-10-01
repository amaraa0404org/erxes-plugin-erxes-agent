import { IconCode, IconServer } from '@tabler/icons-react';
import { useMutation } from '@apollo/client';
import {
  Breadcrumb,
  Button,
  Label,
  Separator,
  Spinner,
  Switch,
  toast,
} from 'erxes-ui';
import { Link } from 'react-router-dom';
import { PageHeader, usePermissionCheck } from 'ui-modules';

import {
  AGENTS_SETTINGS,
  AGENTS_SETTINGS_UPDATE,
} from '@/agents/graphql/settings';
import type {
  IAgentsSettingsUpdateData,
  IAgentsSettingsUpdateVariables,
} from '@/agents/graphql/settings';
import { useAgentsSettings } from '@/agents/hooks/useAgentsSettings';

/**
 * Tenant-wide "Code mode" settings: when enabled, every user's chat agent
 * additionally carries the sandboxed `execute_typescript` tool (model-
 * authored TypeScript runs in the server's in-process QuickJS sandbox).
 * Every agents user can read the state; only admins (`manageAgentsSettings`)
 * can change it — the switch is disabled for everyone else.
 */
export const SettingsCodeModePage = () => {
  const { settings, loading, error } = useAgentsSettings();
  const { isLoaded, hasActionPermission } = usePermissionCheck();

  const canManage = isLoaded && hasActionPermission('manageAgentsSettings', 'erxes-agent');
  const enabled = settings?.codeModeEnabled === true;

  const [updateSettings, { loading: saving }] = useMutation<
    IAgentsSettingsUpdateData,
    IAgentsSettingsUpdateVariables
  >(AGENTS_SETTINGS_UPDATE, {
    refetchQueries: [{ query: AGENTS_SETTINGS }],
    onCompleted: (data) => {
      toast({
        title:
          data?.agentsSettingsUpdate?.codeModeEnabled === true
            ? 'Code mode enabled'
            : 'Code mode disabled',
      });
    },
    onError: (updateError) => {
      toast({
        title: 'Failed to update code mode',
        description: updateError.message,
        variant: 'destructive',
      });
    },
  });

  const handleToggle = (checked: boolean) => {
    if (saving) {
      return;
    }

    void updateSettings({ variables: { codeModeEnabled: checked } });
  };

  return (
    <div className="ea:flex ea:h-full ea:flex-col">
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="ea:gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to="/erxes-agent/chat">
                    <IconCode />
                    Agents
                  </Link>
                </Button>
              </Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to="/settings/erxes-agent">Settings</Link>
                </Button>
              </Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                <span className="ea:text-muted-foreground">Code mode</span>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton
            breadcrumb={['Agents', 'Settings', 'Code mode']}
            icon="IconCode"
          />
        </PageHeader.Start>
      </PageHeader>

      <div className="ea:flex-1 ea:overflow-y-auto">
        {loading ? (
          <div className="ea:flex ea:justify-center ea:p-8">
            <Spinner className="ea:size-5" />
          </div>
        ) : error ? (
          <p className="ea:mx-auto ea:max-w-xl ea:p-6 ea:text-sm ea:text-destructive">
            {error}
          </p>
        ) : (
          <div className="ea:mx-auto ea:max-w-xl ea:space-y-4 ea:p-6">
            <div className="ea:rounded-xl ea:border ea:p-6">
              <div className="ea:flex ea:items-start ea:justify-between ea:gap-4">
                <div className="ea:space-y-1.5">
                  <Label className="ea:font-sans ea:text-sm ea:font-medium ea:normal-case">
                    Code mode
                  </Label>
                  <p className="ea:max-w-sm ea:text-xs ea:text-muted-foreground">
                    Lets the agent write and run TypeScript in a sandbox to
                    search, aggregate, and compute across your workspace
                    tools, then answer with one result.
                  </p>
                </div>
                <Switch
                  checked={enabled}
                  disabled={!canManage || saving}
                  onCheckedChange={handleToggle}
                  aria-label="Enable code mode"
                />
              </div>
              {!canManage && (
                <p className="ea:mt-4 ea:rounded-lg ea:border ea:border-dashed ea:p-3 ea:text-xs ea:text-muted-foreground">
                  Managed by your administrators.
                </p>
              )}
            </div>

            <div className="ea:rounded-xl ea:border ea:p-6">
              <Label className="ea:font-sans ea:text-sm ea:font-medium ea:normal-case">
                Sandbox environment
              </Label>
              <div className="ea:mt-3 ea:flex ea:items-start ea:gap-3 ea:rounded-lg ea:border ea:p-3">
                <span className="ea:mt-0.5 ea:flex ea:size-8 ea:shrink-0 ea:items-center ea:justify-center ea:rounded-md ea:bg-muted">
                  <IconServer className="ea:size-4 ea:text-muted-foreground" />
                </span>
                <div className="ea:min-w-0">
                  <p className="ea:text-sm ea:font-medium">
                    In-process (built-in server)
                    <span className="ea:ml-2 ea:rounded-full ea:bg-primary/10 ea:px-2 ea:py-0.5 ea:text-[10px] ea:font-medium ea:uppercase ea:tracking-wide ea:text-primary">
                      Default
                    </span>
                  </p>
                  <p className="ea:mt-1 ea:text-xs ea:text-muted-foreground">
                    Code runs inside this server in an isolated WebAssembly
                    interpreter — no filesystem, network, or process access.
                    Destructive tool calls always stay behind the normal
                    approval prompt.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

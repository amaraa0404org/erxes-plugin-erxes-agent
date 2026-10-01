import {
  IconDeviceFloppy,
  IconEye,
  IconEyeOff,
  IconSparkles,
  IconTrash,
} from '@tabler/icons-react';
import { useMutation } from '@apollo/client';
import {
  AlertDialog,
  Breadcrumb,
  Button,
  Input,
  Label,
  Separator,
  Spinner,
  buttonVariants,
  formatDateISOStringToRelativeDate,
  toast,
} from 'erxes-ui';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from 'ui-modules';

import { ProviderIcon } from '@/agents/components/ProviderIcon';
import {
  getProviderLabel,
  getProviderOption,
  ProviderPicker,
} from '@/agents/components/ProviderPicker';
import {
  AGENTS_CONNECTIONS,
  AGENTS_CONNECTION_REMOVE,
  AGENTS_CONNECTION_UPSERT,
} from '@/agents/graphql/connection';
import type {
  IAgentsConnectionRemoveData,
  IAgentsConnectionRemoveVariables,
  IAgentsConnectionUpsertData,
  IAgentsConnectionUpsertVariables,
} from '@/agents/graphql/connection';
import { useAgentsConnection } from '@/agents/hooks/useAgentsConnection';

/**
 * Settings BYOK management: every configured provider is listed with its
 * stored entry, and more providers can be added side by side — pick a
 * provider, paste the API key, save. The model is chosen server-side by the
 * provider default (overridable from the chat's model picker), so there is
 * no model field here. The backend never returns stored keys.
 */
export const SettingsConnectionPage = () => {
  const { connections, loading, error } = useAgentsConnection();

  const [provider, setProvider] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [removingProvider, setRemovingProvider] = useState<string | null>(
    null,
  );

  const refetchQueries = [{ query: AGENTS_CONNECTIONS }];

  const [upsertConnection, { loading: saving }] = useMutation<
    IAgentsConnectionUpsertData,
    IAgentsConnectionUpsertVariables
  >(AGENTS_CONNECTION_UPSERT, {
    refetchQueries,
    onCompleted: () => {
      toast({ title: 'API key saved' });
      setProvider('');
      setApiKey('');
      setShowKey(false);
    },
    onError: (upsertError) => {
      toast({
        title: 'Failed to save the connection',
        description: upsertError.message,
        variant: 'destructive',
      });
    },
  });

  const [removeConnection, { loading: removing }] = useMutation<
    IAgentsConnectionRemoveData,
    IAgentsConnectionRemoveVariables
  >(AGENTS_CONNECTION_REMOVE, {
    refetchQueries,
    onCompleted: () => {
      toast({ title: 'API key removed' });
      setRemovingProvider(null);
    },
    onError: (removeError) => {
      toast({
        title: 'Failed to remove the connection',
        description: removeError.message,
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    const trimmedProvider = provider.trim();

    if (!trimmedProvider || saving) {
      return;
    }

    void upsertConnection({
      variables: { provider: trimmedProvider, apiKey: apiKey.trim() },
    });
  };

  const selectedProvider = provider.trim();
  const storedProvider = connections.find(
    (connection) => connection.provider === selectedProvider,
  );

  return (
    <div className="ea:flex ea:h-full ea:flex-col">
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="ea:gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to="/erxes-agent/chat">
                    <IconSparkles />
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
                <span className="ea:text-muted-foreground">API key</span>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton
            breadcrumb={['Agents', 'Settings', 'API key']}
            icon="IconSparkles"
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
          <div className="ea:mx-auto ea:max-w-2xl ea:space-y-4 ea:p-6">
            <div className="ea:rounded-xl ea:border ea:p-6">
              <div className="ea:mb-4">
                <Label className="ea:font-sans ea:text-sm ea:font-medium ea:normal-case">
                  Configured providers
                </Label>
                <p className="ea:mt-1 ea:text-xs ea:text-muted-foreground">
                  Each provider keeps its own key; the chat's model picker
                  lists models from every configured provider.
                </p>
              </div>

              {connections.length === 0 ? (
                <div className="ea:flex ea:flex-col ea:items-center ea:gap-1.5 ea:rounded-lg ea:border ea:border-dashed ea:p-6 ea:text-center">
                  <IconSparkles
                    className="ea:size-5 ea:text-muted-foreground"
                    aria-hidden="true"
                  />
                  <p className="ea:text-sm ea:text-muted-foreground">
                    No provider configured yet. Add one below.
                  </p>
                </div>
              ) : (
                <ul className="ea:space-y-2">
                  {connections.map((connection) => {
                    const option = getProviderOption(connection.provider);

                    return (
                      <li
                        key={connection.provider}
                        className="ea:flex ea:items-center ea:gap-3 ea:rounded-lg ea:border ea:px-3 ea:py-2.5"
                      >
                        <ProviderIcon
                          provider={connection.provider}
                          className="ea:size-8"
                        />
                        <div className="ea:min-w-0 ea:flex-1">
                          <p className="ea:truncate ea:text-sm ea:font-medium">
                            {getProviderLabel(connection.provider)}{' '}
                            <span className="ea:font-normal ea:text-muted-foreground">
                              ({connection.model})
                            </span>
                          </p>
                          {option && (
                            <p className="ea:truncate ea:text-xs ea:text-muted-foreground">
                              {option.description}
                            </p>
                          )}
                        </div>
                        <span className="ea:flex ea:shrink-0 ea:items-center ea:gap-1.5 ea:text-xs ea:text-muted-foreground">
                          <span
                            className="ea:size-1.5 ea:shrink-0 ea:rounded-full ea:bg-emerald-500"
                            aria-hidden="true"
                          />
                          {connection.updatedAt
                            ? formatDateISOStringToRelativeDate(
                                connection.updatedAt,
                              )
                            : ''}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ea:size-7 ea:shrink-0 ea:text-muted-foreground ea:hover:text-destructive"
                          aria-label={`Remove ${getProviderLabel(connection.provider)} key`}
                          onClick={() =>
                            setRemovingProvider(connection.provider)
                          }
                        >
                          <IconTrash className="ea:size-3.5" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="ea:rounded-xl ea:border ea:p-6">
              <div className="ea:space-y-4">
                <div className="ea:space-y-1.5">
                  <Label className="ea:font-sans ea:text-sm ea:font-medium ea:normal-case">
                    Add or update a provider
                  </Label>
                  <ProviderPicker
                    value={provider}
                    onChange={(nextProvider) => {
                      setProvider(nextProvider);
                      setApiKey('');
                      setShowKey(false);
                    }}
                  />
                </div>

                {selectedProvider && (
                  <div className="ea:space-y-1.5">
                    <Label
                      htmlFor="agents-settings-api-key"
                      className="ea:font-sans ea:text-sm ea:font-medium ea:normal-case"
                    >
                      API key
                    </Label>
                    <div className="ea:relative">
                      <Input
                        id="agents-settings-api-key"
                        type={showKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(event) => setApiKey(event.target.value)}
                        autoComplete="off"
                        className="ea:pr-10"
                        placeholder={
                          storedProvider?.hasKey
                            ? 'Saved — leave empty to keep your current key'
                            : 'Paste your API key'
                        }
                      />
                      <div className="ea:absolute ea:inset-y-0 ea:right-1 ea:flex ea:items-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="ea:size-6 ea:text-muted-foreground ea:hover:text-foreground"
                          onClick={() => setShowKey((visible) => !visible)}
                          aria-label={showKey ? 'Hide API key' : 'Show API key'}
                          aria-pressed={showKey}
                        >
                          {showKey ? (
                            <IconEyeOff className="ea:size-3.5" />
                          ) : (
                            <IconEye className="ea:size-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <p className="ea:text-xs ea:text-muted-foreground">
                      Your key is stored securely and never displayed again.
                    </p>
                  </div>
                )}
              </div>

              <div className="ea:mt-6 ea:flex ea:justify-end">
                <Button
                  onClick={handleSave}
                  disabled={!selectedProvider || saving}
                >
                  {saving ? (
                    <Spinner className="ea:size-4" />
                  ) : (
                    <IconDeviceFloppy />
                  )}
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <AlertDialog
        open={removingProvider !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRemovingProvider(null);
          }
        }}
      >
        <AlertDialog.Content>
          <AlertDialog.Header>
            <AlertDialog.Title className="ea:flex ea:items-center ea:gap-2">
              {removingProvider && (
                <ProviderIcon provider={removingProvider} className="ea:size-5" />
              )}
              Remove {removingProvider ? getProviderLabel(removingProvider) : ''}{' '}
              key
            </AlertDialog.Title>
            <AlertDialog.Description>
              This provider disappears from the chat's model picker until a new
              key is added.
            </AlertDialog.Description>
          </AlertDialog.Header>
          <AlertDialog.Footer>
            <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
            <AlertDialog.Action
              className={buttonVariants({ variant: 'destructive' })}
              disabled={removing}
              onClick={(event) => {
                event.preventDefault();

                if (removingProvider) {
                  void removeConnection({
                    variables: { provider: removingProvider },
                  });
                }
              }}
            >
              {removing ? <Spinner className="ea:size-4" /> : 'Remove'}
            </AlertDialog.Action>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </div>
  );
};

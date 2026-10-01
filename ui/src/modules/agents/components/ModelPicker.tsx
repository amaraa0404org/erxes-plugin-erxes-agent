import {
  IconArrowLeft,
  IconChevronRight,
  IconSparkles,
} from '@tabler/icons-react';
import { Button, Combobox, Command, Popover, Spinner } from 'erxes-ui';
import { useState } from 'react';

import type { IUseAgentsModelsResult } from '../hooks/useAgentsModels';
import { ProviderIcon } from './ProviderIcon';
import { getProviderLabel } from './ProviderPicker';

export interface IModelPickerProps {
  models: IUseAgentsModelsResult;
  /** Selected `provider|model` value; '' means server default (Auto). */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /**
   * Model the server default (Auto) actually runs — the first configured
   * provider's stored model. Shown in the Auto entry's label so the
   * default is never hidden.
   */
  autoModel?: string;
}

const VALUE_SEPARATOR = '|';

export const modelSelectionValue = (provider: string, model: string) =>
  provider && model ? `${provider}${VALUE_SEPARATOR}${model}` : '';

/**
 * Chat model picker, in two steps: the menu first lists Auto and every
 * configured provider (brand mark + model count), then a provider view
 * shows its models behind a search box. Selections report the
 * `provider|model` contract value; Auto reports ''.
 */
export const ModelPicker = ({
  models,
  value,
  onChange,
  disabled = false,
  autoModel,
}: IModelPickerProps) => {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'selection' | 'models'>('selection');
  const [activeProvider, setActiveProvider] = useState('');

  const separatorIndex = value.indexOf(VALUE_SEPARATOR);
  const selectedProvider =
    separatorIndex === -1 ? '' : value.slice(0, separatorIndex);
  const selectedModel =
    separatorIndex === -1 ? '' : value.slice(separatorIndex + 1);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setView('selection');
      setActiveProvider('');
    }
  };

  const selectAuto = () => {
    onChange('');
    setOpen(false);
  };

  const openProvider = (provider: string) => {
    setActiveProvider(provider);
    setView('models');
  };

  const selectModel = (provider: string, model: string) => {
    onChange(modelSelectionValue(provider, model));
    setOpen(false);
  };

  const activeGroup = models.providerModels.find(
    (group) => group.provider === activeProvider,
  );
  const activeModels = activeGroup?.models ?? [];
  const activeLabel = getProviderLabel(activeProvider);

  const autoLabel = autoModel ? `Auto (${autoModel})` : 'Auto (server default)';

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <Combobox.Trigger
        className="ea:h-8 ea:min-w-0 ea:max-w-[200px] ea:flex-1 ea:justify-between ea:rounded-full ea:text-[13px]"
        disabled={
          disabled || models.loading || models.providerModels.length === 0
        }
        aria-label="Model"
      >
        {models.loading ? (
          <span className="ea:flex ea:min-w-0 ea:items-center ea:gap-1.5">
            <Spinner className="ea:size-3.5 ea:shrink-0" />
            Model
          </span>
        ) : selectedModel ? (
          <span className="ea:flex ea:min-w-0 ea:items-center ea:gap-1.5">
            <ProviderIcon
              provider={selectedProvider}
              className="ea:size-4 ea:shrink-0"
            />
            <span className="ea:truncate ea:font-mono">{selectedModel}</span>
          </span>
        ) : (
          <span className="ea:flex ea:min-w-0 ea:items-center ea:gap-1.5">
            <IconSparkles
              className="ea:size-4 ea:shrink-0 ea:text-primary"
              aria-hidden="true"
            />
            <span className="ea:truncate">{autoLabel}</span>
          </span>
        )}
      </Combobox.Trigger>
      <Combobox.Content className="ea:w-72">
        {view === 'selection' ? (
          <Command>
            <Command.List>
              <Command.Item
                value="auto"
                onSelect={selectAuto}
                className="ea:text-[13px]"
              >
                <IconSparkles
                  className="ea:size-4 ea:shrink-0 ea:text-primary"
                  aria-hidden="true"
                />
                <span className="ea:min-w-0 ea:truncate">{autoLabel}</span>
                <Combobox.Check checked={!selectedModel} />
              </Command.Item>
              {models.providerModels.map((group) => (
                <Command.Item
                  key={group.provider}
                  value={group.provider}
                  onSelect={() => openProvider(group.provider)}
                  className="ea:text-[13px]"
                >
                  <ProviderIcon
                    provider={group.provider}
                    className="ea:size-4 ea:shrink-0"
                  />
                  <span className="ea:min-w-0 ea:truncate">
                    {getProviderLabel(group.provider)}
                  </span>
                  <span className="ea:ml-auto ea:shrink-0 ea:text-xs ea:text-muted-foreground">
                    {(group.models ?? []).length} models
                  </span>
                  <Combobox.Check
                    checked={selectedProvider === group.provider}
                  />
                  <IconChevronRight
                    className="ea:size-3.5 ea:shrink-0 ea:text-muted-foreground"
                    aria-hidden="true"
                  />
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        ) : (
          <Command key={`models:${activeProvider}`}>
            <div className="ea:flex ea:items-center ea:gap-1.5 ea:border-b ea:px-1.5 ea:py-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="ea:size-6 ea:shrink-0"
                onClick={() => setView('selection')}
                aria-label="Back to provider selection"
              >
                <IconArrowLeft className="ea:size-3.5" />
              </Button>
              <ProviderIcon
                provider={activeProvider}
                className="ea:size-4 ea:shrink-0"
              />
              <span className="ea:min-w-0 ea:truncate ea:text-[13px] ea:font-medium">
                {activeLabel}
              </span>
              <span className="ea:ml-auto ea:shrink-0 ea:text-[11px] ea:text-muted-foreground">
                {activeModels.length}{' '}
                {activeModels.length === 1 ? 'model' : 'models'}
              </span>
            </div>
            <Command.Input placeholder={`Search ${activeLabel} models…`} focusOnMount />
            <Command.List>
              <Command.Empty>No models match</Command.Empty>
              {activeModels.map((model) => (
                <Command.Item
                  key={model}
                  value={model}
                  onSelect={() => selectModel(activeProvider, model)}
                  className="ea:text-[13px]"
                >
                  <span className="ea:min-w-0 ea:truncate ea:font-mono">
                    {model}
                  </span>
                  <Combobox.Check
                    checked={selectedProvider === activeProvider && selectedModel === model}
                  />
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        )}
      </Combobox.Content>
    </Popover>
  );
};

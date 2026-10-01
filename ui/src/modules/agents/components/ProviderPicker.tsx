import { IconCheck } from '@tabler/icons-react';

import { ProviderIcon } from './ProviderIcon';

export interface IProviderOption {
  value: string;
  label: string;
  description: string;
  /** Model stored for a fresh entry; mirrors backend PROVIDER_DEFAULTS. */
  defaultModel: string;
}

/** Provider whitelist used by the settings connection form. */
export const PROVIDER_OPTIONS: IProviderOption[] = [
  {
    value: 'openai',
    label: 'OpenAI',
    description: 'GPT models',
    defaultModel: 'gpt-5.6-luna',
  },
  {
    value: 'grok',
    label: 'Grok',
    description: 'xAI models',
    defaultModel: 'grok-4.5',
  },
  {
    value: 'kimi',
    label: 'Kimi',
    description: 'Moonshot Kimi',
    defaultModel: 'kimi-k3',
  },
  {
    value: 'kimi-code',
    label: 'Kimi Code',
    description: 'Coding-focused Kimi',
    defaultModel: 'kimi-for-coding',
  },
];

export interface IProviderPickerProps {
  value: string;
  onChange: (provider: string) => void;
}

/** Stored provider option lookup (`openai` -> its PROVIDER_OPTIONS entry). */
export const getProviderOption = (
  value: string,
): IProviderOption | undefined =>
  PROVIDER_OPTIONS.find((option) => option.value === value);

/** Human label for a provider value (`openai` -> `OpenAI`). */
export const getProviderLabel = (value: string): string =>
  getProviderOption(value)?.label ?? value;

/**
 * 2x2 grid of selectable provider cards, used by the settings connection
 * form. Each card leads with the provider's brand mark and shows the
 * default model in parentheses next to the label so it is never hidden
 * which model a fresh entry will run.
 */
export const ProviderPicker = ({ value, onChange }: IProviderPickerProps) => (
  <div
    className="ea:grid ea:grid-cols-2 ea:gap-2"
    role="group"
    aria-label="Provider"
  >
    {PROVIDER_OPTIONS.map((option) => {
      const selected = option.value === value;

      return (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={selected}
          className={`ea:relative ea:flex ea:items-center ea:gap-3 ea:rounded-lg ea:border ea:p-3 ea:text-left ea:transition-colors ${
            selected
              ? 'ea:border-primary ea:bg-primary/5'
              : 'ea:hover:bg-accent/50'
          }`}
        >
          <ProviderIcon provider={option.value} className="ea:size-9" />
          <span className="ea:min-w-0">
            <span className="ea:block ea:truncate ea:text-[13px] ea:font-medium">
              {option.label}{' '}
              <span className="ea:font-normal ea:text-muted-foreground">
                ({option.defaultModel})
              </span>
            </span>
            <span className="ea:block ea:truncate ea:text-xs ea:text-muted-foreground">
              {option.description}
            </span>
          </span>
          {selected && (
            <IconCheck
              className="ea:absolute ea:right-2.5 ea:top-2.5 ea:size-4 ea:text-primary"
              aria-hidden="true"
            />
          )}
        </button>
      );
    })}
  </div>
);

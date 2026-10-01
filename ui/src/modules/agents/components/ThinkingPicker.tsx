import { IconBulb } from '@tabler/icons-react';
import { Select } from 'erxes-ui';

import type { IAgentsThinkingLevel } from '../hooks/useAgentsChat';

const THINKING_OPTIONS: {
  value: IAgentsThinkingLevel;
  label: string;
  /** Label used on a narrow composer, where the prefix does not fit. */
  shortLabel: string;
}[] = [
  { value: 'off', label: 'Thinking: off', shortLabel: 'Off' },
  { value: 'minimal', label: 'Thinking: minimal', shortLabel: 'Minimal' },
  { value: 'low', label: 'Thinking: low', shortLabel: 'Low' },
  { value: 'medium', label: 'Thinking: medium', shortLabel: 'Medium' },
  { value: 'high', label: 'Thinking: high', shortLabel: 'High' },
];

export interface IThinkingPickerProps {
  value: IAgentsThinkingLevel;
  onChange: (level: IAgentsThinkingLevel) => void;
  disabled?: boolean;
}

/** Per-turn thinking depth; mapped to each provider's native option. */
export const ThinkingPicker = ({
  value,
  onChange,
  disabled = false,
}: IThinkingPickerProps) => {
  const active = THINKING_OPTIONS.find((option) => option.value === value);
  const label = active?.label ?? 'Thinking';
  const shortLabel = active?.shortLabel ?? label;

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <Select.Trigger
        className="ea:h-8 ea:w-[104px] ea:shrink-0 ea:justify-between ea:rounded-full ea:text-[13px] ea:sm:w-[124px] ea:md:w-[150px]"
        aria-label="Thinking level"
      >
        <div className="ea:flex ea:min-w-0 ea:items-center ea:gap-1.5">
          <IconBulb className="ea:size-3.5 ea:shrink-0 ea:text-muted-foreground" />
          {/* The "Thinking:" prefix is the first thing to go on a narrow
              composer; the level alone still reads. */}
          <span className="ea:truncate ea:sm:hidden">{shortLabel}</span>
          <span className="ea:hidden ea:truncate ea:sm:inline">{label}</span>
        </div>
      </Select.Trigger>
      <Select.Content>
        {THINKING_OPTIONS.map((option) => (
          <Select.Item key={option.value} value={option.value}>
            {option.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  );
};

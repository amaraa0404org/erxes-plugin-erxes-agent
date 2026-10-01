import type { IAgentsThinkingLevel } from '../hooks/useAgentsChat';
export interface IThinkingPickerProps {
    value: IAgentsThinkingLevel;
    onChange: (level: IAgentsThinkingLevel) => void;
    disabled?: boolean;
}
/** Per-turn thinking depth; mapped to each provider's native option. */
export declare const ThinkingPicker: ({ value, onChange, disabled, }: IThinkingPickerProps) => import("react").JSX.Element;

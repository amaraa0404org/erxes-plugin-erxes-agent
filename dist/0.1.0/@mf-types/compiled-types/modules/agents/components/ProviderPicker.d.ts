export interface IProviderOption {
    value: string;
    label: string;
    description: string;
    /** Model stored for a fresh entry; mirrors backend PROVIDER_DEFAULTS. */
    defaultModel: string;
}
/** Provider whitelist used by the settings connection form. */
export declare const PROVIDER_OPTIONS: IProviderOption[];
export interface IProviderPickerProps {
    value: string;
    onChange: (provider: string) => void;
}
/** Stored provider option lookup (`openai` -> its PROVIDER_OPTIONS entry). */
export declare const getProviderOption: (value: string) => IProviderOption | undefined;
/** Human label for a provider value (`openai` -> `OpenAI`). */
export declare const getProviderLabel: (value: string) => string;
/**
 * 2x2 grid of selectable provider cards, used by the settings connection
 * form. Each card leads with the provider's brand mark and shows the
 * default model in parentheses next to the label so it is never hidden
 * which model a fresh entry will run.
 */
export declare const ProviderPicker: ({ value, onChange }: IProviderPickerProps) => import("react").JSX.Element;

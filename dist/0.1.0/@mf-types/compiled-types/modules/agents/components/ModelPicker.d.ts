import type { IUseAgentsModelsResult } from '../hooks/useAgentsModels';
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
export declare const modelSelectionValue: (provider: string, model: string) => string;
/**
 * Chat model picker, in two steps: the menu first lists Auto and every
 * configured provider (brand mark + model count), then a provider view
 * shows its models behind a search box. Selections report the
 * `provider|model` contract value; Auto reports ''.
 */
export declare const ModelPicker: ({ models, value, onChange, disabled, autoModel, }: IModelPickerProps) => import("react").JSX.Element;

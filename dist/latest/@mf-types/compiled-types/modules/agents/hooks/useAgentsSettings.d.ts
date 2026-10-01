import type { IAgentsSettings } from '../graphql/settings';
export interface IUseAgentsSettingsResult {
    settings: IAgentsSettings | null;
    loading: boolean;
    error: string | undefined;
}
/**
 * Loads the tenant-wide agents settings (admin-controlled code-mode flag).
 * Every agents user can read the state; only admins can change it.
 */
export declare const useAgentsSettings: () => IUseAgentsSettingsResult;

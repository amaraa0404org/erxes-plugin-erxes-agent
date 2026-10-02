import type { IAgentsProviderModels } from '../graphql/connection';
export interface IUseAgentsModelsResult {
    /** One group per configured provider whose /models fetch succeeded. */
    providerModels: IAgentsProviderModels[];
    loading: boolean;
    error: string | undefined;
}
/**
 * Lists the model ids of every provider the acting user has configured.
 * The backend fetches each provider's /models endpoint server-side with the
 * stored keys, so no secret ever reaches the browser; providers whose
 * listing fails are simply absent from the result.
 */
export declare const useAgentsModels: () => IUseAgentsModelsResult;

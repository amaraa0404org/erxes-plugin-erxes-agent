import { ExpectedError } from 'erxes-api-shared/utils';
import type { IContext } from '~/connectionResolvers';
import { AGENTS_CODE_MODE_ENVIRONMENTS } from '@/agents/db/definitions/settings';
import { toPublicSettings } from '@/agents/graphql/resolvers/queries/settings';

export interface IAgentsSettingsUpdateArgs {
  codeModeEnabled?: boolean;
  codeModeEnvironment?: string;
}

export const agentsSettingsMutations = {
  /**
   * Updates the tenant's settings. Admin-only (`manageAgentsSettings` is
   * granted to the erxes-agent:admin default group only): the code-mode
   * toggle changes what every user's chat agent can execute.
   */
  agentsSettingsUpdate: async (
    _p: undefined,
    args: IAgentsSettingsUpdateArgs,
    ctx: IContext,
  ) => {
    await ctx.checkPermission('manageAgentsSettings');

    const environment = args.codeModeEnvironment?.trim();

    if (
      environment &&
      !AGENTS_CODE_MODE_ENVIRONMENTS.includes(
        environment as (typeof AGENTS_CODE_MODE_ENVIRONMENTS)[number],
      )
    ) {
      throw new ExpectedError(
        `Unsupported code mode environment "${environment}".`,
        'VALIDATION_ERROR',
      );
    }

    if (args.codeModeEnabled === undefined && !environment) {
      throw new ExpectedError(
        'Provide at least one setting to update.',
        'VALIDATION_ERROR',
      );
    }

    const doc = await ctx.models.AgentsSettings.updateSettings({
      ...(args.codeModeEnabled !== undefined
        ? { codeModeEnabled: args.codeModeEnabled }
        : {}),
      ...(environment ? { codeModeEnvironment: environment } : {}),
    });

    return toPublicSettings(doc);
  },
};

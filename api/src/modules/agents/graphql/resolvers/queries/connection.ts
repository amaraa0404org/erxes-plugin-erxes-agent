import type { IContext } from '~/connectionResolvers';
import type { IAgentsConnectionEntry } from '@/agents/@types/connection';

/**
 * Maps one stored connection entry to the public GraphQL shape. The API key
 * never leaves the database: callers only see whether one is stored.
 */
export const toPublicConnection = (
  connection: IAgentsConnectionEntry,
  updatedAt?: Date,
) => ({
  provider: connection.provider,
  model: connection.model,
  hasKey: !!connection.config?.apiKey,
  updatedAt,
});

export const agentsConnectionsQueries = {
  /**
   * Returns the acting user's own BYOK connections (masked), one entry per
   * configured provider. Self data only — the lookup is keyed by the acting
   * user id from the gateway identity, never by an argument.
   */
  agentsConnections: async (_p: undefined, _a: undefined, ctx: IContext) => {
    await ctx.checkPermission('agentsChat');

    const doc = await ctx.models.AgentsConnection.getConnections(
      ctx.user._id,
    );

    return (doc?.connections ?? []).map((connection) =>
      toPublicConnection(connection, doc?.updatedAt),
    );
  },
};

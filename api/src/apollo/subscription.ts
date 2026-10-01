import { withFilter } from 'graphql-subscriptions';

/**
 * Subscription bundle the gateway downloads from `/subscriptionPlugin.js` and
 * aggregates into its graphql-ws subscription schema (same contract as every
 * other subscribing plugin).
 *
 * The gateway saves this file with a `.js` extension and parses it as
 * JavaScript, so it must contain NO TypeScript-only syntax (no interfaces,
 * no type annotations, no casts) — the same constraint block_api's bundle
 * follows.
 *
 * `agentsThreadsChanged` is a per-user refetch signal: the chat routes
 * publish it through the shared Redis pubsub when a turn is persisted and
 * again when Mastra's asynchronous thread title lands, and the filter below
 * delivers it only to the subscriber that owns the thread, using the user
 * decoded from the `auth-token` cookie on the websocket upgrade.
 */

const THREADS_CHANGED_CHANNEL = 'agentsThreadsChanged';

export default {
  name: 'erxes-agent',
  typeDefs: 'agentsThreadsChanged: AgentsThreadsChanged',
  generateResolvers: (graphqlPubsub) => {
    return {
      agentsThreadsChanged: {
        resolve: (payload) => payload.agentsThreadsChanged,
        subscribe: withFilter(
          () => graphqlPubsub.asyncIterator(THREADS_CHANGED_CHANNEL),
          (payload, _args, context) => {
            const event = payload && payload.agentsThreadsChanged;
            const userId = context && context.user && context.user._id;

            return !!userId && !!event && event.userId === userId;
          },
        ),
      },
    };
  },
};

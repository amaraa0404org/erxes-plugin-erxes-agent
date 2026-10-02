import 'dotenv/config';
import * as path from 'path';
import { startPlugin } from 'erxes-api-shared/utils';
import { typeDefs } from '~/apollo/typeDefs';
import { appRouter } from '~/trpc/init-trpc';
import { resolvers } from '~/apollo/resolvers';
import { generateModels } from './connectionResolvers';
import { router } from './routes';
import { permissions } from '~/meta/permissions';

startPlugin({
  name: 'erxes-agent',
  port: 3306,
  // Browser calls these REST routes cross-origin (host :3001 → gateway :4000)
  // with `credentials: 'include'` because auth lives in the httpOnly
  // `auth-token` cookie. The plugin's proxied response headers win, so with
  // the default `cors()` options (`Access-Control-Allow-Origin: *`) the
  // browser rejects every credentialed response with "Failed to fetch".
  // `origin: true` echoes the request origin, which credentialed CORS allows.
  corsOptions: { credentials: true, origin: true },
  expressRouter: router,
  // Serves the gateway subscription bundle (`src/apollo/subscription.ts` at
  // `/subscriptionPlugin.js`) so the gateway's graphql-ws server aggregates
  // this plugin's `agentsThreadsChanged` subscription.
  hasSubscriptions: true,
  subscriptionPluginPath: path.resolve(
    __dirname,
    'apollo',
    `subscription${path.extname(__filename)}`,
  ),
  graphql: async () => ({
    typeDefs: await typeDefs(),
    resolvers,
  }),
  apolloServerContext: async (subdomain, context) => {
    const models = await generateModels(subdomain);

    context.models = models;

    return context;
  },
  trpcAppRouter: {
    router: appRouter,
    createContext: async (subdomain, context) => {
      const models = await generateModels(subdomain);

      context.models = models;

      return context;
    },
  },
  meta: {
    permissions,
  },
});


import { initTRPC } from '@trpc/server';

import type { ITRPCContext } from 'erxes-api-shared/utils';

const t = initTRPC.context<ITRPCContext>().create();

export const appRouter = t.router({
  erxesAgent: {
    hello: t.procedure.query(() => {
      return 'Hello erxes-agent';
    }),
  },
});

export type AppRouter = typeof appRouter;

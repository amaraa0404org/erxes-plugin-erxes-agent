import type { Request, Response, Router } from 'express';
import { extractUserFromHeader, getSubdomain } from 'erxes-api-shared/utils';
import { generateModels } from '~/connectionResolvers';

// Shared secret between this plugin and the Cloudflare OS gatekeeper worker,
// which is the only caller of /exchange.
const exchangeSecret = () => process.env.CF_OS_EXCHANGE_SECRET || '';

const unauthorized = (res: Response) =>
  res.status(401).json({ error: 'Unauthorized' });

/**
 * POST /cf-os/connect-code — dashboard-authenticated. Mints a single-use code
 * that signs the current user into Cloudflare OS without a password.
 */
export const handleConnectCode = async (req: Request, res: Response) => {
  const user = extractUserFromHeader(req.headers);
  if (!user?._id || !user.email) {
    return unauthorized(res);
  }

  const subdomain = getSubdomain(req);
  const models = await generateModels(subdomain);
  const { code, expiresIn } = await models.CfOsConnectCodes.mint({
    userId: user._id,
    email: user.email,
    isOwner: Boolean(user.isOwner),
    subdomain,
  });

  return res.json({ code, expiresIn });
};

/**
 * POST /cf-os/exchange — gatekeeper-only (shared-secret header). Redeems a
 * code for a short-lived OfficeNext session token the executor uses to call
 * erxes GraphQL as the user.
 */
export const handleExchange = async (req: Request, res: Response) => {
  if (!exchangeSecret() || req.header('x-cf-os-secret') !== exchangeSecret()) {
    return unauthorized(res);
  }

  const { code } = (req.body ?? {}) as { code?: string };
  if (!code) {
    return res.status(400).json({ error: 'Missing code' });
  }

  try {
    const result = await (await generateModels(getSubdomain(req)))
      .CfOsConnectCodes.exchange(code);
    return res.json(result);
  } catch (error) {
    return res.status(400).json({
      error: error instanceof Error ? error.message : 'Exchange failed',
    });
  }
};

export const registerCfOsRoutes = (router: Router) => {
  router.post('/cf-os/connect-code', handleConnectCode);
  router.post('/cf-os/exchange', handleExchange);
};

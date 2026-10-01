import { createHash, randomBytes } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';
import { redis } from 'erxes-api-shared/utils';
import { cfOsConnectCodeSchema } from '@/cfos/db/definitions/connectCode';
import {
  CfOsExchangeResult,
  ICfOsConnectCodeDocument,
} from '@/cfos/@types/connectCode';

// Mirrors core-api's session issuance (Users.createTokens + saveValidatedToken):
// a one-day JWT plus the validated-token Redis key the gateway checks on every
// request. Kept in sync with that contract; no core changes required.
const TOKEN_TTL_SECONDS = 24 * 60 * 60;

export interface ICfOsConnectCodeModel
  extends Model<ICfOsConnectCodeDocument> {
  mint(input: {
    userId: string;
    email: string;
    isOwner: boolean;
    subdomain: string;
  }): Promise<{ code: string; expiresIn: number }>;
  exchange(code: string): Promise<CfOsExchangeResult>;
}

const hash = (code: string) =>
  createHash('sha256').update(code).digest('hex');

export const loadCfOsConnectCodeClass = (_models: IModels) => {
  class CfOsConnectCode {
    public static async mint({
      userId,
      email,
      isOwner,
      subdomain,
    }: {
      userId: string;
      email: string;
      isOwner: boolean;
      subdomain: string;
    }) {
      const code = randomBytes(32).toString('hex');
      const expiresIn = 120;
      await _models.CfOsConnectCodes.create({
        codeHash: hash(code),
        userId,
        email: email.trim().toLowerCase(),
        isOwner,
        subdomain,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      });
      return { code, expiresIn };
    }

    public static async exchange(code: string): Promise<CfOsExchangeResult> {
      const doc = await _models.CfOsConnectCodes.findOneAndUpdate(
        {
          codeHash: hash(String(code || '')),
          usedAt: { $exists: false },
          expiresAt: { $gt: new Date() },
        },
        { $set: { usedAt: new Date() } },
        { new: true },
      );
      if (!doc) throw new Error('Connect code is invalid or expired.');

      const secret = process.env.JWT_TOKEN_SECRET;
      if (!secret) throw new Error('JWT token secret is not configured.');
      const authToken = jwt.sign(
        { user: { _id: doc.userId, isOwner: doc.isOwner } },
        secret,
        { expiresIn: TOKEN_TTL_SECONDS },
      );
      // The gateway rejects tokens missing this validated-marker key.
      await redis.set(
        `user_token_${doc.userId}_${authToken}`,
        1,
        'EX',
        TOKEN_TTL_SECONDS,
      );

      return { authToken, userId: doc.userId, email: doc.email };
    }
  }

  cfOsConnectCodeSchema.loadClass(CfOsConnectCode);
  return cfOsConnectCodeSchema;
};

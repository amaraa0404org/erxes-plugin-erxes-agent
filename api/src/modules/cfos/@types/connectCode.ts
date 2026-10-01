import type { Document } from 'mongoose';

export interface ICfOsConnectCode {
  _id: string;
  codeHash: string;
  userId: string;
  email: string;
  isOwner: boolean;
  subdomain: string;
  usedAt?: Date;
  createdAt: Date;
  expiresAt: Date;
}

export interface ICfOsConnectCodeDocument
  extends ICfOsConnectCode,
    Document {
  _id: string;
}

export interface CfOsExchangeResult {
  authToken: string;
  userId: string;
  email: string;
}

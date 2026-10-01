import type { IMainContext } from 'erxes-api-shared/core-types';
import { createGenerateModels } from 'erxes-api-shared/utils';

import mongoose from 'mongoose';

import {
  IAgentsConnectionModel,
  loadAgentsConnectionClass,
} from '@/agents/db/models/Connection';
import { IAgentsConnectionsDocument } from '@/agents/@types/connection';
import {
  ICfOsConnectCodeModel,
  loadCfOsConnectCodeClass,
} from '@/cfos/db/models/CfOsConnectCode';
import { ICfOsConnectCodeDocument } from '@/cfos/@types/connectCode';
import {
  IAgentsSettingsModel,
  loadAgentsSettingsClass,
} from '@/agents/db/models/Settings';
import { IAgentsSettingsDocument } from '@/agents/@types/settings';

export interface IModels {
  /** Per-user BYOK agents connection; one document per user per tenant. */
  AgentsConnection: IAgentsConnectionModel;
  /** Single-use cf-os passwordless sign-in codes. */
  CfOsConnectCodes: ICfOsConnectCodeModel;
  /** Tenant-wide agents settings; one document per tenant. */
  AgentsSettings: IAgentsSettingsModel;
}

export interface IContext extends IMainContext {
  models: IModels;
  /**
   * Tenant slug attached by the shared Apollo context builder
   * (`generateApolloContext`); declared here because `IMainContext` does not
   * expose it even though it is present at runtime.
   */
  subdomain: string;
}

export const loadClasses = (db: mongoose.Connection): IModels => {
  const models = {} as IModels;

  // One document per user within a tenant; the collection name matches the
  // two-arg registration convention used by every other plugin connection in
  // this repository.
  models.AgentsConnection = db.model<
    IAgentsConnectionsDocument,
    IAgentsConnectionModel
  >('agents_user_connections', loadAgentsConnectionClass(models));

  // cf-os passwordless dashboard sign-in: hashed, single-use, short-lived
  // connect codes exchanged by the Cloudflare OS gatekeeper worker.
  models.CfOsConnectCodes = db.model<
    ICfOsConnectCodeDocument,
    ICfOsConnectCodeModel
  >('cf_os_connect_codes', loadCfOsConnectCodeClass(models));

  // Tenant-wide settings singleton (admin-controlled code mode flag);
  // registered on the per-subdomain connection like every other model.
  models.AgentsSettings = db.model<
    IAgentsSettingsDocument,
    IAgentsSettingsModel
  >('agents_settings', loadAgentsSettingsClass(models));

  return models;
};

export const generateModels = createGenerateModels<IModels>(loadClasses);

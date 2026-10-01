import { Model } from 'mongoose';
import type { IAiAgentConnection } from 'erxes-api-shared/core-modules';
import { IModels } from '~/connectionResolvers';
import { agentsConnectionSchema } from '@/agents/db/definitions/connection';
import {
  IAgentsConnectionEntry,
  IAgentsConnectionsDocument,
} from '@/agents/@types/connection';

export interface IAgentsConnectionModel
  extends Model<IAgentsConnectionsDocument> {
  /**
   * Returns the acting user's stored connections document (with the legacy
   * single-connection shape normalized into the array), or null when they
   * have not saved any provider yet.
   */
  getConnections(userId: string): Promise<IAgentsConnectionsDocument | null>;
  /**
   * Inserts or replaces the entry for one provider in the acting user's
   * connections array, creating the document on the first save.
   */
  upsertConnection(
    userId: string,
    provider: string,
    connection: IAiAgentConnection,
  ): Promise<IAgentsConnectionsDocument>;
  /**
   * Removes one provider's entry from the acting user's connections array
   * and deletes the document when the array becomes empty.
   */
  removeConnection(userId: string, provider: string): Promise<void>;
}

/**
 * Documents written by the previous single-connection shape carry a legacy
 * top-level `connection` field; normalize them into the array shape so
 * readers never see the old format.
 */
const normalizeConnections = (
  doc: IAgentsConnectionsDocument | null,
): IAgentsConnectionsDocument | null => {
  if (!doc) {
    return null;
  }

  const legacy = (doc as unknown as { connection?: IAgentsConnectionEntry })
    .connection;
  const legacyDoc = doc as unknown as { connection?: unknown };

  if (legacy && !Array.isArray(doc.connections)) {
    doc.connections = [legacy];
  }

  if (Array.isArray(doc.connections) && legacyDoc.connection !== undefined) {
    delete legacyDoc.connection;
  }

  return doc;
};

export const loadAgentsConnectionClass = (models: IModels) => {
  class AgentsConnection {
    /**
     * Reads one user's BYOK connections. Tenant isolation is handled by the
     * per-subdomain connection this model is registered on.
     */
    public static async getConnections(
      userId: string,
    ): Promise<IAgentsConnectionsDocument | null> {
      const doc = await models.AgentsConnection.findOne({
        userId,
      }).lean<IAgentsConnectionsDocument>();

      return normalizeConnections(doc);
    }

    /**
     * Inserts or replaces the entry for one provider, persisting the legacy
     * single-connection shape into the array form on the way.
     */
    public static async upsertConnection(
      userId: string,
      provider: string,
      connection: IAiAgentConnection,
    ): Promise<IAgentsConnectionsDocument> {
      const existingDoc = await models.AgentsConnection.findOne({
        userId,
      }).lean<IAgentsConnectionsDocument>();
      const normalized = normalizeConnections(existingDoc);

      const entries: IAiAgentConnection[] = normalized?.connections
        ? [...normalized.connections]
        : [];
      const index = entries.findIndex(
        (entry) => entry.provider === provider,
      );

      if (index >= 0) {
        entries[index] = connection;
      } else {
        entries.push(connection);
      }

      const doc = await models.AgentsConnection.findOneAndUpdate(
        { userId },
        { $set: { connections: entries }, $unset: { connection: '' } },
        { new: true, upsert: true },
      );

      if (!doc) {
        throw new Error('Agents connection not found');
      }

      return doc;
    }

    /**
     * Removes one provider's entry; deletes the whole document when no
     * provider remains configured.
     */
    public static async removeConnection(
      userId: string,
      provider: string,
    ): Promise<void> {
      const existingDoc = await models.AgentsConnection.findOne({
        userId,
      }).lean<IAgentsConnectionsDocument>();
      const normalized = normalizeConnections(existingDoc);

      if (!normalized) {
        return;
      }

      const remaining = normalized.connections.filter(
        (entry) => entry.provider !== provider,
      );

      if (remaining.length === 0) {
        await models.AgentsConnection.deleteOne({ userId });
        return;
      }

      await models.AgentsConnection.findOneAndUpdate(
        { userId },
        { $set: { connections: remaining }, $unset: { connection: '' } },
      );
    }
  }

  agentsConnectionSchema.loadClass(AgentsConnection);

  return agentsConnectionSchema;
};

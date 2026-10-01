import { Schema } from 'mongoose';

/**
 * The sandbox environments code mode can run model-authored code in. Only
 * the in-process QuickJS interpreter exists today; the setting is validated
 * against this list so a future remote environment is a deliberate schema
 * change, not free-form input.
 */
export const AGENTS_CODE_MODE_ENVIRONMENTS = ['in-process'] as const;

/**
 * Tenant-wide agents settings: one document per tenant. The in-process
 * sandbox runs inside the plugin's own Node process, isolated by the
 * QuickJS WebAssembly boundary (bare global object — no filesystem,
 * network, process, timer, or module access for guest code).
 */
export const agentsSettingsSchema = new Schema(
  {
    codeModeEnabled: { type: Boolean, default: false },
    codeModeEnvironment: {
      type: String,
      enum: AGENTS_CODE_MODE_ENVIRONMENTS,
      default: 'in-process',
    },
  },
  {
    timestamps: true,
  },
);

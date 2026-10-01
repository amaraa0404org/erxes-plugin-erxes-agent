import { Schema } from 'mongoose';

// Single-use, short-lived codes that let the Cloudflare OS gatekeeper sign a
// dashboard user in without a password. Codes are stored hashed; the raw value
// only ever travels dashboard → iframe → gatekeeper.
export const cfOsConnectCodeSchema = new Schema(
  {
    codeHash: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    email: { type: String, required: true },
    isOwner: { type: Boolean, default: false },
    subdomain: { type: String, required: true },
    usedAt: { type: Date },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: false },
);

// Mongo removes expired documents in the background; redemption also checks
// expiry so a stale document never redeems between sweeps.
cfOsConnectCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

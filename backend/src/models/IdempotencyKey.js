import mongoose from "mongoose";

const IDEMPOTENCY_TTL_MS = Number(process.env.IDEMPOTENCY_KEY_TTL_MS || 7 * 24 * 60 * 60 * 1000);

const idempotencyKeySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    scope: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    requestHash: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing",
      required: true,
    },
    pago: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pago",
    },
    responseStatus: {
      type: Number,
    },
    responseBody: {
      type: mongoose.Schema.Types.Mixed,
    },
    lockedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + IDEMPOTENCY_TTL_MS),
    },
  },
  {
    timestamps: true,
  }
);

idempotencyKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
idempotencyKeySchema.index({ user: 1, scope: 1, createdAt: -1 });

const IdempotencyKey = mongoose.model("IdempotencyKey", idempotencyKeySchema);
export default IdempotencyKey;

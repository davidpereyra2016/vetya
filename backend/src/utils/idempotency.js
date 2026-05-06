import crypto from "crypto";
import IdempotencyKey from "../models/IdempotencyKey.js";

const DEFAULT_WAIT_TIMEOUT_MS = Number(process.env.IDEMPOTENCY_WAIT_TIMEOUT_MS || 10000);
const DEFAULT_WAIT_INTERVAL_MS = Number(process.env.IDEMPOTENCY_WAIT_INTERVAL_MS || 200);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizeBody(body) {
  return JSON.stringify(body || {}, Object.keys(body || {}).sort());
}

function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

export function getIdempotencyKey(req) {
  const value = req.get("Idempotency-Key");
  return typeof value === "string" ? value.trim() : "";
}

export function requireIdempotencyKey(req) {
  const key = getIdempotencyKey(req);

  if (!key) {
    const error = new Error("Idempotency-Key es requerido para procesar pagos");
    error.status = 400;
    throw error;
  }

  return key;
}

export function hashIdempotencyRequest(req, scope) {
  const userId = req.user?._id?.toString() || "";
  const payload = [
    scope,
    req.method,
    req.originalUrl?.split("?")[0] || req.path,
    userId,
    normalizeBody(req.body),
  ].join("|");

  return crypto.createHash("sha256").update(payload).digest("hex");
}

export async function beginIdempotency(req, scope) {
  const key = requireIdempotencyKey(req);
  const requestHash = hashIdempotencyRequest(req, scope);

  try {
    const record = await IdempotencyKey.create({
      key,
      scope,
      user: req.user?._id,
      requestHash,
      status: "processing",
    });

    return { key, record, isNew: true };
  } catch (error) {
    if (error?.code !== 11000) {
      throw error;
    }

    const record = await IdempotencyKey.findOne({ key });

    if (!record) {
      const missingError = new Error("No se pudo recuperar la llave de idempotencia");
      missingError.status = 409;
      throw missingError;
    }

    if (record.requestHash !== requestHash) {
      const mismatchError = new Error("Idempotency-Key ya fue usada para otra operacion");
      mismatchError.status = 409;
      throw mismatchError;
    }

    return { key, record, isNew: false };
  }
}

export async function waitForIdempotencyResult(key, options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_WAIT_TIMEOUT_MS;
  const intervalMs = options.intervalMs ?? DEFAULT_WAIT_INTERVAL_MS;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const record = await IdempotencyKey.findOne({ key });

    if (record && record.status !== "processing") {
      return record;
    }

    await sleep(intervalMs);
  }

  return IdempotencyKey.findOne({ key });
}

export async function completeIdempotency(record, { statusCode = 200, body, pago = null } = {}) {
  if (!record?._id) return null;

  return IdempotencyKey.findByIdAndUpdate(
    record._id,
    {
      $set: {
        status: statusCode >= 200 && statusCode < 400 ? "completed" : "failed",
        responseStatus: statusCode,
        responseBody: cloneJson(body),
        pago,
        completedAt: new Date(),
      },
    },
    { new: true }
  );
}

export async function failIdempotency(record, error, fallbackMessage = "Error al procesar el pago") {
  const statusCode = error?.status || 500;
  const body = {
    message: error?.message || fallbackMessage,
    error: error?.message || fallbackMessage,
    idempotencyStatus: "failed",
  };

  await completeIdempotency(record, { statusCode, body });
  return { statusCode, body };
}

export async function replayIdempotencyResult(res, record) {
  const finalRecord = record.status === "processing"
    ? await waitForIdempotencyResult(record.key)
    : record;

  if (!finalRecord || finalRecord.status === "processing") {
    return res.status(202).json({
      message: "La transaccion ya se esta procesando. Intenta consultar nuevamente en unos segundos.",
      idempotencyStatus: "processing",
    });
  }

  res.set("X-Idempotent-Replay", "true");

  const responseBody = {
    ...(finalRecord.responseBody || {}),
    idempotentReplay: true,
  };

  if (finalRecord.status === "failed") {
    return res.status(finalRecord.responseStatus || 500).json(responseBody);
  }

  return res.status(200).json(responseBody);
}

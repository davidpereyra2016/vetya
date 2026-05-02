import crypto from "crypto";

const CACHE_NAMESPACE = process.env.CACHE_NAMESPACE || "vetya:api";
const REDIS_URL = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;
const DEFAULT_TTL_SECONDS = Number(process.env.API_CACHE_TTL_SECONDS || 60);
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
let redisClientPromise;
let redisDisabledUntil = 0;
const memoryCounters = new Map();

const nowSeconds = () => Math.floor(Date.now() / 1000);

export const normalizeEmail = (email = "") => String(email).trim().toLowerCase();

export const safeLog = {
  info: (...args) => {
    if (process.env.NODE_ENV !== "production") console.log(...args);
  },
  warn: (...args) => {
    if (process.env.NODE_ENV !== "production") console.warn(...args);
  },
  error: (...args) => {
    if (process.env.NODE_ENV !== "production") console.error(...args);
  },
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const stripDangerousKeys = (value) => {
  if (!value || typeof value !== "object") return value;

  if (Array.isArray(value)) {
    value.forEach(stripDangerousKeys);
    return value;
  }

  for (const key of Object.keys(value)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete value[key];
      continue;
    }
    stripDangerousKeys(value[key]);
  }

  return value;
};

export const sanitizeRequest = (req, _res, next) => {
  // Defensa basica contra NoSQL injection en filtros recibidos por query/body.
  stripDangerousKeys(req.body);
  stripDangerousKeys(req.query);
  stripDangerousKeys(req.params);
  next();
};

export const getPagination = (query, { defaultLimit = 20, maxLimit = 100 } = {}) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const requestedLimit = Number.parseInt(query.limit, 10) || defaultLimit;
  const limit = Math.min(Math.max(requestedLimit, 1), maxLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const paginatedResponse = (items, total, { page, limit }) => ({
  data: items,
  pagination: {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  },
});

const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");

export const getRedisClient = async () => {
  if (!REDIS_URL) return null;
  if (Date.now() < redisDisabledUntil) return null;

  if (!redisClientPromise) {
    redisClientPromise = import("ioredis")
      .then(({ default: Redis }) => {
        const client = new Redis(REDIS_URL, {
          maxRetriesPerRequest: 1,
          enableReadyCheck: false,
          lazyConnect: true,
          connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT_MS || 500),
          commandTimeout: Number(process.env.REDIS_COMMAND_TIMEOUT_MS || 500),
        });

        client.on("error", (error) => safeLog.warn("Redis no disponible:", error.message));
        return client.connect().then(() => client);
      })
      .catch((error) => {
        safeLog.warn("Redis deshabilitado:", error.message);
        redisClientPromise = null;
        redisDisabledUntil = Date.now() + Number(process.env.REDIS_RETRY_AFTER_MS || 30000);
        return null;
      });
  }

  return redisClientPromise;
};

const cacheKeyForRequest = (req) => {
  const authHash = req.headers.authorization ? hash(req.headers.authorization).slice(0, 16) : "public";
  return `${CACHE_NAMESPACE}:cache:${authHash}:${hash(req.originalUrl)}`;
};

const shouldCache = (req, res) => {
  if (req.method !== "GET") return false;
  if (res.statusCode !== 200) return false;
  if (req.query.noCache === "true") return false;
  return true;
};

export const cacheReads = ({ ttl = DEFAULT_TTL_SECONDS } = {}) => async (req, res, next) => {
  if (req.method !== "GET") return next();

  const redis = await getRedisClient();
  if (!redis) return next();

  const key = cacheKeyForRequest(req);
  try {
    const cached = await redis.get(key);
    if (cached) {
      res.set("X-Cache", "HIT");
      return res.status(200).json(JSON.parse(cached));
    }
  } catch (error) {
    safeLog.warn("Error leyendo cache:", error.message);
  }

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (shouldCache(req, res)) {
      redis
        .set(key, JSON.stringify(body), "EX", ttl)
        .catch((error) => safeLog.warn("Error guardando cache:", error.message));
    }
    res.set("X-Cache", "MISS");
    return originalJson(body);
  };

  next();
};

export const invalidateCache = async () => {
  const redis = await getRedisClient();
  if (!redis) return;

  let cursor = "0";
  do {
    const [nextCursor, keys] = await redis.scan(cursor, "MATCH", `${CACHE_NAMESPACE}:cache:*`, "COUNT", 250);
    cursor = nextCursor;
    if (keys.length > 0) await redis.del(keys);
  } while (cursor !== "0");
};

export const invalidateCacheOnMutation = (req, res, next) => {
  if (!WRITE_METHODS.has(req.method)) return next();

  res.on("finish", () => {
    if (res.statusCode >= 200 && res.statusCode < 400) {
      invalidateCache().catch((error) => safeLog.warn("Error invalidando cache:", error.message));
    }
  });

  next();
};

const rateKey = (req, scope, keyBy) => {
  const userId = req.user?._id || req.user?.userId || req.user?.id;
  const selected = keyBy === "user" && userId ? String(userId) : req.ip || req.socket.remoteAddress || "unknown";
  return `${CACHE_NAMESPACE}:rate:${scope}:${selected}`;
};

export const redisRateLimit = ({
  windowSeconds = 60,
  max = 120,
  scope = "global",
  keyBy = "ip",
  message = "Demasiadas solicitudes. Intenta nuevamente mas tarde.",
} = {}) => async (req, res, next) => {
  const key = rateKey(req, scope, keyBy);
  const redis = await getRedisClient();

  try {
    if (redis) {
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, windowSeconds);
      const ttl = await redis.ttl(key);
      res.set("RateLimit-Limit", String(max));
      res.set("RateLimit-Remaining", String(Math.max(max - count, 0)));
      res.set("RateLimit-Reset", String(Math.max(ttl, 0)));

      if (count > max) return res.status(429).json({ message });
      return next();
    }

    const bucket = memoryCounters.get(key) || { count: 0, resetAt: nowSeconds() + windowSeconds };
    if (bucket.resetAt <= nowSeconds()) {
      bucket.count = 0;
      bucket.resetAt = nowSeconds() + windowSeconds;
    }
    bucket.count += 1;
    memoryCounters.set(key, bucket);

    if (bucket.count > max) return res.status(429).json({ message });
    return next();
  } catch (error) {
    safeLog.warn("Rate limit degradado:", error.message);
    return next();
  }
};

export const generalApiLimiter = redisRateLimit({
  windowSeconds: 60,
  max: Number(process.env.RATE_LIMIT_GLOBAL_MAX || 300),
  scope: "global",
});

export const authLimiter = redisRateLimit({
  windowSeconds: 15 * 60,
  max: Number(process.env.RATE_LIMIT_AUTH_MAX || 12),
  scope: "auth-sensitive",
});

export const authRecoveryLimiter = redisRateLimit({
  windowSeconds: 15 * 60,
  max: Number(process.env.RATE_LIMIT_AUTH_RECOVERY_MAX || 30),
  scope: "auth-recovery",
  message: "Demasiadas solicitudes de recuperacion. Intenta nuevamente mas tarde.",
});

export const userWriteLimiter = redisRateLimit({
  windowSeconds: 60,
  max: Number(process.env.RATE_LIMIT_USER_WRITE_MAX || 60),
  scope: "user-write",
  keyBy: "user",
});

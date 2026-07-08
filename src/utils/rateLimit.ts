const rateLimitStore = new Map<string, number[]>();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const defaults: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60000, // 1 minute
};

export function checkRateLimit(action: string, config: Partial<RateLimitConfig> = {}): boolean {
  const { maxRequests, windowMs } = { ...defaults, ...config };
  const now = Date.now();
  const key = action;

  const timestamps = rateLimitStore.get(key) || [];
  const validTimestamps = timestamps.filter(t => now - t < windowMs);

  if (validTimestamps.length >= maxRequests) {
    return false; // Rate limit exceeded
  }

  validTimestamps.push(now);
  rateLimitStore.set(key, validTimestamps);
  return true; // OK
}

export function getRateLimitInfo(action: string): { remaining: number; resetIn: number } {
  const now = Date.now();
  const timestamps = rateLimitStore.get(action) || [];
  const validTimestamps = timestamps.filter(t => now - t < defaults.windowMs);
  const remaining = defaults.maxRequests - validTimestamps.length;
  const oldest = validTimestamps[0];
  const resetIn = oldest ? defaults.windowMs - (now - oldest) : defaults.windowMs;

  return { remaining: Math.max(0, remaining), resetIn };
}

// Specific rate limits for different actions
export const rateLimits = {
  register: { maxRequests: 3, windowMs: 300000 }, // 3 per 5 min
  login: { maxRequests: 5, windowMs: 60000 }, // 5 per min
  payment: { maxRequests: 3, windowMs: 300000 }, // 3 per 5 min
  deviceAdd: { maxRequests: 5, windowMs: 60000 }, // 5 per min
  deviceRemove: { maxRequests: 10, windowMs: 60000 }, // 10 per min
  email: { maxRequests: 3, windowMs: 300000 }, // 3 per 5 min
};
